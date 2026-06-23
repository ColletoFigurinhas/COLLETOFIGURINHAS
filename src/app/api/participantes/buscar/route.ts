import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/server/auth/api'

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { userId, empresaId } = auth.session

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const isNum = /^\d+$/.test(q)

  const participantes = await db.participante.findMany({
    where: {
      empresaId,
      ativo:     true,
      id:        { not: userId },
      ...(isNum ? { matricula: { contains: q } } : { nome: { contains: q } }),
    },
    select:  { id: true, nome: true, matricula: true },
    orderBy: { nome: 'asc' },
    take:    8,
  })

  return NextResponse.json(participantes)
}
