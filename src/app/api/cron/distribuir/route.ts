import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sortearFigurinhas } from '@/lib/campanha'

// Retorna hora e dia da semana no fuso da campanha
function localTime(timezone: string): { dayOfWeek: number; minutes: number } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday:  'short',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  }).formatToParts(now)

  const p = Object.fromEntries(parts.map(x => [x.type, x.value]))
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

  // hora pode vir como "24" no lugar de "00" em alguns ambientes
  const horas   = parseInt(p.hour) % 24
  const minutos = parseInt(p.minute)

  return {
    dayOfWeek: dayMap[p.weekday] ?? 0,
    minutes:   horas * 60 + minutos,
  }
}

// Converte "HH:MM" em minutos desde meia-noite
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}

async function handle(request: Request) {
  // Autenticação: chave no header ou query string
  const url    = new URL(request.url)
  const key    = request.headers.get('x-cron-secret') ?? url.searchParams.get('key')
  const secret = process.env.CRON_SECRET
  if (!secret || key !== secret)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const agora = new Date()

  const campanhas = await db.campanha.findMany({
    where: { status: 'ativo' },
  })

  const resultados: { empresaId: number; campanhaId: number; motivo?: string; distribuidos: number }[] = []

  for (const campanha of campanhas) {

    // ── 1. Campanha dentro do período? ───────────────────────────
    const inicio = new Date(campanha.dataInicio); inicio.setHours(0, 0, 0, 0)
    const fim    = new Date(campanha.dataFim);    fim.setHours(23, 59, 59, 999)
    const hoje   = new Date(agora);               hoje.setHours(0, 0, 0, 0)

    if (hoje < inicio || hoje > fim) {
      resultados.push({ empresaId: campanha.empresaId, campanhaId: campanha.id, motivo: 'fora_periodo', distribuidos: 0 })
      continue
    }

    // ── 2. Dia da semana configurado? ────────────────────────────
    const { dayOfWeek, minutes: minutosAgora } = localTime(campanha.timezone)
    const diasSemana: number[] = JSON.parse(campanha.diasSemana)

    if (!diasSemana.includes(dayOfWeek)) {
      resultados.push({ empresaId: campanha.empresaId, campanhaId: campanha.id, motivo: 'dia_nao_configurado', distribuidos: 0 })
      continue
    }

    // ── 3. Dentro da janela de horário? ──────────────────────────
    const minutosInicio = toMinutes(campanha.horarioInicio)
    const minutosFim    = toMinutes(campanha.horarioFim)

    if (minutosAgora < minutosInicio || minutosAgora > minutosFim) {
      resultados.push({ empresaId: campanha.empresaId, campanhaId: campanha.id, motivo: 'fora_horario', distribuidos: 0 })
      continue
    }

    // ── 4. Frequência respeitada? ────────────────────────────────
    if (campanha.ultimaDistribuicao) {
      const minutosDecorridos = (agora.getTime() - campanha.ultimaDistribuicao.getTime()) / 60_000
      if (minutosDecorridos < campanha.frequenciaMinutos) {
        resultados.push({ empresaId: campanha.empresaId, campanhaId: campanha.id, motivo: 'aguardando_frequencia', distribuidos: 0 })
        continue
      }
    }

    // ── 5. Quantidade de cartas: dia útil ou fim de semana ───────
    const isFds = dayOfWeek === 0 || dayOfWeek === 6
    const qtd   = isFds ? campanha.qtdCartasFds : campanha.stickersPorDiaPadrao

    // ── 6. Dedup: janela de tempo = frequenciaMinutos atrás ──────
    const windowStart = new Date(agora.getTime() - campanha.frequenciaMinutos * 60_000)

    const participantes = await db.participante.findMany({
      where:  { empresaId: campanha.empresaId, ativo: true },
      select: { id: true },
    })

    const pacotesJaFeitos = await db.pacote.findMany({
      where: {
        campanhaId:     campanha.id,
        tipo:           'PADRAO',
        isNivelamento:  false,
        dataReferencia: { gte: windowStart },
      },
      select: { participanteId: true },
    })
    const jaReceberam = new Set(pacotesJaFeitos.map(p => p.participanteId))
    const pendentes   = participantes.filter(p => !jaReceberam.has(p.id))

    for (const p of pendentes) {
      const picks = await sortearFigurinhas(db, campanha.id, qtd, campanha.chanceEspecial)
      await db.pacote.create({
        data: {
          campanhaId:     campanha.id,
          participanteId: p.id,
          tipo:           'PADRAO',
          dataReferencia: agora,
          status:         'DISPONIVEL',
          isNivelamento:  false,
          figurinhas:     { create: picks.map(f => ({ figurinhaId: f.id, revelada: false })) },
        },
      })
    }

    // ── 7. Atualiza timestamp ────────────────────────────────────
    await db.campanha.update({
      where: { id: campanha.id },
      data:  { ultimaDistribuicao: agora },
    })

    console.log(`[cron] empresa=${campanha.empresaId} campanha=${campanha.id} qtd=${qtd} distribuidos=${pendentes.length}/${participantes.length}`)
    resultados.push({ empresaId: campanha.empresaId, campanhaId: campanha.id, distribuidos: pendentes.length })
  }

  const totalDistribuidos = resultados.reduce((s, r) => s + r.distribuidos, 0)
  return NextResponse.json({ ok: true, totalDistribuidos, campanhas: resultados })
}
