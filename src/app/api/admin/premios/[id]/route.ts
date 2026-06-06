import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession()
  if (!s?.userId || !s.empresaId || !ROLES.includes(s.role as any))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const albumItemId = parseInt(id)
  if (isNaN(albumItemId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const { entregar } = await request.json()

  const item = await db.albumItem.findUnique({
    where: { id: albumItemId },
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
      entregueBy: entregar ? (s.nome ?? 'admin') : (novaQtd === 0 ? null : undefined),
    },
    select: { id: true, quantidadeEntregue: true, quantidade: true },
  })

  return NextResponse.json(updated)
}
