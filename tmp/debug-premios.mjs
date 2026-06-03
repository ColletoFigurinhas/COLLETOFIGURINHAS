import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'

const adapter = new PrismaMariaDb({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'album_supermedica' })
const db = new PrismaClient({ adapter })

// 1. Verifica campanha
const campanha = await db.campanha.findFirst({ where: { slug: 'super-copa-2026' } })
console.log('Campanha:', campanha ? `id=${campanha.id} nome=${campanha.nome}` : 'NÃO ENCONTRADA')

if (!campanha) { await db.$disconnect(); process.exit(1) }

// 2. Verifica figurinhas de prêmio
const figs = await db.figurinha.findMany({
  where: { campanhaId: campanha.id, classificacao: { in: ['PREMIO PRATA', 'PREMIO OURO'] } },
  select: { id: true, classificacao: true, tipo: true, ativo: true },
})
console.log(`\nFigurinhas de prêmio (campanhaId=${campanha.id}):`, figs.length)
for (const f of figs) console.log(`  id=${f.id} ${f.classificacao} tipo=${f.tipo} ativo=${f.ativo}`)

// 3. Verifica albumItens de prêmio
const itens = await db.albumItem.findMany({
  where: { figurinha: { campanhaId: campanha.id, classificacao: { in: ['PREMIO PRATA', 'PREMIO OURO'] } } },
  select: {
    id: true, quantidade: true, quantidadeEntregue: true, entregueEm: true,
    participante: { select: { nome: true, matricula: true } },
    figurinha: { select: { classificacao: true } },
  },
})
console.log(`\nAlbumItens de prêmio:`, itens.length)
for (const i of itens) {
  console.log(`  ${i.participante.nome} | ${i.figurinha.classificacao} | qty=${i.quantidade} entregue=${i.quantidadeEntregue}`)
}

await db.$disconnect()
