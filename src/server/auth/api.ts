import 'server-only'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import type { Role } from '@prisma/client'

/**
 * Guards centralizados de autenticação para Route Handlers (APIs).
 *
 * Diferente de `src/lib/dal.ts` (que redireciona, para Server Components/páginas),
 * estes retornam uma `NextResponse` 401/403 — adequado para APIs.
 *
 * Uso:
 *   const auth = await requireAdmin()
 *   if (!auth.ok) return auth.response
 *   const { empresaId } = auth.session   // tenant garantido
 */

export type ApiUser = {
  userId:      number
  matricula:   string
  nome:        string
  role:        Role
  empresaId:   number
  empresaSlug: string
}

export type ApiOwner = {
  ownerId: number
  nome:    string
}

export type AuthResult<T> =
  | { ok: true;  session: T }
  | { ok: false; response: NextResponse }

function deny(status: number, error: string): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error }, { status }) }
}

/** Exige participante/admin autenticado, com tenant (empresaId) resolvido. */
export async function requireUser(): Promise<AuthResult<ApiUser>> {
  const s = await getSession()
  const userId = Number(s?.userId)
  if (!s?.userId || !Number.isInteger(userId) || userId <= 0 || !s.empresaId || !s.empresaSlug) {
    return deny(401, 'Não autorizado')
  }
  if (s.primeiroAcesso) return deny(403, 'Primeiro acesso pendente')
  return {
    ok: true,
    session: {
      userId,
      matricula:   s.matricula ?? '',
      nome:        s.nome,
      role:        s.role!,
      empresaId:   s.empresaId,
      empresaSlug: s.empresaSlug,
    },
  }
}

/** Exige um dos papéis informados. Sem argumentos, basta estar autenticado. */
export async function requireRole(...roles: Role[]): Promise<AuthResult<ApiUser>> {
  const r = await requireUser()
  if (!r.ok) return r
  if (roles.length && !roles.includes(r.session.role)) return deny(403, 'Acesso negado')
  return r
}

/** Atalho: qualquer papel administrativo da empresa (ADMIN, MARKETING, TI). */
export function requireAdmin(): Promise<AuthResult<ApiUser>> {
  return requireRole('ADMIN', 'MARKETING', 'TI')
}

/** Exige owner (equipe Collêto). */
export async function requireOwner(): Promise<AuthResult<ApiOwner>> {
  const s = await getSession()
  if (!s?.isOwner || !s.ownerId) return deny(401, 'Não autorizado')
  return { ok: true, session: { ownerId: s.ownerId, nome: s.nome } }
}

export type ApiEmpresa = { empresaId: number; empresaSlug: string }

/**
 * Autentica uma requisição EXTERNA pela API key da empresa.
 * Header: `Authorization: Bearer <key>` ou `x-api-key: <key>`.
 */
export async function requireEmpresaApiKey(request: Request): Promise<AuthResult<ApiEmpresa>> {
  const authz = request.headers.get('authorization')
  const key = request.headers.get('x-api-key')
    ?? (authz?.startsWith('Bearer ') ? authz.slice(7).trim() : null)
  if (!key) return deny(401, 'API key ausente (use Authorization: Bearer <key> ou x-api-key).')

  const empresa = await db.empresa.findFirst({
    where:  { apiKey: key, ativo: true },
    select: { id: true, slug: true },
  })
  if (!empresa) return deny(401, 'API key inválida.')
  return { ok: true, session: { empresaId: empresa.id, empresaSlug: empresa.slug } }
}
