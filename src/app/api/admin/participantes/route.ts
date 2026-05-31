import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES_PERMITIDOS = ['MARKETING', 'TI', 'ADMIN'] as const

export async function GET(request: Request) {
  const s = await getSession()
  if (!s?.userId || !ROLES_PERMITIDOS.includes(s.role as any))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json([])

  const participantes = await db.participante.findMany({
    where: {
      ativo: true,
      OR: [
        { nome:      { contains: q } },
        { matricula: { contains: q } },
      ],
    },
    select:  { id: true, matricula: true, nome: true },
    orderBy: { nome: 'asc' },
    take:    20,
  })
  return NextResponse.json(participantes)
}
