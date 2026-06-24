import 'server-only'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { env } from '@/env'

// Cliente S3 apontando para o Storage do Supabase (endpoint S3-compatível).
// Bucket é PRIVADO: nada é público — leitura sempre passa pela nossa rota autenticada.
const s3 = new S3Client({
  region:         env.STORAGE_S3_REGION,
  endpoint:       env.STORAGE_S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId:     env.STORAGE_S3_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
  },
})

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
}

function contentType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return MIME[ext] ?? 'application/octet-stream'
}

function sanitize(part: string): string {
  return part.replace(/[^a-zA-Z0-9._-]/g, '')
}

/**
 * Monta a chave (key) do objeto isolando por empresa:
 *   {empresaId}/{folder}/{filename}
 */
export function montarChave(empresaId: number, folder: string, filename: string): string {
  return `${empresaId}/${sanitize(folder)}/${sanitize(filename)}`
}

/** Sobe a imagem para o bucket privado. Retorna a chave do objeto. */
export async function salvarFigurinha(
  empresaId: number,
  folder:    string,
  filename:  string,
  buffer:    Buffer,
): Promise<string> {
  const key = montarChave(empresaId, folder, filename)
  await s3.send(new PutObjectCommand({
    Bucket:      env.STORAGE_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: contentType(key),
  }))
  return key
}

/** Lê um objeto do bucket (uso server-side, para servir via rota autenticada). */
export async function lerFigurinha(
  key: string,
): Promise<{ body: Uint8Array; contentType: string } | null> {
  try {
    const out  = await s3.send(new GetObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }))
    const body = await out.Body!.transformToByteArray()
    return { body, contentType: out.ContentType ?? contentType(key) }
  } catch {
    return null
  }
}
