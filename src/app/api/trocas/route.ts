import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

function getUserId(session: Awaited<ReturnType<typeof getSession>>) {
  const id = Number(session?.userId)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function GET() {
  const session = await getSession()
  const userId  = getUserId(session)
  if (!userId || !session?.empresaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const include = {
    solicitante:       { select: { id: true, nome: true, matricula: true } },
    destinatario:      { select: { id: true, nome: true, matricula: true } },
    figurinhaOfertada: { select: { id: true, imagemUrl: true, classificacao: true } },
    figurinhaRecebida: { select: { id: true, imagemUrl: true, classificacao: true } },
  }

  const [recebidas, enviadas] = await Promise.all([
    db.troca.findMany({ where: { destinatarioId: userId },  include, orderBy: { createdAt: 'desc' } }),
    db.troca.findMany({ where: { solicitanteId:  userId },  include, orderBy: { createdAt: 'desc' } }),
  ])

  return NextResponse.json({ recebidas, enviadas })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  const userId  = getUserId(session)
  if (!userId || !session?.empresaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { figurinhaOfertadaId, matriculaDestinatario } = await req.json()
  if (!figurinhaOfertadaId || !matriculaDestinatario)
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const itemSolicitante = await db.albumItem.findUnique({
    where: { participanteId_figurinhaId: { participanteId: userId, figurinhaId: Number(figurinhaOfertadaId) } },
  })
  if (!itemSolicitante || itemSolicitante.quantidade < 1)
    return NextResponse.json({ error: 'Você não tem essa figurinha' }, { status: 400 })

  const destinatario = await db.participante.findFirst({
    where:  { matricula: String(matriculaDestinatario), empresaId: session.empresaId },
    select: { id: true, nome: true, ativo: true },
  })
  if (!destinatario)       return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 })
  if (!destinatario.ativo) return NextResponse.json({ error: 'Participante inativo' }, { status: 400 })
  if (destinatario.id === userId) return NextResponse.json({ error: 'Não pode propor troca consigo mesmo' }, { status: 400 })

  const campanha = await db.campanha.findFirst({ where: { empresaId: session.empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json({ error: 'Nenhuma campanha ativa' }, { status: 400 })

  const troca = await db.troca.create({
    data: {
      campanhaId:          campanha.id,
      solicitanteId:       userId,
      figurinhaOfertadaId: Number(figurinhaOfertadaId),
      destinatarioId:      destinatario.id,
      status:              'PENDENTE',
    },
  })

  return NextResponse.json({ ok: true, troca, destinatarioNome: destinatario.nome })
}
