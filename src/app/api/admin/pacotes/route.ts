import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { sortearFigurinhas } from '@/lib/campanha'

const ROLES_PERMITIDOS = ['MARKETING', 'TI', 'ADMIN'] as const

export async function POST(request: Request) {
  try {
    const s = await getSession()
    if (!s?.userId || !ROLES_PERMITIDOS.includes(s.role as any))
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { participanteId, tipo, figurinhaPremioId } = await request.json()

    if (!participanteId || !['PADRAO', 'PLUS', 'PREMIUM'].includes(tipo))
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    if (tipo === 'PREMIUM' && !figurinhaPremioId)
      return NextResponse.json({ error: 'Selecione a carta prêmio.' }, { status: 400 })

    const participante = await db.participante.findFirst({
      where: { id: participanteId },
      select: { nome: true, matricula: true },
    })
    if (!participante) return NextResponse.json({ error: 'Participante não encontrado.' }, { status: 404 })

    const campanha = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })

    const qtd = tipo === 'PADRAO'
      ? campanha.stickersPorDiaPadrao
      : tipo === 'PLUS'
        ? campanha.stickersPorDiaPlus
        : campanha.stickersPorDiaPremium

    const picks = await sortearFigurinhas(db, campanha.id, qtd, campanha.chanceEspecial)

    const cartasPacote = tipo === 'PREMIUM'
      ? [...picks.slice(0, picks.length - 1), { id: figurinhaPremioId }]
      : picks

    const pacote = await db.pacote.create({
      data: {
        campanhaId:     campanha.id,
        participanteId,
        tipo,
        dataReferencia: new Date(),
        status:         'DISPONIVEL',
        figurinhas: {
          create: cartasPacote.map(f => ({ figurinhaId: f.id, revelada: false })),
        },
        ...(tipo === 'PREMIUM' ? {
          premio: {
            create: {
              descricao:    `Carta prêmio #${figurinhaPremioId}`,
              registradoPor: s.nome ?? 'admin',
            },
          },
        } : {}),
      },
    })

    await db.logDistribuicaoManual.create({
      data: {
        pacoteId:         pacote.id,
        participanteId,
        participanteNome: participante.nome,
        matricula:        participante.matricula,
        tipoPacote:       tipo,
        distribuidoPor:   s.nome ?? 'admin',
      },
    })

    return NextResponse.json({ ok: true, pacoteId: pacote.id })
  } catch (err: any) {
    console.error('[pacotes] Erro ao distribuir:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro interno' }, { status: 500 })
  }
}
