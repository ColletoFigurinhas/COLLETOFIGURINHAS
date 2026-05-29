import sharp from 'sharp'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

const DIR = 'public/album'
const TARGET_W = 1000   // 2× display size (retina)
const JPEG_Q   = 90

const files = readdirSync(DIR).filter(f => f.endsWith('.png'))

for (const file of files.sort()) {
  const src  = join(DIR, file)
  const dest = join(DIR, file.replace('.png', '.jpg'))
  const before = Math.round(statSync(src).size / 1024)

  await sharp(src)
    .resize(TARGET_W, null, { fit:'inside' })
    .jpeg({ quality: JPEG_Q, mozjpeg: true })
    .toFile(dest)

  const after = Math.round(statSync(dest).size / 1024)
  console.log(`${file} → ${file.replace('.png','.jpg')} | ${before}KB → ${after}KB (-${Math.round((1-after/before)*100)}%)`)
}
console.log('\nDone. Atualize as referências de .png → .jpg no FlipBook.')
