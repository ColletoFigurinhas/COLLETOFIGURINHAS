import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES = ['ADMIN'] as const

async function auth() {
  const s = await getSession()
  if (!s?.userId || !s.empresaId || !ROLES.includes(s.role as any)) return null
  return s
}

export async function GET() {
  const s = await auth()
  if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const campanha = await db.campanha.findFirst({
    where:   { empresaId: s.empresaId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(campanha ?? null)
}

export async function POST(request: Request) {
  const s = await auth()
  if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, dataInicio, dataFim, stickersPorDiaPadrao, chanceEspecial } = await request.json()
  if (!nome || !dataInicio || !dataFim)
    return NextResponse.json({ error: 'nome, dataInicio e dataFim são obrigatórios' }, { status: 400 })

  // Desativa campanhas anteriores da empresa
  await db.campanha.updateMany({
    where: { empresaId: s.empresaId, status: 'ativo' },
    data:  { status: 'encerrado' },
  })

  const slug = nome.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50)

  const campanha = await db.campanha.create({
    data: {
      empresaId:           s.empresaId!,
      nome,
      slug,
      dataInicio:          new Date(dataInicio),
      dataFim:             new Date(dataFim),
      stickersPorDiaPadrao: stickersPorDiaPadrao ?? 14,
      chanceEspecial:       chanceEspecial ?? 0.10,
      status:              'ativo',
    },
  })
  return NextResponse.json(campanha, { status: 201 })
}

export async function PATCH(request: Request) {
  const s = await auth()
  if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const campanha = await db.campanha.findFirst({ where: { empresaId: s.empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json({ error: 'Nenhuma campanha ativa' }, { status: 404 })

  const body = await request.json()
  const data: Record<string, any> = {}
  if (body.nome                !== undefined) data.nome                = body.nome
  if (body.dataInicio          !== undefined) data.dataInicio          = new Date(body.dataInicio)
  if (body.dataFim             !== undefined) data.dataFim             = new Date(body.dataFim)
  if (body.stickersPorDiaPadrao !== undefined) data.stickersPorDiaPadrao = Number(body.stickersPorDiaPadrao)
  if (body.chanceEspecial      !== undefined) data.chanceEspecial      = Number(body.chanceEspecial)
  if (body.status              !== undefined) data.status              = body.status

  const updated = await db.campanha.update({ where: { id: campanha.id }, data })
  return NextResponse.json(updated)
}
