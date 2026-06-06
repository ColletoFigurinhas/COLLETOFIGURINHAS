import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

async function auth() {
  const s = await getSession()
  if (!s?.userId || !ROLES.includes(s.role as any)) return null
  return s
}

export async function GET(request: Request) {
  if (!await auth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipoFiltro = searchParams.get('tipo')

  const campanha = await db.campanha.findFirstOrThrow({ where: { status: 'ativo' } })
  const figurinhas = await db.figurinha.findMany({
    where:   { campanhaId: campanha.id, ...(tipoFiltro ? { tipo: tipoFiltro } : {}) },
    orderBy: [{ classificacao: 'asc' }, { tipo: 'asc' }, { id: 'asc' }],
    select:  { id: true, classificacao: true, tipo: true, imagemUrl: true, ativo: true },
  })
  return NextResponse.json(figurinhas)
}

export async function POST(request: Request) {
  if (!await auth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { classificacao, tipo, imagemUrl } = await request.json()
  if (!classificacao || !tipo || !imagemUrl)
    return NextResponse.json({ error: 'classificacao, tipo e imagemUrl são obrigatórios' }, { status: 400 })

  const campanha = await db.campanha.findFirstOrThrow({ where: { status: 'ativo' } })
  const f = await db.figurinha.create({
    data: { campanhaId: campanha.id, classificacao, tipo, imagemUrl, ativo: true },
  })
  return NextResponse.json(f, { status: 201 })
}

