import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/server/auth/api'

const PREMIOS_CLASSIF = ['PREMIO PRATA', 'PREMIO OURO']

export async function GET() {
  try {
    const auth = await requireUser()
    if (!auth.ok) return auth.response
    const { userId, empresaId } = auth.session

    const campanha = await db.campanha.findFirst({
      where: { empresaId, status: 'ativo' },
    })
    if (!campanha) return NextResponse.json({ secoes: [], premios: [] })

    const [figurinhas, albumItens] = await Promise.all([
      db.figurinha.findMany({
        where:   { campanhaId: campanha.id, ativo: true },
        select:  { id: true, classificacao: true, imagemUrl: true },
        orderBy: { id: 'asc' },
      }),
      db.albumItem.findMany({
        where:  { participanteId: userId },
        select: { figurinhaId: true, quantidade: true, quantidadeEntregue: true },
      }),
    ])

    const qtdMap         = new Map(albumItens.map(a => [a.figurinhaId, a.quantidade]))
    const qtdEntregueMap = new Map(albumItens.map(a => [a.figurinhaId, a.quantidadeEntregue]))

    const normais   = figurinhas.filter(f => !PREMIOS_CLASSIF.includes(f.classificacao))
    const premiadas = figurinhas.filter(f =>  PREMIOS_CLASSIF.includes(f.classificacao))

    const colecao = normais.map(f => ({
      id: f.id, classificacao: f.classificacao, imagemUrl: f.imagemUrl,
      quantidade: qtdMap.get(f.id) ?? 0,
    }))

    // Ordem dinâmica: seções na ordem em que aparecem no banco
    const ordemVista: string[] = []
    const seen = new Set<string>()
    for (const f of normais) {
      if (!seen.has(f.classificacao)) { seen.add(f.classificacao); ordemVista.push(f.classificacao) }
    }

    const secoes = ordemVista
      .map(c => ({ classificacao: c, figurinhas: colecao.filter(f => f.classificacao === c) }))
      .filter(s => s.figurinhas.length > 0)

    const premios = premiadas
      .filter(f => (qtdMap.get(f.id) ?? 0) > 0)
      .map(f => ({
        id: f.id, classificacao: f.classificacao, imagemUrl: f.imagemUrl,
        quantidade:         qtdMap.get(f.id) ?? 0,
        quantidadeEntregue: qtdEntregueMap.get(f.id) ?? 0,
      }))
      .sort((a, b) => a.classificacao.localeCompare(b.classificacao))

    return NextResponse.json({ secoes, premios })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
