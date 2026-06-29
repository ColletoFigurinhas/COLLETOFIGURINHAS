# 🐘 Migração — MySQL → Supabase (PostgreSQL)

> Complementa `docs/ARCHITECTURE.md`.
>
> Última atualização: 2026-06-23 · Status: **✅ EXECUTADO** (cutover do banco + storage feito)

## ✅ O que já foi feito (commit do cutover)

- Provider `postgresql`; tabelas com prefixo **`colleto_`** (13 tabelas) + índices escaláveis.
- `db.ts` com `@prisma/adapter-pg`; `env.ts` com `DATABASE_URL` (pooler) + `DIRECT_URL`.
- Schema sincronizado no Supabase via `prisma db push` + `seed` rodando.
- **Storage**: bucket **privado** `figurinhas`; upload por empresa (`{empresaId}/{folder}/{file}`);
  imagens servidas pela rota `/api/figuras/[...path]` com auth + isolamento por empresa.

## ⏭️ Pendências pós-cutover

- **Enums** (`StatusCampanha`, `Plano`, `TipoFigurinha`) — adiados (hoje ainda `String`). Fazer com calma (ripple no código).
- **Histórico de migrations**: usamos `db push` (sem migration). Baseline com `prisma migrate` quando o schema estabilizar.
- **RLS** nas tabelas (2ª barreira) — ver `SECURITY.md`.
- **Deploy no Vercel**: setar as env vars (DATABASE_URL, DIRECT_URL, STORAGE_*, SESSION_SECRET, etc.).

---

## (Referência) Plano original

---

## Objetivo

Migrar o banco do álbum de **MariaDB/MySQL (local)** para **PostgreSQL no Supabase**, aproveitando o cutover para: aplicar o **padrão de nomes `colleto_`**, trocar `String` por **enums**, adicionar **índices** escaláveis e preparar terreno para **RLS**.

## Estado atual (baseline)

- Banco local MariaDB `album_samsung` — **dados fictícios e descartáveis** (8 participantes, 10 figurinhas, 2 empresas, ~290 `pacote_figurinhas`). Será **recriado do zero** no Supabase.
- 13 tabelas de aplicação + `_prisma_migrations`. Histórico de migration atual é SQL de MySQL → **será descartado**; criamos um migration inicial novo pro Postgres.

---

## 1. Padrão de nomes — prefixo `colleto_`

Só muda o `@@map` (nome no banco). Os models no código (`Empresa`, `Participante`…) **continuam iguais** → sem mudança no resto do código.

| Hoje | Novo |
|---|---|
| `empresas` | `colleto_empresas` |
| `super_admins` | `colleto_super_admins` |
| `participantes` | `colleto_participantes` |
| `campanhas` | `colleto_campanhas` |
| `figurinhas` | `colleto_figurinhas` |
| `album_itens` | `colleto_album_itens` |
| `pacotes` | `colleto_pacotes` |
| `pacote_figurinhas` | `colleto_pacote_figurinhas` |
| `premios_fisicos` | `colleto_premios_fisicos` |
| `trocas` | `colleto_trocas` |
| `acoes_campanha` | `colleto_acoes_campanha` |
| `ganhadores_acao` | `colleto_ganhadores_acao` |
| `logs_distribuicao_manual` | `colleto_logs_distribuicao_manual` |

> Alternativa considerada: schema dedicado do Postgres (`colleto.empresas`). Decisão: **prefixo `colleto_`** (explícito e portável).

## 2. Melhorias escaláveis (no mesmo cutover)

### Enums (integridade; Postgres tem enum nativo)
- `Campanha.status` → `StatusCampanha { ATIVA, ENCERRADA, RASCUNHO }`
- `Empresa.plano` → `Plano { BASICO, MEDIO, COMPLETO }` (casa com os 3 níveis do produto)
- `Figurinha.tipo` → `TipoFigurinha { FUNCIONARIO, ESPECIAL }`
- `Figurinha.classificacao` continua `String` (nome de seção/departamento, dinâmico) — mas **indexado**.

> ⚠️ Ao trocar para enum, alinhar os valores usados no código (hoje compara strings tipo `status: 'ativo'`). Ajustar `services/campanha.ts`, rotas admin e seed.

### Índices (além dos índices de FK automáticos)
- `colleto_figurinhas`: `@@index([campanhaId, ativo])`
- `colleto_trocas`: `@@index([destinatarioId, status])`, `@@index([solicitanteId, status])`
- `colleto_album_itens`: `@@index([figurinhaId])`
- `colleto_pacotes`: `@@index([participanteId, status])`
- `colleto_acoes_campanha`: `@@index([campanhaId])`
- `colleto_pacote_figurinhas`: `@@index([pacoteId])`

### Outros
- Timestamps consistentes (`criadoEm`/`atualizadoEm`) onde faltam.

## 3. Mudanças de infra (arquivos)

- `prisma/schema.prisma`: `provider = "postgresql"`; aplicar nomes + enums + índices.
- `src/lib/db.ts`: trocar adapter `@prisma/adapter-mariadb` → **`pg`** / `@prisma/adapter-pg`.
- `package.json`: remover `mariadb` + `@prisma/adapter-mariadb`; adicionar `pg` (+ `@types/pg`) ou `@prisma/adapter-pg`.
- `src/env.ts`: `DATABASE_URL` (pooler) + **`DIRECT_URL`** (direta, p/ migrations); remover/onestar DB_HOST/PORT/USER/PASSWORD/NAME.
- `prisma.config.ts`: usar `DIRECT_URL` para comandos de migration.
- `prisma/seed.ts`: revisar valores de enum e dados de teste.

## 4. Conexões Supabase

- `DATABASE_URL` = **Connection pooler** (Transaction mode, porta `6543`, `?pgbouncer=true&connection_limit=1`) — usado em runtime serverless (Vercel).
- `DIRECT_URL` = **Conexão direta** (porta `5432`) — usado por `prisma migrate`/`db push`.
- Ambas vão no `.env.local` e nas env vars do Vercel.

## 5. Passos de execução (quando tiver as strings)

1. [ ] Criar projeto Supabase e copiar as 2 connection strings.
2. [ ] Colocar `DATABASE_URL` + `DIRECT_URL` no `.env.local`.
3. [ ] Trocar dependências (`pg` no lugar de `mariadb`) e ajustar `db.ts`.
4. [ ] Reescrever `schema.prisma` (provider postgres + nomes `colleto_` + enums + índices).
5. [ ] Ajustar `env.ts`, `prisma.config.ts`, código que compara strings de status, e `seed.ts`.
6. [ ] `prisma migrate dev --name init_supabase` (migration novo do zero).
7. [ ] `npm run seed` e validar localmente apontando pro Supabase.
8. [ ] `tsc --noEmit` + `npm run build`.
9. [ ] Configurar as env vars no Vercel e fazer deploy.
10. [ ] (Depois) Ativar **RLS** nas tabelas como 2ª barreira de isolamento (ver `SECURITY.md`).

## O que precisamos de você

- Projeto Supabase criado + as **duas connection strings** (pooler e direct).
