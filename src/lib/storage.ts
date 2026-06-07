import 'server-only'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Verifica se DO Spaces está configurado
function spacesConfigured(): boolean {
  const { SPACES_KEY, SPACES_SECRET, SPACES_BUCKET, SPACES_ENDPOINT } = process.env
  return !!(SPACES_KEY && SPACES_SECRET && SPACES_BUCKET && SPACES_ENDPOINT)
}

/**
 * Salva um arquivo e retorna a URL pública.
 * - Se DO Spaces estiver configurado: faz upload para o bucket e retorna CDN URL.
 * - Caso contrário: salva em uploads/figuras/ e retorna rota local /api/figuras/...
 */
export async function salvarArquivo(
  buffer:   Buffer,
  folder:   string,
  filename: string,
): Promise<string> {
  if (spacesConfigured()) {
    return uploadParaSpaces(buffer, folder, filename)
  }
  return salvarLocal(buffer, folder, filename)
}

// ── Local ─────────────────────────────────────────────────────────
async function salvarLocal(buffer: Buffer, folder: string, filename: string): Promise<string> {
  const dir      = path.join(process.cwd(), 'uploads', 'figuras', folder)
  const filePath = path.join(dir, filename)
  await mkdir(dir, { recursive: true })
  await writeFile(filePath, buffer)
  return `/api/figuras/${folder}/${filename}`
}

// ── DO Spaces (S3-compatible) ─────────────────────────────────────
async function uploadParaSpaces(buffer: Buffer, folder: string, filename: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')

  const client = new S3Client({
    region:   process.env.SPACES_REGION ?? 'nyc3',
    endpoint: process.env.SPACES_ENDPOINT,
    credentials: {
      accessKeyId:     process.env.SPACES_KEY!,
      secretAccessKey: process.env.SPACES_SECRET!,
    },
  })

  const key = `figuras/${folder}/${filename}`
  const ext  = filename.split('.').pop()?.toLowerCase() ?? 'png'
  const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'png'  ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : ext === 'gif'  ? 'image/gif'
    : 'application/octet-stream'

  await client.send(new PutObjectCommand({
    Bucket:       process.env.SPACES_BUCKET!,
    Key:          key,
    Body:         buffer,
    ContentType:  contentType,
    ACL:          'public-read',
  }))

  const base = process.env.SPACES_CDN_URL
    ?? `https://${process.env.SPACES_BUCKET}.${process.env.SPACES_REGION}.digitaloceanspaces.com`

  return `${base}/${key}`
}
