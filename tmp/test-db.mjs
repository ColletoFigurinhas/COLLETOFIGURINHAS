import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'

const adapter = new PrismaMariaDb({ host:'localhost', port:3306, user:'root', password:'', database:'album_supermedica' })
const db = new PrismaClient({ adapter })

try {
  const r = await db.participante.findUnique({ where: { matricula: 'teste' } })
  console.log('findUnique OK — resultado:', r)

  const fields = await db.$queryRaw`DESCRIBE participantes`
  console.log('\nColunas:')
  fields.forEach(f => console.log(' ', f.Field, '-', f.Type, f.Null === 'NO' ? 'NOT NULL' : 'nullable', f.Key))
} catch(e) {
  console.error('ERRO:', e.message)
} finally {
  await db.$disconnect()
}
