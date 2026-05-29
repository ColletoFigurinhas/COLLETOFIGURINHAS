import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'

const adapter = new PrismaMariaDb({
  host: '127.0.0.1', port: 3306,
  user: 'root', password: '', database: 'album_supermedica',
})
const db = new PrismaClient({ adapter })

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function criarPacotes(participanteId: number, campanhaId: number, figurinhas: { id: number }[]) {
  const hoje = new Date()

  // Remove pacotes disponíveis anteriores
  await db.pacoteFigurinha.deleteMany({
    where: { pacote: { participanteId, status: 'DISPONIVEL' } }
  })
  await db.pacote.deleteMany({ where: { participanteId, status: 'DISPONIVEL' } })

  // PADRAO — 14 figurinhas
  await db.pacote.create({
    data: {
      campanhaId, participanteId, tipo: 'PADRAO',
      dataReferencia: hoje, status: 'DISPONIVEL',
      figurinhas: { create: shuffle(figurinhas).slice(0, 14).map(f => ({ figurinhaId: f.id, revelada: false })) },
    },
  })

  // PLUS — 15 figurinhas
  await db.pacote.create({
    data: {
      campanhaId, participanteId, tipo: 'PLUS',
      dataReferencia: hoje, status: 'DISPONIVEL',
      figurinhas: { create: shuffle(figurinhas).slice(0, 15).map(f => ({ figurinhaId: f.id, revelada: false })) },
    },
  })

  // PREMIUM — 15 figurinhas
  await db.pacote.create({
    data: {
      campanhaId, participanteId, tipo: 'PREMIUM',
      dataReferencia: hoje, status: 'DISPONIVEL',
      figurinhas: { create: shuffle(figurinhas).slice(0, 15).map(f => ({ figurinhaId: f.id, revelada: false })) },
    },
  })
}

async function main() {
  const campanha = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })
  const figurinhas = await db.figurinha.findMany({
    where: { campanhaId: campanha.id, ativo: true }, select: { id: true }
  })
  console.log(`Campanha: ${campanha.nome} | Figurinhas: ${figurinhas.length}`)

  const participantes = await db.participante.findMany({
    where: { ativo: true }, select: { id: true, matricula: true, nome: true }
  })
  console.log(`Participantes: ${participantes.length}`)

  for (const p of participantes) {
    await criarPacotes(p.id, campanha.id, figurinhas)
    console.log(`✓ 3 pacotes criados para ${p.nome} (${p.matricula})`)
  }

  console.log('\nPronto! Todos os participantes têm 3 pacotes disponíveis (PADRAO, PLUS, PREMIUM).')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
