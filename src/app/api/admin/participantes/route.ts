import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// GET — lista participantes da empresa com filtro de busca
export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  const participantes = await db.participante.findMany({
    where: {
      empresaId,
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
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const { matricula, nome, email, role, senha } = await request.json()
  if (!matricula || !nome) return NextResponse.json({ error: 'matricula e nome são obrigatórios' }, { status: 400 })

  const existe = await db.participante.findFirst({
    where: { matricula: String(matricula), empresaId },
  })
  if (existe) return NextResponse.json({ error: 'Matrícula já cadastrada nesta empresa' }, { status: 409 })

  const p = await db.participante.create({
    data: {
      empresaId,
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
