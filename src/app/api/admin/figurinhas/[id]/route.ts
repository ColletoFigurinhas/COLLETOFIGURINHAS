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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const { id } = await params
  const figId = Number(id)

  const existe = await db.figurinha.findFirst({ where: { id: figId, campanha: { empresaId } }, select: { id: true } })
  if (!existe) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const [emPacote, emAlbum] = await Promise.all([
    db.pacoteFigurinha.count({ where: { figurinhaId: figId } }),
    db.albumItem.count({       where: { figurinhaId: figId } }),
  ])

  if (emPacote > 0 || emAlbum > 0) {
    return NextResponse.json(
      { error: `Não é possível deletar: carta em ${emPacote} pacote(s) e ${emAlbum} álbum(ns).` },
      { status: 409 }
    )
  }

  await db.figurinha.delete({ where: { id: figId } })
  return NextResponse.json({ ok: true })
}
