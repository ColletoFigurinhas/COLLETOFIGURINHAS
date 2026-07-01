'use client'

import { useMemo, useRef, useState } from 'react'

type Row = { matricula: string; nome: string; email: string }
type Resultado = {
  total: number
  criados: number
  atualizados: number
  erros: { linha: number; matricula?: string; erro: string }[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseCSV(text: string): Row[] {
  const linhas = text.split(/\r?\n/).filter(l => l.trim() !== '')
  if (linhas.length === 0) return []
  const sep = (linhas[0].match(/;/g)?.length ?? 0) > (linhas[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const primeira = linhas[0].toLowerCase()
  const temCabecalho = primeira.includes('matr') || primeira.includes('nome')
  const out: Row[] = []
  for (let i = temCabecalho ? 1 : 0; i < linhas.length; i++) {
    const c = linhas[i].split(sep).map(x => x.trim().replace(/^"|"$/g, ''))
    out.push({ matricula: c[0] ?? '', nome: c[1] ?? '', email: c[2] ?? '' })
  }
  return out
}

function valida(r: Row): string | null {
  if (!r.matricula) return 'matrícula vazia'
  if (!r.nome) return 'nome vazio'
  if (r.email && !EMAIL_RE.test(r.email)) return 'e-mail inválido'
  return null
}

export default function ImportarParticipantesPanel({ onDone }: { onDone?: () => void }) {
  const [rows, setRows]       = useState<Row[]>([])
  const [enviando, setEnviando]   = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erroGeral, setErroGeral] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const validas = useMemo(() => rows.filter(r => valida(r) === null).length, [rows])
  const invalidas = rows.length - validas

  function carregar(text: string) { setResultado(null); setErroGeral(''); setRows(parseCSV(text)) }

  async function importar() {
    const limpas = rows.filter(r => valida(r) === null)
    if (limpas.length === 0) { setErroGeral('Nenhuma linha válida para importar.'); return }
    setEnviando(true); setErroGeral(''); setResultado(null)
    try {
      const res = await fetch('/api/admin/participantes/importar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: limpas }),
      })
      const data = await res.json()
      if (!res.ok) { setErroGeral(data?.error ?? 'Falha na importação.'); return }
      setResultado(data)
      setRows([])
      if (fileRef.current) fileRef.current.value = ''
      onDone?.()
    } catch {
      setErroGeral('Erro de rede ao importar.')
    } finally {
      setEnviando(false)
    }
  }

  const modeloHref = 'data:text/csv;charset=utf-8,' + encodeURIComponent(
    'matricula,nome,email\n00123,Maria Souza,maria@empresa.com\n00124,Joao Lima,\n'
  )

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(var(--brand-light-rgb),0.2)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(var(--brand-light-rgb),0.55)', marginBottom: 10 }}>Importar planilha (CSV)</div>
      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 14px' }}>
        Colunas <code style={code}>matricula</code>, <code style={code}>nome</code>, <code style={code}>email</code> (e-mail opcional). Separador <b>,</b> ou <b>;</b>. Quem já existe é atualizado; novos definem senha no 1º acesso.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept=".csv,text/csv"
          onChange={e => { const f = e.target.files?.[0]; if (f) f.text().then(carregar) }}
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }} />
        <a href={modeloHref} download="modelo-participantes.csv" style={{ fontSize: 11, color: 'var(--color-gold)' }}>⬇ Baixar modelo</a>
      </div>

      <details style={{ marginTop: 12 }}>
        <summary style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>ou colar o conteúdo</summary>
        <textarea placeholder={'matricula,nome,email\n00123,Maria Souza,maria@empresa.com'} onChange={e => carregar(e.target.value)}
          style={{ width: '100%', height: 90, marginTop: 8, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 10, fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box' }} />
      </details>

      {rows.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
            {rows.length} linha(s) · <span style={{ color: '#4ade80' }}>{validas} válida(s)</span>
            {invalidas > 0 && <> · <span style={{ color: '#f87171' }}>{invalidas} com erro</span></>}
          </div>
          <button onClick={importar} disabled={enviando || validas === 0} style={{
            padding: '10px 22px', borderRadius: 10, border: 'none',
            background: (enviando || validas === 0) ? 'rgba(var(--brand-bright-rgb),0.3)' : 'linear-gradient(135deg,var(--color-verde),var(--color-verde-dark))',
            color: 'var(--on-primary)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
            cursor: (enviando || validas === 0) ? 'not-allowed' : 'pointer',
          }}>
            {enviando ? 'Importando…' : `Importar ${validas} participante(s)`}
          </button>
        </div>
      )}

      {erroGeral && <div style={alerta}>{erroGeral}</div>}

      {resultado && (
        <div style={{ marginTop: 16, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#4ade80' }}>✓ {resultado.criados} criado(s) · {resultado.atualizados} atualizado(s) · {resultado.erros.length} erro(s) de {resultado.total}</div>
          {resultado.erros.length > 0 && (
            <ul style={{ marginTop: 8, fontSize: 11, color: '#f87171', maxHeight: 140, overflow: 'auto' }}>
              {resultado.erros.map((e, i) => <li key={i}>Linha {e.linha}{e.matricula ? ` (${e.matricula})` : ''}: {e.erro}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

const code:   React.CSSProperties = { background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }
const alerta: React.CSSProperties = { marginTop: 14, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#fca5a5' }
