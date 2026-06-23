import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { deleteSession } from '@/lib/session'
import { requireUser } from '@/server/auth/api'

export const dynamic = 'force-dynamic'

// GET /api/me/dados — exporta todos os dados do participante (LGPD art. 18)
export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { userId } = auth.session

  const participante = await db.participante.findUnique({
    where: { id: userId },
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
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { userId } = auth.session

  await db.$transaction([
    // Remove figurinhas do pacote e os pacotes
    db.pacoteFigurinha.deleteMany({ where: { pacote: { participanteId: userId } } }),
    db.pacote.deleteMany({ where: { participanteId: userId } }),
    // Remove itens do álbum
    db.albumItem.deleteMany({ where: { participanteId: userId } }),
    // Remove trocas relacionadas
    db.troca.deleteMany({
      where: { OR: [{ solicitanteId: userId }, { destinatarioId: userId }] },
    }),
    // Anonimiza o participante (mantém id para integridade, apaga dados pessoais)
    db.participante.update({
      where: { id: userId },
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
