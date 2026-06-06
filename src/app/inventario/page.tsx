import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import InventarioClient from './InventarioClient'

const ORDEM_SECOES = [
  'COMERCIAL', 'ALMOXARIFADO', 'GARANTIA DA QUALIDADE',
  'MARKETING / TI', 'FINANCEIRO', 'COMPRAS',
  'RH / SERVIÇOS GERAIS', 'ESPECIAIS',
]

export type FigurinhaInventario = {
  id:            number
  classificacao: string
  imagemUrl:     string | null
  quantidade:    number   // 0 = não tem | 1 = tem | ≥2 = repetida
}

export type PremioInventario = {
  id:                 number
  classificacao:      string
  imagemUrl:          string | null
  quantidade:         number
  quantidadeEntregue: number
}

export default async function InventarioPage() {
  const { userId } = await verifySession()

  const [figurinhas, albumItens] = await Promise.all([
    db.figurinha.findMany({
      where:   { campanha: { status: 'ativo' }, ativo: true },
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

  const figurinhasNormais = figurinhas.filter(f => !['PREMIO PRATA', 'PREMIO OURO'].includes(f.classificacao))
  const figurinhasPremiadas = figurinhas.filter(f => ['PREMIO PRATA', 'PREMIO OURO'].includes(f.classificacao))

  const colecao: FigurinhaInventario[] = figurinhasNormais.map(f => ({
    id:            f.id,
    classificacao: f.classificacao,
    imagemUrl:     f.imagemUrl,
    quantidade:    qtdMap.get(f.id) ?? 0,
  }))

  const premios: PremioInventario[] = figurinhasPremiadas
    .filter(f => (qtdMap.get(f.id) ?? 0) > 0)
    .map(f => ({
      id:            f.id,
      classificacao: f.classificacao,
      imagemUrl:     f.imagemUrl,
      quantidade:         qtdMap.get(f.id) ?? 0,
      quantidadeEntregue: qtdEntregueMap.get(f.id) ?? 0,
    }))
    .sort((a, b) => a.classificacao.localeCompare(b.classificacao))

  const secoes = ORDEM_SECOES
    .map(c => ({ classificacao: c, figurinhas: colecao.filter(f => f.classificacao === c) }))
    .filter(s => s.figurinhas.length > 0)

  return <InventarioClient secoes={secoes} premios={premios} />
}

