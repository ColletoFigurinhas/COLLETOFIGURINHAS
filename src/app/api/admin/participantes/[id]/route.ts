import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'
import bcrypt from 'bcryptjs'

// PATCH — ativa/desativa, troca role, reseta senha
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const { id } = await params
  const pid = Number(id)
  const body = await request.json()

  const participante = await db.participante.findFirst({
    where: { id: pid, empresaId },
  })
  if (!participante) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const data: Record<string, any> = {}
  if (body.ativo  !== undefined) data.ativo = body.ativo
  if (body.role   !== undefined) data.role  = body.role
  if (body.senha  !== undefined) data.senha = await bcrypt.hash(String(body.senha), 10)
  if (body.email  !== undefined) data.email = body.email

  // Tombamento: ao desligar (ativo: true → false), cancela as trocas
  // pendentes envolvendo o participante (não travam mais os colegas).
  const desligando = body.ativo === false && participante.ativo

  const updated = await db.$transaction(async tx => {
    const up = await tx.participante.update({
      where:  { id: pid },
      data,
      select: { id: true, matricula: true, nome: true, email: true, role: true, ativo: true },
    })
    if (desligando) {
      await tx.troca.updateMany({
        where: { status: 'PENDENTE', OR: [{ solicitanteId: pid }, { destinatarioId: pid }] },
        data:  { status: 'CANCELADA_SEM_FIGURINHA', respondidoEm: new Date() },
      })
    }
    return up
  })
  return NextResponse.json(updated)
}
