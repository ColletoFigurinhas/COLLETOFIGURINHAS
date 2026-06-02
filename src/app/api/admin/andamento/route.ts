import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES_PERMITIDOS = ['MARKETING', 'TI', 'ADMIN'] as const

export async function GET() {
  const s = await getSession()
  if (!s?.userId || !ROLES_PERMITIDOS.includes(s.role as any))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [figurinhas, participantes, trocas] = await Promise.all([
    db.figurinha.findMany({
      where:  { ativo: true },
      select: { id: true, classificacao: true },
    }),
    db.participante.findMany({
      where:  { ativo: true },
      select: {
        id:       true,
        nome:     true,
        matricula: true,
        albumItens: {
          where:  { quantidade: { gt: 0 } },
          select: { figurinhaId: true, quantidade: true },
        },
      },
      orderBy: { nome: 'asc' },
    }),
    db.troca.findMany({
      where:  { status: 'ACEITA' },
      select: { solicitanteId: true, destinatarioId: true },
    }),
  ])

  const totalPorClassif: Record<string, number> = {}
  const totalGeral = figurinhas.length
  for (const f of figurinhas) {
    totalPorClassif[f.classificacao] = (totalPorClassif[f.classificacao] ?? 0) + 1
  }
  const figurinhaMap = new Map(figurinhas.map(f => [f.id, f.classificacao]))

  const trocasEnviadasPor:  Record<number, number> = {}
  const trocasRecebidasPor: Record<number, number> = {}
  for (const t of trocas) {
    trocasEnviadasPor[t.solicitanteId]   = (trocasEnviadasPor[t.solicitanteId]   ?? 0) + 1
    trocasRecebidasPor[t.destinatarioId] = (trocasRecebidasPor[t.destinatarioId] ?? 0) + 1
  }

  const resultado = participantes.map(p => {
    const coletadosPorClassif: Record<string, number> = {}
    for (const item of p.albumItens) {
      const classif = figurinhaMap.get(item.figurinhaId)
      if (!classif) continue
      coletadosPorClassif[classif] = (coletadosPorClassif[classif] ?? 0) + 1
    }

    const totalColetado = p.albumItens.filter(i => figurinhaMap.has(i.figurinhaId)).length

    const porDepartamento = Object.entries(totalPorClassif).map(([classificacao, total]) => ({
      classificacao,
      coletado: coletadosPorClassif[classificacao] ?? 0,
      total,
      percentual: total > 0 ? Math.round(((coletadosPorClassif[classificacao] ?? 0) / total) * 100) : 0,
    }))

    return {
      id:           p.id,
      nome:         p.nome,
      matricula:    p.matricula,
      totalColetado,
      totalFigurinhas: totalGeral,
      percentualGeral: totalGeral > 0 ? Math.round((totalColetado / totalGeral) * 100) : 0,
      trocasEnviadas:  trocasEnviadasPor[p.id]  ?? 0,
      trocasRecebidas: trocasRecebidasPor[p.id] ?? 0,
      porDepartamento,
    }
  })

  resultado.sort((a, b) => b.percentualGeral - a.percentualGeral)

  return NextResponse.json({ totalFigurinhas: totalGeral, totalPorClassif, participantes: resultado })
}
