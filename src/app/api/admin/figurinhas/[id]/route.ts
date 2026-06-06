import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES = ['MARKETING', 'TI', 'ADMIN'] as const

async function auth() {
  const s = await getSession()
  if (!s?.userId || !s.empresaId || !ROLES.includes(s.role as any)) return null
  return s
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await auth()
  if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const data: Record<string, any> = {}
  if (body.ativo         !== undefined) data.ativo         = body.ativo
  if (body.classificacao !== undefined) data.classificacao = body.classificacao
  if (body.tipo          !== undefined) data.tipo          = body.tipo
  if (body.imagemUrl     !== undefined) data.imagemUrl     = body.imagemUrl

  const f = await db.figurinha.update({ where: { id: Number(id) }, data })
  return NextResponse.json(f)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await auth()
  if (!s) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const figId = Number(id)

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
