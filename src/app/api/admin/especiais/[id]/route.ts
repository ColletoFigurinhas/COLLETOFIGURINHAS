import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const { id } = await params
  const figId = Number(id)
  const { ativo } = await request.json()

  const existe = await db.figurinha.findFirst({ where: { id: figId, campanha: { empresaId } }, select: { id: true } })
  if (!existe) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const f = await db.figurinha.update({ where: { id: figId }, data: { ativo } })
  return NextResponse.json(f)
}
