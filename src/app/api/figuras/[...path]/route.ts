import { readFile } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params

  // Prevent path traversal
  const safe = segments.map(s => path.basename(s))
  const base = path.join(process.cwd(), 'uploads', 'figuras')
  const filePath = path.join(base, ...safe)

  if (!filePath.startsWith(base + path.sep) && filePath !== base) {
    return new NextResponse(null, { status: 403 })
  }

  try {
    const file = await readFile(filePath)
    const ext = safe[safe.length - 1].split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME[ext] ?? 'application/octet-stream'
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
