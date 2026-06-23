import 'server-only'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { env } from '@/env'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host:                    env.DB_HOST,
    port:                    Number(env.DB_PORT),
    user:                    env.DB_USER,
    password:                env.DB_PASSWORD,
    database:                env.DB_NAME,
    timezone:                '-03:00',
    allowPublicKeyRetrieval: true,
  })
  return new PrismaClient({ adapter })
}

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db
