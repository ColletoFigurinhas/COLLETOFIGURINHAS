import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/server/auth/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireRole('ADMIN')
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const campanha = await db.campanha.findFirst({
    where:   { empresaId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(campanha ?? null)
}

export async function POST(request: Request) {
  const auth = await requireRole('ADMIN')
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const body = await request.json()
  const { nome, dataInicio, dataFim } = body
  if (!nome || !dataInicio || !dataFim)
    return NextResponse.json({ error: 'nome, dataInicio e dataFim são obrigatórios' }, { status: 400 })

  // Valida diasSemana se fornecido
  if (body.diasSemana !== undefined) {
    try {
      const dias = JSON.parse(body.diasSemana)
      if (!Array.isArray(dias) || dias.some((d: any) => typeof d !== 'number' || d < 0 || d > 6))
        return NextResponse.json({ error: 'diasSemana inválido' }, { status: 400 })
    } catch {
      return NextResponse.json({ error: 'diasSemana deve ser JSON válido' }, { status: 400 })
    }
  }

  await db.campanha.updateMany({
    where: { empresaId, status: 'ativo' },
    data:  { status: 'encerrado' },
  })

  const slug = nome.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50)

  const campanha = await db.campanha.create({
    data: {
      empresaId,
      nome,
      slug,
      dataInicio:           new Date(dataInicio),
      dataFim:              new Date(dataFim),
      stickersPorDiaPadrao: body.stickersPorDiaPadrao  ?? 14,
      chanceEspecial:       body.chanceEspecial         ?? 0.10,
      status:               'ativo',
      horarioInicio:        body.horarioInicio          ?? '08:00',
      horarioFim:           body.horarioFim             ?? '18:00',
      frequenciaMinutos:    body.frequenciaMinutos      ?? 1440,
      diasSemana:           body.diasSemana             ?? '[1,2,3,4,5]',
      qtdCartasFds:         body.qtdCartasFds           ?? 5,
      timezone:             body.timezone               ?? 'America/Sao_Paulo',
      temperatura:          ['LOW', 'MEDIUM', 'HIGH'].includes(body.temperatura) ? body.temperatura : 'LOW',
    },
  })
  return NextResponse.json(campanha, { status: 201 })
}

export async function PATCH(request: Request) {
  const auth = await requireRole('ADMIN')
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json({ error: 'Nenhuma campanha ativa' }, { status: 404 })

  const body = await request.json()

  if (body.diasSemana !== undefined) {
    try {
      const dias = JSON.parse(body.diasSemana)
      if (!Array.isArray(dias) || dias.some((d: any) => typeof d !== 'number' || d < 0 || d > 6))
        return NextResponse.json({ error: 'diasSemana inválido' }, { status: 400 })
    } catch {
      return NextResponse.json({ error: 'diasSemana deve ser JSON válido' }, { status: 400 })
    }
  }

  if (body.temperatura !== undefined && !['LOW', 'MEDIUM', 'HIGH'].includes(body.temperatura))
    return NextResponse.json({ error: 'temperatura inválida' }, { status: 400 })

  const data: Record<string, any> = {}
  const campos = [
    'nome', 'status',
    'stickersPorDiaPadrao', 'chanceEspecial',
    'horarioInicio', 'horarioFim', 'frequenciaMinutos',
    'diasSemana', 'qtdCartasFds', 'timezone', 'temperatura', 'pausada',
  ]
  for (const c of campos) {
    if (body[c] !== undefined) data[c] = body[c]
  }
  if (body.dataInicio !== undefined) data.dataInicio = new Date(body.dataInicio)
  if (body.dataFim    !== undefined) data.dataFim    = new Date(body.dataFim)
  if (body.stickersPorDiaPadrao !== undefined) data.stickersPorDiaPadrao = Number(body.stickersPorDiaPadrao)
  if (body.chanceEspecial       !== undefined) data.chanceEspecial       = Number(body.chanceEspecial)
  if (body.frequenciaMinutos    !== undefined) data.frequenciaMinutos    = Number(body.frequenciaMinutos)
  if (body.qtdCartasFds         !== undefined) data.qtdCartasFds         = Number(body.qtdCartasFds)

  const updated = await db.campanha.update({ where: { id: campanha.id }, data })
  return NextResponse.json(updated)
}
