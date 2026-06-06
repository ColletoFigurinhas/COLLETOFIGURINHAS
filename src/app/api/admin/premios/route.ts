import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

async function auth() {
  const s = await getSession()
  if (!s?.userId || !s.empresaId || !ROLES.includes(s.role as any)) return null
  return s
}

export async function GET(request: Request) {
  try {
    const s = await auth()
    if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
    const campanha = await db.campanha.findFirst({ where: { empresaId: s.empresaId, status: 'ativo' } })
    if (!campanha) return NextResponse.json([])

    const itens = await db.albumItem.findMany({
      where: {
        figurinha: {
          campanhaId:    campanha.id,
          classificacao: { in: ['PREMIO PRATA', 'PREMIO OURO'] },
        },
        ...(q ? {
          participante: {
            empresaId: s.empresaId,
            OR: [{ nome: { contains: q } }, { matricula: { contains: q } }],
          },
        } : {
          participante: { empresaId: s.empresaId },
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
