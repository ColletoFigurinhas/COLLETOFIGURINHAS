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

export default function ImportarPage() {
  const [rows, setRows]     = useState<Row[]>([])
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erroGeral, setErroGeral] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const validas = useMemo(() => rows.filter(r => valida(r) === null).length, [rows])
  const invalidas = rows.length - validas

  function carregar(text: string) {
    setResultado(null); setErroGeral('')
    setRows(parseCSV(text))
  }

  async function importar() {
    const limpas = rows.filter(r => valida(r) === null)
    if (limpas.length === 0) { setErroGeral('Nenhuma linha válida para importar.'); return }
    setEnviando(true); setErroGeral(''); setResultado(null)
    try {
      const res = await fetch('/api/admin/participantes/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: limpas }),
      })
      const data = await res.json()
      if (!res.ok) { setErroGeral(data?.error ?? 'Falha na importação.'); return }
      setResultado(data)
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
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📥 Importar participantes por planilha</h1>
      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginTop: 8 }}>
        Suba um arquivo <b>.csv</b> com as colunas <code style={code}>matricula</code>, <code style={code}>nome</code> e
        {' '}<code style={code}>email</code> (e-mail opcional). Separador <b>,</b> ou <b>;</b>. Quem já existe é
        atualizado; quem é novo entra e define a senha no primeiro acesso.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
        <input
          ref={fileRef} type="file" accept=".csv,text/csv"
          onChange={e => { const f = e.target.files?.[0]; if (f) f.text().then(carregar) }}
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}
        />
        <a href={modeloHref} download="modelo-participantes.csv" style={{ fontSize: 11, color: '#60a5fa' }}>
          ⬇ Baixar modelo CSV
        </a>
      </div>

      <details style={{ marginTop: 14 }}>
        <summary style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>ou colar o conteúdo</summary>
        <textarea
          placeholder={'matricula,nome,email\n00123,Maria Souza,maria@empresa.com'}
          onChange={e => carregar(e.target.value)}
          style={{ width: '100%', height: 110, marginTop: 8, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 10, fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box' }}
        />
      </details>

      {rows.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
            {rows.length} linha(s) · <span style={{ color: '#4ade80' }}>{validas} válida(s)</span>
            {invalidas > 0 && <> · <span style={{ color: '#f87171' }}>{invalidas} com erro</span></>}
          </div>
          <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#0c1626' }}>
                  <th style={th}>#</th><th style={th}>Matrícula</th><th style={th}>Nome</th><th style={th}>E-mail</th><th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => {
                  const erro = valida(r)
                  return (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={td}>{i + 1}</td>
                      <td style={td}>{r.matricula}</td>
                      <td style={td}>{r.nome}</td>
                      <td style={td}>{r.email || <span style={{ opacity: 0.3 }}>—</span>}</td>
                      <td style={{ ...td, color: erro ? '#f87171' : '#4ade80' }}>{erro ?? 'ok'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rows.length > 100 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Mostrando as 100 primeiras de {rows.length}.</div>}

          <button onClick={importar} disabled={enviando || validas === 0} style={{
            marginTop: 16, height: 44, padding: '0 24px', borderRadius: 8, border: 'none',
            background: (enviando || validas === 0) ? 'rgba(59,130,246,0.3)' : '#3b82f6',
            color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 1,
            cursor: (enviando || validas === 0) ? 'not-allowed' : 'pointer',
          }}>
            {enviando ? 'Importando…' : `Importar ${validas} participante(s)`}
          </button>
        </div>
      )}

      {erroGeral && <div style={alerta}>{erroGeral}</div>}

      {resultado && (
        <div style={{ marginTop: 20, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>✓ Importação concluída</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 1.7 }}>
            {resultado.criados} criado(s) · {resultado.atualizados} atualizado(s) · {resultado.erros.length} erro(s) de {resultado.total} linha(s).
          </div>
          {resultado.erros.length > 0 && (
            <ul style={{ marginTop: 8, fontSize: 11.5, color: '#f87171', maxHeight: 160, overflow: 'auto' }}>
              {resultado.erros.map((e, i) => (
                <li key={i}>Linha {e.linha}{e.matricula ? ` (${e.matricula})` : ''}: {e.erro}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

const code: React.CSSProperties = { background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(96,165,250,0.7)', fontWeight: 700 }
const td: React.CSSProperties = { padding: '7px 10px', color: 'rgba(255,255,255,0.8)' }
const alerta: React.CSSProperties = { marginTop: 16, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#fca5a5' }
