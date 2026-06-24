import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { lerFigurinha } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// Serve imagens do bucket PRIVADO do Supabase.
// Chave: {empresaId}/{folder}/{filename} — só a própria empresa (ou super admin) acessa.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const safe = segments.map(s => s.replace(/[^a-zA-Z0-9._-]/g, '')).filter(Boolean)
  if (safe.length < 2) return new NextResponse(null, { status: 404 })

  // Isolamento por tenant: a 1ª parte da chave é o empresaId.
  const empresaIdDaChave = Number(safe[0])
  const session = await getSession()
  const autorizado =
    !!session &&
    (session.isSuperAdmin === true ||
      (!!session.userId && session.empresaId === empresaIdDaChave))
  if (!autorizado) return new NextResponse(null, { status: 403 })

  const obj = await lerFigurinha(safe.join('/'))
  if (!obj) return new NextResponse(null, { status: 404 })

  return new NextResponse(Buffer.from(obj.body), {
    headers: {
      'Content-Type':  obj.contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
