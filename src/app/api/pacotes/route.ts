import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  const userId  = Number(session?.userId)
  if (!userId || !Number.isInteger(userId)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pacotes = await db.pacote.findMany({
    where:   { participanteId: userId, status: 'DISPONIVEL' },
    orderBy: { createdAt: 'asc' },
    select:  { id: true, tipo: true, dataReferencia: true, isNivelamento: true },
  })

  return NextResponse.json(pacotes)
}
