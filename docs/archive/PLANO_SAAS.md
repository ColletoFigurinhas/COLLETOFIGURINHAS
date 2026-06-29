# Colleto Figurinhas — Plano de Escalada para SaaS Multi-Tenant

> ⚠️ **DOCUMENTO ARQUIVADO / SUPERADO (mantido por histórico).**
> Este plano (06/06/2026) descreve roteamento por **slug-no-path** e banco **MySQL**.
> A realidade implementada é **multi-tenant por subdomínio** — ver `docs/ARCHITECTURE.md`.
> O rumo de negócio atual está em `docs/PLANEJAMENTO_EMPRESARIAL.md` (Supabase/Postgres é passo futuro).
> Não use este arquivo como fonte da verdade.
>
> Data: 06/06/2026 | Status: planejado, pronto para execução
> Dados atuais são fictícios — banco será zerado e recriado do zero.

---

## VISÃO GERAL

O produto vira um SaaS: uma única instalação Next.js + um único banco MySQL no DigitalOcean,
servindo N empresas clientes. Cada empresa compra o serviço, recebe um slug único
(ex: `acesso.colleto.com.br/samsung`) e opera de forma 100% isolada.
Nenhum dado de uma empresa é visível para outra.

---

## FASE 1 — BANCO DE DADOS (fazer primeiro, zera tudo)

### Tabela nova: `empresas`
```sql
id          INT PK AUTO_INCREMENT
nome        VARCHAR(255)          -- "Samsung"
slug        VARCHAR(100) UNIQUE   -- "samsung" (URL)
cnpj        VARCHAR(18) UNIQUE    -- "00.000.000/0001-00"
logo_url    VARCHAR(500) NULL
cor_primaria VARCHAR(7) DEFAULT '#1d4ed8'   -- personalização visual
ativo       BOOLEAN DEFAULT true
plano       ENUM('basico','pro','enterprise') DEFAULT 'basico'
criado_em   DATETIME DEFAULT NOW()
```

### Campo `empresa_id` entra em TODAS as tabelas
Tabelas afetadas:
- `participantes`       → + `empresa_id INT NOT NULL`
- `campanhas`          → + `empresa_id INT NOT NULL`
- `figurinhas`         → herdado via campanha (sem campo direto — join)
- `album_itens`        → herdado via participante (sem campo direto)
- `pacotes`            → herdado via participante
- `trocas`             → herdado via participante
- `acoes_campanha`     → herdado via campanha
- `premios_fisicos`    → herdado via pacote
- `logs_distribuicao_manual` → + `empresa_id INT NOT NULL` (log direto)
- `ganhadores_acao`    → herdado via acao

### Tabela nova: `admins_empresa`
```sql
id           INT PK AUTO_INCREMENT
empresa_id   INT FK → empresas.id
matricula    VARCHAR(50) UNIQUE
nome         VARCHAR(255)
email        VARCHAR(255)
senha_hash   VARCHAR(255)
role         ENUM('ADMIN','MARKETING','TI')
ativo        BOOLEAN DEFAULT true
criado_em    DATETIME DEFAULT NOW()
```
> Separado de `participantes` — admin não joga, só gerencia.

### Tabela nova: `owners`
```sql
id        INT PK AUTO_INCREMENT
email     VARCHAR(255) UNIQUE
senha_hash VARCHAR(255)
nome      VARCHAR(255)
criado_em DATETIME DEFAULT NOW()
```
> O owner vê e gerencia TODAS as empresas. Nunca aparece para o cliente.

### Índices críticos para performance
```sql
INDEX idx_participantes_empresa   ON participantes(empresa_id)
INDEX idx_campanhas_empresa       ON campanhas(empresa_id)
INDEX idx_pacotes_participante    ON pacotes(participante_id, campanha_id)
```

---

## FASE 2 — SCHEMA PRISMA (reflete o novo banco)

Mudanças no `schema.prisma`:

