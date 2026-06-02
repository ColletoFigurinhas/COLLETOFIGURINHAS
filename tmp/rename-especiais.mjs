/**
 * Renomeia os arquivos ESPECIAL N → ESPECIAL-N (remove espaços)
 * e atualiza as URLs no banco local.
 *
 * O que faz:
 *   - Renomeia public/figuras/Especiais/ESPECIAL N.jpg → ESPECIAL-N.jpg
 *   - Renomeia Album Copa/Figuras/Especiais/ESPECIAL N.png → ESPECIAL-N.png
 *   - Atualiza imagem_url no banco local (IDs 976-991)
 *
 * Passar --dry-run para simular sem alterar nada.
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'
import { renameSync, existsSync } from 'fs'
import { join, dirname }  from 'path'
import { fileURLToPath }  from 'url'

const DRY = process.argv.includes('--dry-run')
if (DRY) console.log('\n🔍 MODO DRY-RUN — nenhuma alteração será feita\n')

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUB_DIR = join(ROOT, 'public', 'figuras', 'Especiais')
const SRC_DIR = join(ROOT, 'Album Copa', 'Figuras', 'Especiais')

const db = new PrismaClient({
  adapter: new PrismaMariaDb({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'album_supermedica' })
})

const registros = await db.figurinha.findMany({
  where:   { classificacao: 'ESPECIAIS', imagemUrl: { contains: 'ESPECIAL ' } },
  select:  { id: true, imagemUrl: true },
  orderBy: { id: 'asc' },
})

console.log(`${registros.length} registros a corrigir\n`)
console.log('─'.repeat(60))

let ok = 0, erros = 0

for (const r of registros) {
  const nomeAtual = r.imagemUrl.split('/').pop()           // "ESPECIAL 1.jpg"
  const nomeNovo  = nomeAtual.replace(/ESPECIAL /, 'ESPECIAL-') // "ESPECIAL-1.jpg"
  const novaUrl   = r.imagemUrl.replace(/ESPECIAL /, 'ESPECIAL-')

  const jpgAtual = join(PUB_DIR, nomeAtual)
  const jpgNovo  = join(PUB_DIR, nomeNovo)
  const pngAtual = join(SRC_DIR, nomeAtual.replace('.jpg', '.png'))
  const pngNovo  = join(SRC_DIR, nomeNovo.replace('.jpg', '.png'))

  console.log(`\nID ${r.id}`)
  console.log(`  URL  : ${r.imagemUrl} → ${novaUrl}`)

  try {
    // Renomeia JPG processado
    if (existsSync(jpgAtual)) {
      console.log(`  JPG  : ${nomeAtual} → ${nomeNovo}`)
      if (!DRY) renameSync(jpgAtual, jpgNovo)
    } else if (existsSync(jpgNovo)) {
      console.log(`  JPG  : ${nomeNovo} já existe (sem renomear)`)
    } else {
      console.log(`  JPG  : ⚠️  não encontrado em public/figuras/Especiais/`)
    }

    // Renomeia PNG fonte
    if (existsSync(pngAtual)) {
      console.log(`  PNG  : ${pngAtual.split('Especiais\\')[1]} → ${pngNovo.split('Especiais\\')[1]}`)
      if (!DRY) renameSync(pngAtual, pngNovo)
    } else if (existsSync(pngNovo)) {
      console.log(`  PNG  : ${nomeNovo.replace('.jpg','.png')} já existe (sem renomear)`)
    } else {
      console.log(`  PNG  : ⚠️  não encontrado em Album Copa/Figuras/Especiais/`)
    }

    // Atualiza banco
    if (!DRY) {
      await db.figurinha.update({ where: { id: r.id }, data: { imagemUrl: novaUrl } })
    }
    console.log(`  DB   : ${DRY ? '[simulado]' : '✅ atualizado'}`)
    ok++
  } catch (err) {
    console.error(`  ❌ Erro: ${err.message}`)
    erros++
  }
}

await db.$disconnect()

console.log(`\n${'='.repeat(60)}`)
console.log(` RESUMO${DRY ? ' (DRY-RUN)' : ''}`)
console.log(`${'='.repeat(60)}`)
console.log(` OK    : ${ok}`)
console.log(` Erros : ${erros}`)
if (DRY) console.log('\n⚡ Execute sem --dry-run para aplicar.')
