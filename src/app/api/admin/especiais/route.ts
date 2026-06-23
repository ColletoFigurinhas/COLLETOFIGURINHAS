import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json([])

  const especiais = await db.figurinha.findMany({
    where:   { campanhaId: campanha.id, classificacao: 'ESPECIAIS' },
    orderBy: { criadoEm: 'desc' },
    select:  { id: true, imagemUrl: true, ativo: true, criadoEm: true },
  })
  return NextResponse.json(especiais)
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const { imagemUrl } = await request.json()
  if (!imagemUrl) return NextResponse.json({ error: 'imagemUrl obrigatória' }, { status: 400 })

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json({ error: 'Nenhuma campanha ativa' }, { status: 400 })

  const f = await db.figurinha.create({
    data: { campanhaId: campanha.id, classificacao: 'ESPECIAIS', tipo: 'ESPECIAL', imagemUrl, ativo: true },
  })
  return NextResponse.json(f, { status: 201 })
}
