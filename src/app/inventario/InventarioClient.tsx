'use client'

import { useState } from 'react'
import type { FigurinhaInventario, PremioInventario } from './page'

type Secao = { classificacao: string; figurinhas: FigurinhaInventario[] }
type Filtro = 'todas' | 'tenho' | 'repetidas' | 'faltam'

// ── Cores por seção ───────────────────────────────────────────────
const SECTION_COLOR: Record<string, string> = {
  'COMERCIAL':             '#1e3a5f',
  'ALMOXARIFADO':          '#14532d',
  'GARANTIA DA QUALIDADE': '#4c1d95',
  'MARKETING / TI':        '#7f1d1d',
  'FINANCEIRO':            '#78350f',
  'COMPRAS':               '#7c2d12',
  'RH / SERVIÇOS GERAIS':  '#831843',
  'ESPECIAIS':             '#713f12',
}

// ── Cores alternadas (xadrez 4 colunas) ──────────────────────────
function corAlternada(i: number): 'VERDE' | 'AMARELO' {
  return i % 2 === 0 ? 'VERDE' : 'AMARELO'
}
function urlComCor(url: string, cor: 'VERDE' | 'AMARELO'): string {
  const base = (url.split('/').pop() ?? '').replace(/\.[^.]+$/, '')
  return `/figuras/${cor}/${base}.png`
}

