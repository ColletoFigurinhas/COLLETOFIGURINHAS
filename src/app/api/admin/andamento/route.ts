import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json({ totalFigurinhas: 0, totalPorClassif: {}, participantes: [] })

  const [figurinhas, participantes, trocas] = await Promise.all([
    db.figurinha.findMany({
      where:  { campanhaId: campanha.id, ativo: true },
      select: { id: true, classificacao: true },
    }),
    db.participante.findMany({
      where:  { empresaId, ativo: true },
      select: {
        id: true, nome: true, matricula: true,
        albumItens: {
          where:  { quantidade: { gt: 0 } },
          select: { figurinhaId: true, quantidade: true },
        },
      },
      orderBy: { nome: 'asc' },
    }),
    db.troca.findMany({
      where:  { campanha: { empresaId }, status: 'ACEITA' },
      select: { solicitanteId: true, destinatarioId: true },
    }),
  ])

  const totalPorClassif: Record<string, number> = {}
  for (const f of figurinhas) {
    totalPorClassif[f.classificacao] = (totalPorClassif[f.classificacao] ?? 0) + 1
  }
  const figurinhaMap = new Map(figurinhas.map(f => [f.id, f.classificacao]))
  const totalGeral = figurinhas.length

  const trocasEnviadosPor:  Record<number, number> = {}
  const trocasRecebidasPor: Record<number, number> = {}
  for (const t of trocas) {
    trocasEnviadosPor[t.solicitanteId]   = (trocasEnviadosPor[t.solicitanteId]   ?? 0) + 1
    trocasRecebidasPor[t.destinatarioId] = (trocasRecebidasPor[t.destinatarioId] ?? 0) + 1
  }

  const resultado = participantes.map(p => {
    const coletadosPorClassif: Record<string, number> = {}
    for (const item of p.albumItens) {
      const c = figurinhaMap.get(item.figurinhaId)
      if (!c) continue
      coletadosPorClassif[c] = (coletadosPorClassif[c] ?? 0) + 1
    }
    const totalColetado = p.albumItens.filter(i => figurinhaMap.has(i.figurinhaId)).length

    return {
      id: p.id, nome: p.nome, matricula: p.matricula,
      totalColetado, totalFigurinhas: totalGeral,
      percentualGeral: totalGeral > 0 ? Math.round((totalColetado / totalGeral) * 100) : 0,
      trocasEnviadas:  trocasEnviadosPor[p.id]  ?? 0,
      trocasRecebidas: trocasRecebidasPor[p.id] ?? 0,
      porDepartamento: Object.entries(totalPorClassif).map(([classificacao, total]) => ({
        classificacao, total,
        coletado:   coletadosPorClassif[classificacao] ?? 0,
        percentual: total > 0 ? Math.round(((coletadosPorClassif[classificacao] ?? 0) / total) * 100) : 0,
      })),
    }
  })

  resultado.sort((a, b) => b.percentualGeral - a.percentualGeral)
  return NextResponse.json({ totalFigurinhas: totalGeral, totalPorClassif, participantes: resultado })
}
