import sharp from 'sharp'

// Analisa a imagem do gestor e encontra o retângulo branco
const img = sharp('public/album/page-02.jpg')
const { width, height } = await img.metadata()
console.log(`Imagem: ${width}x${height}px`)

// Extrai pixels em raw RGBA
const raw = await img.raw().toBuffer()

// Varre procurando região com pixels brancos (R>220, G>220, B>220)
// para encontrar o retângulo branco do gestor
let minX=width, maxX=0, minY=height, maxY=0
let whiteCount = 0

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 3 // RGB (jpeg = 3 channels)
    const r = raw[idx], g = raw[idx+1], b = raw[idx+2]
    if (r > 230 && g > 230 && b > 230) {
      whiteCount++
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}

console.log(`Pixels brancos: ${whiteCount}`)
console.log(`Região branca encontrada (na imagem ${width}x${height}):`)
console.log(`  X: ${minX} → ${maxX} (largura: ${maxX-minX}px)`)
console.log(`  Y: ${minY} → ${maxY} (altura: ${maxY-minY}px)`)

// Converte para coordenadas no display (450×620)
// objectFit: cover: scale = 450/width (fill width), crop top/bottom
const scale = 450 / width
const displayH = height * scale
const topCrop = (displayH - 620) / 2

const dX = minX * scale
const dY = minY * scale - topCrop
const dW = (maxX - minX) * scale
const dH = (maxY - minY) * scale

console.log(`\nNo display (450×620) com objectFit: cover:`)
console.log(`  left:  ${dX.toFixed(1)}px`)
console.log(`  top:   ${dY.toFixed(1)}px`)
console.log(`  right: ${(450 - (dX + dW)).toFixed(1)}px`)
console.log(`  width: ${dW.toFixed(1)}px`)
console.log(`  height: ${dH.toFixed(1)}px`)
