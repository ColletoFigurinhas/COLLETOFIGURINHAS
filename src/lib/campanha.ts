import type { PrismaClient } from '@prisma/client'

/** Retorna true se a data for segunda a sexta */
export function isDiaUtil(date: Date): boolean {
  const d = date.getDay()
  return d >= 1 && d <= 5
}

/** Lista de dias úteis entre duas datas (inclusive) */
export function diasUteisEntre(inicio: Date, fim: Date): Date[] {
  const dias: Date[] = []
  const cur = new Date(inicio); cur.setHours(0, 0, 0, 0)
  const end = new Date(fim);   end.setHours(0, 0, 0, 0)
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
 * Cria pacotes de nivelamento para um participante novo.
 * Recebe um pacote para cada dia útil desde o início da campanha até hoje (inclusive).
 * Retorna a quantidade de pacotes criados.
 */
export async function nivelarParticipante(
  db: PrismaClient,
  campanhaId: number,
  participanteId: number
): Promise<number> {
  const campanha = await db.campanha.findFirstOrThrow({ where: { id: campanhaId } })

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const inicio = new Date(campanha.dataInicio); inicio.setHours(0, 0, 0, 0)
  const fim    = new Date(campanha.dataFim);    fim.setHours(0, 0, 0, 0)

  // Campanha ainda não começou
  if (hoje < inicio) return 0

  const ate = hoje < fim ? hoje : fim
  const dias = diasUteisEntre(inicio, ate)
  if (dias.length === 0) return 0

  // Evita duplicata: verifica pacotes que o participante já tem
  const jaExistem = await db.pacote.findMany({
    where: { participanteId, campanhaId },
    select: { dataReferencia: true },
  })
  const datasExistentes = new Set(jaExistem.map(p => p.dataReferencia.toISOString().slice(0, 10)))

  const diasPendentes = dias.filter(d => !datasExistentes.has(d.toISOString().slice(0, 10)))
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
