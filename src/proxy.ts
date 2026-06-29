import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptEdge } from '@/lib/session-edge'

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0]
  const base = process.env.BASE_DOMAIN ?? 'localhost'

  if (hostname === base || hostname === `www.${base}`) return null

  if (hostname.endsWith(`.${base}`)) {
    const sub = hostname.slice(0, hostname.length - base.length - 1)
    return sub === 'www' ? null : sub
  }

  return null
}

const PROTECTED  = ['/album', '/admin', '/primeiro-acesso', '/termos']
const AUTH_ONLY  = ['/login', '/recuperar-senha']
const SKIP_PATHS = ['/_next', '/api/cron', '/api/v1', '/api/figuras', '/figuras', '/icon.png', '/favicon']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''

  const slug = extractSubdomain(host)

  // Propaga o slug para server components / actions via header (sempre, antes de qualquer early return)
  const requestHeaders = new Headers(request.headers)
  if (slug) requestHeaders.set('x-empresa-slug', slug)
  const next = NextResponse.next({ request: { headers: requestHeaders } })

  // Server Actions passam direto — mas já carregam o header x-empresa-slug
  if (request.method === 'POST' && request.headers.get('Next-Action')) {
    return next
  }

  // Assets e crons passam direto
  if (SKIP_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  // ── Owner (domínio raiz ou owner.localhost / owner.colleto.com.br) ──
  if (!slug || slug === 'owner') {
    if (pathname.startsWith('/owner')) {
      const token = request.cookies.get('album-session')?.value
      const session = await decryptEdge(token)

      if (session?.isOwner && pathname === '/owner/login') {
        return NextResponse.redirect(new URL('/owner', request.url))
      }
      if (!session?.isOwner && pathname !== '/owner/login') {
        return NextResponse.redirect(new URL('/owner/login', request.url))
      }
      return next
    }
    // Domínio raiz → owner login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/owner/login', request.url))
    }
    return next
  }

  // ── Empresa (tem subdomínio) ─────────────────────────────────────
  const token = request.cookies.get('album-session')?.value
  const session = await decryptEdge(token)
  const autenticado = !!(session?.userId && session?.empresaSlug === slug)

  if (AUTH_ONLY.some(p => pathname.startsWith(p))) {
    if (autenticado) return NextResponse.redirect(new URL('/album', request.url))
    return next
  }

  if (PROTECTED.some(p => pathname.startsWith(p))) {
    if (!autenticado) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (session?.primeiroAcesso && pathname !== '/primeiro-acesso') {
      return NextResponse.redirect(new URL('/primeiro-acesso', request.url))
    }
    if (!session?.primeiroAcesso && !session?.termosAceitos && pathname !== '/termos') {
      return NextResponse.redirect(new URL('/termos', request.url))
    }
  }

  return next
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$).*)'],
}
