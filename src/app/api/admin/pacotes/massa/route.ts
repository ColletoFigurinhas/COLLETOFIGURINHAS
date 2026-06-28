import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'
import { sortearFigurinhas } from '@/server/services/campanha'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST — distribui 1 pacote PADRÃO para todos os participantes ativos
export async function POST() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId, nome: adminNome } = auth.session

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })
  if (!campanha) return NextResponse.json({ error: 'Nenhuma campanha ativa.' }, { status: 400 })

  const participantes = await db.participante.findMany({
    where:  { empresaId, ativo: true },
    select: { id: true, nome: true, matricula: true },
  })

  let distribuidos = 0
  for (const p of participantes) {
    try {
      const picks = await sortearFigurinhas(db, campanha.id, campanha.stickersPorDiaPadrao, campanha.chanceEspecial, campanha.temperatura, p.id)
      const pacote = await db.pacote.create({
        data: {
          campanhaId:     campanha.id,
          participanteId: p.id,
          tipo:           'PADRAO',
          dataReferencia: new Date(),
          status:         'DISPONIVEL',
          figurinhas:     { create: picks.map(f => ({ figurinhaId: f.id, revelada: false })) },
        },
      })
      await db.logDistribuicaoManual.create({
        data: {
          empresaId, pacoteId: pacote.id, participanteId: p.id,
          participanteNome: p.nome, matricula: p.matricula,
          tipoPacote: 'PADRAO', distribuidoPor: `${adminNome ?? 'admin'} (massa)`,
        },
      })
      distribuidos++
    } catch { /* segue para o próximo */ }
  }

  return NextResponse.json({ ok: true, distribuidos, total: participantes.length })
}
