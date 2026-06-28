import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export const dynamic = 'force-dynamic'

const PREMIOS = ['ESPECIAIS', 'PREMIO PRATA', 'PREMIO OURO']

// GET — estatísticas detalhadas: por carta e por participante
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json({ semCampanha: true })

  const figs = await db.figurinha.findMany({
    where:   { campanhaId: campanha.id },
    select:  { id: true, classificacao: true, tipo: true, ativo: true, imagemUrl: true },
    orderBy: { id: 'asc' },
  })
  const totalCartasNormais = figs.filter(f => f.ativo && !PREMIOS.includes(f.classificacao)).length

  // ── Por carta: donos + cópias + saídas (vezes que saiu em pacote) ──
  const [donosCopias, saidas] = await Promise.all([
    db.albumItem.groupBy({
      by:     ['figurinhaId'],
      where:  { quantidade: { gt: 0 }, participante: { empresaId, ativo: true }, figurinha: { campanhaId: campanha.id } },
      _count: { participanteId: true },
      _sum:   { quantidade: true },
    }),
    db.pacoteFigurinha.groupBy({
      by:     ['figurinhaId'],
      where:  { pacote: { campanhaId: campanha.id } },
      _count: { id: true },
    }),
  ])
  const donosMap  = new Map(donosCopias.map(g => [g.figurinhaId, { donos: g._count.participanteId, copias: g._sum.quantidade ?? 0 }]))
  const saidasMap = new Map(saidas.map(g => [g.figurinhaId, g._count.id]))

  const cartas = figs.map(f => ({
    id: f.id, classificacao: f.classificacao, tipo: f.tipo, ativo: f.ativo, imagemUrl: f.imagemUrl,
    premio: PREMIOS.includes(f.classificacao),
    donos:  donosMap.get(f.id)?.donos  ?? 0,
    copias: donosMap.get(f.id)?.copias ?? 0,
    saidas: saidasMap.get(f.id) ?? 0,
  }))

  // ── Por participante ──
  const participantes = await db.participante.findMany({
    where:  { empresaId, ativo: true },
    select: { id: true, nome: true, matricula: true },
  })
  const [colecaoNormais, pacGrp, tEnv, tRec] = await Promise.all([
    db.albumItem.groupBy({
      by:     ['participanteId'],
      where:  { quantidade: { gt: 0 }, participante: { empresaId, ativo: true }, figurinha: { campanhaId: campanha.id, ativo: true, classificacao: { notIn: PREMIOS } } },
      _count: { figurinhaId: true },
      _sum:   { quantidade: true },
    }),
    db.pacote.groupBy({ by: ['participanteId', 'status'], where: { campanhaId: campanha.id }, _count: { id: true } }),
    db.troca.groupBy({ by: ['solicitanteId'],  where: { campanhaId: campanha.id, status: 'ACEITA' }, _count: { id: true } }),
    db.troca.groupBy({ by: ['destinatarioId'], where: { campanhaId: campanha.id, status: 'ACEITA' }, _count: { id: true } }),
  ])
  const colMap = new Map(colecaoNormais.map(g => [g.participanteId, { distinct: g._count.figurinhaId, copias: g._sum.quantidade ?? 0 }]))
  const abertosMap = new Map<number, number>()
  const pendentesMap = new Map<number, number>()
  for (const g of pacGrp) {
    if (g.status === 'ABERTO') abertosMap.set(g.participanteId, g._count.id)
    else if (g.status === 'DISPONIVEL') pendentesMap.set(g.participanteId, g._count.id)
  }
  const trocaMap = new Map<number, number>()
  for (const g of tEnv) trocaMap.set(g.solicitanteId, (trocaMap.get(g.solicitanteId) ?? 0) + g._count.id)
  for (const g of tRec) trocaMap.set(g.destinatarioId, (trocaMap.get(g.destinatarioId) ?? 0) + g._count.id)

  const parts = participantes.map(p => {
    const col = colMap.get(p.id)
    const distinct = col?.distinct ?? 0
    const copias   = col?.copias ?? 0
    return {
      id: p.id, nome: p.nome, matricula: p.matricula,
      coletadas:  distinct,
      total:      totalCartasNormais,
      percentual: totalCartasNormais > 0 ? Math.round((distinct / totalCartasNormais) * 100) : 0,
      repetidas:  Math.max(0, copias - distinct),
      pacotesAbertos:   abertosMap.get(p.id) ?? 0,
      pacotesPendentes: pendentesMap.get(p.id) ?? 0,
      trocas:     trocaMap.get(p.id) ?? 0,
    }
  })

  return NextResponse.json({
    campanha: { nome: campanha.nome, dataInicio: campanha.dataInicio, dataFim: campanha.dataFim },
    totalCartasNormais,
    classificacoes: [...new Set(figs.map(f => f.classificacao))],
    cartas,
    participantes: parts,
  })
}
