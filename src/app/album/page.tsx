import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import AlbumClient from './AlbumClient'

// Ordem exata conforme os valores no banco (resultado do groupBy)
const ORDEM_SECOES = [
  'COMERCIAL',
  'ALMOXARIFADO',
  'GARANTIA DA QUALIDADE',
  'MARKETING / TI',
  'FINANCEIRO',
  'COMPRAS',
  'RH / SERVIÇOS GERAIS',
  'ESPECIAIS',
]

export type FigurinhaSlot = {
  id:        number
  imagemUrl: string | null
  tipo:      string   // 'FUNCIONARIO' | 'GESTOR'
}
export type SectionData = { classificacao: string; figurinhas: FigurinhaSlot[] }

export default async function AlbumPage() {
  const { userId, nome, matricula, role } = await verifySession()

  const [todasFigurinhas, albumItens] = await Promise.all([
    db.figurinha.findMany({
      where:   { campanha: { slug: 'super-copa-2026' }, ativo: true },
      select:  { id: true, classificacao: true, imagemUrl: true, tipo: true },
      orderBy: { id: 'asc' },
    }),
    db.albumItem.findMany({
      where:  { participanteId: userId },
      select: { figurinhaId: true },
    }),
  ])

  const coletadas = new Set(albumItens.map(a => a.figurinhaId))

  const sections: SectionData[] = ORDEM_SECOES
    .map(classificacao => ({
      classificacao,
      figurinhas: todasFigurinhas
        .filter(f => f.classificacao === classificacao)
        // Gestor primeiro, depois os demais por id
        .sort((a, b) => {
          if (a.tipo === 'GESTOR' && b.tipo !== 'GESTOR') return -1
          if (a.tipo !== 'GESTOR' && b.tipo === 'GESTOR') return 1
          return a.id - b.id
        })
        .map(f => ({
          id:        f.id,
          imagemUrl: coletadas.has(f.id) ? f.imagemUrl : null,
          tipo:      f.tipo,
        })),
    }))
    .filter(s => s.figurinhas.length > 0)

  return <AlbumClient sections={sections} nomeUsuario={nome} matricula={matricula} role={role} />
}
