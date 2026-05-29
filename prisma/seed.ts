import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'album_supermedica',
})
const db = new PrismaClient({ adapter })

async function main() {
  const campanha = await db.campanha.upsert({
    where: { slug: 'super-copa-2026' },
    update: {},
    create: {
      nome:                  'Super Copa 2026',
      slug:                  'super-copa-2026',
      dataInicio:            new Date('2026-06-01T00:00:00'),
      dataFim:               new Date('2026-06-26T23:59:59'),
      stickersPorDiaPadrao:  14,
      stickersPorDiaPlus:    15,
      stickersPorDiaPremium: 15,
      chanceEspecial:        0.10,
      horarioCorteAcoes:     '18:00',
      status:                'ativo',
    },
  })

  console.log('✓ Campanha criada:', campanha.id, '—', campanha.nome)
  console.log('  Período:', campanha.dataInicio.toLocaleDateString('pt-BR'), 'a', campanha.dataFim.toLocaleDateString('pt-BR'))
  console.log('  Pacote padrão:', campanha.stickersPorDiaPadrao, 'figurinhas/dia')
  console.log('  Horário de corte:', campanha.horarioCorteAcoes)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
