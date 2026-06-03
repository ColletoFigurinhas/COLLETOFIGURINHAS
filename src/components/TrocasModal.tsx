'use client'

import { useEffect, useState, useCallback } from 'react'

type FigCard      = { id: number; imagemUrl: string | null; classificacao: string }
type Participante = { id: number; nome: string; matricula: string | null }

type Troca = {
  id: number
  status: 'PENDENTE' | 'ACEITA' | 'RECUSADA' | 'CANCELADA_SEM_FIGURINHA' | 'CANCELADA_PELO_SOLICITANTE'
  createdAt: string
  respondidoEm: string | null
  solicitante: Participante
  destinatario: Participante
  figurinhaOfertada: FigCard
  figurinhaRecebida: FigCard | null
}

type MinhaFigurinha = { id: number; imagemUrl: string | null; classificacao: string; quantidade: number }

// ── Badge de status ───────────────────────────────────────────────
const STATUS_CFG = {
  PENDENTE:                    { label: 'Pendente',   bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)'  },
  ACEITA:                      { label: 'Aceita',     bg: 'rgba(74,222,128,0.12)',  color: '#4ade80', border: 'rgba(74,222,128,0.3)'  },
  RECUSADA:                    { label: 'Recusada',   bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.3)' },
  CANCELADA_SEM_FIGURINHA:     { label: 'Cancelada',  bg: 'rgba(148,163,184,0.1)',  color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
  CANCELADA_PELO_SOLICITANTE:  { label: 'Cancelada',  bg: 'rgba(148,163,184,0.1)',  color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
}

function StatusBadge({ status }: { status: Troca['status'] }) {
  const cfg = STATUS_CFG[status]
  return (
    <span style={{
      fontSize: 8, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 6,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

// ── Mini card ─────────────────────────────────────────────────────
function MiniCard({ fig, selecionado, onClick }: {
  fig: { id: number; imagemUrl: string | null }
  selecionado?: boolean
  onClick?: () => void
}) {
  return (
    <div onClick={onClick} style={{
      width: 52, height: 70, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
      border: selecionado ? '2px solid #f0c040' : '1.5px solid rgba(255,255,255,0.12)',
      boxShadow: selecionado ? '0 0 10px rgba(240,192,64,0.4)' : 'none',
      background: 'rgba(255,255,255,0.06)',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
    }}>
      {fig.imagemUrl
        ? <img src={fig.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>#{fig.id}</div>
      }
      {selecionado && <div style={{ position: 'absolute', inset: 0, background: 'rgba(240,192,64,0.15)' }} />}
    </div>
  )
}

// ── Item de troca recebida pendente ───────────────────────────────
function TrocaRecebidaPendente({ troca, onAtualizar }: { troca: Troca; onAtualizar: () => void }) {
  const [minhasFigs,   setMinhasFigs]   = useState<MinhaFigurinha[]>([])
  const [selecionada,  setSelecionada]  = useState<number | null>(null)
  const [expandido,    setExpandido]    = useState(false)
  const [enviando,     setEnviando]     = useState(false)
  const [erro,         setErro]         = useState('')
  const [soRepetidas,  setSoRepetidas]  = useState(false)

  useEffect(() => {
    if (!expandido) return
    fetch('/api/inventario')
      .then(r => r.json())
      .then((data: any) => {
        const secoes = Array.isArray(data) ? data : (data?.secoes ?? [])
        setMinhasFigs(secoes.flatMap((s: any) => s.figurinhas).filter((f: any) => f.quantidade >= 1))
      })
  }, [expandido])

  async function aceitar() {
    if (!selecionada) return
    setEnviando(true); setErro('')
    const r = await fetch(`/api/trocas/${troca.id}/aceitar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ figurinhaRecebidaId: selecionada }),
    })
    const data = await r.json()
    if (data.ok) onAtualizar()
    else { setErro(data.error ?? 'Erro'); setEnviando(false) }
  }

  async function recusar() {
    setEnviando(true)
    await fetch(`/api/trocas/${troca.id}/recusar`, { method: 'POST' })
    onAtualizar()
  }

  return (
    <div style={{
      background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.15)',
      borderRadius: 10, padding: 14, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <MiniCard fig={troca.figurinhaOfertada} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <StatusBadge status="PENDENTE" />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {troca.solicitante.nome}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
            Figurinha #{troca.figurinhaOfertada.id} · {troca.figurinhaOfertada.classificacao}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <button onClick={() => setExpandido(v => !v)} disabled={enviando} style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '5px 10px',
            background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
            color: '#4ade80', borderRadius: 6, cursor: 'pointer',
          }}>
            {expandido ? 'Fechar' : 'Aceitar'}
          </button>
          <button onClick={recusar} disabled={enviando} style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '5px 10px',
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: '#f87171', borderRadius: 6, cursor: 'pointer',
          }}>
            Recusar
          </button>
        </div>
      </div>

      {expandido && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>
              Escolha qual figurinha oferecer em troca:
            </div>
            <button onClick={() => setSoRepetidas(v => !v)} style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              padding: '3px 8px', borderRadius: 5, cursor: 'pointer', border: 'none',
              background: soRepetidas ? '#f0c040' : 'rgba(240,192,64,0.12)',
              color: soRepetidas ? '#000' : '#f0c040',
              transition: 'all 0.15s',
            }}>
              {soRepetidas ? '★ Repetidas' : '☆ Repetidas'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
            {(soRepetidas ? minhasFigs.filter(f => f.quantidade >= 2) : minhasFigs).map(f => (
              <MiniCard key={f.id} fig={f} selecionado={selecionada === f.id} onClick={() => setSelecionada(f.id)} />
            ))}
          </div>
          {erro && <div style={{ fontSize: 10, color: '#f87171', marginTop: 6 }}>{erro}</div>}
          <button onClick={aceitar} disabled={!selecionada || enviando} style={{
            marginTop: 10, width: '100%', height: 34, borderRadius: 7, border: 'none',
            background: selecionada ? 'linear-gradient(135deg,#f0c040,#b8902c)' : 'rgba(255,255,255,0.06)',
            color: selecionada ? '#000' : 'rgba(255,255,255,0.2)',
            fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
            cursor: selecionada ? 'pointer' : 'not-allowed',
          }}>
            {enviando ? 'Executando…' : 'Confirmar troca'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Item de troca enviada pendente ────────────────────────────────
function TrocaEnviadaPendente({ troca, onAtualizar }: { troca: Troca; onAtualizar: () => void }) {
  const [confirmando, setConfirmando] = useState(false)

  async function cancelar() {
    await fetch(`/api/trocas/${troca.id}/cancelar`, { method: 'POST' })
    setConfirmando(false)
    onAtualizar()
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.1)',
      borderRadius: 10, padding: 14, marginBottom: 8,
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <MiniCard fig={troca.figurinhaOfertada} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <StatusBadge status="PENDENTE" />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>aguardando</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Para: {troca.destinatario.nome}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
          Figurinha #{troca.figurinhaOfertada.id} · {troca.figurinhaOfertada.classificacao}
        </div>
      </div>
      {confirmando ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>Cancelar troca?</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setConfirmando(false)} style={{ fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
              Não
            </button>
            <button onClick={cancelar} style={{ fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 5, border: 'none', background: 'rgba(248,113,113,0.2)', color: '#f87171', cursor: 'pointer' }}>
              Sim, cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmando(true)} style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '5px 10px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.4)', borderRadius: 6, cursor: 'pointer',
        }}>
          Cancelar
        </button>
      )}
    </div>
  )
}

// ── Item de histórico ─────────────────────────────────────────────
function TrocaHistoricoItem({ troca, userId }: { troca: Troca; userId?: number }) {
  const fui = troca.solicitante.id === userId ? 'enviada' : 'recebida'
  const outraPessoa = fui === 'enviada' ? troca.destinatario : troca.solicitante
  const minhaFig = troca.figurinhaOfertada
  const figRecebida = troca.figurinhaRecebida

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10, padding: 12, marginBottom: 6,
      display: 'flex', gap: 10, alignItems: 'center',
    }}>
      <MiniCard fig={minhaFig} />
      {troca.status === 'ACEITA' && figRecebida && (
        <>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>⇄</div>
          <MiniCard fig={figRecebida} />
        </>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <StatusBadge status={troca.status} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
            {fui === 'enviada' ? 'enviada' : 'recebida'}
          </span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {fui === 'enviada' ? `Para: ${outraPessoa.nome}` : `De: ${outraPessoa.nome}`}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
          #{minhaFig.id}
          {troca.status === 'ACEITA' && figRecebida ? ` ⇄ #${figRecebida.id}` : ''}
          {' · '}
          {new Date(troca.respondidoEm ?? troca.createdAt).toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────────
export default function TrocasModal({ onClose }: { onClose: () => void }) {
  const [aba, setAba]               = useState<'pendentes' | 'historico'>('pendentes')
  const [recebidas, setRecebidas]   = useState<Troca[]>([])
  const [enviadas,  setEnviadas]    = useState<Troca[]>([])
  const [loading,   setLoading]     = useState(true)
  const [userId,    setUserId]      = useState<number>()

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/trocas')
      .then(r => r.json())
      .then(data => {
        setRecebidas(data.recebidas ?? [])
        setEnviadas(data.enviadas  ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const recebidasPendentes = recebidas.filter(t => t.status === 'PENDENTE')
  const enviadasPendentes  = enviadas.filter(t => t.status === 'PENDENTE')
  const totalPendentes     = recebidasPendentes.length + enviadasPendentes.length

  const historicoRecebidas = recebidas.filter(t => t.status !== 'PENDENTE')
  const historicoEnviadas  = enviadas.filter(t => t.status !== 'PENDENTE')
  const historico = [...historicoRecebidas, ...historicoEnviadas]
    .sort((a, b) => new Date(b.respondidoEm ?? b.createdAt).getTime() - new Date(a.respondidoEm ?? a.createdAt).getTime())

  // Pega userId a partir da primeira troca disponível
  const currentUserId = userId ?? (
    enviadas[0]?.solicitante.id ?? recebidas[0]?.destinatario.id
  )

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1001,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, maxHeight: '85vh',
        background: '#0d1220', border: '1px solid rgba(240,192,64,0.15)',
        borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#f0c040' }}>
            Trocas
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: 'rgba(255,255,255,0.5)',
            width: 32, height: 32, fontSize: 16, cursor: 'pointer',
          }}>×</button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {([
            { key: 'pendentes' as const, label: 'Pendentes', count: totalPendentes },
            { key: 'historico' as const, label: 'Histórico', count: historico.length },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setAba(tab.key)} style={{
              flex: 1, padding: '12px 16px', cursor: 'pointer',
              background: aba === tab.key ? 'rgba(240,192,64,0.08)' : 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottom: aba === tab.key ? '2px solid #f0c040' : '2px solid transparent',
              color: aba === tab.key ? '#f0c040' : 'rgba(255,255,255,0.35)',
              fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: aba === tab.key ? '#f0c040' : 'rgba(255,255,255,0.12)',
                  color: aba === tab.key ? '#000' : 'rgba(255,255,255,0.5)',
                  borderRadius: 10, fontSize: 9, fontWeight: 900, padding: '1px 6px',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Carregando...
            </div>
          ) : aba === 'pendentes' ? (
            totalPendentes === 0 ? (
              <EmptyState texto="Nenhuma troca pendente" />
            ) : (
              <>
                {recebidasPendentes.length > 0 && (
                  <>
                    <SectionLabel texto={`Recebidas (${recebidasPendentes.length})`} />
                    {recebidasPendentes.map(t => (
                      <TrocaRecebidaPendente key={t.id} troca={t} onAtualizar={carregar} />
                    ))}
                  </>
                )}
                {enviadasPendentes.length > 0 && (
                  <>
                    <SectionLabel texto={`Enviadas (${enviadasPendentes.length})`} />
                    {enviadasPendentes.map(t => (
                      <TrocaEnviadaPendente key={t.id} troca={t} onAtualizar={carregar} />
                    ))}
                  </>
                )}
              </>
            )
          ) : (
            historico.length === 0 ? (
              <EmptyState texto="Nenhuma troca no histórico" />
            ) : (
              historico.map(t => (
                <TrocaHistoricoItem key={`${t.id}-${t.solicitante.id}`} troca={t} userId={currentUserId} />
              ))
            )
          )}
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ texto }: { texto: string }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.25)', marginBottom: 8, marginTop: 4,
    }}>
      {texto}
    </div>
  )
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.2)', fontSize: 11, letterSpacing: 2 }}>
      {texto}
    </div>
  )
}
