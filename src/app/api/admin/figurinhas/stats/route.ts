import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export const dynamic = 'force-dynamic'

// GET — por figurinha: quantos participantes ativos têm (donos) e total de cópias
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json({})

  const grupos = await db.albumItem.groupBy({
    by: ['figurinhaId'],
    where: {
      quantidade:   { gt: 0 },
      participante: { empresaId, ativo: true },
      figurinha:    { campanhaId: campanha.id },
    },
    _count: { participanteId: true },
    _sum:   { quantidade: true },
  })

  const stats: Record<number, { donos: number; copias: number }> = {}
  for (const g of grupos) {
    stats[g.figurinhaId] = { donos: g._count.participanteId, copias: g._sum.quantidade ?? 0 }
  }
  return NextResponse.json(stats)
}
