import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { requireOwner } from '@/server/auth/api'

export const dynamic = 'force-dynamic'

// POST — (re)gera a API key da empresa. Retorna a key em texto (mostrada uma vez).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const { id } = await params
  const key = 'colleto_' + randomBytes(24).toString('base64url')

  const empresa = await db.empresa.update({
    where:  { id: Number(id) },
    data:   { apiKey: key },
    select: { id: true, apiKey: true },
  })
  return NextResponse.json(empresa)
}
