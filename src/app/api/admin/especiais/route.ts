import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES_PERMITIDOS = ['MARKETING', 'TI', 'ADMIN'] as const

async function autenticar() {
  const s = await getSession()
  if (!s?.userId || !ROLES_PERMITIDOS.includes(s.role as any))
    return null
  return s
}

export async function GET() {
  if (!await autenticar())
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const campanha = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })
  const especiais = await db.figurinha.findMany({
    where:   { campanhaId: campanha.id, classificacao: 'ESPECIAIS' },
    orderBy: { criadoEm: 'desc' },
    select:  { id: true, imagemUrl: true, ativo: true, criadoEm: true },
  })
  return NextResponse.json(especiais)
}

export async function POST(request: Request) {
  if (!await autenticar())
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { imagemUrl } = await request.json()
  if (!imagemUrl) return NextResponse.json({ error: 'imagemUrl obrigatória' }, { status: 400 })

  const campanha = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })
  const f = await db.figurinha.create({
    data: { campanhaId: campanha.id, classificacao: 'ESPECIAIS', tipo: 'ESPECIAL', imagemUrl, ativo: true },
  })
  return NextResponse.json(f, { status: 201 })
}
