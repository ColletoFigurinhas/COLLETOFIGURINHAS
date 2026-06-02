/**
 * Adiciona as figurinhas ESPECIAL 1-16 à campanha super-copa-2026.
 * - Processa imagens (420x560 JPEG q88) → public/figuras/Especiais/
 * - Cria registros no banco com classificacao=ESPECIAIS, tipo=ESPECIAL
 * - Skips arquivos já presentes no banco (por imagemUrl)
 * - Seguro para campanha em andamento — não toca em figurinhas existentes
 *
 * Passar --dry-run para simular sem alterar nada.
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'
import sharp             from 'sharp'
import { existsSync, mkdirSync, statSync } from 'fs'
import { readdir }       from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const DRY = process.argv.includes('--dry-run')
if (DRY) console.log('\n🔍 MODO DRY-RUN — nenhuma alteração será feita\n')

const ROOT     = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR  = join(ROOT, 'Album Copa', 'Figuras', 'Especiais')
const DEST_DIR = join(ROOT, 'public', 'figuras', 'Especiais')

const CARD_W = 420
const CARD_H = 560
const JPEG_Q = 88

const db = new PrismaClient({
  adapter: new PrismaMariaDb({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'album_supermedica' })
})

// ── Campanha ──────────────────────────────────────────────────────
const campanha = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })
console.log(`Campanha : ${campanha.nome} (ID: ${campanha.id})`)

// ── Estado atual no banco ─────────────────────────────────────────
const existentes = await db.figurinha.findMany({
  where:   { campanhaId: campanha.id, classificacao: 'ESPECIAIS' },
  orderBy: { id: 'asc' },
  select:  { id: true, imagemUrl: true, ativo: true },
})

console.log(`\nEspeciais já no banco (${existentes.length}):`)
for (const e of existentes) {
  console.log(`  ID ${String(e.id).padStart(4)} | ativo: ${e.ativo} | ${e.imagemUrl}`)
}

// ── Arquivos fonte: apenas "ESPECIAL N.png" ───────────────────────
const todosSrc = await readdir(SRC_DIR)
const arquivos = todosSrc
  .filter(f => /^ESPECIAL\s+\d+\.png$/i.test(f))
  .sort((a, b) => {
    const na = parseInt(a.replace(/\D+/g, ''), 10)
    const nb = parseInt(b.replace(/\D+/g, ''), 10)
    return na - nb
  })

console.log(`\nArquivos ESPECIAL encontrados em Album Copa/Figuras/Especiais/ (${arquivos.length}):`)

const urlsExistentes = new Set(existentes.map(e => e.imagemUrl))

const novas = []
for (const arquivo of arquivos) {
  const destName = arquivo.replace(/\.png$/i, '.jpg')
  const url      = `/figuras/Especiais/${destName}`

  if (urlsExistentes.has(url)) {
    console.log(`  ⏭️  ${arquivo} — já existe (URL: ${url})`)
  } else {
    console.log(`  🆕 ${arquivo} → ${url}`)
    novas.push({ arquivo, destName, url })
  }
}

if (novas.length === 0) {
  console.log('\n✅ Nada a fazer — todas as especiais já estão no banco.')
  await db.$disconnect()
  process.exit(0)
}

// ── Processamento ─────────────────────────────────────────────────
console.log(`\n${'─'.repeat(56)}`)
console.log(`${DRY ? '[DRY-RUN] ' : ''}${novas.length} figurinhas a inserir:\n`)

if (!DRY) mkdirSync(DEST_DIR, { recursive: true })

let ok = 0, erros = 0
for (const { arquivo, destName, url } of novas) {
  const srcPath  = join(SRC_DIR, arquivo)
  const destPath = join(DEST_DIR, destName)
  const srcSize  = statSync(srcPath).size

  try {
    if (!DRY) {
      await sharp(srcPath)
        .resize(CARD_W, CARD_H, { fit: 'inside', withoutEnlargement: false })
        .jpeg({ quality: JPEG_Q, mozjpeg: true })
        .toFile(destPath)

      await db.figurinha.create({
        data: { campanhaId: campanha.id, classificacao: 'ESPECIAIS', tipo: 'ESPECIAL', imagemUrl: url, ativo: true },
      })

      const destSize = statSync(destPath).size
      const ratio    = Math.round((1 - destSize / srcSize) * 100)
      console.log(`  ✅ ${destName} (${Math.round(destSize / 1024)}KB, -${ratio}% do original) → banco ✓`)
    } else {
      console.log(`  📋 ${destName} (${Math.round(srcSize / 1024)}KB original) → seria inserido no banco`)
    }
    ok++
  } catch (err) {
    console.error(`  ❌ ${arquivo}: ${err.message}`)
    erros++
  }
}

await db.$disconnect()

console.log(`\n${'='.repeat(56)}`)
console.log(` RESUMO${DRY ? ' (DRY-RUN)' : ''}`)
console.log(`${'='.repeat(56)}`)
console.log(` Especiais no banco antes : ${existentes.length}`)
console.log(` Novas figurinhas         : ${novas.length}`)
console.log(` Sucesso                  : ${ok}`)
console.log(` Erros                    : ${erros}`)
if (!DRY) console.log(` Especiais no banco após  : ${existentes.length + ok}`)
if (DRY) console.log('\n⚡ Execute sem --dry-run para aplicar as alterações.')
