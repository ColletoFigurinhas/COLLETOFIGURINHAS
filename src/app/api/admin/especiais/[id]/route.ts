import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES_PERMITIDOS = ['MARKETING', 'TI', 'ADMIN'] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession()
  if (!s?.userId || !ROLES_PERMITIDOS.includes(s.role as any))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { ativo } = await request.json()
  const f = await db.figurinha.update({ where: { id: Number(id) }, data: { ativo } })
  return NextResponse.json(f)
}
