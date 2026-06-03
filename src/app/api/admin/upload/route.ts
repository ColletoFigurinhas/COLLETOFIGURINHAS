import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
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
  const dir      = path.join(process.cwd(), 'public', 'figuras', folder)

  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({ url: `/figuras/${folder}/${filename}`, filename })
}
