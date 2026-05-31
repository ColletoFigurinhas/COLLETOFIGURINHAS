import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession()
  if (!s?.userId || !ROLES.includes(s.role as any))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const data: Record<string, any> = {}
  if (body.ativo        !== undefined) data.ativo         = body.ativo
  if (body.classificacao !== undefined) data.classificacao = body.classificacao
  if (body.tipo         !== undefined) data.tipo          = body.tipo
  if (body.imagemUrl    !== undefined) data.imagemUrl     = body.imagemUrl

  const f = await db.figurinha.update({ where: { id: Number(id) }, data })
  return NextResponse.json(f)
}
