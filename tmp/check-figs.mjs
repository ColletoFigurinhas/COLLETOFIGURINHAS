import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'

const adapter = new PrismaMariaDb({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'album_supermedica' })
const db = new PrismaClient({ adapter })

const count = await db.figurinha.count({ where: { ativo: true } })
const campanha = await db.campanha.findFirst({ where: { slug: 'super-copa-2026' }, select: { id:true } })
const withCampanha = await db.figurinha.count({ where: { campanha: { slug:'super-copa-2026' }, ativo: true } })

console.log('Total figurinhas ativas:', count)
console.log('Campanha:', campanha)
console.log('Figurinhas com campanha slug:', withCampanha)

// Testa a query exata do album
const figs = await db.figurinha.findMany({
  where:   { campanha: { slug: 'super-copa-2026' }, ativo: true },
  select:  { id: true, classificacao: true, imagemUrl: true, tipo: true },
  orderBy: { id: 'asc' },
  take: 3,
})
console.log('Amostra:', JSON.stringify(figs, null, 2))
await db.$disconnect()
