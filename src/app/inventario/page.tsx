import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import InventarioClient from './InventarioClient'

export type FigurinhaInventario = {
  id:            number
  classificacao: string
  imagemUrl:     string | null
  quantidade:    number
}

export type PremioInventario = {
  id:                 number
  classificacao:      string
  imagemUrl:          string | null
  quantidade:         number
  quantidadeEntregue: number
}

export default async function InventarioPage() {
  const { userId, empresaId } = await verifySession()

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })

  const [figurinhas, albumItens] = await Promise.all([
    campanha
      ? db.figurinha.findMany({
          where:   { campanhaId: campanha.id, ativo: true },
          select:  { id: true, classificacao: true, imagemUrl: true },
          orderBy: { id: 'asc' },
        })
      : Promise.resolve([]),
    db.albumItem.findMany({
      where:  { participanteId: userId },
      select: { figurinhaId: true, quantidade: true, quantidadeEntregue: true },
    }),
  ])

  const qtdMap         = new Map(albumItens.map(a => [a.figurinhaId, a.quantidade]))
  const qtdEntregueMap = new Map(albumItens.map(a => [a.figurinhaId, a.quantidadeEntregue]))

  const normais   = figurinhas.filter(f => !['PREMIO PRATA', 'PREMIO OURO'].includes(f.classificacao))
  const premiadas = figurinhas.filter(f =>  ['PREMIO PRATA', 'PREMIO OURO'].includes(f.classificacao))

  const colecao: FigurinhaInventario[] = normais.map(f => ({
    id: f.id, classificacao: f.classificacao, imagemUrl: f.imagemUrl,
    quantidade: qtdMap.get(f.id) ?? 0,
  }))

  const ordemVista: string[] = []
  const seen = new Set<string>()
  for (const f of normais) {
    if (!seen.has(f.classificacao)) { seen.add(f.classificacao); ordemVista.push(f.classificacao) }
  }

  const secoes = ordemVista
    .map(c => ({ classificacao: c, figurinhas: colecao.filter(f => f.classificacao === c) }))
    .filter(s => s.figurinhas.length > 0)

  const premios: PremioInventario[] = premiadas
    .filter(f => (qtdMap.get(f.id) ?? 0) > 0)
    .map(f => ({
      id: f.id, classificacao: f.classificacao, imagemUrl: f.imagemUrl,
      quantidade:         qtdMap.get(f.id) ?? 0,
      quantidadeEntregue: qtdEntregueMap.get(f.id) ?? 0,
    }))
    .sort((a, b) => a.classificacao.localeCompare(b.classificacao))

  return <InventarioClient secoes={secoes} premios={premios} />
}
