# 🔒 Segurança — Collêto Figurinhas

> Postura de segurança da plataforma (o álbum, produto que vai a produção no Vercel).
> Complementa `docs/ARCHITECTURE.md`. Última atualização: 2026-06-22.

Dados sensíveis em jogo: credenciais de login de muitas pessoas e **fotos** de funcionários. Segurança é requisito de primeira ordem.

---

## 1. Autenticação & sessão

- Sessão em **JWT (`jose`, HS256)** dentro de cookie **httpOnly**, `sameSite=lax`, `secure` em produção (`COOKIE_SECURE=true`), validade 8h.
- Senhas com **bcrypt**.
- `SESSION_SECRET` validado (mínimo 32 caracteres) via `src/env.ts`.
- Guards centralizados:
  - **Páginas/RSC** (`src/lib/dal.ts`): `verifySession` / `verifyRole` / `verifySuperAdmin` — redirecionam.
  - **APIs** (`src/server/auth/api.ts`): `requireUser` / `requireRole` / `requireAdmin` / `requireSuper` — retornam `401/403`.

## 2. Isolamento multi-tenant (anti-vazamento)

- Toda query de dados de empresa filtra por **`empresaId`** (vindo da sessão, nunca do cliente).
- Rotas com `[id]` que alteram/excluem recurso **verificam que ele pertence à empresa** antes da operação (`premios/[id]`, `figurinhas/[id]`, `especiais/[id]`, `participantes/[id]`).
- **Roadmap:** ao migrar para Postgres/Supabase, ativar **Row-Level Security (RLS)** como segunda barreira no banco.

## 3. Rate limiting

- Aplicado em login e recuperação de senha (`src/lib/ratelimit.ts`), por IP (10 tentativas / 60s).

### ⚠️ Limitação atual (corrigir antes/junto da ida pro Vercel)

**Problema.** O contador de tentativas é um `Map` na memória do processo Node. Isso funciona num **servidor único** (ex.: droplet rodando 1 processo). Mas o **Vercel é serverless**: cada requisição pode cair numa **instância diferente e efêmera**, cada uma com sua própria memória — logo, seu próprio contador.

Num brute-force de login, as tentativas se espalham por várias instâncias e **nenhuma chega ao limite**:

```text
Tentativa 1 → Instância A → contador A = 1
Tentativa 2 → Instância B → contador B = 1   (não enxerga o A)
Tentativa 3 → Instância C → contador C = 1
```

Resultado: no Vercel o rate limit vira **decorativo** (não quebra o app, mas não protege). Some-se a isso: instâncias reiniciam (cold start) zerando o contador, e o `setInterval` de limpeza não roda de forma confiável em serverless.

**Como corrigir.** Tirar o contador da memória e usar um **store compartilhado** (Redis) que todas as instâncias enxergam.

- Recomendado: **Upstash Redis** (serverless, free tier, integra com Vercel) + lib `@upstash/ratelimit`. Alternativa: **Vercel KV** (Upstash por baixo).
- Mudança **isolada**: só `src/lib/ratelimit.ts` muda; quem chama (`actions/auth.ts`) continua igual.
- Manter **fallback em memória no dev** (sem precisar de Redis local) e usar Redis quando as envs existirem.

**O que precisamos.**

1. Conta no **Upstash** (ou ativar **Vercel KV**) → criar um banco Redis.
2. Variáveis de ambiente: `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (no `.env.local` e nas envs do Vercel).
3. Pacotes: `npm i @upstash/ratelimit @upstash/redis`.
4. Adicionar essas vars (opcionais) no `src/env.ts` e reescrever `rateLimit()` para usar o sliding window do Upstash, com fallback para o `Map` quando as vars não estiverem setadas.

**Esforço:** pequeno (~1 arquivo + config). Pode ser feito junto da migração pro Vercel/Supabase.

## 4. Headers de segurança (`next.config.ts`)

| Header | Valor |
| :--- | :--- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` (anti-clickjacking) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` |
| `Content-Security-Policy-Report-Only` | baseline (ver abaixo) |
| `X-Powered-By` | removido (`poweredByHeader: false`) |

**CSP:** começa em **Report-Only** para não quebrar o álbum 3D/Sentry. **TODO:** validar em staging e promover para `Content-Security-Policy` (enforce); endurecer `script-src` com **nonce** (remover `'unsafe-inline'`).

## 5. Uploads de imagem

- Aceita só **PNG/JPG/WEBP** (por `file.type`), tamanho **máx. 5 MB**.
- Pasta de destino por **whitelist** (`VERDE`/`AMARELO`/`Especiais`); nome de arquivo validado por regex.
- **Path traversal** bloqueado em duas camadas: na rota e no `storage.ts` (`path.basename`). A rota que serve imagens (`/api/figuras/[...path]`) também sanitiza cada segmento e confina à pasta base.

## 6. Crons

- `/api/cron/distribuir` exige `CRON_SECRET` (header `x-cron-secret` ou query `key`).

## 7. Segredos & ambiente

- Variáveis validadas com **zod** em `src/env.ts` (falha cedo se faltar/for inválida). `.env*` fora do versionamento.
- Em produção: `COOKIE_SECURE=true`, `SESSION_SECRET` forte e único, `CRON_SECRET` definido.

## 8. LGPD

- Titular pode **exportar** (`GET /api/me/dados`) e **anonimizar** seus dados (`DELETE /api/me/dados`).
- **Tombamento** (offboarding/anonimização de desligados pelo RH) — planejado.

---

## 9. Checklist / próximos passos

- [ ] Promover CSP de Report-Only para enforce (após staging) + nonce em `script-src`
- [ ] Rate limit distribuído (Upstash/Redis)
- [ ] RLS no Postgres/Supabase (2ª barreira de isolamento)
- [ ] 2FA para Super Admin
- [ ] Log de auditoria (ações de admin/super admin)
- [ ] Varredura de dependências (Dependabot / `npm audit` no CI)
