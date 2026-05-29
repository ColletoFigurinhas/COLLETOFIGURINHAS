import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import type { Role } from '@prisma/client'

export type SessionUser = {
  userId:    number
  matricula: string
  nome:      string
  role:      Role
}

export const verifySession = cache(async (): Promise<SessionUser> => {
  const session = await getSession()
  const userId  = Number(session?.userId)
  if (!session?.userId || !Number.isInteger(userId) || userId <= 0) redirect('/login')
  if (session.primeiroAcesso) redirect('/primeiro-acesso')
  return {
    userId:    userId,
    matricula: session.matricula,
    nome:      session.nome,
    role:      session.role,
  }
})

export async function verifyRole(...roles: Role[]): Promise<SessionUser> {
  const user = await verifySession()
  if (!roles.includes(user.role)) redirect('/album')
  return user
}

export const getOptionalSession = cache(async (): Promise<SessionUser | null> => {
  const session = await getSession()
  if (!session?.userId || session.primeiroAcesso) return null
  return {
    userId:    session.userId,
    matricula: session.matricula,
    nome:      session.nome,
    role:      session.role,
  }
})
