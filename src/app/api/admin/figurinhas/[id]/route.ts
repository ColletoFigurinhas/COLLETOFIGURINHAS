import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const { id } = await params
  const figId = Number(id)
  const body = await request.json()

  const existe = await db.figurinha.findFirst({ where: { id: figId, campanha: { empresaId } }, select: { id: true } })
  if (!existe) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const data: Record<string, any> = {}
  if (body.ativo         !== undefined) data.ativo         = body.ativo
  if (body.classificacao !== undefined) data.classificacao = body.classificacao
  if (body.tipo          !== undefined) data.tipo          = body.tipo
  if (body.imagemUrl     !== undefined) data.imagemUrl     = body.imagemUrl

  const f = await db.figurinha.update({ where: { id: figId }, data })
  return NextResponse.json(f)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const { id } = await params
  const figId = Number(id)

  const existe = await db.figurinha.findFirst({ where: { id: figId, campanha: { empresaId } }, select: { id: true } })
  if (!existe) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // ?force=true → cascade explícito (admin confirmou no 2º passo)
  const force = new URL(request.url).searchParams.get('force') === 'true'

  const [emPacote, emAlbum, emTroca] = await Promise.all([
    db.pacoteFigurinha.count({ where: { figurinhaId: figId } }),
    db.albumItem.count({       where: { figurinhaId: figId } }),
    db.troca.count({           where: { OR: [{ figurinhaOfertadaId: figId }, { figurinhaRecebidaId: figId }] } }),
  ])

  const emUso = emPacote > 0 || emAlbum > 0 || emTroca > 0

  if (emUso && !force) {
    return NextResponse.json(
      {
        error: `Não é possível deletar: carta em ${emPacote} pacote(s), ${emAlbum} álbum(ns) e ${emTroca} troca(s).`,
        emUso: true,
        counts: { pacotes: emPacote, albuns: emAlbum, trocas: emTroca },
      },
      { status: 409 }
    )
  }

  if (emUso) {
    // Cascade: remove todas as referências e a carta numa única transação.
    await db.$transaction([
      db.pacoteFigurinha.deleteMany({ where: { figurinhaId: figId } }),
      db.albumItem.deleteMany({       where: { figurinhaId: figId } }),
      db.troca.deleteMany({           where: { OR: [{ figurinhaOfertadaId: figId }, { figurinhaRecebidaId: figId }] } }),
      db.figurinha.delete({           where: { id: figId } }),
    ])
    return NextResponse.json({ ok: true, cascade: true, removed: { pacotes: emPacote, albuns: emAlbum, trocas: emTroca } })
  }

  await db.figurinha.delete({ where: { id: figId } })
  return NextResponse.json({ ok: true })
}
