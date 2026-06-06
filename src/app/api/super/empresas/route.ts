import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

async function authSuper() {
  const s = await getSession()
  if (!s?.isSuperAdmin) return null
  return s
}

export async function GET() {
  if (!await authSuper()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const empresas = await db.empresa.findMany({
    orderBy: { criadoEm: 'desc' },
    include: {
      _count: { select: { participantes: true, campanhas: true } },
    },
  })
  return NextResponse.json(empresas)
}

export async function POST(request: Request) {
  if (!await authSuper()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, slug, cnpj, corPrimaria, plano } = await request.json()
  if (!nome || !slug || !cnpj)
    return NextResponse.json({ error: 'nome, slug e cnpj são obrigatórios' }, { status: 400 })

  const slugLimpo = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')

  const existe = await db.empresa.findFirst({
    where: { OR: [{ slug: slugLimpo }, { cnpj }] },
  })
  if (existe) return NextResponse.json({ error: 'Slug ou CNPJ já cadastrado' }, { status: 409 })

  const empresa = await db.empresa.create({
    data: {
      nome,
      slug:       slugLimpo,
      cnpj,
      corPrimaria: corPrimaria ?? '#1d4ed8',
      plano:       plano ?? 'basico',
    },
  })
  return NextResponse.json(empresa, { status: 201 })
}
