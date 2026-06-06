import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptEdge } from '@/lib/session-edge'

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0]
  const parts = hostname.split('.')

  // x.localhost → subdomain = x
  if (parts[parts.length - 1] === 'localhost') {
    return parts.length >= 2 && parts[0] !== 'localhost' ? parts[0] : null
  }

  // x.colleto.com.br (4+ parts) → subdomain = x, exceto "www"
  if (parts.length >= 4) {
    return parts[0] === 'www' ? null : parts[0]
  }

  // x.colleto.com (3 parts) → subdomain = x, exceto "www"
  if (parts.length === 3) {
    return parts[0] === 'www' ? null : parts[0]
  }

  return null
}

const PROTECTED  = ['/album', '/inventario', '/admin', '/primeiro-acesso']
const AUTH_ONLY  = ['/login', '/recuperar-senha']
const SKIP_PATHS = ['/_next', '/api/cron', '/figuras', '/icon.png', '/favicon']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''

  // Server Actions nunca devem ser interceptadas
  if (request.method === 'POST' && request.headers.get('Next-Action')) {
    return NextResponse.next()
  }

  // Assets e crons passam direto
  if (SKIP_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const slug = extractSubdomain(host)

  // Propaga o slug para server components / actions via header
  const requestHeaders = new Headers(request.headers)
  if (slug) requestHeaders.set('x-empresa-slug', slug)
  const next = NextResponse.next({ request: { headers: requestHeaders } })

  // ── Super admin (domínio raiz ou super.localhost / super.colleto.com.br) ──
  if (!slug || slug === 'super') {
    if (pathname.startsWith('/super')) {
      const token = request.cookies.get('album-session')?.value
      const session = await decryptEdge(token)

      if (session?.isSuperAdmin && pathname === '/super/login') {
        return NextResponse.redirect(new URL('/super', request.url))
      }
      if (!session?.isSuperAdmin && pathname !== '/super/login') {
        return NextResponse.redirect(new URL('/super/login', request.url))
      }
      return next
    }
    // Domínio raiz → super login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/super/login', request.url))
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
  }

  return next
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$).*)'],
}
