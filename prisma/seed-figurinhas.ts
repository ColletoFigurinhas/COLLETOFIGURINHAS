import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient }  from '@prisma/client'
import sharp             from 'sharp'
import * as fs           from 'fs'
import * as path         from 'path'

const adapter = new PrismaMariaDb({
  host: '127.0.0.1', port: 3306,
  user: 'root', password: '', database: 'album_supermedica',
})
const db = new PrismaClient({ adapter })

// ── Padrão de figurinha ───────────────────────────────────────────
// Dimensões de um card estilo Panini (proporção 3:4)
const CARD_W    = 420   // px
const CARD_H    = 560   // px
const JPEG_Q    = 88    // qualidade JPEG (88 = ótimo equilíbrio tamanho/qualidade)
// Saída em JPEG para uniformidade e tamanho menor que PNG

// Mapeamento de pasta → classificação oficial (maiúsculas, conforme banco)
// Marketing e TI estão unificados no mesmo departamento
const CLASSIFICACAO: Record<string, string> = {
  'comercial':     'COMERCIAL',
  'almoxarifado':  'ALMOXARIFADO',
  'qualidade':     'GARANTIA DA QUALIDADE',
  'marketing':     'MARKETING / TI',
  'tI':            'MARKETING / TI',
  'financeiro':    'FINANCEIRO',
  'compras':       'COMPRAS',
  'manutenção':    'MANUTENÇÃO E CONSERVAÇÃO',
  'rh':            'RECURSOS HUMANOS',
  'Especiais':     'ESPECIAIS',
}

// Ordem das seções no álbum (valores exatos do banco)
const ORDEM_SECOES = [
  'COMERCIAL', 'ALMOXARIFADO', 'GARANTIA DA QUALIDADE',
  'MARKETING / TI', 'FINANCEIRO', 'COMPRAS',
  'MANUTENÇÃO E CONSERVAÇÃO', 'RECURSOS HUMANOS', 'ESPECIAIS',
]

const ORIGEM  = path.resolve('Album Copa', 'Figuras')
const DESTINO = path.resolve('public', 'figuras')

async function processarImagem(srcPath: string, destPath: string): Promise<void> {
  const destJpeg = destPath.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg')

  await sharp(srcPath)
    .resize(CARD_W, CARD_H, {
      fit:        'inside',    // preserva todo o conteúdo sem cortar
      withoutEnlargement: false,
    })
    .jpeg({ quality: JPEG_Q, mozjpeg: true })
    .toFile(destJpeg)
}

async function main() {
  const campanha = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })
  console.log('Campanha:', campanha.nome)

  // 1. Limpa na ordem correta (FK: pacote_figurinhas → album_itens → figurinhas)
  const figIds = (await db.figurinha.findMany({ where: { campanhaId: campanha.id }, select: { id: true } })).map(f => f.id)
  await db.pacoteFigurinha.deleteMany({ where: { figurinhaId: { in: figIds } } })
  const delAlbum = await db.albumItem.deleteMany({ where: { figurinhaId: { in: figIds } } })
  const delFigs  = await db.figurinha.deleteMany({ where: { campanhaId: campanha.id } })
  console.log(`✓ Removidos: ${delFigs.count} figurinhas, ${delAlbum.count} itens de álbum`)

  // 2. Limpa pasta public/figuras e recria
  if (fs.existsSync(DESTINO)) fs.rmSync(DESTINO, { recursive: true })
  fs.mkdirSync(DESTINO, { recursive: true })

  let totalProcessadas = 0
  let totalCadastradas = 0
  const resumo: Record<string, number> = {}

  const pastas = fs.readdirSync(ORIGEM, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  for (const pasta of pastas) {
    const classificacao = CLASSIFICACAO[pasta]
    if (!classificacao) {
      console.warn(`⚠ Pasta desconhecida: "${pasta}" — ignorada`)
      continue
    }

    const srcDir  = path.join(ORIGEM, pasta)
    const destDir = path.join(DESTINO, pasta)
    fs.mkdirSync(destDir, { recursive: true })

    const arquivos = fs.readdirSync(srcDir)
      .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort((a, b) => {
        const na = parseInt(a.replace(/\D/g, ''), 10) || 0
        const nb = parseInt(b.replace(/\D/g, ''), 10) || 0
        return na - nb
      })

    console.log(`\n📁 ${pasta} → "${classificacao}" (${arquivos.length} figurinhas)`)

    for (const arquivo of arquivos) {
      const srcPath  = path.join(srcDir, arquivo)
      const destName = arquivo.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg')
      const destPath = path.join(destDir, destName)

      try {
        await processarImagem(srcPath, destPath)

        const destSize = fs.statSync(destPath).size
        const srcSize  = fs.statSync(srcPath).size
        const ratio    = Math.round((1 - destSize / srcSize) * 100)
        process.stdout.write(`  ✓ ${destName} (${Math.round(destSize/1024)}KB, -${ratio}% do original)\n`)

        const imagemUrl = `/figuras/${pasta}/${destName}`
        await db.figurinha.create({
          data: { campanhaId: campanha.id, classificacao, tipo: 'FUNCIONARIO', imagemUrl, ativo: true },
        })
        totalProcessadas++
        totalCadastradas++
        resumo[classificacao] = (resumo[classificacao] ?? 0) + 1
      } catch (err: any) {
        console.error(`  ✗ Erro em ${arquivo}: ${err.message}`)
      }
    }
  }

  // 3. Resumo final
  console.log('\n' + '─'.repeat(56))
  console.log(`✓ ${totalProcessadas} imagens processadas → ${CARD_W}×${CARD_H}px JPEG q${JPEG_Q}`)
  console.log(`✓ ${totalCadastradas} figurinhas cadastradas no banco`)
  console.log('\nResumo por seção (na ordem do álbum):')

  let totalPaginas = 2 // capa + intro
  for (const sec of ORDEM_SECOES) {
    const count = resumo[sec] ?? 0
    if (count === 0) continue
    const paginas = Math.ceil(count / 12)
    totalPaginas += paginas
    console.log(`  ${sec.padEnd(30)} ${String(count).padStart(3)} figurinhas → ${paginas} pág.`)
  }
  console.log(`  ${'TOTAL PÁGINAS NO ÁLBUM'.padEnd(30)} ${String(totalPaginas + 1).padStart(3)} (+ contracapa)`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