```prisma
model Empresa {
  id          Int     @id @default(autoincrement())
  nome        String
  slug        String  @unique
  cnpj        String  @unique
  logoUrl     String? @map("logo_url")
  corPrimaria String  @default("#1d4ed8") @map("cor_primaria")
  ativo       Boolean @default(true)
  plano       String  @default("basico")
  criadoEm   DateTime @default(now()) @map("criado_em")

  participantes Participante[]
  campanhas     Campanha[]
  admins        AdminEmpresa[]

  @@map("empresas")
}

model Participante {
  // + empresaId Int @map("empresa_id")
  // + empresa   Empresa @relation(...)
  // resto igual
}

model Campanha {
  // + empresaId Int @map("empresa_id")
  // + empresa   Empresa @relation(...)
  // resto igual
}

model AdminEmpresa {
  id         Int    @id @default(autoincrement())
  empresaId  Int    @map("empresa_id")
  matricula  String @unique
  nome       String
  email      String
  senhaHash  String @map("senha_hash")
  role       Role   @default(ADMIN)
  ativo      Boolean @default(true)
  criadoEm  DateTime @default(now()) @map("criado_em")

  empresa Empresa @relation(fields: [empresaId], references: [id])

  @@map("admins_empresa")
}

model Owner {
  id        Int    @id @default(autoincrement())
  email     String @unique
  senhaHash String @map("senha_hash")
  nome      String
  criadoEm DateTime @default(now()) @map("criado_em")

  @@map("owners")
}
```

---

## FASE 3 — ROTEAMENTO MULTI-TENANT

### Estratégia escolhida: slug na URL (sem subdomínio)
```
colleto.com.br/[slug]/login          → login da empresa
colleto.com.br/[slug]/album          → álbum do participante
colleto.com.br/[slug]/inventario     → inventário
colleto.com.br/[slug]/admin          → painel admin da empresa
colleto.com.br/owner                 → painel owner (Colleto)
```

### Mudança na estrutura de pastas do Next.js
```
src/app/
  [slug]/                   ← NOVO — contexto da empresa
    login/page.tsx
    album/page.tsx
    inventario/page.tsx
    admin/
      page.tsx
      layout.tsx
  owner/                    ← NOVO — owner
    page.tsx
    empresas/page.tsx
    layout.tsx
  api/
    [slug]/                 ← prefixo empresa nas APIs
      admin/figurinhas/route.ts
      admin/participantes/route.ts
      ...
    owner/                  ← APIs do owner
      empresas/route.ts
```

### Session — o que muda
```typescript
// session atual
{ userId, matricula, nome, role }

// session nova
{ userId, matricula, nome, role, empresaId, empresaSlug }
// owner: { ownerId, nome, isOwner: true }
```

### Middleware (src/middleware.ts) — o que muda
- Lê `empresaSlug` da URL
- Valida que empresa existe e está ativa
- Redireciona `/` para `/[slug]/login` ou `/owner/login`
- Protege rotas admin verificando role + empresaId na session

---

## FASE 4 — ISOLAMENTO DE DADOS

### Regra de ouro: todo query filtra por empresaId

Antes:
```typescript
const participantes = await db.participante.findMany({ where: { ativo: true } })
```

Depois:
```typescript
const { empresaId } = await getSession()
const participantes = await db.participante.findMany({
  where: { ativo: true, empresaId }
})
```

### Helper central (src/lib/tenant.ts) — novo arquivo
```typescript
export async function getTenantId(): Promise<number> {
  const session = await getSession()
  if (!session?.empresaId) throw new Error('Sem tenant na sessão')
  return session.empresaId
}

export async function resolveEmpresa(slug: string): Promise<Empresa> {
  const empresa = await db.empresa.findFirst({ where: { slug, ativo: true } })
  if (!empresa) notFound()
  return empresa
}
```

