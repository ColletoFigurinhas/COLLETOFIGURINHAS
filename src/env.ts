import { z } from 'zod'

const schema = z.object({
  // Banco
  DATABASE_URL:  z.string().min(1, 'DATABASE_URL é obrigatório'),
  DB_HOST:       z.string().default('127.0.0.1'),
  DB_PORT:       z.string().default('3306'),
  DB_USER:       z.string().default('root'),
  DB_PASSWORD:   z.string().default(''),
  DB_NAME:       z.string().min(1, 'DB_NAME é obrigatório'),

  // Auth / sessão
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET precisa ter no mínimo 32 caracteres'),
  COOKIE_SECURE:  z.enum(['true', 'false']).default('false'),

  // App
  BASE_DOMAIN: z.string().default('localhost'),
  NODE_ENV:    z.enum(['development', 'production', 'test']).default('development'),

  // Serviços opcionais
  SENTRY_DSN:      z.string().url().optional(),
  CRON_SECRET:     z.string().optional(),
  COPA_API_URL:    z.string().url().optional(),
  COPA_API_KEY:    z.string().optional(),

  // DO Spaces / S3 (todos obrigatórios juntos se qualquer um for definido)
  SPACES_KEY:      z.string().optional(),
  SPACES_SECRET:   z.string().optional(),
  SPACES_BUCKET:   z.string().optional(),
  SPACES_REGION:   z.string().optional(),
  SPACES_ENDPOINT: z.string().url().optional(),
  SPACES_CDN_URL:  z.string().url().optional(),
})

const result = schema.safeParse(process.env)

if (!result.success) {
  const issues = result.error.issues
    .map(i => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(`\n[env] Variáveis de ambiente inválidas:\n${issues}\n`)
}

export const env = result.data
