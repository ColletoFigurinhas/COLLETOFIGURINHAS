import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'
import { sortearFigurinhas } from '@/server/services/campanha'

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { empresaId, nome } = auth.session

    const { participanteId, tipo, premioPrataId, premioOuroId } = await request.json()

    if (!participanteId || !['PADRAO', 'PLUS', 'PREMIUM'].includes(tipo))
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    if (tipo === 'PLUS' && !premioPrataId)
      return NextResponse.json({ error: 'Selecione a carta Prêmio Prata.' }, { status: 400 })

    if (tipo === 'PREMIUM' && (!premioPrataId || !premioOuroId))
      return NextResponse.json({ error: 'Selecione as cartas Prêmio Prata e Prêmio Ouro.' }, { status: 400 })

    const participante = await db.participante.findFirst({
      where:  { id: participanteId, empresaId },
      select: { nome: true, matricula: true },
    })
    if (!participante) return NextResponse.json({ error: 'Participante não encontrado.' }, { status: 404 })

    const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
    if (!campanha) return NextResponse.json({ error: 'Nenhuma campanha ativa.' }, { status: 400 })

    const qtdNormais = tipo === 'PADRAO' ? campanha.stickersPorDiaPadrao : 5
    const normais = await sortearFigurinhas(db, campanha.id, qtdNormais, campanha.chanceEspecial, campanha.temperatura, participanteId)

    let cartas: { id: number }[]
    if (tipo === 'PADRAO')        cartas = normais
    else if (tipo === 'PLUS')     cartas = [...normais, { id: premioPrataId }]
    else                          cartas = [...normais, { id: premioPrataId }, { id: premioOuroId }]

    const pacote = await db.pacote.create({
      data: {
        campanhaId:     campanha.id,
        participanteId,
        tipo,
        dataReferencia: new Date(),
        status:         'DISPONIVEL',
        figurinhas: { create: cartas.map(f => ({ figurinhaId: f.id, revelada: false })) },
        ...(tipo === 'PREMIUM' ? {
          premio: {
            create: {
              descricao:    `Carta prêmio ouro #${premioOuroId}`,
              registradoPor: nome ?? 'admin',
            },
          },
        } : {}),
      },
    })

    await db.logDistribuicaoManual.create({
      data: {
        empresaId,
        pacoteId:         pacote.id,
        participanteId,
        participanteNome: participante.nome,
        matricula:        participante.matricula,
        tipoPacote:       tipo,
        distribuidoPor:   nome ?? 'admin',
      },
    })

    return NextResponse.json({ ok: true, pacoteId: pacote.id })
  } catch (err: any) {
    console.error('[pacotes] Erro:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro interno' }, { status: 500 })
  }
}
