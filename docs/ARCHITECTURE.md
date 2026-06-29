# 🏛️ Arquitetura — Collêto Figurinhas

> Documentação técnica da arquitetura **real** do produto (a plataforma do álbum).
> Fonte da verdade de engenharia. Rumo de negócio: `docs/PLANEJAMENTO_EMPRESARIAL.md`.
>
> Última atualização: 2026-06-22

---

## 1. Stack

| Camada | Tecnologia |
| :--- | :--- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| ORM / Banco | Prisma 7 + adapter MariaDB (**MySQL** hoje; Postgres/Supabase é passo futuro) |
| Auth / sessão | JWT próprio com `jose` em cookie httpOnly + `bcryptjs` |
| Validação | `zod` (env e payloads) |
| Estilo | Tailwind CSS 4 |
| Álbum 3D | `three` + `@react-three/fiber` + `@react-three/drei` + `page-flip` |
| Storage | S3-compatível (AWS SDK / DigitalOcean Spaces) |
| Email | `nodemailer` (SMTP) — migração planejada p/ API transacional (Resend) |
| Observabilidade | Sentry + `pino` (logger) + `/api/health` |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

---

## 2. Multi-tenancy (isolamento por empresa)

**Estratégia: subdomínio.** Cada empresa cliente tem `empresa.dominio`.

```
Request  →  middleware (src/proxy.ts)
            extrai o subdomínio do host  →  header  x-empresa-slug
                                              │
         ┌────────────────────────────────────┘
         ▼
  Server Components / Route Handlers
     lib/tenant.ts  →  resolveEmpresa() / getTenantId()
     lib/dal.ts     →  guards de sessão (empresaId embutido)
```

- **Sem subdomínio** (domínio raiz) ou `owner.*` → área **Owner** (equipe Collêto).
- **Com subdomínio** → contexto da **empresa**; sessão carrega `empresaId` + `empresaSlug`.
- **Regra de ouro:** toda query de dados de empresa **filtra por `empresaId`**. Nunca confiar só no ID do recurso.

---

## 3. Estrutura de pastas

```
src/
├── app/                  Rotas (App Router): páginas + route handlers (HTTP in/out — finas)
│   ├── (auth)/           login, primeiro-acesso, recuperar-senha
│   ├── album/ inventario/  experiência do participante
│   ├── admin/            painel da empresa (RH/marketing)
│   ├── owner/            painel da equipe Collêto (owner)
│   └── api/              admin/* · owner/* · trocas · pacotes · inventario · cron · health
├── server/               Backend isolado (server-only)
│   ├── auth/             guards centralizados (API → 401, RSC → redirect)
│   └── services/         regra de negócio (campanha, pacotes, trocas, ...)
├── lib/                  Infra pura: db, session, session-edge, tenant, env, logger,
│                         ratelimit, storage, email, erp
├── components/           UI (FlipBook, PacoteAbertura, modais, Canvas3D, ...)
├── hooks/ · shaders/ · types/
└── proxy.ts              Middleware (resolução de tenant + proteção de rotas)
```

**Princípio de camadas:** `app/` (orquestração HTTP) → `server/services` (regra) → `lib/` (infra). Rotas não contêm regra de negócio complexa.

---

## 4. Modelo de dados (Prisma)

```
Empresa ─┬─< Campanha ─┬─< Figurinha ─< PacoteFigurinha
         │             ├─< Pacote ──────┘   └─ PremioFisico
         │             ├─< Troca
         │             └─< AcaoCampanha ─< GanhadorAcao
         └─< Participante ─< AlbumItem

Owner (global)             LogDistribuicaoManual (por empresa)
```

- `@@unique([empresaId, matricula])` em `Participante`, `@@unique([empresaId, slug])` em `Campanha`, índices por `empresaId`.
- Detalhe das regras de produto: `docs/campanha-album-figurinhas.md`.

---

## 5. Autenticação & papéis

- **Papéis** (`Role`): `PARTICIPANTE`, `MARKETING`, `TI`, `ADMIN` (empresa) + `Owner` (global, separado).
- **Sessão** (cookie `album-session`, httpOnly, JWT HS256, 8h):
  - Participante/admin: `{ userId, matricula, nome, role, empresaId, empresaSlug, primeiroAcesso? }`
  - Owner: `{ ownerId, nome, isOwner: true }`
- **Guards** (`src/server/auth`): variante de **página** redireciona; variante de **API** retorna `401/403`. Ambas embutem o tenant para evitar vazamento entre empresas.

---

## 6. Segurança (resumo)

Detalhes e checklist em `docs/SECURITY.md`. Pilares:

- Cookies httpOnly + `secure` em produção; segredo de sessão validado (≥32 chars).
- Headers de segurança (CSP, HSTS, X-Frame-Options, etc.) no `next.config.ts`.
- Rate limiting em rotas sensíveis (login, recuperação de senha).
- Validação de entrada com `zod`; validação de upload (tipo/tamanho).
- Crons protegidos por `CRON_SECRET`.
- Isolamento estrito por `empresaId` em todas as queries.

---

## 7. Operação

- **Distribuição diária**: `/api/cron/distribuir` (agendamento por campanha: dias, horário, frequência).
- **Scripts**: `scripts/` (backup do banco, distribuição, fim de semana, crontab).
- **Ambiente**: variáveis validadas em `src/env.ts` (falha cedo se faltar algo).

---

## 8. Evolução planejada

1. Migração de banco **MySQL → PostgreSQL (Supabase)** + otimização (índices, RLS).
2. Email transacional via **Resend**.
3. Painel admin da empresa self-service completo (campanha, participantes, relatórios).
4. Mecânicas **Tombamento** (offboarding/anonimização) e **Melt** (reciclagem de repetidas).
