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

    const { participanteId, tipo, premioPrataId, premioOuroId } = await request.json()

    if (!participanteId || !['PADRAO', 'PLUS', 'PREMIUM'].includes(tipo))
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    if (tipo === 'PLUS' && !premioPrataId)
      return NextResponse.json({ error: 'Selecione a carta Prêmio Prata.' }, { status: 400 })

    if (tipo === 'PREMIUM' && (!premioPrataId || !premioOuroId))
      return NextResponse.json({ error: 'Selecione a carta Prêmio Prata e a carta Prêmio Ouro.' }, { status: 400 })

    const participante = await db.participante.findFirst({
      where:  { id: participanteId },
      select: { nome: true, matricula: true },
    })
    if (!participante) return NextResponse.json({ error: 'Participante não encontrado.' }, { status: 404 })

    const campanha = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })

    // 5 figurinhas normais para PLUS e PREMIUM
    const qtdNormais = tipo === 'PADRAO' ? campanha.stickersPorDiaPadrao : 5
    const normais = await sortearFigurinhas(db, campanha.id, qtdNormais, campanha.chanceEspecial)

    let cartas: { id: number }[]
    if (tipo === 'PADRAO') {
      cartas = normais
    } else if (tipo === 'PLUS') {
      // 5 normais + 1 prêmio prata
      cartas = [...normais, { id: premioPrataId }]
    } else {
      // 5 normais + 1 prêmio prata + 1 prêmio ouro
      cartas = [...normais, { id: premioPrataId }, { id: premioOuroId }]
    }

    const pacote = await db.pacote.create({
      data: {
        campanhaId:     campanha.id,
        participanteId,
        tipo,
        dataReferencia: new Date(),
        status:         'DISPONIVEL',
        figurinhas: {
          create: cartas.map(f => ({ figurinhaId: f.id, revelada: false })),
        },
        ...(tipo === 'PREMIUM' ? {
          premio: {
            create: {
              descricao:    `Carta prêmio ouro #${premioOuroId}`,
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
