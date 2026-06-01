import type { PrismaClient } from '@prisma/client'

/** Horário da distribuição diária em UTC (18:00 BRT = 21:00 UTC) */
export const CRON_HOUR_UTC = 21

/** Retorna true se a data for segunda a sexta */
export function isDiaUtil(date: Date): boolean {
  const d = date.getDay()
  return d >= 1 && d <= 5
}

/** Lista de dias úteis entre duas datas (inclusive) */
export function diasUteisEntre(inicio: Date, fim: Date): Date[] {
  const dias: Date[] = []
  const cur = new Date(inicio); cur.setHours(0, 0, 0, 0)
  const end = new Date(fim);    end.setHours(0, 0, 0, 0)
  while (cur <= end) {
    if (isDiaUtil(cur)) dias.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dias
}

/** Monta as figurinhas de um pacote respeitando chance especial por carta */
export async function sortearFigurinhas(
  db: PrismaClient,
  campanhaId: number,
  qtd: number,
  chanceEspecial: number
): Promise<{ id: number }[]> {
  const normais   = await db.figurinha.findMany({ where: { campanhaId, ativo: true, classificacao: { not: 'ESPECIAIS' } }, select: { id: true } })
  const especiais = await db.figurinha.findMany({ where: { campanhaId, ativo: true, classificacao: 'ESPECIAIS' },               select: { id: true } })

  const shuffled = [...normais].sort(() => Math.random() - 0.5)
  let normalIdx = 0
  const picks: { id: number }[] = []

  for (let i = 0; i < qtd; i++) {
    if (especiais.length > 0 && Math.random() < chanceEspecial) {
      picks.push(especiais[Math.floor(Math.random() * especiais.length)])
    } else {
      picks.push(shuffled[normalIdx % shuffled.length])
      normalIdx++
    }
  }
  return picks
}

/**
 * Calcula os dias que um participante deve receber pacotes ao cadastrar:
 *
 * - Dia 1 (data de início da campanha): sempre conta — pacote de lançamento
 * - Dias 2+ até ontem: sempre contam (distribuições passadas)
 * - Hoje: só conta se a distribuição das 18h BRT (21h UTC) já rodou
 *
 * Assim:
 *   Cadastro antes das 18h → recebe só os dias passados (sem hoje)
 *   Cadastro depois das 18h → recebe os dias passados + hoje
 */
export async function nivelarParticipante(
  db: PrismaClient,
  campanhaId: number,
  participanteId: number
): Promise<number> {
  const campanha = await db.campanha.findFirstOrThrow({ where: { id: campanhaId } })

  const agora  = new Date()
  const hoje   = new Date(agora); hoje.setHours(0, 0, 0, 0)
  const inicio = new Date(campanha.dataInicio); inicio.setHours(0, 0, 0, 0)
  const fim    = new Date(campanha.dataFim);    fim.setHours(0, 0, 0, 0)

  if (hoje < inicio || hoje > fim) return 0

  // ── Dias a distribuir ──────────────────────────────────────────
  const diasParaDar: Date[] = []

  // 1. Dia de início (lançamento) — sempre conta se for dia útil
  if (isDiaUtil(inicio)) {
    diasParaDar.push(new Date(inicio))
  }

  // 2. Dias úteis do dia 2 até ontem — sempre contam
  if (hoje > inicio) {
    const diaDois = new Date(inicio); diaDois.setDate(diaDois.getDate() + 1)
    const ontem   = new Date(hoje);   ontem.setDate(ontem.getDate() - 1)
    if (diaDois <= ontem) {
      diasParaDar.push(...diasUteisEntre(diaDois, ontem))
    }
  }

  // 3. Hoje — só conta se a distribuição das 18h BRT (21h UTC) já rodou
  if (isDiaUtil(hoje) && hoje.getTime() !== inicio.getTime()) {
    const cronHoje = new Date(agora)
    cronHoje.setUTCHours(CRON_HOUR_UTC, 0, 0, 0)
    if (agora >= cronHoje) {
      diasParaDar.push(new Date(hoje))
    }
  }

  if (diasParaDar.length === 0) return 0

  // ── Evita duplicatas ───────────────────────────────────────────
  const jaExistem = await db.pacote.findMany({
    where:  { participanteId, campanhaId },
    select: { dataReferencia: true },
  })
  const datasExistentes = new Set(jaExistem.map(p => p.dataReferencia.toISOString().slice(0, 10)))
  const diasPendentes = diasParaDar.filter(d => !datasExistentes.has(d.toISOString().slice(0, 10)))

  if (diasPendentes.length === 0) return 0

  for (const dia of diasPendentes) {
    const picks = await sortearFigurinhas(db, campanhaId, campanha.stickersPorDiaPadrao, campanha.chanceEspecial)
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
