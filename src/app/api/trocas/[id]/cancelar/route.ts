import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const trocaId = parseInt(id, 10)

  const troca = await db.troca.findUnique({ where: { id: trocaId } })
  if (!troca) return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 })
  if (troca.solicitanteId !== session.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  if (troca.status !== 'PENDENTE') return NextResponse.json({ error: 'Troca não está pendente' }, { status: 400 })

  await db.troca.update({
    where: { id: trocaId },
    data: { status: 'CANCELADA_PELO_SOLICITANTE', respondidoEm: new Date() },
  })

  return NextResponse.json({ ok: true })
}
