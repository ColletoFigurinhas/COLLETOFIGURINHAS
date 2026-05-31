import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const userId  = Number(session?.userId)
  if (!userId || !Number.isInteger(userId)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const pacoteId = parseInt(id, 10)

  const pacote = await db.pacote.findFirst({
    where: { id: pacoteId, participanteId: userId, status: 'DISPONIVEL' },
    include: { figurinhas: { include: { figurinha: { select: { id: true, classificacao: true, tipo: true, imagemUrl: true } } } } },
  })

  if (!pacote) return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })

  // Abre o pacote em transação
  const figurinhasReveladas = await db.$transaction(async tx => {
    // Marca como aberto
    await tx.pacote.update({
      where: { id: pacoteId },
      data:  { status: 'ABERTO', abertoEm: new Date() },
    })

    // Revela todas as figurinhas
    await tx.pacoteFigurinha.updateMany({
      where: { pacoteId },
      data:  { revelada: true },
    })

    // Adiciona ao album_itens (upsert)
    for (const pf of pacote.figurinhas) {
      await tx.albumItem.upsert({
        where: { participanteId_figurinhaId: { participanteId: userId, figurinhaId: pf.figurinhaId } },
        create: { participanteId: userId, figurinhaId: pf.figurinhaId, quantidade: 1 },
        update: { quantidade: { increment: 1 } },
      })
    }

    return pacote.figurinhas.map(pf => ({
      id:            pf.figurinha.id,
      classificacao: pf.figurinha.classificacao,
      tipo:          pf.figurinha.tipo,
      imagemUrl:     pf.figurinha.imagemUrl,
    }))
  })

  return NextResponse.json({
    ok: true,
    tipo: pacote.tipo,
    figurinhas: figurinhasReveladas,
  })
}
