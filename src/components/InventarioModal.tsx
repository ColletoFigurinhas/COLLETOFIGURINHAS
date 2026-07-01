'use client'

import { useEffect, useState, useRef } from 'react'
import FigurinhaPreview from '@/components/FigurinhaPreview'

type Figurinha = { id: number; classificacao: string; imagemUrl: string | null; quantidade: number }
type Secao     = { classificacao: string; figurinhas: Figurinha[] }
type Premio    = { id: number; classificacao: string; imagemUrl: string | null; quantidade: number; quantidadeEntregue: number }

const SECTION_COLOR: Record<string, string> = {
  'COMERCIAL':                '#1e3a5f',
  'ALMOXARIFADO':             '#14532d',
  'GARANTIA DA QUALIDADE':    '#4c1d95',
  'MARKETING / TI':           '#7f1d1d',
  'FINANCEIRO':               '#78350f',
  'COMPRAS':                  '#7c2d12',
  'RH / SERVIÇOS GERAIS':     '#831843',
  'ESPECIAIS':                '#713f12',
}

// ── Modal de troca ────────────────────────────────────────────────
type BuscaResult = { id: number; nome: string; matricula: string }

function ModalTroca({ fig, onClose, onSucesso }: {
  fig: Figurinha
  onClose: () => void
  onSucesso: () => void
}) {
  const [query,       setQuery]       = useState('')
  const [resultados,  setResultados]  = useState<BuscaResult[]>([])
  const [buscando,    setBuscando]    = useState(false)
  const [selecionado, setSelecionado] = useState<BuscaResult | null>(null)
  const [enviando,    setEnviando]    = useState(false)
  const [erro,        setErro]        = useState('')
  const [ok,          setOk]          = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Busca com debounce
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResultados([]); return }
    setBuscando(true)
    const t = setTimeout(async () => {
      const r = await fetch(`/api/participantes/buscar?q=${encodeURIComponent(q)}`)
      setResultados(await r.json())
      setBuscando(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  function selecionar(p: BuscaResult) {
    setSelecionado(p)
    setQuery(p.nome)
    setResultados([])
    setErro('')
  }

  function limparSelecao() {
    setSelecionado(null)
    setQuery('')
    setResultados([])
    setErro('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!selecionado) return
    setEnviando(true); setErro('')
    const r = await fetch('/api/trocas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ figurinhaOfertadaId: fig.id, matriculaDestinatario: selecionado.matricula }),
    })
    const data = await r.json()
    if (data.ok) {
      setOk(`Proposta enviada para ${data.destinatarioNome}!`)
      setTimeout(onSucesso, 1500)
    } else {
      setErro(data.error ?? 'Erro ao enviar')
      setEnviando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 40, borderRadius: 8, boxSizing: 'border-box',
    border: erro ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff', fontSize: 13, padding: '0 12px', outline: 'none',
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 360,
        background: '#111827', border: '1px solid rgba(245,200,0,0.25)',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <div style={{
            width: 52, height: 70, borderRadius: 7, overflow: 'hidden',
            border: '1.5px solid rgba(245,200,0,0.3)', flexShrink: 0,
            background: SECTION_COLOR[fig.classificacao] ?? '#333',
          }}>
            {fig.imagemUrl && <img src={fig.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>Propor troca</div>
            <div style={{ fontSize: 11, color: 'var(--color-gold)', fontWeight: 700, marginTop: 3 }}>Figurinha #{fig.id}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{fig.classificacao}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>×</button>
        </div>

        {/* Corpo */}
        <div style={{ padding: 16 }}>
          {ok ? (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{ok}</div>
          ) : (
            <form onSubmit={enviar}>
              <label style={{ display: 'block', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                Buscar colega (nome ou matrícula)
              </label>

              {/* Campo de busca ou confirmação do selecionado */}
              {selecionado ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                  padding: '8px 12px', borderRadius: 8, background: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.3)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>{selecionado.nome}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>#{selecionado.matricula}</div>
                  </div>
                  <button type="button" onClick={limparSelecao} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 14, cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}>×</button>
                </div>
              ) : (
                <div style={{ position: 'relative', marginBottom: 6 }}>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelecionado(null) }}
                    placeholder="Nome ou número da matrícula…"
                    style={inputStyle}
                  />
                  {/* Dropdown de resultados */}
                  {(resultados.length > 0 || buscando) && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, marginTop: 4, overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}>
                      {buscando ? (
                        <div style={{ padding: '10px 14px', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Buscando…</div>
                      ) : resultados.length === 0 ? (
                        <div style={{ padding: '10px 14px', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Nenhum colega encontrado.</div>
                      ) : resultados.map(p => (
                        <button key={p.id} type="button" onClick={() => selecionar(p)} style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '10px 14px', background: 'none', border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>#{p.matricula}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!selecionado && query.trim().length < 2 && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 14 }}>Digite ao menos 2 caracteres para buscar.</div>
              )}

              {erro && <div style={{ fontSize: 10, color: '#f87171', marginBottom: 12 }}>{erro}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: selecionado ? 0 : 8 }}>
                <button type="button" onClick={onClose} style={{
                  flex: 1, height: 38, borderRadius: 8, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1,
                }}>
                  Cancelar
                </button>
                <button type="submit" disabled={!selecionado || enviando} style={{
                  flex: 2, height: 38, borderRadius: 8, border: 'none',
                  background: selecionado && !enviando ? 'linear-gradient(135deg,var(--color-gold),var(--color-verde-dark))' : 'rgba(255,255,255,0.07)',
                  color: selecionado && !enviando ? '#000' : 'rgba(255,255,255,0.2)',
                  fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
                  cursor: selecionado && !enviando ? 'pointer' : 'not-allowed',
                }}>
                  {enviando ? 'Enviando…' : 'Enviar proposta'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Card de figurinha ─────────────────────────────────────────────
function FigurinhaCard({ fig, onTrocar }: { fig: Figurinha; onTrocar: (fig: Figurinha) => void }) {
  const repetida = fig.quantidade >= 2
  const color = SECTION_COLOR[fig.classificacao] ?? '#333'

  return (
    <div
      onClick={() => onTrocar(fig)}
      style={{
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        border: repetida ? '2px solid rgba(245,200,0,0.5)' : '1.5px solid rgba(255,255,255,0.12)',
        position: 'relative', aspectRatio: '3/4',
        background: color,
        transition: 'transform 0.12s, border-color 0.12s',
      }}
    >
      {fig.imagemUrl && (
        <img
          src={fig.imagemUrl ?? undefined}
          alt={`#${fig.id}`} draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {fig.quantidade > 1 && (
        <div style={{
          position: 'absolute', top: 5, right: 5,
          background: 'var(--color-gold)', color: '#000',
          fontSize: 10, fontWeight: 900, borderRadius: 10,
          padding: '1px 6px', lineHeight: 1.5,
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        }}>
          ×{fig.quantidade}
        </div>
      )}

      {/* Overlay TROCAR ao hover */}
      <div className="trocar-overlay" style={{
        position: 'absolute', inset: 0,
        background: 'rgba(245,200,0,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 900, color: 'var(--color-gold)',
        letterSpacing: 2, textTransform: 'uppercase',
        opacity: 0, transition: 'opacity 0.15s',
      }}>
        TROCAR
      </div>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────────
export default function InventarioModal({ onClose }: { onClose: () => void }) {
  const [secoes,     setSecoes]     = useState<Secao[]>([])
  const [premios,    setPremios]    = useState<Premio[]>([])
  const [loading,    setLoading]    = useState(true)
  const [figTroca,   setFigTroca]   = useState<Figurinha | null>(null)
  const [figPreview, setFigPreview] = useState<Figurinha | null>(null)

  const carregar = () => {
    setLoading(true)
    fetch('/api/inventario')
      .then(r => r.json())
      .then(data => {
        // Suporta novo formato { secoes, premios } e legado array
        const rawSecoes: Secao[]  = Array.isArray(data) ? data : (data?.secoes ?? [])
        const rawPremios: Premio[] = Array.isArray(data) ? [] : (data?.premios ?? [])

        const filtrado = rawSecoes.map((s: Secao) => ({
          ...s,
          figurinhas: s.figurinhas.filter(f => f.quantidade >= 1),
        })).filter((s: Secao) => s.figurinhas.length > 0)

        setSecoes(filtrado)
        setPremios(rawPremios)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const todasFigs       = secoes.flatMap(s => s.figurinhas)
  const totalRepetidas  = todasFigs.length
  const totalRepetBadge = todasFigs.filter(f => f.quantidade >= 2).length

  return (
    <>
    {figPreview && (
      <FigurinhaPreview
        id={figPreview.id}
        imagemUrl={figPreview.imagemUrl!}
        classificacao={figPreview.classificacao}
        onClose={() => setFigPreview(null)}
        onTrocar={() => { setFigPreview(null); setFigTroca(figPreview) }}
      />
    )}
    {figTroca && (
      <ModalTroca
        fig={figTroca}
        onClose={() => setFigTroca(null)}
        onSucesso={() => { setFigTroca(null); carregar() }}
      />
    )}
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 860, maxHeight: '88vh',
        background: '#0d1220', border: '1px solid rgba(245,200,0,0.2)',
        borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--color-gold)' }}>
              Minhas Figurinhas
            </div>
            {!loading && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginTop: 3 }}>
                {totalRepetidas} figurinha{totalRepetidas !== 1 ? 's' : ''}
                {totalRepetBadge > 0 && <> · <span style={{ color: 'var(--color-gold)' }}>{totalRepetBadge} repetida{totalRepetBadge !== 1 ? 's' : ''}</span></>}
                {' · '}
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>clique para trocar</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: 'rgba(255,255,255,0.5)',
            width: 32, height: 32, fontSize: 16, cursor: 'pointer',
          }}>×</button>
        </div>

        {/* Conteúdo */}
        <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Carregando...
            </div>
          ) : totalRepetidas === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🃏</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
                Você ainda não tem figurinhas
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 6 }}>
                Abra pacotinhos para começar a colecionar
              </div>
            </div>
          ) : (
            <>
              {secoes.map(sec => {
                const color = SECTION_COLOR[sec.classificacao] ?? '#555'
                return (
                  <div key={sec.classificacao} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${color}` }}>
                      <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color }}>{sec.classificacao}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
                        {sec.figurinhas.length} figurinha{sec.figurinhas.length !== 1 ? 's' : ''}
                        {sec.figurinhas.filter(f => f.quantidade >= 2).length > 0 && (
                          <span style={{ color: 'var(--color-gold)' }}>{' · '}{sec.figurinhas.filter(f => f.quantidade >= 2).length} repetida{sec.figurinhas.filter(f => f.quantidade >= 2).length !== 1 ? 's' : ''}</span>
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                      {sec.figurinhas.map((fig) => <FigurinhaCard key={fig.id} fig={fig} onTrocar={setFigPreview} />)}
                    </div>
                  </div>
                )
              })}

              {/* Seção Meus Prêmios — sempre por último */}
              {premios.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #f59e0b' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#f59e0b' }}>Meus Prêmios</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
                      {premios.filter(p => p.quantidadeEntregue >= p.quantidade).length}/{premios.length} entregues
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                    {premios.flatMap(p => {
                      const isPrata = p.classificacao === 'PREMIO PRATA'
                      const cor     = isPrata ? '#94a3b8' : '#f59e0b'
                      const bgCor   = isPrata ? '#1e293b' : '#78350f'
                      return Array.from({ length: p.quantidade }, (_, i) => {
                        const entregue = i < p.quantidadeEntregue
                        return (
                          <div key={`${p.id}-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden', border: `2px solid ${cor}`, boxShadow: `0 0 10px ${isPrata ? 'rgba(148,163,184,0.3)' : 'rgba(245,158,11,0.4)'}`, background: bgCor }}>
                              {p.imagemUrl
                                ? <img src={p.imagemUrl} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{isPrata ? '🥈' : '🥇'}</div>
                              }
                              {entregue ? (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(74,222,128,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#000', boxShadow: '0 0 12px rgba(74,222,128,0.6)' }}>✓</div>
                                </div>
                              ) : (
                                <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(251,191,36,0.9)', borderRadius: 3, fontSize: 6, fontWeight: 900, color: '#000', padding: '2px 4px', letterSpacing: 0.5, textTransform: 'uppercase' }}>Pendente</div>
                              )}
                            </div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: cor, letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' }}>{isPrata ? '🥈 Prata' : '🥇 Ouro'}</div>
                          </div>
                        )
                      })
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
