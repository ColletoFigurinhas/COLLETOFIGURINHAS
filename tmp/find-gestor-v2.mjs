import sharp from 'sharp'

// Analisa cada página de gestor para encontrar o frame exato
for (const pageNum of ['02', '04', '06', '08']) {
  const img = sharp(`public/album/page-${pageNum}.jpg`)
  const { width, height } = await img.metadata()
  const raw = await img.raw().toBuffer()

  // Busca retângulos brancos isolados (cercados por não-branco)
  // Estratégia: varre linha por linha e coluna por coluna
  // Encontra regiões contíguas de pixels brancos

  let firstWhiteRow = -1, lastWhiteRow = -1
  let firstWhiteCol = -1, lastWhiteCol = -1

  // Analisa apenas a parte superior da imagem (top 40%)
  const searchH = Math.floor(height * 0.40)
  // Analisa apenas a parte direita (right 40%)
  const searchX = Math.floor(width * 0.60)

  for (let y = 0; y < searchH; y++) {
    for (let x = searchX; x < width; x++) {
      const idx = (y * width + x) * 3
      const r = raw[idx], g = raw[idx+1], b = raw[idx+2]
      if (r > 230 && g > 230 && b > 230) {
        if (firstWhiteRow < 0) firstWhiteRow = y
        lastWhiteRow = y
        if (firstWhiteCol < 0 || x < firstWhiteCol) firstWhiteCol = x
        if (x > lastWhiteCol) lastWhiteCol = x
      }
    }
  }

  const scale = 450 / width
  const displayH = height * scale
  const topCrop = (displayH - 620) / 2

  const dLeft   = firstWhiteCol * scale
  const dTop    = firstWhiteRow * scale - topCrop
  const dRight  = width * scale - lastWhiteCol * scale
  const dWidth  = (lastWhiteCol - firstWhiteCol) * scale
  const dHeight = (lastWhiteRow - firstWhiteRow) * scale

  console.log(`page-${pageNum}: left=${dLeft.toFixed(0)} top=${dTop.toFixed(0)} right=${dRight.toFixed(0)} w=${dWidth.toFixed(0)} h=${dHeight.toFixed(0)}`)
}
