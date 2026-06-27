import 'server-only'
import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
import { nivelarParticipante } from '@/server/services/campanha'

const rowSchema = z.object({
  matricula: z.string().trim().min(1).max(50),
  nome:      z.string().trim().min(1).max(255),
  email:     z.preprocess(
    v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().email().optional(),
  ),
})

export type ResultadoImportacao = {
  total: number
  criados: number
  atualizados: number
  erros: { linha: number; matricula?: string; erro: string }[]
}

/**
 * Importa/atualiza participantes em lote para uma empresa.
 * Upsert por (empresaId, matricula); novos entram sem senha (definem no 1º acesso)
 * e recebem nivelamento. Usado pela importação por planilha e pela API pública.
 */
export async function importarParticipantes(
  db: PrismaClient,
  empresaId: number,
  rows: unknown[],
): Promise<ResultadoImportacao> {
  const campanha = await db.campanha.findFirst({ where: { empresaId, status: 'ativo' } })

  let criados = 0
  let atualizados = 0
  const erros: ResultadoImportacao['erros'] = []

  for (let i = 0; i < rows.length; i++) {
    const parsed = rowSchema.safeParse(rows[i])
    if (!parsed.success) {
      const mat = (rows[i] as { matricula?: string } | null)?.matricula
      erros.push({ linha: i + 1, matricula: mat, erro: 'Matrícula e nome são obrigatórios; e-mail deve ser válido.' })
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
        if (campanha) {
          try { await nivelarParticipante(db, campanha.id, novo.id) } catch { /* best-effort */ }
        }
        criados++
      }
    } catch (e) {
      erros.push({ linha: i + 1, matricula, erro: e instanceof Error ? e.message : 'Erro ao salvar.' })
    }
  }

  return { total: rows.length, criados, atualizados, erros }
}
