import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ORDEM_SECOES = [
  'COMERCIAL',
  'ALMOXARIFADO',
  'GARANTIA DA QUALIDADE',
  'MARKETING / TI',
  'FINANCEIRO',
  'COMPRAS',
  'MANUTENÇÃO E CONSERVAÇÃO',
  'RECURSOS HUMANOS',
  'ESPECIAIS',
]

export async function GET() {
  try {
    const session = await getSession()
    const userId  = Number(session?.userId)
    if (!session?.userId || !Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const [figurinhas, albumItens] = await Promise.all([
      db.figurinha.findMany({
        where:   { campanha: { slug: 'super-copa-2026' }, ativo: true },
        select:  { id: true, classificacao: true, imagemUrl: true },
        orderBy: { id: 'asc' },
      }),
      db.albumItem.findMany({
        where:  { participanteId: userId },
        select: { figurinhaId: true, quantidade: true },
      }),
    ])

    const qtdMap = new Map(albumItens.map(a => [a.figurinhaId, a.quantidade]))

    const colecao = figurinhas.map(f => ({
      id:            f.id,
      classificacao: f.classificacao,
      imagemUrl:     f.imagemUrl,
      quantidade:    qtdMap.get(f.id) ?? 0,
    }))

    const secoes = ORDEM_SECOES
      .map(c => ({ classificacao: c, figurinhas: colecao.filter(f => f.classificacao === c) }))
      .filter(s => s.figurinhas.length > 0)

    return NextResponse.json(secoes)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
