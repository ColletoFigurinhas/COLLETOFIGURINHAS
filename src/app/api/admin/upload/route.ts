import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/api'
import { salvarArquivo } from '@/lib/storage'
import { log } from '@/lib/logger'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const formData = await request.formData()
  const file     = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo' }, { status: 400 })

  // Validação de tipo e tamanho (defesa contra uploads maliciosos)
  const TIPOS_PERMITIDOS = new Map([
    ['image/png',  'png'],
    ['image/jpeg', 'jpg'],
    ['image/webp', 'webp'],
  ])
  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
  const extPorTipo = TIPOS_PERMITIDOS.get(file.type)
  if (!extPorTipo)
    return NextResponse.json({ error: 'Formato inválido. Use PNG, JPG ou WEBP.' }, { status: 415 })
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'Arquivo muito grande (máx. 5 MB).' }, { status: 413 })

  // Whitelist de pastas — evita path traversal no storage
  const PASTAS = ['VERDE', 'AMARELO', 'Especiais']
  const folderRaw = (formData.get('folder') as string | null) ?? 'Especiais'
  const folder = PASTAS.includes(folderRaw) ? folderRaw : 'Especiais'

  // filename reutilizado precisa bater o padrão seguro; senão gera um novo
  const existing = formData.get('filename') as string | null
  const filename = existing && /^\d+\.(png|jpg|jpeg|webp)$/i.test(existing)
    ? existing
    : `${Date.now()}.${extPorTipo}`

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const url    = await salvarArquivo(buffer, folder, filename)
    return NextResponse.json({ url, filename })
  } catch (err: any) {
    log.error('Falha ao salvar arquivo de upload', { err: err?.message, folder, empresaId })
    return NextResponse.json({ error: 'Falha ao salvar arquivo', detail: err?.message }, { status: 500 })
  }
}
