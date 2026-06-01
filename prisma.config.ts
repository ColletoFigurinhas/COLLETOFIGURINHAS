import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    // Fallback vazio permite prisma generate sem DATABASE_URL no ambiente.
    // Em runtime e nos comandos de DB (push/migrate), a var real precisa estar set.
    url: process.env.DATABASE_URL ?? '',
  },
})
