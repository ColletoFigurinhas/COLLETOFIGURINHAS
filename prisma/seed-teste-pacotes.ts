import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'

const adapter = new PrismaMariaDb({
  host: '127.0.0.1', port: 3306,
  user: 'root', password: '', database: 'album_supermedica',
})
const db = new PrismaClient({ adapter })

// Embaralha array
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function main() {
  // Busca ou cria o participante de teste
  let participante = await db.participante.findFirst({ where: { matricula: '00931' } })
  if (!participante) {
    participante = await db.participante.create({
      data: { matricula: '00931', nome: 'RAUL MARTINS OLIVEIRA', email: null },
    })
    console.log(`✓ Participante criado: ${participante.nome} (id: ${participante.id})`)
  } else {
    console.log(`Participante encontrado: ${participante.nome} (id: ${participante.id})`)
  }

  // 1. Limpa álbum do participante
  const deletados = await db.albumItem.deleteMany({ where: { participanteId: participante.id } })
  console.log(`✓ Álbum limpo — ${deletados.count} itens removidos`)

  // 2. Remove pacotes pendentes anteriores
  await db.pacoteFigurinha.deleteMany({
    where: { pacote: { participanteId: participante.id, status: 'DISPONIVEL' } }
  })
  await db.pacote.deleteMany({ where: { participanteId: participante.id, status: 'DISPONIVEL' } })
  console.log('✓ Pacotes anteriores removidos')

  // 3. Busca campanha e figurinhas
  const campanha   = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })
  const figurinhas = await db.figurinha.findMany({ where: { campanhaId: campanha.id, ativo: true }, select: { id: true } })
  console.log(`Figurinhas disponíveis: ${figurinhas.length}`)

  const hoje = new Date()

  // ── Pacote PADRAO (14 figurinhas) ──────────────────────────────
  const figs14 = shuffle(figurinhas).slice(0, 14)
  const pacotePadrao = await db.pacote.create({
    data: {
      campanhaId:     campanha.id,
      participanteId: participante.id,
      tipo:           'PADRAO',
      dataReferencia: hoje,
      status:         'DISPONIVEL',
      figurinhas: {
        create: figs14.map(f => ({ figurinhaId: f.id, revelada: false })),
      },
    },
  })
  console.log(`✓ Pacote PADRÃO criado (id: ${pacotePadrao.id}) com ${figs14.length} figurinhas`)

  // ── Pacote PLUS / Prateado (15 figurinhas) ─────────────────────
  const figs15plus = shuffle(figurinhas).slice(0, 15)
  const pacotePlus = await db.pacote.create({
    data: {
      campanhaId:     campanha.id,
      participanteId: participante.id,
      tipo:           'PLUS',
      dataReferencia: hoje,
      status:         'DISPONIVEL',
      figurinhas: {
        create: figs15plus.map(f => ({ figurinhaId: f.id, revelada: false })),
      },
    },
  })
  console.log(`✓ Pacote PRATEADO criado (id: ${pacotePlus.id}) com ${figs15plus.length} figurinhas`)

  // ── Pacote PREMIUM / Dourado (15 figurinhas) ───────────────────
  const figs15prem = shuffle(figurinhas).slice(0, 15)
  const pacotePrem = await db.pacote.create({
    data: {
      campanhaId:     campanha.id,
      participanteId: participante.id,
      tipo:           'PREMIUM',
      dataReferencia: hoje,
      status:         'DISPONIVEL',
      figurinhas: {
        create: figs15prem.map(f => ({ figurinhaId: f.id, revelada: false })),
      },
    },
  })
  console.log(`✓ Pacote DOURADO criado (id: ${pacotePrem.id}) com ${figs15prem.length} figurinhas`)

  console.log('\n🎴 Tudo pronto! Acesse o álbum e clique em "Pacotes" para abrir.')
  console.log(`   PADRÃO:   id ${pacotePadrao.id}`)
  console.log(`   PRATEADO: id ${pacotePlus.id}`)
  console.log(`   DOURADO:  id ${pacotePrem.id}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
