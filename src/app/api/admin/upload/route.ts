import { NextResponse } from 'next/server'
import { writeFile, mkdir, chmod } from 'fs/promises'
import path from 'path'
import { getSession } from '@/lib/session'

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
  const filePath = path.join(process.cwd(), 'public', 'figuras', folder, filename)
  const dir      = path.join(process.cwd(), 'public', 'figuras', folder)

  try {
    await mkdir(dir, { recursive: true })
    await chmod(dir, 0o755)
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()))
    await chmod(filePath, 0o644)
  } catch (err: any) {
    console.error('[upload] erro ao salvar arquivo:', err)
    return NextResponse.json(
      { error: 'Falha ao salvar arquivo', detail: err?.message, dir },
      { status: 500 }
    )
  }

  return NextResponse.json({ url: `/figuras/${folder}/${filename}`, filename })
}
