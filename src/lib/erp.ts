import 'server-only'

export type ErpFuncionario = {
  matricula: string
  nome:      string
  tipo:      number   // 0 = suspenso → bloqueia login
  ativo:     boolean
}

export type ErpValidacao =
  | { ok: true;  funcionario: ErpFuncionario }
  | { ok: false; motivo: 'nao_encontrado' | 'nao_permitido' | 'suspenso' | 'inativo' | 'erro_api' }

/**
 * Valida matrícula na API v4 do Farol.
 * Endpoint: GET /api/v4/funcionarios/matricula/{matricula}
 * tipo = 0 → suspenso → acesso negado
 */
export async function validarMatriculaNoErp(matricula: string): Promise<ErpValidacao> {
  const baseUrl = process.env.COPA_API_URL
  const apiKey  = process.env.COPA_API_KEY

  if (!baseUrl) {
    console.warn('[ERP] COPA_API_URL não configurado — modo offline')
    return { ok: true, funcionario: { matricula, nome: 'Funcionário', tipo: 1, ativo: true } }
  }

  try {
    const url = `${baseUrl}/funcionarios/matricula/${encodeURIComponent(matricula)}`
    console.log('[ERP] chamando:', url)
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache:  'no-store',
      signal: AbortSignal.timeout(5000),
    })

    if (res.status === 404) return { ok: false, motivo: 'nao_encontrado' }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      if (res.status === 403 && String(body?.message ?? '').toLowerCase().includes('não permitido')) {
        return { ok: false, motivo: 'nao_permitido' }
      }
      throw new Error(`ERP respondeu ${res.status}`)
    }

    const data = await res.json()
    const tipo  = Number(data.tipo ?? 1)
    const ativo = data.ativo !== undefined ? Boolean(data.ativo) : (data.status === 'ativo')

    if (tipo === 0)  return { ok: false, motivo: 'suspenso' }
    if (!ativo)      return { ok: false, motivo: 'inativo' }

    return {
      ok: true,
      funcionario: {
        matricula: data.matricula ?? matricula,
        nome:      data.nome ?? data.nomeCompleto,
        tipo,
        ativo,
      },
    }
  } catch (err: any) {
    console.error('[ERP] Erro:', err?.message ?? err)
    return { ok: false, motivo: 'erro_api' }
  }
}
