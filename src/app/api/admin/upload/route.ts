import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { salvarArquivo } from '@/lib/storage'
import { log } from '@/lib/logger'

const ROLES_PERMITIDOS = ['MARKETING', 'TI', 'ADMIN'] as const

export async function POST(request: Request) {
  const s = await getSession()
  if (!s?.userId || !ROLES_PERMITIDOS.includes(s.role as any))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file     = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo' }, { status: 400 })

  // folder: 'VERDE' | 'AMARELO' | 'Especiais' (default)
  const folder   = (formData.get('folder') as string | null) ?? 'Especiais'
  // filename: reutiliza nome gerado no upload anterior (para AMARELO = mesmo nome do VERDE)
  const existing = formData.get('filename') as string | null
  const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const filename = existing ?? `${Date.now()}.${ext}`

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const url    = await salvarArquivo(buffer, folder, filename)
    return NextResponse.json({ url, filename })
  } catch (err: any) {
    log.error('Falha ao salvar arquivo de upload', { err: err?.message, folder, empresaId: s.empresaId })
    return NextResponse.json({ error: 'Falha ao salvar arquivo', detail: err?.message }, { status: 500 })
  }
}
