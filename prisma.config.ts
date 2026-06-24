import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Prisma CLI por padrão só lê `.env`; carregamos `.env.local` do projeto.
config({ path: '.env.local' })

export default defineConfig({
  datasource: {
    // Migrations usam a conexão direta (session-mode, 5432);
    // o runtime usa o pooler (DATABASE_URL, 6543).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
})
