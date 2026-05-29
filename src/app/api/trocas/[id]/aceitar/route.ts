import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// POST /api/trocas/[id]/aceitar
// Body: { figurinhaRecebidaId: number } — figurinha que B oferece em troca
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const trocaId = parseInt(id, 10)
  const { figurinhaRecebidaId } = await req.json()

  if (!figurinhaRecebidaId) return NextResponse.json({ error: 'Informe a figurinha a oferecer' }, { status: 400 })

  const troca = await db.troca.findUnique({ where: { id: trocaId } })
  if (!troca) return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 })
  if (troca.destinatarioId !== session.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  if (troca.status !== 'PENDENTE') return NextResponse.json({ error: 'Troca não está pendente' }, { status: 400 })

  try {
    await db.$transaction(async tx => {
      // Verifica A ainda tem a figurinha ofertada
      const itemA = await tx.albumItem.findUnique({
        where: { participanteId_figurinhaId: { participanteId: troca.solicitanteId, figurinhaId: troca.figurinhaOfertadaId } },
      })
      if (!itemA || itemA.quantidade < 1) throw new Error('Solicitante não tem mais essa figurinha')

      // Verifica B tem a figurinha que está oferecendo
      const itemB = await tx.albumItem.findUnique({
        where: { participanteId_figurinhaId: { participanteId: session.userId, figurinhaId: figurinhaRecebidaId } },
      })
      if (!itemB || itemB.quantidade < 1) throw new Error('Você não tem essa figurinha')

      // Remove da coleção de A a figurinha ofertada
      await tx.albumItem.update({
        where: { participanteId_figurinhaId: { participanteId: troca.solicitanteId, figurinhaId: troca.figurinhaOfertadaId } },
        data: { quantidade: { decrement: 1 } },
      })

      // Adiciona para A a figurinha de B
      await tx.albumItem.upsert({
        where: { participanteId_figurinhaId: { participanteId: troca.solicitanteId, figurinhaId: figurinhaRecebidaId } },
        create: { participanteId: troca.solicitanteId, figurinhaId: figurinhaRecebidaId, quantidade: 1 },
        update: { quantidade: { increment: 1 } },
      })

      // Remove da coleção de B a figurinha oferecida
      await tx.albumItem.update({
        where: { participanteId_figurinhaId: { participanteId: session.userId, figurinhaId: figurinhaRecebidaId } },
        data: { quantidade: { decrement: 1 } },
      })

      // Adiciona para B a figurinha de A
      await tx.albumItem.upsert({
        where: { participanteId_figurinhaId: { participanteId: session.userId, figurinhaId: troca.figurinhaOfertadaId } },
        create: { participanteId: session.userId, figurinhaId: troca.figurinhaOfertadaId, quantidade: 1 },
        update: { quantidade: { increment: 1 } },
      })

      // Marca troca como aceita
      await tx.troca.update({
        where: { id: trocaId },
        data: { status: 'ACEITA', figurinhaRecebidaId, respondidoEm: new Date() },
      })

      // Auto-cancela outras propostas pendentes de A com a mesma figurinha se esgotou
      const itemAAtualizado = await tx.albumItem.findUnique({
        where: { participanteId_figurinhaId: { participanteId: troca.solicitanteId, figurinhaId: troca.figurinhaOfertadaId } },
      })
      if (!itemAAtualizado || itemAAtualizado.quantidade === 0) {
        await tx.troca.updateMany({
          where: {
            solicitanteId:       troca.solicitanteId,
            figurinhaOfertadaId: troca.figurinhaOfertadaId,
            status:              'PENDENTE',
            id:                  { not: trocaId },
          },
          data: { status: 'CANCELADA_SEM_FIGURINHA', respondidoEm: new Date() },
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro ao executar troca' }, { status: 400 })
  }
}
