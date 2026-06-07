import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.103', '192.168.1.*'],
  experimental: {
    staleTimes: { dynamic: 0, static: 0 },
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
  silent:          true,
  disableLogger:   true,
  // Sem upload de source maps se não tiver auth token configurado
  authToken:       process.env.SENTRY_AUTH_TOKEN,
  org:             process.env.SENTRY_ORG,
  project:         process.env.SENTRY_PROJECT,
  telemetry:       false,
})