### Arquivos a modificar para isolamento
Todos os arquivos de API que fazem queries no banco:
- `src/app/api/[slug]/admin/figurinhas/route.ts`
- `src/app/api/[slug]/admin/participantes/route.ts`
- `src/app/api/[slug]/admin/especiais/route.ts`
- `src/app/api/[slug]/admin/upload/route.ts`
- `src/app/api/[slug]/inventario/route.ts`
- `src/app/api/[slug]/trocas/route.ts`
- `src/app/api/[slug]/pacotes/route.ts`
- `src/app/api/[slug]/cron/distribuir/route.ts`
- `src/app/api/[slug]/cron/fim-de-semana/route.ts`
- `src/app/actions/auth.ts` — login agora busca participante por (matricula + empresaId)

---

## FASE 5 — PAINEL ADMIN DA EMPRESA (expandir)

O admin atual só tem figurinhas. Vamos adicionar as abas que fazem sentido para o cliente.

### Abas do admin da empresa:
1. **Figurinhas** ← já existe, mantém
2. **Participantes** — lista, ativa/desativa, reseta senha, cria manualmente
3. **Campanha** — cria/edita a campanha ativa (datas, nome, stickers por dia, chance especial)
4. **Pacotes** — distribui pacotes manualmente para um participante
5. **Ações** — cria ações/eventos que geram pacote bônus
6. **Prêmios** — registra entrega de prêmios físicos
7. **Relatórios** — ranking de coleção, % de álbum completo, logs de distribuição

### O que hoje é manual no banco, vai para o admin:
| Hoje (manual no DB)              | Admin novo                              |
|----------------------------------|-----------------------------------------|
| Criar campanha                   | Aba "Campanha" → formulário             |
| Adicionar participante           | Aba "Participantes" → botão "+ Novo"    |
| Distribuir pacote extra          | Aba "Pacotes" → busca participante      |
| Registrar ganhador de ação       | Aba "Ações" → marcar participante       |
| Ver quem completou o álbum       | Aba "Relatórios"                        |
| Resetar senha de participante    | Aba "Participantes" → ação na linha     |

---

## FASE 6 — PAINEL OWNER (colleto.com.br/owner)

Painel exclusivo da equipe Colleto. Clientes nunca veem.

### Funcionalidades:
1. **Empresas** — lista todas, cria nova, edita, ativa/desativa
2. **Criar empresa** — formulário: nome, CNPJ, slug, plano, logo, cor primária
3. **Criar admin da empresa** — após criar empresa, cria o 1º usuário admin
4. **Visão geral** — quantas empresas, participantes, figurinhas no ar
5. **Configurações globais** — URL base do email, chaves de API padrão

### Fluxo de onboarding de novo cliente:
```
Owner       → cria empresa (nome, CNPJ, slug)
            → cria admin inicial (email + senha temporária)
            → envia credenciais para o cliente
Cliente     → acessa colleto.com.br/[slug]/admin
            → cria a campanha
            → cadastra figurinhas
            → importa lista de participantes
            → campanha no ar
```

---

## FASE 7 — ERP / INTEGRAÇÃO EXTERNA (opcional por empresa)

Hoje o ERP (Farol da Samsung) valida matrícula no login. Isso é específico da Samsung.
No SaaS, cada empresa pode ou não ter ERP.

### Tabela nova: `configuracoes_empresa`
```sql
empresa_id        INT FK
chave             VARCHAR(100)   -- "erp_url", "erp_key", "email_api_url", etc.
valor             TEXT
criado_em         DATETIME
```

### Lógica nova em `src/lib/erp.ts`
```typescript
// Se a empresa tiver ERP configurado → valida
// Se não tiver → aceita qualquer matrícula que exista em participantes
export async function validarMatricula(matricula: string, empresaId: number): Promise<ErpValidacao> {
  const config = await getEmpresaConfig(empresaId, 'erp_url')
  if (!config) return { ok: true, funcionario: { matricula, nome: '', tipo: 1, ativo: true } }
  // chama ERP normalmente
}
```

---

## FASE 8 — UPLOAD DE IMAGENS ISOLADO POR EMPRESA

Hoje as imagens ficam em `public/figuras/VERDE/` e `public/figuras/AMARELO/`.
No SaaS, cada empresa precisa de seu próprio espaço.