// ── Card de figurinha ─────────────────────────────────────────────
function FigurinhaCard({ fig, index }: { fig: FigurinhaInventario; index: number }) {
  const tem       = fig.quantidade >= 1
  const repetida  = fig.quantidade >= 2
  const color     = SECTION_COLOR[fig.classificacao] ?? '#333'
  const cor       = corAlternada(index)
  const src       = tem && fig.imagemUrl ? urlComCor(fig.imagemUrl, cor) : fig.imagemUrl

  return (
    <div style={{
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
      aspectRatio: '3/4',
      background: tem ? color : 'rgba(255,255,255,0.04)',
      border: repetida
        ? '2px solid #f0c040'
        : tem
          ? '2px solid rgba(255,255,255,0.15)'
          : '1.5px dashed rgba(255,255,255,0.1)',
      boxShadow: repetida ? '0 0 14px rgba(240,192,64,0.3)' : 'none',
      transition: 'transform 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)')}
      onMouseLeave={e => (e.currentTarget.style.transform = '')}
    >
      {/* Imagem */}
      {fig.imagemUrl && (
        <img
          src={src ?? fig.imagemUrl}
          onError={e => { if (src && src !== fig.imagemUrl) (e.currentTarget as HTMLImageElement).src = fig.imagemUrl! }}
          alt={`#${fig.id}`}
          draggable={false}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: tem ? 1 : 0.18,
            filter: tem ? 'none' : 'grayscale(100%)',
          }}
        />
      )}

      {/* Código da figurinha — canto superior esquerdo */}
      <div style={{
        position: 'absolute', top: 4, left: 4,
        background: 'rgba(0,0,0,0.65)',
        borderRadius: 4,
        padding: '2px 5px',
        fontSize: 8,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 0.5,
      }}>
        #{fig.id}
      </div>

      {/* Badge de quantidade (repetidas) */}
      {repetida && (
        <div style={{
          position: 'absolute', top: 5, right: 5,
          background: '#f0c040',
          color: '#000',
          fontSize: 9, fontWeight: 900,
          borderRadius: 10,
          padding: '2px 6px',
          letterSpacing: 0.5,
        }}>
          ×{fig.quantidade}
        </div>
      )}

      {/* Ícone de falta */}
      {!tem && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, opacity: 0.15,
        }}>
          ?
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────
export default function InventarioClient({ secoes, premios = [] }: { secoes: Secao[]; premios?: PremioInventario[] }) {
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const todasFigs    = secoes.flatMap(s => s.figurinhas)
  const totalFigs    = todasFigs.length
  const totalTenho   = todasFigs.filter(f => f.quantidade >= 1).length
  const totalRepetidas = todasFigs.filter(f => f.quantidade >= 2).length
  const totalFaltam  = todasFigs.filter(f => f.quantidade === 0).length

  function filtrarFigs(figs: FigurinhaInventario[]) {
    if (filtro === 'tenho')    return figs.filter(f => f.quantidade >= 1)
    if (filtro === 'repetidas') return figs.filter(f => f.quantidade >= 2)
    if (filtro === 'faltam')   return figs.filter(f => f.quantidade === 0)
    return figs
  }

  const filtros: { key: Filtro; label: string; count: number; cor: string }[] = [
    { key: 'todas',    label: 'Todas',    count: totalFigs,     cor: 'rgba(255,255,255,0.6)' },
    { key: 'tenho',    label: 'Tenho',    count: totalTenho,    cor: '#4ade80' },
    { key: 'repetidas', label: 'Repetidas', count: totalRepetidas, cor: '#f0c040' },
    { key: 'faltam',   label: 'Faltam',   count: totalFaltam,   cor: '#f87171' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% 20%, #1c1540 0%, transparent 60%), #06080f',
      color: '#fff',
      paddingBottom: 60,
    }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,8,15,0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/album" style={{
            fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2,
            textDecoration: 'none', textTransform: 'uppercase',
          }}>
            ← Álbum
          </a>
          <div style={{
            fontSize: 11, fontWeight: 900, letterSpacing: 4,
            textTransform: 'uppercase', color: '#f0c040',
          }}>
            Inventário
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
          {totalTenho} / {totalFigs} figurinhas
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12, marginBottom: 28,
        }}>
          {filtros.map(f => (
            <button key={f.key}
              onClick={() => setFiltro(f.key)}
              style={{
                background: filtro === f.key ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: filtro === f.key
                  ? `1px solid ${f.cor}`
                  : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '14px 12px',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, color: f.cor, lineHeight: 1 }}>
                {f.count}
              </div>
              <div style={{
                fontSize: 9, color: 'rgba(255,255,255,0.45)',
                letterSpacing: 2, textTransform: 'uppercase', marginTop: 4,
              }}>
                {f.label}
              </div>
            </button>
          ))}
        </div>

        {/* Seções */}
        {secoes.map(sec => {
          const figs = filtrarFigs(sec.figurinhas)
          if (figs.length === 0) return null
          const color = SECTION_COLOR[sec.classificacao] ?? '#555'
          const tenhoNaSecao = sec.figurinhas.filter(f => f.quantidade >= 1).length

          return (
            <div key={sec.classificacao} style={{ marginBottom: 36 }}>
              {/* Cabeçalho da seção */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: `2px solid ${color}`,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 900, letterSpacing: 3,
                  textTransform: 'uppercase', color,
                }}>
                  {sec.classificacao}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
                  {tenhoNaSecao} / {sec.figurinhas.length}
                </div>
              </div>

              {/* Grid de figurinhas */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: 8,
              }}>
                {figs.map((fig, i) => <FigurinhaCard key={fig.id} fig={fig} index={i} />)}
              </div>
            </div>
          )
        })}

        {/* Seção de Prêmios — sempre por último */}
        {premios.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 14, paddingBottom: 10,
              borderBottom: '2px solid #f59e0b',
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#f59e0b' }}>
                Meus Prêmios
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
                {premios.reduce((sum, p) => sum + p.quantidadeEntregue, 0)} / {premios.reduce((sum, p) => sum + p.quantidade, 0)} entregues
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
              {premios.flatMap(p => {
                const isPrata = p.classificacao === 'PREMIO PRATA'
                const cor     = isPrata ? '#94a3b8' : '#f59e0b'
                const bgCor   = isPrata ? '#1e293b' : '#78350f'
                return Array.from({ length: p.quantidade }, (_, i) => {
                  const entregue = i < p.quantidadeEntregue
                  return (
                    <div key={`${p.id}-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden', border: `2px solid ${cor}`, boxShadow: `0 0 14px ${isPrata ? 'rgba(148,163,184,0.35)' : 'rgba(245,158,11,0.45)'}`, background: bgCor }}>
                        {p.imagemUrl
                          ? <img src={p.imagemUrl} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{isPrata ? '🥈' : '🥇'}</div>
                        }
                        {entregue ? (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(74,222,128,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#000', boxShadow: '0 0 16px rgba(74,222,128,0.7)' }}>✓</div>
                          </div>
                        ) : (
                          <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(251,191,36,0.9)', borderRadius: 4, fontSize: 7, fontWeight: 900, color: '#000', padding: '2px 5px', letterSpacing: 0.5, textTransform: 'uppercase' }}>Pendente</div>
                        )}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: cor, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>{isPrata ? '🥈 Prata' : '🥇 Ouro'}</div>
                    </div>
                  )
                })
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
