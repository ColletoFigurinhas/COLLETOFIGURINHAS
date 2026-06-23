import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

// Content-Security-Policy — começa em Report-Only para não quebrar o app 3D/Sentry.
// Promover para 'Content-Security-Policy' (enforce) após validar em staging.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options',        value: 'nosniff' },
  { key: 'X-Frame-Options',               value: 'DENY' },
  { key: 'Referrer-Policy',               value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control',        value: 'off' },
  { key: 'Permissions-Policy',            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Strict-Transport-Security',     value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy-Report-Only', value: csp },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.103', '192.168.1.*'],
  poweredByHeader: false,
  experimental: {
    staleTimes: { dynamic: 0 },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  turbopack: {
    rules: {
      '*.glsl': { loaders: ['raw-loader'], as: '*.js' },
      '*.vert': { loaders: ['raw-loader'], as: '*.js' },
      '*.frag': { loaders: ['raw-loader'], as: '*.js' },
    },
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
}

export default withSentryConfig(nextConfig, {
  // Sentry só ativo quando SENTRY_DSN está definido
  silent:    true,
  // Sem upload de source maps se não tiver auth token configurado
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org:             process.env.SENTRY_ORG,
  project:         process.env.SENTRY_PROJECT,
  telemetry:       false,
})
