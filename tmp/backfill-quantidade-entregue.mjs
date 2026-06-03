/**
 * Backfill quantidade_entregue para itens que foram marcados entregues
 * pelo sistema antigo (entregue_em preenchido, mas quantidade_entregue = 0).
 *
 * Lógica: se entregue_em IS NOT NULL e quantidade_entregue = 0,
 * considera que TODAS as unidades foram entregues de uma vez (comportamento antigo).
 * Seta quantidade_entregue = quantidade.
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'

const adapter = new PrismaMariaDb({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'album_supermedica' })
const db = new PrismaClient({ adapter })

async function main() {
  const result = await db.$executeRaw`
    UPDATE album_itens
    SET quantidade_entregue = quantidade
    WHERE entregue_em IS NOT NULL
      AND quantidade_entregue = 0
  `
  console.log(`Backfill concluído: ${result} item(ns) atualizado(s).`)

  // Mostra estado atual dos prêmios
  const premios = await db.albumItem.findMany({
    where: {
      figurinha: { classificacao: { in: ['PREMIO PRATA', 'PREMIO OURO'] } },
    },
    select: {
      id: true,
      quantidade: true,
      quantidadeEntregue: true,
      entregueEm: true,
      participante: { select: { nome: true, matricula: true } },
      figurinha: { select: { classificacao: true } },
    },
    orderBy: { participante: { nome: 'asc' } },
  })

  console.log('\nEstado dos prêmios após backfill:')
  for (const p of premios) {
    console.log(
      `  ${p.participante.nome} (${p.participante.matricula}) | ${p.figurinha.classificacao} | qty=${p.quantidade} entregue=${p.quantidadeEntregue}`
    )
  }
}

main().catch(console.error).finally(() => db.$disconnect())
