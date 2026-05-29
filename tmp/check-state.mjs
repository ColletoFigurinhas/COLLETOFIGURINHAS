import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'

const adapter = new PrismaMariaDb({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'album_supermedica' })
const db = new PrismaClient({ adapter })

const [totalFigs, gestores, campanha, participantes, imgSample] = await Promise.all([
  db.figurinha.count(),
  db.figurinha.count({ where: { tipo: 'GESTOR' } }),
  db.campanha.findFirst({ where: { slug:'super-copa-2026' }, select: { id:true, nome:true } }),
  db.participante.count(),
  db.figurinha.findFirst({ select: { id:true, imagemUrl:true, classificacao:true, tipo:true } }),
])

console.log('=== ESTADO ATUAL ===')
console.log(`Campanha:      ${campanha?.nome} (id: ${campanha?.id})`)
console.log(`Figurinhas:    ${totalFigs} total | ${gestores} gestores`)
console.log(`Participantes: ${participantes}`)
console.log(`URL exemplo:   ${imgSample?.imagemUrl}`)

const por_secao = await db.figurinha.groupBy({ by: ['classificacao'], _count: { id: true } })
console.log('\nPor seção:')
por_secao.sort((a,b) => b._count.id - a._count.id)
         .forEach(s => console.log(`  ${s.classificacao.padEnd(32)} ${s._count.id}`))

await db.$disconnect()
