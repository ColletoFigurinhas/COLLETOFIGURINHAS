import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptEdge } from '@/lib/session-edge'

const PUBLIC_PATHS  = ['/login', '/recuperar-senha', '/recuperar-senha-confirm']
const ADMIN_PATHS   = ['/admin']

export async function proxy(req: NextRequest) {
  // Server Actions (POST com header Next-Action) nunca devem ser redirecionadas
  if (req.method === 'POST' && req.headers.get('Next-Action')) {
    return NextResponse.next()
  }

  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isAdmin  = ADMIN_PATHS.some(p => pathname.startsWith(p))

  const token   = req.cookies.get('album-session')?.value
  const session = await decryptEdge(token)

  // Rota pública
  if (isPublic) {
    if (session?.userId && !session.primeiroAcesso) {
      return NextResponse.redirect(new URL('/album', req.nextUrl))
    }
    return NextResponse.next()
  }

  // Sem sessão → login
  if (!session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Primeiro acesso → só pode ir para /primeiro-acesso
  if (session.primeiroAcesso) {
    if (!pathname.startsWith('/primeiro-acesso')) {
      return NextResponse.redirect(new URL('/primeiro-acesso', req.nextUrl))
    }
    return NextResponse.next()
  }

  // Admin → exige role
  if (isAdmin) {
    const rolesPermitidas = ['MARKETING', 'TI', 'ADMIN']
    if (!rolesPermitidas.includes(session.role)) {
      return NextResponse.redirect(new URL('/album', req.nextUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$).*)',
  ],
}
