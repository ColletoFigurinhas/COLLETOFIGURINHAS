import sharp from 'sharp'
import { readdirSync } from 'fs'
import { join } from 'path'

// Mede as dimensões reais das figurinhas processadas
const pastas = ['comercial', 'almoxarifado', 'compras']
const amostras = []

for (const pasta of pastas) {
  const dir = `public/figuras/${pasta}`
  const files = readdirSync(dir).filter(f => f.endsWith('.jpg')).slice(0, 3)
  for (const f of files) {
    const { width, height } = await sharp(join(dir, f)).metadata()
    amostras.push({ file: `${pasta}/${f}`, width, height, ratio: (height/width).toFixed(3) })
  }
}

console.log('Dimensões das figurinhas processadas:')
amostras.forEach(a => console.log(`  ${a.file}: ${a.width}×${a.height}  ratio h/w=${a.ratio}`))

// Calcula o slot ideal para o album (PAGE_W=450, 4 colunas)
const { width: fw, height: fh } = amostras[0]
const PAD = 10, GAP = 6, COLS = 4
const PAGE_W = 450
const colW = (PAGE_W - PAD*2 - GAP*(COLS-1)) / COLS
const rowH = Math.round(colW * (fh / fw))
console.log(`\nSlot ideal: ${colW.toFixed(1)}×${rowH}px (proporção exata da figurinha)`)
console.log(`GRID_TOP necessário para 3 linhas: ${PAGE_W} → rowH=${rowH}, 3 rows = ${rowH*3 + GAP*2}px + top`)
