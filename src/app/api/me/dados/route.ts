import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, deleteSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET /api/me/dados — exporta todos os dados do participante (LGPD art. 18)
export async function GET() {
  const s = await getSession()
  if (!s?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const participante = await db.participante.findUnique({
    where: { id: s.userId },
    include: {
      pacotes: {
        include: { figurinhas: { include: { figurinha: true } } },
        orderBy: { id: 'desc' },
      },
      albumItens: { include: { figurinha: true } },
      trocasSolicitadas: true,
    },
  })

  if (!participante) return NextResponse.json({ error: 'Participante não encontrado' }, { status: 404 })

  // Omite campos sensíveis da exportação
  const { senha, resetToken, resetTokenExpiry, ...dados } = participante as any

  return NextResponse.json({ exportadoEm: new Date().toISOString(), dados })
}

// DELETE /api/me/dados — anonimiza dados do participante (LGPD art. 18 VI)
export async function DELETE() {
  const s = await getSession()
  if (!s?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  await db.$transaction([
    // Remove figurinhas do pacote e os pacotes
    db.pacoteFigurinha.deleteMany({ where: { pacote: { participanteId: s.userId } } }),
    db.pacote.deleteMany({ where: { participanteId: s.userId } }),
    // Remove itens do álbum
    db.albumItem.deleteMany({ where: { participanteId: s.userId } }),
    // Remove trocas relacionadas
    db.troca.deleteMany({
      where: { OR: [{ solicitanteId: s.userId }, { destinatarioId: s.userId }] },
    }),
    // Anonimiza o participante (mantém id para integridade, apaga dados pessoais)
    db.participante.update({
      where: { id: s.userId },
      data: {
        nome:             'Usuário removido',
        email:            null,
        senha:            null,
        resetToken:       null,
        resetTokenExpiry: null,
        ativo:            false,
      },
    }),
  ])

  await deleteSession()
  return NextResponse.json({ ok: true, mensagem: 'Dados removidos com sucesso.' })
}
