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

export default async function InventarioPage() {
  const { userId } = await verifySession()

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

  // Mapa: figurinhaId → quantidade
  const qtdMap = new Map(albumItens.map(a => [a.figurinhaId, a.quantidade]))

  const colecao: FigurinhaInventario[] = figurinhas.map(f => ({
    id:            f.id,
    classificacao: f.classificacao,
    imagemUrl:     f.imagemUrl,
    quantidade:    qtdMap.get(f.id) ?? 0,
  }))

  // Agrupa por classificação na ordem do álbum
  const secoes = ORDEM_SECOES
    .map(c => ({ classificacao: c, figurinhas: colecao.filter(f => f.classificacao === c) }))
    .filter(s => s.figurinhas.length > 0)

  return <InventarioClient secoes={secoes} />
}
