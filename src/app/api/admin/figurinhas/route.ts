import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const { searchParams } = new URL(request.url)
  const tipoFiltro = searchParams.get('tipo')

  const campanha = await db.campanha.findFirst({
    where: { empresaId, status: 'ativo' },
  })
  if (!campanha) return NextResponse.json([])

  const figurinhas = await db.figurinha.findMany({
    where:   { campanhaId: campanha.id, ...(tipoFiltro ? { tipo: tipoFiltro } : {}) },
    orderBy: [{ classificacao: 'asc' }, { tipo: 'asc' }, { id: 'asc' }],
    select:  { id: true, classificacao: true, tipo: true, imagemUrl: true, ativo: true },
  })
  return NextResponse.json(figurinhas)
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const { classificacao, tipo, imagemUrl } = await request.json()
  if (!classificacao || !tipo || !imagemUrl)
    return NextResponse.json({ error: 'classificacao, tipo e imagemUrl são obrigatórios' }, { status: 400 })

  const campanha = await db.campanha.findFirst({
    where: { empresaId, status: 'ativo' },
  })
  if (!campanha)
    return NextResponse.json({ error: 'Nenhuma campanha ativa' }, { status: 400 })

  const f = await db.figurinha.create({
    data: { campanhaId: campanha.id, classificacao, tipo, imagemUrl, ativo: true },
  })
  return NextResponse.json(f, { status: 201 })
}
