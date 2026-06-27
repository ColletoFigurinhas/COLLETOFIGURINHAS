import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'
import { importarParticipantes } from '@/server/services/participantes'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST — importa participantes em lote (planilha). Body: { rows: [{matricula, nome, email?}] }
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { empresaId } = auth.session

  const body = await request.json().catch(() => null)
  const rows = body?.rows
  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: 'Nenhuma linha para importar.' }, { status: 400 })
  if (rows.length > 2000)
    return NextResponse.json({ error: 'Máximo de 2000 linhas por importação.' }, { status: 400 })

  const resultado = await importarParticipantes(db, empresaId, rows)
  return NextResponse.json(resultado)
}
