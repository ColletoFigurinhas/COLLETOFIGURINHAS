import { z } from 'zod'

const schema = z.object({
  // ── Banco (Supabase / Postgres) ──────────────────────────────
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),  // pooler (runtime)
  DIRECT_URL:   z.string().min(1, 'DIRECT_URL é obrigatório'),    // direta (migrations)

  // ── Auth / sessão ────────────────────────────────────────────
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET precisa ter no mínimo 32 caracteres'),
  COOKIE_SECURE:  z.enum(['true', 'false']).default('false'),

  // ── App ──────────────────────────────────────────────────────
  BASE_DOMAIN: z.string().default('localhost'),
  NODE_ENV:    z.enum(['development', 'production', 'test']).default('development'),

  // ── Storage (Supabase, S3-compatível) ────────────────────────
  STORAGE_S3_ENDPOINT:          z.string().url('STORAGE_S3_ENDPOINT deve ser uma URL'),
  STORAGE_S3_REGION:            z.string().min(1, 'STORAGE_S3_REGION é obrigatório'),
  STORAGE_S3_ACCESS_KEY_ID:     z.string().min(1, 'STORAGE_S3_ACCESS_KEY_ID é obrigatório'),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().min(1, 'STORAGE_S3_SECRET_ACCESS_KEY é obrigatório'),
  STORAGE_BUCKET:               z.string().min(1, 'STORAGE_BUCKET é obrigatório'),

  // ── Serviços opcionais ───────────────────────────────────────
  SENTRY_DSN:   z.string().url().optional(),
  CRON_SECRET:  z.string().optional(),
  // Email transacional (Resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM:    z.string().optional(),  // ex.: "Colleto <no-reply@seudominio.com>"
})

const result = schema.safeParse(process.env)

if (!result.success) {
  const issues = result.error.issues
    .map(i => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(`\n[env] Variáveis de ambiente inválidas:\n${issues}\n`)
}

export const env = result.data
