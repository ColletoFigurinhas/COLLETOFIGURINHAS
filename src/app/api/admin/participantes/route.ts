import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

async function auth() {
  const s = await getSession()
  if (!s?.userId || !s.empresaId || !ROLES.includes(s.role as any)) return null
  return s
}

// GET — lista participantes da empresa com filtro de busca
export async function GET(request: Request) {
  const s = await auth()
  if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  const participantes = await db.participante.findMany({
    where: {
      empresaId: s.empresaId,
      ...(q ? {
        OR: [
          { nome:      { contains: q } },
          { matricula: { contains: q } },
        ],
      } : {}),
    },
    select:  { id: true, matricula: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
    orderBy: { nome: 'asc' },
    take: 100,
  })
  return NextResponse.json(participantes)
}

// POST — criar participante manualmente
export async function POST(request: Request) {
  const s = await auth()
  if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { matricula, nome, email, role, senha } = await request.json()
  if (!matricula || !nome) return NextResponse.json({ error: 'matricula e nome são obrigatórios' }, { status: 400 })

  const existe = await db.participante.findFirst({
    where: { matricula: String(matricula), empresaId: s.empresaId },
  })
  if (existe) return NextResponse.json({ error: 'Matrícula já cadastrada nesta empresa' }, { status: 409 })

  const p = await db.participante.create({
    data: {
      empresaId: s.empresaId!,
      matricula: String(matricula),
      nome:      String(nome),
      email:     email ? String(email) : undefined,
      role:      role ?? 'PARTICIPANTE',
      senha:     senha ? await bcrypt.hash(String(senha), 10) : undefined,
    },
    select: { id: true, matricula: true, nome: true, email: true, role: true, ativo: true },
  })
  return NextResponse.json(p, { status: 201 })
}