### Opção A (simples — local): pasta por empresa
```
public/figuras/[empresa_id]/VERDE/
public/figuras/[empresa_id]/AMARELO/
```
- Fácil, sem custo extra
- Problema: no DigitalOcean com vários dynos perde os arquivos no restart

### Opção B (recomendada): DigitalOcean Spaces (S3-compatível)
```
spaces.digitalocean.com/colleto/[empresa_id]/VERDE/[id].webp
spaces.digitalocean.com/colleto/[empresa_id]/AMARELO/[id].webp
```
- Persistente, CDN, sem custo de servidor
- Precisa de: `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_BUCKET`

> Decisão: começar com Opção A (local) para ter produto funcionando rápido,
> migrar para Spaces quando tiver o 2º cliente.

---

## O QUE JÁ FUNCIONA HOJE (pode usar/vender)

| Funcionalidade                    | Status     |
|-----------------------------------|------------|
| Login com matrícula + senha        | ✅ pronto  |
| Recuperação de senha por email     | ✅ pronto  |
| Álbum flipbook visual              | ✅ pronto  |
| Inventário de figurinhas           | ✅ pronto  |
| Sistema de trocas                  | ✅ pronto  |
| Distribuição diária automática     | ✅ pronto  |
| Pacote bônus fim de semana         | ✅ pronto  |
| Admin: criar/editar figurinhas     | ✅ pronto  |
| Upload de imagens VERDE/AMARELO    | ✅ pronto  |
| Nivelamento no primeiro acesso     | ✅ pronto  |

| Funcionalidade                    | Status     |
|-----------------------------------|------------|
| Multi-tenant (empresas isoladas)   | ❌ fase 1-4 |
| Painel owner (Colleto)             | ❌ fase 6   |
| Admin: gerenciar participantes     | ❌ fase 5   |
| Admin: criar/editar campanha       | ❌ fase 5   |
| Admin: distribuição manual         | ❌ fase 5   |
| ERP opcional por empresa           | ❌ fase 7   |
| Upload isolado por empresa         | ❌ fase 8   |

---

## ORDEM DE EXECUÇÃO RECOMENDADA

```
Semana 1:
  [1] Apagar banco, recriar schema com empresas + empresa_id + admins
  [2] Migração Prisma limpa (migrate dev)
  [3] Seed: 1 owner + 1 empresa teste + 1 campanha + figurinhas

Semana 2:
  [4] Roteamento /[slug]/ no Next.js
  [5] Session com empresaId
  [6] Middleware de tenant
  [7] Todas as queries filtradas por empresaId

Semana 3:
  [8] Painel owner /owner (criar empresa, criar admin)
  [9] Admin: abas Participantes + Campanha

Semana 4:
  [10] Admin: Pacotes manuais + Ações + Relatórios
  [11] ERP opcional
  [12] Testes end-to-end com 2 empresas simultâneas
```

---

## VARIÁVEIS DE AMBIENTE FINAIS (produção)

```env
# Banco
DB_HOST=ip-do-digital-ocean
DB_PORT=3306
DB_USER=colleto
DB_PASSWORD=senha-forte
DB_NAME=colleto_saas

# Sessão
SESSION_SECRET=string-aleatoria-64-chars

# Email
EMAIL_API_URL=https://...
EMAIL_API_KEY=...

# Storage (fase 2)
DO_SPACES_KEY=...
DO_SPACES_SECRET=...
DO_SPACES_BUCKET=colleto
DO_SPACES_REGION=nyc3
```

---

## DECISÕES ABERTAS (a confirmar com o usuário)

1. **URL do produto**: domínio próprio? `colleto.com.br`? subdomínio por empresa ou path?
2. **Planos/preços**: o campo `plano` (basico/pro/enterprise) limita funcionalidades? quais?
3. **ERP**: as próximas empresas vão precisar integração com sistema de RH ou não?
4. **Login sem ERP**: participantes são cadastrados manualmente pelo admin ou se auto-cadastram?
5. **Imagens**: começar com pasta local ou já ir para DigitalOcean Spaces?
