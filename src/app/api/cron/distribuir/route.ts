import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isDiaUtil, sortearFigurinhas } from '@/lib/campanha'

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  if (!isDiaUtil(hoje))
    return NextResponse.json({ ok: true, msg: 'Fim de semana', distribuidos: 0 })

  const campanhas = await db.campanha.findMany({ where: { status: 'ativo' } })
  let totalDistribuidos = 0

  for (const campanha of campanhas) {
    const inicio = new Date(campanha.dataInicio); inicio.setHours(0, 0, 0, 0)
    const fim    = new Date(campanha.dataFim);    fim.setHours(23, 59, 59, 999)

    if (hoje < inicio || hoje > fim) continue

    const participantes = await db.participante.findMany({
      where:  { empresaId: campanha.empresaId, ativo: true },
      select: { id: true },
    })

    const amanha = new Date(hoje.getTime() + 86_400_000)
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
    const pendentes = participantes.filter(p => !jaReceberam.has(p.id))

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
      totalDistribuidos++
    }

    console.log(`[cron] empresa ${campanha.empresaId} — distribuídos: ${pendentes.length}/${participantes.length}`)
  }

  return NextResponse.json({ ok: true, distribuidos: totalDistribuidos, campanhas: campanhas.length })
}
