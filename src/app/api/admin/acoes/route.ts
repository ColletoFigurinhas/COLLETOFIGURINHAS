import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export const dynamic = 'force-dynamic'

// GET — lista as ações da campanha ativa, com os ganhadores
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json([])

  const acoes = await db.acaoCampanha.findMany({
    where:   { campanhaId: campanha.id },
    orderBy: { dataAcao: 'desc' },
    include: {
      ganhadores: {
        orderBy: { dataRegistro: 'desc' },
        include: { participante: { select: { id: true, nome: true, matricula: true } } },
      },
    },
  })
  return NextResponse.json(acoes)
}

// POST — cria uma ação
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json({ error: 'Nenhuma campanha ativa' }, { status: 400 })

  const { nome, descricao, dataAcao, horarioCorte } = await request.json()
  if (!nome?.trim()) return NextResponse.json({ error: 'nome é obrigatório' }, { status: 400 })

  const acao = await db.acaoCampanha.create({
    data: {
      campanhaId:   campanha.id,
      nome:         String(nome).trim(),
      descricao:    descricao ? String(descricao) : null,
      dataAcao:     dataAcao ? new Date(dataAcao) : new Date(),
      horarioCorte: horarioCorte || campanha.horarioCorteAcoes,
      ativo:        true,
    },
  })
  return NextResponse.json(acao, { status: 201 })
}
