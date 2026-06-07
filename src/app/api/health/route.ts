import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({
      ok:     true,
      db:     'connected',
      uptime: Math.floor(process.uptime()),
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, db: 'error', error: err?.message },
      { status: 503 }
    )
  }
}
