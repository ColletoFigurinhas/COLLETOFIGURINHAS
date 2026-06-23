import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { empresaId } = auth.session

    const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
    const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
    if (!campanha) return NextResponse.json([])

    const itens = await db.albumItem.findMany({
      where: {
        figurinha: {
          campanhaId:    campanha.id,
          classificacao: { in: ['PREMIO PRATA', 'PREMIO OURO'] },
        },
        ...(q ? {
          participante: {
            empresaId,
            OR: [{ nome: { contains: q } }, { matricula: { contains: q } }],
          },
        } : {
          participante: { empresaId },
        }),
      },
      select: {
        id:                 true,
        quantidade:         true,
        quantidadeEntregue: true,
        entregueEm:         true,
        entregueBy:         true,
        participante: { select: { id: true, nome: true, matricula: true } },
        figurinha:    { select: { id: true, classificacao: true, tipo: true, imagemUrl: true } },
      },
      orderBy: { id: 'asc' },
    })

    const linhas = itens.flatMap(item =>
      Array.from({ length: item.quantidade }, (_, i) => ({
        albumItemId:  item.id,
        unidade:      i + 1,
        entregue:     i < item.quantidadeEntregue,
        entregueEm:   i < item.quantidadeEntregue ? item.entregueEm : null,
        entregueBy:   i < item.quantidadeEntregue ? item.entregueBy : null,
        participante: item.participante,
        figurinha:    item.figurinha,
      }))
    )

    linhas.sort((a, b) => {
      if (a.entregue !== b.entregue) return a.entregue ? 1 : -1
      return a.participante.nome.localeCompare(b.participante.nome)
    })

    return NextResponse.json(linhas)
  } catch (err: any) {
    console.error('[premios] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro interno' }, { status: 500 })
  }
}
