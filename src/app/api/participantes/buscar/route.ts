import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(request: Request) {
  const s = await getSession()
  if (!s?.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const isNum = /^\d+$/.test(q)

  const participantes = await db.participante.findMany({
    where: {
      ativo: true,
      id: { not: s.userId },
      ...(isNum
        ? { matricula: { contains: q } }
        : { nome: { contains: q } }),
    },
    select: { id: true, nome: true, matricula: true },
    orderBy: { nome: 'asc' },
    take: 8,
  })

  return NextResponse.json(participantes)
}
