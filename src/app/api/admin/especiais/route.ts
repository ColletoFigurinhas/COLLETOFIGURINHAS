import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

async function auth() {
  const s = await getSession()
  if (!s?.userId || !s.empresaId || !ROLES.includes(s.role as any)) return null
  return s
}

export async function GET() {
  const s = await auth()
  if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const campanha = await db.campanha.findFirst({ where: { empresaId: s.empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json([])

  const especiais = await db.figurinha.findMany({
    where:   { campanhaId: campanha.id, classificacao: 'ESPECIAIS' },
    orderBy: { criadoEm: 'desc' },
    select:  { id: true, imagemUrl: true, ativo: true, criadoEm: true },
  })
  return NextResponse.json(especiais)
}

export async function POST(request: Request) {
  const s = await auth()
  if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { imagemUrl } = await request.json()
  if (!imagemUrl) return NextResponse.json({ error: 'imagemUrl obrigatória' }, { status: 400 })

  const campanha = await db.campanha.findFirst({ where: { empresaId: s.empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json({ error: 'Nenhuma campanha ativa' }, { status: 400 })

  const f = await db.figurinha.create({
    data: { campanhaId: campanha.id, classificacao: 'ESPECIAIS', tipo: 'ESPECIAL', imagemUrl, ativo: true },
  })
  return NextResponse.json(f, { status: 201 })
}
