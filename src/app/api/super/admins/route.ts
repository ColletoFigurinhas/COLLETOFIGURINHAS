import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuper } from '@/server/auth/api'
import bcrypt from 'bcryptjs'

// POST — cria admin (participante com role ADMIN) para uma empresa
export async function POST(request: Request) {
  const auth = await requireSuper()
  if (!auth.ok) return auth.response

  const { empresaId, matricula, nome, email, senha } = await request.json()
  if (!empresaId || !matricula || !nome || !email || !senha)
    return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })

  const empresa = await db.empresa.findUnique({ where: { id: Number(empresaId) } })
  if (!empresa) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

  const existe = await db.participante.findFirst({
    where: { matricula: String(matricula), empresaId: Number(empresaId) },
  })
  if (existe) return NextResponse.json({ error: 'Matrícula já cadastrada nesta empresa' }, { status: 409 })

  const admin = await db.participante.create({
    data: {
      empresaId: Number(empresaId),
      matricula: String(matricula),
      nome:      String(nome),
      email:     String(email),
      senha:     await bcrypt.hash(String(senha), 10),
      role:      'ADMIN',
    },
    select: { id: true, matricula: true, nome: true, email: true, role: true },
  })

  return NextResponse.json(admin, { status: 201 })
}
