import type { PrismaClient } from '@prisma/client'

/** Monta as figurinhas de um pacote respeitando chance especial por carta */
export async function sortearFigurinhas(
  db: PrismaClient,
  campanhaId: number,
  qtd: number,
  chanceEspecial: number
): Promise<{ id: number }[]> {
  const normais   = await db.figurinha.findMany({ where: { campanhaId, ativo: true, classificacao: { notIn: ['ESPECIAIS', 'PREMIO PRATA', 'PREMIO OURO'] } }, select: { id: true } })
  const especiais = await db.figurinha.findMany({ where: { campanhaId, ativo: true, classificacao: 'ESPECIAIS' }, select: { id: true } })

  const shuffled = [...normais].sort(() => Math.random() - 0.5)
  let normalIdx = 0
  const picks: { id: number }[] = []

  for (let i = 0; i < qtd; i++) {
    if (especiais.length > 0 && Math.random() < chanceEspecial) {
      picks.push(especiais[Math.floor(Math.random() * especiais.length)])
    } else {
      if (shuffled.length === 0) break
      picks.push(shuffled[normalIdx % shuffled.length])
      normalIdx++
    }
  }
  return picks
}

/**
 * Nivelamanto: cria pacotes retroativos para um participante que chegou
 * depois do início da campanha.
 *
 * Lógica:
 *  - Itera cada dia desde o início até ontem
 *  - Respeita diasSemana configurado na campanha
 *  - Usa qtdCartasFds para sáb/dom, stickersPorDiaPadrao para dias úteis
 *  - Hoje só entra se ultimaDistribuicao já ocorreu hoje (cron já rodou)
 */
export async function nivelarParticipante(
  db: PrismaClient,
  campanhaId: number,
  participanteId: number
): Promise<number> {
  const campanha = await db.campanha.findFirstOrThrow({ where: { id: campanhaId } })

  const diasSemana: number[] = JSON.parse(campanha.diasSemana)
  const agora  = new Date()
  const hoje   = new Date(agora); hoje.setHours(0, 0, 0, 0)
  const inicio = new Date(campanha.dataInicio); inicio.setHours(0, 0, 0, 0)
  const fim    = new Date(campanha.dataFim);    fim.setHours(0, 0, 0, 0)

  if (hoje < inicio || hoje > fim) return 0

  // ── Coleta dias passados que deveriam ter distribuição ─────────
  const diasParaDar: Date[] = []
  const cursor = new Date(inicio)

  while (cursor <= hoje) {
    const diaCursor = new Date(cursor)
    const dow = diaCursor.getDay()

    // Só inclui se está nos dias configurados pela empresa
    if (diasSemana.includes(dow)) {
      if (diaCursor < hoje) {
        // Dias passados: sempre incluir
        diasParaDar.push(new Date(diaCursor))
      } else {
        // Hoje: só inclui se o cron já rodou (ultimaDistribuicao é hoje)
        if (campanha.ultimaDistribuicao) {
          const ultimaHoje = new Date(campanha.ultimaDistribuicao)
          ultimaHoje.setHours(0, 0, 0, 0)
          if (ultimaHoje.getTime() === hoje.getTime()) {
            diasParaDar.push(new Date(diaCursor))
          }
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  if (diasParaDar.length === 0) return 0

  // ── Evita duplicatas ───────────────────────────────────────────
  const jaExistem = await db.pacote.findMany({
    where:  { participanteId, campanhaId },
    select: { dataReferencia: true },
  })
  const datasExistentes = new Set(
    jaExistem.map(p => p.dataReferencia.toISOString().slice(0, 10))
  )
  const diasPendentes = diasParaDar.filter(
    d => !datasExistentes.has(d.toISOString().slice(0, 10))
  )

  if (diasPendentes.length === 0) return 0

  for (const dia of diasPendentes) {
    const dow = dia.getDay()
    const isFds = dow === 0 || dow === 6
    const qtd   = isFds ? campanha.qtdCartasFds : campanha.stickersPorDiaPadrao

    const picks = await sortearFigurinhas(db, campanhaId, qtd, campanha.chanceEspecial)
    await db.pacote.create({
      data: {
        campanhaId,
        participanteId,
        tipo:           'PADRAO',
        dataReferencia: dia,
        status:         'DISPONIVEL',
        isNivelamento:  dia.getTime() !== hoje.getTime(),
        figurinhas:     { create: picks.map(f => ({ figurinhaId: f.id, revelada: false })) },
      },
    })
  }

  return diasPendentes.length
}
