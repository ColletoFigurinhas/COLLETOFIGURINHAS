import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

async function auth() {
  const s = await getSession()
  if (!s?.userId || !ROLES.includes(s.role as any)) return null
  return s
}

export async function GET(request: Request) {
  if (!await auth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  const campanha = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })

  const itens = await db.albumItem.findMany({
    where: {
      figurinha: {
        campanhaId:    campanha.id,
        classificacao: { in: ['PREMIO PRATA', 'PREMIO OURO'] },
      },
      ...(q
        ? {
            participante: {
              OR: [
                { nome:      { contains: q } },
                { matricula: { contains: q } },
              ],
            },
          }
        : {}),
    },
    select: {
      id:           true,
      quantidade:   true,
      entregue:     true,
      entregueEm:   true,
      entregueBy:   true,
      participante: { select: { id: true, nome: true, matricula: true } },
      figurinha:    { select: { id: true, classificacao: true, tipo: true, imagemUrl: true } },
    },
    orderBy: [{ entregue: 'asc' }, { participante: { nome: 'asc' } }],
  })

  return NextResponse.json(itens)
}
