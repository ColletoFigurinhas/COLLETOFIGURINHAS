import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'

const adapter = new PrismaMariaDb({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'album_supermedica' })
const db = new PrismaClient({ adapter })

const p = await db.participante.findFirst({
  where:  { matricula: '00931' },
  select: { id:true, nome:true, email:true, senha:true, resetToken:true, resetTokenExpiry:true },
})
console.log(JSON.stringify(p, null, 2))
await db.$disconnect()
