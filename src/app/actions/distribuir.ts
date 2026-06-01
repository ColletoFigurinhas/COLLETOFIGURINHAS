'use server'

import { verifyRole }        from '@/lib/dal'
import { db }                from '@/lib/db'
import { sortearFigurinhas } from '@/lib/campanha'

export async function distribuirPacotesHoje(): Promise<{ ok: boolean; distribuidos: number; jaReceberam: number }> {
  await verifyRole('MARKETING', 'TI', 'ADMIN')

  const campanha = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })

  const hoje   = new Date(); hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje.getTime() + 86_400_000)

  const participantes = await db.participante.findMany({ where: { ativo: true }, select: { id: true } })

  const pacotesHoje = await db.pacote.findMany({
    where: {
      campanhaId:    campanha.id,
      tipo:          'PADRAO',
      isNivelamento: false,
      dataReferencia: { gte: hoje, lt: amanha },
    },
    select: { participanteId: true },
  })

  const jaReceberam = new Set(pacotesHoje.map(p => p.participanteId))
  const pendentes   = participantes.filter(p => !jaReceberam.has(p.id))

  let distribuidos = 0
  for (const p of pendentes) {
    const picks = await sortearFigurinhas(db, campanha.id, campanha.stickersPorDiaPadrao, campanha.chanceEspecial)
    await db.pacote.create({
      data: {
        campanhaId:     campanha.id,
        participanteId: p.id,
        tipo:           'PADRAO',
        dataReferencia: hoje,
        status:         'DISPONIVEL',
        isNivelamento:  false,
        figurinhas:     { create: picks.map(f => ({ figurinhaId: f.id, revelada: false })) },
      },
    })
    distribuidos++
  }

  return { ok: true, distribuidos, jaReceberam: jaReceberam.size }
}
