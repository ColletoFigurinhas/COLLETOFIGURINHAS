import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/server/auth/api'
import { nivelarParticipante } from '@/server/services/campanha'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const rowSchema = z.object({
  matricula: z.string().trim().min(1).max(50),
  nome:      z.string().trim().min(1).max(255),
  email:     z.preprocess(
    v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().email().optional(),
  ),
})

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

  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })

  let criados = 0
  let atualizados = 0
  const erros: { linha: number; matricula?: string; erro: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const parsed = rowSchema.safeParse(rows[i])
    if (!parsed.success) {
      erros.push({ linha: i + 1, matricula: rows[i]?.matricula, erro: 'Matrícula e nome são obrigatórios; e-mail deve ser válido.' })
      continue
    }
    const { matricula, nome, email } = parsed.data
    try {
      const existente = await db.participante.findFirst({ where: { empresaId, matricula } })
      if (existente) {
        await db.participante.update({
          where: { id: existente.id },
          data:  { nome, ...(email ? { email } : {}), ativo: true },
        })
        atualizados++
      } else {
        const novo = await db.participante.create({
          data: { empresaId, matricula, nome, email, role: 'PARTICIPANTE', ativo: true },
        })
        // Sem senha: participante define no primeiro acesso.
        if (campanha) {
          try { await nivelarParticipante(db, campanha.id, novo.id) } catch { /* nivelamento best-effort */ }
        }
        criados++
      }
    } catch (e) {
      erros.push({ linha: i + 1, matricula, erro: e instanceof Error ? e.message : 'Erro ao salvar.' })
    }
  }

  return NextResponse.json({ total: rows.length, criados, atualizados, erros })
}
