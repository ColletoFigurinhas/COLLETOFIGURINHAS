import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId, nome } = auth.session

  const { id } = await params
  const albumItemId = parseInt(id)
  if (isNaN(albumItemId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const { entregar } = await request.json()

  const item = await db.albumItem.findFirst({
    where: { id: albumItemId, participante: { empresaId } },
    select: { quantidade: true, quantidadeEntregue: true },
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const novaQtd = entregar
    ? Math.min(item.quantidade, item.quantidadeEntregue + 1)
    : Math.max(0, item.quantidadeEntregue - 1)

  const updated = await db.albumItem.update({
    where: { id: albumItemId },
    data: {
      quantidadeEntregue: novaQtd,
      entregueEm: entregar ? new Date() : (novaQtd === 0 ? null : undefined),
      entregueBy: entregar ? (nome ?? 'admin') : (novaQtd === 0 ? null : undefined),
    },
    select: { id: true, quantidadeEntregue: true, quantidade: true },
  })

  return NextResponse.json(updated)
}
