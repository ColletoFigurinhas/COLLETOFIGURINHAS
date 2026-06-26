import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'
import { sortearFigurinhas } from '@/server/services/campanha'

export const dynamic = 'force-dynamic'

// POST — marca um ganhador da ação e gera o pacote bônus (PLUS ou PREMIUM)
// Body: { participanteId, tipo: 'PLUS'|'PREMIUM', premioPrataId, premioOuroId? }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId, nome: adminNome } = auth.session

  const { id } = await params
  const acaoId = Number(id)
  const { participanteId, tipo, premioPrataId, premioOuroId } = await request.json()

  if (!participanteId || !['PLUS', 'PREMIUM'].includes(tipo))
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  if (tipo === 'PLUS' && !premioPrataId)
    return NextResponse.json({ error: 'Selecione a carta Prêmio Prata.' }, { status: 400 })
  if (tipo === 'PREMIUM' && (!premioPrataId || !premioOuroId))
    return NextResponse.json({ error: 'Selecione as cartas Prêmio Prata e Prêmio Ouro.' }, { status: 400 })

  const acao = await db.acaoCampanha.findFirst({
    where:   { id: acaoId, campanha: { empresaId } },
    include: { campanha: true },
  })
  if (!acao) return NextResponse.json({ error: 'Ação não encontrada.' }, { status: 404 })
  const campanha = acao.campanha

  const participante = await db.participante.findFirst({
    where:  { id: participanteId, empresaId },
    select: { nome: true, matricula: true },
  })
  if (!participante) return NextResponse.json({ error: 'Participante não encontrado.' }, { status: 404 })

  const jaGanhou = await db.ganhadorAcao.findFirst({ where: { acaoId, participanteId } })
  if (jaGanhou) return NextResponse.json({ error: 'Participante já ganhou esta ação.' }, { status: 409 })

  const normais = await sortearFigurinhas(db, campanha.id, 5, campanha.chanceEspecial, campanha.temperatura, participanteId)
  const cartas = tipo === 'PLUS'
    ? [...normais, { id: premioPrataId }]
    : [...normais, { id: premioPrataId }, { id: premioOuroId }]

  const pacote = await db.$transaction(async tx => {
    const pac = await tx.pacote.create({
      data: {
        campanhaId:     campanha.id,
        participanteId,
        tipo,
        dataReferencia: new Date(),
        status:         'DISPONIVEL',
        figurinhas:     { create: cartas.map(f => ({ figurinhaId: f.id, revelada: false })) },
        ...(tipo === 'PREMIUM'
          ? { premio: { create: { descricao: `Prêmio da ação: ${acao.nome}`, registradoPor: adminNome ?? 'admin' } } }
          : {}),
      },
    })
    await tx.ganhadorAcao.create({
      data: { acaoId, participanteId, tipoPacotePremio: tipo, registradoPor: adminNome ?? 'admin', pacoteId: pac.id },
    })
    await tx.logDistribuicaoManual.create({
      data: {
        empresaId, pacoteId: pac.id, participanteId,
        participanteNome: participante.nome, matricula: participante.matricula,
        tipoPacote: tipo, distribuidoPor: adminNome ?? 'admin',
      },
    })
    return pac
  })

  return NextResponse.json({ ok: true, pacoteId: pacote.id })
}
