import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/server/auth/api'

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { userId } = auth.session

  const pacotes = await db.pacote.findMany({
    where:   { participanteId: userId, status: 'DISPONIVEL' },
    orderBy: { createdAt: 'asc' },
    select:  { id: true, tipo: true, dataReferencia: true, isNivelamento: true },
  })

  return NextResponse.json(pacotes)
}
