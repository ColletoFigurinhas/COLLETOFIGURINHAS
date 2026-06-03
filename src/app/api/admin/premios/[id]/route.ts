import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession()
  if (!s?.userId || !ROLES.includes(s.role as any))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const albumItemId = parseInt(id)
  if (isNaN(albumItemId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const { entregue } = await request.json()

  const item = await db.albumItem.update({
    where: { id: albumItemId },
    data: {
      entregue,
      entregueEm: entregue ? new Date() : null,
      entregueBy: entregue ? (s.nome ?? 'admin') : null,
    },
    select: { id: true, entregue: true, entregueEm: true, entregueBy: true },
  })

  return NextResponse.json(item)
}
