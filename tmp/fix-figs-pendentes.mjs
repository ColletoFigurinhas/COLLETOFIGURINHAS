import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'

const adapter = new PrismaMariaDb({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'album_supermedica' })
const db = new PrismaClient({ adapter })

// Corrige extensao de .jpg para .png onde o arquivo real e .png
await db.figurinha.update({ where: { id: 975 }, data: { imagemUrl: '/figuras/comercial/Figura-168.png' } })
console.log('✓ id=975 -> /figuras/comercial/Figura-168.png')

await db.figurinha.update({ where: { id: 994 }, data: { imagemUrl: '/figuras/marketing/Figura-169.png' } })
console.log('✓ id=994 -> /figuras/marketing/Figura-169.png')

await db.$disconnect()
