import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import AlbumClient from './AlbumClient'

export type FigurinhaSlot = {
  id:        number
  imagemUrl: string | null
  tipo:      string
}
export type SectionData = { classificacao: string; figurinhas: FigurinhaSlot[] }

export default async function AlbumPage() {
  const { userId, nome, matricula, empresaId } = await verifySession()

  const participante = await db.participante.findUnique({ where: { id: userId }, select: { role: true } })
  const role = participante?.role ?? 'PARTICIPANTE'

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })

  const [todasFigurinhas, albumItens] = await Promise.all([
    campanha
      ? db.figurinha.findMany({
          where:   { campanhaId: campanha.id, ativo: true },
          select:  { id: true, classificacao: true, imagemUrl: true, tipo: true },
          orderBy: { id: 'asc' },
        })
      : Promise.resolve([]),
    db.albumItem.findMany({
      where:  { participanteId: userId, quantidade: { gt: 0 } },
      select: { figurinhaId: true },
    }),
  ])

  const coletadas = new Set(albumItens.map(a => a.figurinhaId))

  const ordemVista: string[] = []
  const seenSet = new Set<string>()
  for (const f of todasFigurinhas) {
    if (!seenSet.has(f.classificacao)) {
      seenSet.add(f.classificacao)
      ordemVista.push(f.classificacao)
    }
  }

  const sections: SectionData[] = ordemVista
    .map(classificacao => ({
      classificacao,
      figurinhas: todasFigurinhas
        .filter(f => f.classificacao === classificacao)
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
