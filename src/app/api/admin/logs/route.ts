import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

export async function GET() {
  const s = await getSession()
  if (!s?.userId || !s.empresaId || !ROLES.includes(s.role as any))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const logs = await db.logDistribuicaoManual.findMany({
    where:   { empresaId: s.empresaId },
    orderBy: { criadoEm: 'desc' },
    take:    200,
  })
  return NextResponse.json(logs)
}
