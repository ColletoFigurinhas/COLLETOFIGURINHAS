import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

async function auth() {
  const s = await getSession()
  if (!s?.userId || !s.empresaId || !ROLES.includes(s.role as any)) return null
  return s
}

// PATCH — ativa/desativa, troca role, reseta senha
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await auth()
  if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const pid = Number(id)
  const body = await request.json()

  const participante = await db.participante.findFirst({
    where: { id: pid, empresaId: s.empresaId },
  })
  if (!participante) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const data: Record<string, any> = {}
  if (body.ativo  !== undefined) data.ativo = body.ativo
  if (body.role   !== undefined) data.role  = body.role
  if (body.senha  !== undefined) data.senha = await bcrypt.hash(String(body.senha), 10)
  if (body.email  !== undefined) data.email = body.email

  const updated = await db.participante.update({
    where:  { id: pid },
    data,
    select: { id: true, matricula: true, nome: true, email: true, role: true, ativo: true },
  })
  return NextResponse.json(updated)
}
