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

- Aplicado em login e recuperação de senha (`src/lib/ratelimit.ts`), por IP.
- ⚠️ **Limitação:** implementação em memória (Map) — funciona em 1 instância. No Vercel (serverless, multi-instância) **não é confiável**. **TODO:** migrar para store distribuído (Upstash/Redis) antes de escalar.

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
