import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const logs = await db.logDistribuicaoManual.findMany({
    where:   { empresaId },
    orderBy: { criadoEm: 'desc' },
    take:    200,
  })
  return NextResponse.json(logs)
}
