import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuper } from '@/server/auth/api'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuper()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()

  const data: Record<string, any> = {}
  if (body.nome        !== undefined) data.nome        = body.nome
  if (body.cnpj        !== undefined) data.cnpj        = body.cnpj
  if (body.ativo       !== undefined) data.ativo       = body.ativo
  if (body.corPrimaria !== undefined) data.corPrimaria = body.corPrimaria
  if (body.plano       !== undefined) data.plano       = body.plano
  if (body.logoUrl     !== undefined) data.logoUrl     = body.logoUrl

  const empresa = await db.empresa.update({ where: { id: Number(id) }, data })
  return NextResponse.json(empresa)
}
