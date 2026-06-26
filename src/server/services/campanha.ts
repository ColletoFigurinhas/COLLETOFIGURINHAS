import type { PrismaClient } from '@prisma/client'

/**
 * Monta as figurinhas de um pacote. A `temperatura` controla o peso do sorteio:
 *  - LOW    → totalmente aleatório (não olha o álbum do participante)
 *  - MEDIUM → reduz repetidas: cartas que faltam têm peso 3×
 *  - HIGH   → acelera o álbum: cartas que faltam têm peso 12×
 * MEDIUM/HIGH precisam do `participanteId`; sem ele, cai no comportamento LOW.
 */
export async function sortearFigurinhas(
  db: PrismaClient,
  campanhaId: number,
  qtd: number,
  chanceEspecial: number,
  temperatura: string = 'LOW',
  participanteId?: number,
): Promise<{ id: number }[]> {
  const normais   = await db.figurinha.findMany({ where: { campanhaId, ativo: true, classificacao: { notIn: ['ESPECIAIS', 'PREMIO PRATA', 'PREMIO OURO'] } }, select: { id: true } })
  const especiais = await db.figurinha.findMany({ where: { campanhaId, ativo: true, classificacao: 'ESPECIAIS' }, select: { id: true } })

  const temp = temperatura === 'MEDIUM' || temperatura === 'HIGH' ? temperatura : 'LOW'

  // ── LOW (ou sem participante): clássico — embaralha e distribui ──
  if (temp === 'LOW' || !participanteId) {
    const shuffled = [...normais].sort(() => Math.random() - 0.5)
    let idx = 0
    const picks: { id: number }[] = []
    for (let i = 0; i < qtd; i++) {
      if (especiais.length > 0 && Math.random() < chanceEspecial) {
        picks.push(especiais[Math.floor(Math.random() * especiais.length)])
      } else {
        if (shuffled.length === 0) break
        picks.push(shuffled[idx % shuffled.length])
        idx++
      }
    }
    return picks
  }

  // ── MEDIUM / HIGH: peso maior para cartas que ainda faltam ──
  const itens = await db.albumItem.findMany({ where: { participanteId, quantidade: { gt: 0 } }, select: { figurinhaId: true } })
  const possui    = new Set(itens.map(i => i.figurinhaId))
  const pesoFalta = temp === 'HIGH' ? 12 : 3

  const dadosNoPacote = new Map<number, number>()
  const pesoDe = (id: number) =>
    possui.has(id) || (dadosNoPacote.get(id) ?? 0) > 0 ? 1 : pesoFalta

  const picks: { id: number }[] = []
  for (let i = 0; i < qtd; i++) {
    if (especiais.length > 0 && Math.random() < chanceEspecial) {
      picks.push(especiais[Math.floor(Math.random() * especiais.length)])
      continue
    }
    if (normais.length === 0) break
    const pesos = normais.map(f => pesoDe(f.id))
    const total = pesos.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let escolhido = normais[normais.length - 1]
    for (let j = 0; j < normais.length; j++) {
      r -= pesos[j]
      if (r <= 0) { escolhido = normais[j]; break }
    }
    picks.push(escolhido)
    dadosNoPacote.set(escolhido.id, (dadosNoPacote.get(escolhido.id) ?? 0) + 1)
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

    const picks = await sortearFigurinhas(db, campanhaId, qtd, campanha.chanceEspecial, campanha.temperatura, participanteId)
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
