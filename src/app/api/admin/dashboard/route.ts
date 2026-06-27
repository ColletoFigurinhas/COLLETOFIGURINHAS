import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export const dynamic = 'force-dynamic'

const PREMIOS = ['ESPECIAIS', 'PREMIO PRATA', 'PREMIO OURO']

// GET — KPIs agregados da campanha ativa (Visão Geral do admin)
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const campanha = await db.campanha.findFirst({
    where:   { empresaId, status: 'ativo' },
    orderBy: { createdAt: 'desc' },
  })
  if (!campanha) return NextResponse.json({ semCampanha: true })

  const totalCartas = await db.figurinha.count({
    where: { campanhaId: campanha.id, ativo: true, classificacao: { notIn: PREMIOS } },
  })

  const [participantesAtivos, pacotesTotais, pacotesAbertos, pacotesDisponiveis, trocasAceitas] = await Promise.all([
    db.participante.count({ where: { empresaId, ativo: true } }),
    db.pacote.count({ where: { campanhaId: campanha.id } }),
    db.pacote.count({ where: { campanhaId: campanha.id, status: 'ABERTO' } }),
    db.pacote.count({ where: { campanhaId: campanha.id, status: 'DISPONIVEL' } }),
    db.troca.count({ where: { campanhaId: campanha.id, status: 'ACEITA' } }),
  ])

  // Coleção por participante (cartas normais distintas coletadas)
  const grupos = await db.albumItem.groupBy({
    by: ['participanteId'],
    where: {
      quantidade:   { gt: 0 },
      participante: { empresaId, ativo: true },
      figurinha:    { campanhaId: campanha.id, ativo: true, classificacao: { notIn: PREMIOS } },
    },
    _count: { figurinhaId: true },
  })

  let completaram = 0
  let somaPct = 0
  for (const g of grupos) {
    const coletadas = g._count.figurinhaId
    somaPct += totalCartas > 0 ? Math.min(1, coletadas / totalCartas) : 0
    if (totalCartas > 0 && coletadas >= totalCartas) completaram++
  }
  const percentualMedio = participantesAtivos > 0 ? Math.round((somaPct / participantesAtivos) * 100) : 0
  const semColetar = Math.max(0, participantesAtivos - grupos.length)

  return NextResponse.json({
    campanha: {
      nome:               campanha.nome,
      status:             campanha.status,
      dataInicio:         campanha.dataInicio,
      dataFim:            campanha.dataFim,
      temperatura:        campanha.temperatura,
      ultimaDistribuicao: campanha.ultimaDistribuicao,
    },
    totalCartas,
    participantesAtivos,
    completaram,
    percentualMedio,
    semColetar,
    pacotesTotais,
    pacotesAbertos,
    pacotesDisponiveis,
    trocasAceitas,
  })
}
