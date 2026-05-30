'use client'

import { useEffect, useState, useRef } from 'react'
import FigurinhaPreview from '@/components/FigurinhaPreview'

type Figurinha = { id: number; classificacao: string; imagemUrl: string | null; quantidade: number }
type Secao     = { classificacao: string; figurinhas: Figurinha[] }

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
function ModalTroca({ fig, onClose, onSucesso }: {
  fig: Figurinha
  onClose: () => void
  onSucesso: () => void
}) {
  const [matricula, setMatricula] = useState('')
  const [enviando, setEnviando]   = useState(false)
  const [erro, setErro]           = useState('')
  const [ok, setOk]               = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!matricula.trim()) return
    setEnviando(true); setErro('')

    // Normaliza: remove não-dígitos e preenche com zeros à esquerda (931 → 00931)
    const matriculaNorm = matricula.replace(/\D/g, '').padStart(5, '0')

    const r = await fetch('/api/trocas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ figurinhaOfertadaId: fig.id, matriculaDestinatario: matriculaNorm }),
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
        {/* Header com a figurinha */}
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
            {fig.imagemUrl && (
              <img src={fig.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>
              Propor troca
            </div>
            <div style={{ fontSize: 11, color: '#f5c800', fontWeight: 700, marginTop: 3 }}>
              Figurinha #{fig.id}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              {fig.classificacao}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 7, border: 'none',
            background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)',
            fontSize: 14, cursor: 'pointer', flexShrink: 0,
          }}>×</button>
        </div>

        {/* Corpo */}
        <div style={{ padding: 16 }}>
          {ok ? (
            <div style={{
              textAlign: 'center', padding: '20px 0',
              fontSize: 13, color: '#4ade80', fontWeight: 600,
            }}>
              {ok}
            </div>
          ) : (
            <form onSubmit={enviar}>
              <label style={{
                display: 'block', fontSize: 9, color: 'rgba(255,255,255,0.4)',
                letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
              }}>
                Matrícula do colega
              </label>
              <input
                ref={inputRef}
                value={matricula}
                onChange={e => setMatricula(e.target.value)}
                placeholder="Sua matrícula"
                maxLength={10}
                style={{
                  width: '100%', height: 40, borderRadius: 8, boxSizing: 'border-box',
                  border: erro ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff', fontSize: 15, padding: '0 12px', outline: 'none',
                  marginBottom: erro ? 6 : 14,
                }}
              />
              {erro && (
                <div style={{ fontSize: 10, color: '#f87171', marginBottom: 12 }}>{erro}</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={onClose} style={{
                  flex: 1, height: 38, borderRadius: 8, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: 'rgba(255,255,255,0.4)',
                  fontSize: 11, fontWeight: 700, letterSpacing: 1,
                }}>
                  Cancelar
                </button>
                <button type="submit" disabled={enviando || !matricula.trim()} style={{
                  flex: 2, height: 38, borderRadius: 8, border: 'none',
                  background: matricula.trim() && !enviando
                    ? 'linear-gradient(135deg,#f5c800,#c49200)'
                    : 'rgba(255,255,255,0.07)',
                  color: matricula.trim() && !enviando ? '#000' : 'rgba(255,255,255,0.2)',
                  fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
                  cursor: matricula.trim() && !enviando ? 'pointer' : 'not-allowed',
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
        <img src={fig.imagemUrl} alt={`#${fig.id}`} draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}

      {fig.quantidade > 1 && (
        <div style={{
          position: 'absolute', top: 5, right: 5,
          background: '#f5c800', color: '#000',
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
        fontSize: 10, fontWeight: 900, color: '#f5c800',
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
  const [secoes,    setSecoes]    = useState<Secao[]>([])
  const [loading,   setLoading]   = useState(true)
  const [figTroca,  setFigTroca]  = useState<Figurinha | null>(null)
  const [figPreview, setFigPreview] = useState<Figurinha | null>(null)

  const carregar = () => {
    setLoading(true)
    fetch('/api/inventario')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setLoading(false); return }
        // Mostra todas que o usuário tem (quantidade >= 1)
        const filtrado = data.map((s: Secao) => ({
          ...s,
          figurinhas: s.figurinhas.filter(f => f.quantidade >= 1),
        })).filter((s: Secao) => s.figurinhas.length > 0)
        setSecoes(filtrado)
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
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#f5c800' }}>
              Minhas Figurinhas
            </div>
            {!loading && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginTop: 3 }}>
                {totalRepetidas} figurinha{totalRepetidas !== 1 ? 's' : ''}
                {totalRepetBadge > 0 && <> · <span style={{ color: '#f5c800' }}>{totalRepetBadge} repetida{totalRepetBadge !== 1 ? 's' : ''}</span></>}
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
            secoes.map(sec => {
              const color = SECTION_COLOR[sec.classificacao] ?? '#555'

              return (
                <div key={sec.classificacao} style={{ marginBottom: 28 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 12, paddingBottom: 8,
                    borderBottom: `2px solid ${color}`,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color }}>
                      {sec.classificacao}
                    </span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
                      {sec.figurinhas.length} figurinha{sec.figurinhas.length !== 1 ? 's' : ''}
                      {sec.figurinhas.filter(f => f.quantidade >= 2).length > 0 && (
                        <span style={{ color: '#f5c800' }}>
                          {' · '}{sec.figurinhas.filter(f => f.quantidade >= 2).length} repetida{sec.figurinhas.filter(f => f.quantidade >= 2).length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: 8,
                  }}>
                    {sec.figurinhas.map(fig => (
                      <FigurinhaCard key={fig.id} fig={fig} onTrocar={setFigPreview} />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
    </>
  )
}
