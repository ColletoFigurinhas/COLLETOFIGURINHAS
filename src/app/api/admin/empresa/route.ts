import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export const dynamic = 'force-dynamic'

// GET — dados da própria empresa (identidade visual)
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const empresa = await db.empresa.findUnique({
    where:  { id: empresaId },
    select: { id: true, nome: true, slug: true, logoUrl: true, corPrimaria: true, plano: true },
  })
  return NextResponse.json(empresa)
}

// PATCH — o admin edita a identidade visual da própria empresa
export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const body = await request.json()
  const data: Record<string, any> = {}

  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl || null
  if (body.corPrimaria !== undefined) {
    const cor = String(body.corPrimaria)
    if (!/^#[0-9a-fA-F]{6}$/.test(cor))
      return NextResponse.json({ error: 'Cor inválida (use #RRGGBB).' }, { status: 400 })
    data.corPrimaria = cor
  }

  const empresa = await db.empresa.update({
    where:  { id: empresaId },
    data,
    select: { id: true, logoUrl: true, corPrimaria: true },
  })
  return NextResponse.json(empresa)
}
