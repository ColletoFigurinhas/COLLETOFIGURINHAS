import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwner } from '@/server/auth/api'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()

  if (body.statusCobranca !== undefined && !['em_dia', 'atrasado', 'cortesia'].includes(body.statusCobranca))
    return NextResponse.json({ error: 'statusCobranca inválido' }, { status: 400 })

  const data: Record<string, any> = {}
  if (body.nome        !== undefined) data.nome        = body.nome
  if (body.cnpj        !== undefined) data.cnpj        = body.cnpj
  if (body.ativo       !== undefined) data.ativo       = body.ativo
  if (body.corPrimaria !== undefined) data.corPrimaria = body.corPrimaria
  if (body.plano       !== undefined) data.plano       = body.plano
  if (body.logoUrl     !== undefined) data.logoUrl     = body.logoUrl
  if (body.valorMensal       !== undefined) data.valorMensal       = body.valorMensal === null || body.valorMensal === '' ? null : Number(body.valorMensal)
  if (body.statusCobranca    !== undefined) data.statusCobranca    = body.statusCobranca
  if (body.proximoVencimento !== undefined) data.proximoVencimento = body.proximoVencimento ? new Date(body.proximoVencimento) : null

  const empresa = await db.empresa.update({ where: { id: Number(id) }, data })
  return NextResponse.json(empresa)
}
