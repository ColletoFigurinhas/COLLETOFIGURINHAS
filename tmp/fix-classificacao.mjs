import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'

const adapter = new PrismaMariaDb({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'album_supermedica' })
const db = new PrismaClient({ adapter })

// Ver classificações únicas no banco
const raw = await db.figurinha.groupBy({ by: ['classificacao'], _count: { id: true } })
console.log('Classificações no banco:')
raw.forEach(r => console.log(`  "${r.classificacao}": ${r._count.id}`))

await db.$disconnect()
