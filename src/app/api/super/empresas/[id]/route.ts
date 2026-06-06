import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

async function authSuper() {
  const s = await getSession()
  if (!s?.isSuperAdmin) return null
  return s
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await authSuper()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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
