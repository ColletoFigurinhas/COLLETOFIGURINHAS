'use client'

import { useEffect, useRef, useState, useMemo, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from '@prisma/client'
import type { SectionData } from '@/app/album/page'
import InventarioModal from '@/components/InventarioModal'
import TrocasModal from '@/components/TrocasModal'
import PacoteAbertura from '@/components/PacoteAbertura'
import FigurinhaPreview from '@/components/FigurinhaPreview'
import { logout } from '@/app/actions/auth'

// ── Toast ─────────────────────────────────────────────────────────
type ToastType = 'pacote' | 'troca_recebida' | 'troca_aceita' | 'troca_recusada' | 'troca_cancelada'
type Toast = { id: number; type: ToastType; message: string }

const TOAST_CFG: Record<ToastType, { icon: string; bg: string; border: string }> = {
  pacote:          { icon: '🎴', bg: 'linear-gradient(135deg,#b45309,#92400e)', border: '#f59e0b' },
  troca_recebida:  { icon: '🔄', bg: 'linear-gradient(135deg,#1d4ed8,#1e3a8a)', border: '#60a5fa' },
  troca_aceita:    { icon: '✅', bg: 'linear-gradient(135deg,#15803d,#14532d)', border: '#4ade80' },
  troca_recusada:  { icon: '❌', bg: 'linear-gradient(135deg,#b91c1c,#7f1d1d)', border: '#f87171' },
  troca_cancelada: { icon: '↩️', bg: 'linear-gradient(135deg,#374151,#1f2937)', border: '#9ca3af' },
}

function ToastList({ toasts, onRemove, onNavigate }: {
  toasts: Toast[]
  onRemove: (id: number) => void
  onNavigate: (type: ToastType) => void
}) {
  return (
    <div className="toast-list" style={{
      position: 'fixed', bottom: 72, right: 16,
      zIndex: 3000, display: 'flex', flexDirection: 'column-reverse', gap: 8,
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes toast-in { from { opacity:0; transform:translateX(60px) scale(0.9) } to { opacity:1; transform:translateX(0) scale(1) } }
      `}</style>
      {toasts.map(t => {
        const cfg = TOAST_CFG[t.type]
        return (
          <div
            key={t.id}
            onClick={() => { onNavigate(t.type); onRemove(t.id) }}
            style={{
              pointerEvents: 'all',
              display: 'flex', alignItems: 'center', gap: 10,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: 12, padding: '12px 14px',
              boxShadow: `0 6px 24px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.border}22`,
              maxWidth: 300, minWidth: 220,
              animation: 'toast-in 0.3s cubic-bezier(0.2,0.8,0.2,1)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{cfg.icon}</span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
              {t.message}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onRemove(t.id) }}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                color: '#fff', width: 22, height: 22, fontSize: 12,
                cursor: 'pointer', flexShrink: 0, lineHeight: 1,
              }}
            >×</button>
          </div>
        )
      })}
    </div>
  )
}

// ── Constantes ────────────────────────────────────────────────────
// PAGE_W = 4×123 + 2×10(padding) + 3×6(gap) = 530
// PAGE_H = cabeçalho(80) + gestor(188) + gap(10) + grid(576) + margem(20) = 874
const PAGE_W   = 530
const PAGE_H   = 874
const PER_PAGE = 12
const COLS     = 4

// Dimensões das figurinhas (123×188px) — FIG_W=124 para rowH bater exato com o fundo
const FIG_W = 124
const FIG_H = 188

// Medidos pixel a pixel no PNG do designer (530×874):
//   col1 x=13..136 (124px), gap≈3px, grid top=258
//   gestor x=393..516 (124px), y=21..257 (237px)
const GRID_TOP     = 258
const GESTOR_TOP   = 21
const GESTOR_RIGHT = 13
const GESTOR_H     = 237

// Páginas por seção — chaves correspondem exatamente ao campo classificacao no banco
const SECTION_PAGES: Record<string, { gestor: string; normal: string }> = {
  'COMERCIAL':                  { gestor: '/album/page-02.png', normal: '/album/page-03.png' },
  'ALMOXARIFADO':               { gestor: '/album/page-04.png', normal: '/album/page-05.png' },
  'GARANTIA DA QUALIDADE':      { gestor: '/album/page-06.png', normal: '/album/page-07.png' },
  'MARKETING / TI':             { gestor: '/album/page-08.png', normal: '/album/page-09.png' },
  'FINANCEIRO':                 { gestor: '/album/page-10.png', normal: '/album/page-11.png' },
  'COMPRAS':                    { gestor: '/album/page-12.png', normal: '/album/page-13.png' },
  'RH / SERVIÇOS GERAIS':       { gestor: '/album/page-14.png', normal: '/album/page-15.png' },
  'ESPECIAIS':                  { gestor: '/album/page-16.png', normal: '/album/page-16.png' },
}

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

// ── Cores alternadas (xadrez 4 colunas) ──────────────────────────
function corXadrez(globalIndex: number): 'VERDE' | 'AMARELO' {
  const row = Math.floor(globalIndex / COLS)
  const col = globalIndex % COLS
  return (row + col) % 2 === 0 ? 'VERDE' : 'AMARELO'
}
function urlComCor(url: string, cor: 'VERDE' | 'AMARELO'): string {
  const baseName = (url.split('/').pop() ?? '').replace(/\.[^.]+$/, '')
  return `/figuras/${cor}/${baseName}.png`
}

// ── Helpers ───────────────────────────────────────────────────────
function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
function isPageVisible(cur: number, target: number, portrait: boolean, total: number) {
  if (portrait) return cur === target
  if (cur === 0) return target === 0
  if (cur === total - 1) return target === total - 1
  return target === cur || target === cur + 1
}

// ── Grid de figurinhas ────────────────────────────────────────────
type Slot = { id: number; imagemUrl: string | null; tipo?: string }

function StickerGrid({ figs, top, color, maxSlots = PER_PAGE, onPreview }: {
  figs: Slot[]; top: number; color: string; maxSlots?: number
  onPreview?: (f: { id: number; imagemUrl: string; classificacao: string }) => void
}) {
  const padSide = 13
  const gap     = 3
  const colW    = (PAGE_W - padSide * 2 - gap * (COLS - 1)) / COLS
  const rowH    = Math.round(colW * FIG_H / FIG_W)

  const slots: Slot[] = [...figs]
  while (slots.length < maxSlots) slots.push({ id: -(slots.length + 1), imagemUrl: null })

  return (
    <div style={{
      position: 'absolute',
      top, left: padSide, right: padSide,
      display: 'grid',
      gridTemplateColumns: `repeat(${COLS}, ${colW}px)`,
      gridAutoRows: `${rowH}px`,
      gap,
    }}>
      {slots.map((f, i) => {
        const cor        = f.tipo === 'FUNCIONARIO' ? corXadrez(i) : null
        const displayUrl = f.imagemUrl && cor ? urlComCor(f.imagemUrl, cor) : f.imagemUrl
        return (
          <div key={f.id}
            data-figurinha={f.imagemUrl ? 'true' : undefined}
            onClick={e => { if (f.imagemUrl && onPreview) { e.stopPropagation(); onPreview({ id: f.id, imagemUrl: displayUrl ?? f.imagemUrl, classificacao: (f as any).classificacao ?? '' }) } }}
            style={{
              borderRadius: 10, overflow: 'hidden',
              background: f.imagemUrl ? '#fff' : 'rgba(0,0,0,0.06)',
              border: f.imagemUrl ? 'none' : '1px dashed rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              cursor: f.imagemUrl && onPreview ? 'zoom-in' : 'default',
            }}>
            {f.imagemUrl ? (
              <img
                src={displayUrl ?? f.imagemUrl}
                onError={e => { (e.currentTarget as HTMLImageElement).src = f.imagemUrl! }}
                alt="" draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              f.id > 0 && (
                <span style={{ fontSize: 9, color: 'rgba(0,0,0,0.2)', fontWeight: 700, letterSpacing: 0.5 }}>
                  {f.id}
                </span>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Página de seção ───────────────────────────────────────────────
// isGestorPage = true → usa fundo de gestor (aparece só 1x por seção)
// isGestorPage = false → usa fundo normal (pode repetir)
function SectionPage({ section, figs, isGestorPage, onPreview }: {
  section: string
  figs: Slot[]
  isGestorPage: boolean
  onPreview?: (f: { id: number; imagemUrl: string; classificacao: string }) => void
}) {
  const pages   = SECTION_PAGES[section]
  const bg      = pages ? (isGestorPage ? pages.gestor : pages.normal) : ''
  const color   = SECTION_COLOR[section] ?? '#555'

  const gestor   = isGestorPage ? figs.find(f => f.tipo === 'GESTOR') : null
  const normFigs = isGestorPage ? figs.filter(f => f.tipo !== 'GESTOR') : figs

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {bg && (
        <img src={bg} alt="" draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}

      {/* Gestor — 123×188 centrado no slot branco (x=362..529, y=0..239) */}
      {gestor && gestor.imagemUrl && (
        <div
          onClick={e => { e.stopPropagation(); onPreview?.({ id: gestor.id, imagemUrl: gestor.imagemUrl!, classificacao: section }) }}
          style={{
            position: 'absolute',
            top: 26, right: 6,
            width: 123, height: 188,
            borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            cursor: onPreview ? 'zoom-in' : 'default',
          }}>
          <img src={gestor.imagemUrl} alt="" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Grid sempre em y=278, sempre 12 slots (4×3) */}
      <StickerGrid
        figs={normFigs}
        top={GRID_TOP}
        color={color}
        maxSlots={12}
        onPreview={onPreview}
      />
    </div>
  )
}

// ── Página de imagem inteira (capa / intro) ───────────────────────
function FullImagePage({ src }: { src: string }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <img src={src} alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
}

// ── Contracapa ────────────────────────────────────────────────────
function BackCoverPage() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(155deg, #d96010 0%, #b04a08 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(45deg,rgba(0,0,0,0.03) 0,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 16px)' }} />
      <div style={{ fontSize: 64, marginBottom: 14, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.35))' }}>🏆</div>
      <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 4, color: 'rgba(255,255,255,0.92)', textTransform: 'uppercase', textAlign: 'center' }}>
        Super Copa 2026
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
        Álbum Oficial Supermédica
      </div>
    </div>
  )
}

// ── Filmstrip ─────────────────────────────────────────────────────
function Filmstrip({ pages, current, onGo }: {
  pages: React.ReactNode[]; current: number; onGo: (i: number) => void
}) {
  const stripRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const el = itemRefs.current[current]
    if (el && stripRef.current) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [current])

  const TH_W   = 56
  const TH_H   = Math.round(TH_W * PAGE_H / PAGE_W)
  const pgScale = TH_W / PAGE_W

  return (
    <div ref={stripRef} style={{
      position: 'fixed', left: 0, top: 44, bottom: 0,
      width: 72, zIndex: 500,
      background: 'rgba(10,10,18,0.92)', backdropFilter: 'blur(8px)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      overflowY: 'auto', overflowX: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '8px 0 16px',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255,255,255,0.1) transparent',
    }}>
      {pages.map((page, i) => {
        const active = i === current || i === current + 1
        return (
          <div
            key={i}
            ref={el => { itemRefs.current[i] = el }}
            onClick={() => onGo(i)}
            style={{
              width: TH_W, height: TH_H, flexShrink: 0,
              borderRadius: 5, overflow: 'hidden', cursor: 'pointer',
              position: 'relative',
              border: active ? '2px solid #f5c800' : '2px solid rgba(255,255,255,0.08)',
              boxShadow: active ? '0 0 10px rgba(245,200,0,0.4)' : 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ''}
          >
            {/* Página real escalada */}
            <div style={{
              width: PAGE_W, height: PAGE_H,
              transform: `scale(${pgScale})`,
              transformOrigin: 'top left',
              pointerEvents: 'none', userSelect: 'none',
            }}>
              {page}
            </div>

            {/* Número + gradiente */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 45%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: 2, left: 0, right: 0,
              textAlign: 'center', fontSize: 7, fontWeight: 900,
              color: active ? '#f5c800' : 'rgba(255,255,255,0.7)',
              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              pointerEvents: 'none',
            }}>
              {i + 1}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Monta array de páginas a partir das seções ────────────────────
function buildPages(sections: SectionData[], onPreview?: (f: { id: number; imagemUrl: string; classificacao: string }) => void) {
  const pages: React.ReactNode[] = []

  pages.push(<FullImagePage key="cover" src="/album/page-01.png" />)

  sections.forEach(sec => {
    const SLOTS = 12

    const gestor   = sec.figurinhas.find(f => f.tipo === 'GESTOR')
    const normFigs = sec.figurinhas.filter(f => f.tipo !== 'GESTOR')

    const gestorPageFigs = normFigs.slice(0, SLOTS)
    pages.push(
      <SectionPage
        key={`${sec.classificacao}-gestor`}
        section={sec.classificacao}
        figs={gestor ? [gestor, ...gestorPageFigs] : gestorPageFigs}
        isGestorPage={true}
        onPreview={onPreview}
      />
    )

    const remaining = normFigs.slice(SLOTS)
    chunks(remaining, SLOTS).forEach((group, idx) => {
      pages.push(
        <SectionPage
          key={`${sec.classificacao}-p${idx}`}
          section={sec.classificacao}
          figs={group}
          isGestorPage={false}
          onPreview={onPreview}
        />
      )
    })
  })

  if (pages.length % 2 === 0)
    pages.push(<FullImagePage key="pad" src="/album/page-16.png" />)

  pages.push(<FullImagePage key="contracapa" src="/album/page-17.png" />)

  return pages
}

// ── Filmstrip mobile (com páginas reais) ──────────────────────────
function MobileFilmstrip({ pages, current, onGo, onClose }: {
  pages: React.ReactNode[]
  current: number
  onGo: (i: number) => void
  onClose: () => void
}) {
  const TH_W   = 62
  const TH_H   = Math.round(TH_W * PAGE_H / PAGE_W)
  const pgScale = TH_W / PAGE_W

  return (
    <>
      {/* Backdrop clicável para fechar */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 498,
          background: 'rgba(0,0,0,0.4)',
        }}
      />

      {/* Painel lateral */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: 78, zIndex: 499,
        background: 'rgba(8,10,18,0.97)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        overflowY: 'auto', overflowX: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 5, padding: '60px 8px 20px',
        scrollbarWidth: 'none',
      }}>
        {pages.map((page, i) => {
          const active = i === current
          return (
            <div
              key={i}
              onClick={() => { onGo(i); onClose() }}
              style={{
                width: TH_W, height: TH_H,
                borderRadius: 4, overflow: 'hidden',
                cursor: 'pointer', flexShrink: 0,
                position: 'relative',
                border: active
                  ? '2px solid #f5c800'
                  : '2px solid rgba(255,255,255,0.07)',
                boxShadow: active ? '0 0 10px rgba(245,200,0,0.45)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              {/* Página real escalada — pointer-events none para não disparar cliques internos */}
              <div style={{
                width: PAGE_W, height: PAGE_H,
                transform: `scale(${pgScale})`,
                transformOrigin: 'top left',
                pointerEvents: 'none',
                userSelect: 'none',
              }}>
                {page}
              </div>

              {/* Número da página */}
              <div style={{
                position: 'absolute', bottom: 1, right: 2,
                fontSize: 6, fontWeight: 900,
                color: active ? '#f5c800' : 'rgba(255,255,255,0.55)',
                textShadow: '0 1px 3px rgba(0,0,0,1)',
                lineHeight: 1,
              }}>
                {i + 1}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────
export default function FlipBook({ sections, nomeUsuario, matricula, role }: { sections: SectionData[]; nomeUsuario?: string; matricula?: string; role?: Role }) {
  const isAdmin = role === 'MARKETING' || role === 'TI' || role === 'ADMIN'
  const router  = useRouter()
  const [logoutPending, startLogout] = useTransition()
  const [, startRefresh] = useTransition()
  const [inventarioKey, setInventarioKey] = useState(0)

  function handleTrocaConcluida() {
    startRefresh(() => router.refresh())      // recarrega dados do server component (album)
    setInventarioKey(k => k + 1)             // força remount do InventarioModal
  }
  const bookRef      = useRef<HTMLDivElement>(null)
  const flipRef      = useRef<any>(null)
  const curRef       = useRef(0)
  const rapidTarget  = useRef(-1)
  const bookState    = useRef('read')
  const mouseDownPos = useRef({ x: 0, y: 0 })

  const [cur,           setCur]          = useState(0)
  const [loading,       setLoading]      = useState(true)
  const [fadeOut,       setFadeOut]      = useState(false)
  const [scale,         setScale]        = useState(1)
  // Componente só existe no cliente (dynamic ssr:false), então window já existe aqui
  const [isPortrait,    setIsPortrait]   = useState(() => window.innerWidth < 600)
  const [inventarioOpen,   setInventarioOpen]   = useState(false)
  const [trocasOpen,       setTrocasOpen]       = useState(false)
  const [trocasBadge,      setTrocasBadge]      = useState(0)
  const [pacotesOpen,      setPacotesOpen]      = useState(false)
  const [pacotesBadge,     setPacotesBadge]     = useState(0)
  const [toasts,           setToasts]           = useState<Toast[]>([])
  const [preview,          setPreview]          = useState<{ id: number; imagemUrl: string; classificacao: string } | null>(null)
  const [filmstripMobile,  setFilmstripMobile]  = useState(false)
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false)

  const toastIdRef       = useRef(0)
  const isFirstPollRef   = useRef(true)
  const prevPacotesRef   = useRef(0)
  const prevReceivedIds  = useRef<number[]>([])
  const prevSentStatuses = useRef<{ id: number; status: string; nome: string }[]>([])

  const totalFigs = sections.reduce((s, sec) => s + sec.figurinhas.length, 0)

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev.slice(-4), { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Polling de badges a cada 10s com notificações de eventos
  useEffect(() => {
    function poll() {
      // ── Pacotes ──
      fetch('/api/pacotes')
        .then(r => r.json())
        .then(data => {
          if (!Array.isArray(data)) return
          const count = data.length
          if (!isFirstPollRef.current && count > prevPacotesRef.current) {
            const n = count - prevPacotesRef.current
            addToast('pacote', `Você recebeu ${n > 1 ? `${n} novos pacotes` : 'um novo pacote'}!`)
          }
          prevPacotesRef.current = count
          setPacotesBadge(count)
        })
        .catch(() => {})

      // ── Trocas ──
      fetch('/api/trocas')
        .then(r => r.json())
        .then(data => {
          const recebidas: any[] = data.recebidas ?? []
          const enviadas:  any[] = data.enviadas  ?? []

          if (!isFirstPollRef.current) {
            // Novas propostas recebidas pendentes
            recebidas
              .filter(t => t.status === 'PENDENTE' && !prevReceivedIds.current.includes(t.id))
              .forEach(t => addToast('troca_recebida', `Nova proposta de ${t.solicitante.nome}!`))

            // Status mudou nas trocas enviadas
            enviadas.forEach(t => {
              const prev = prevSentStatuses.current.find(p => p.id === t.id)
              if (!prev || prev.status !== 'PENDENTE') return
              if (t.status === 'ACEITA')
                addToast('troca_aceita',    `Troca aceita por ${t.destinatario.nome}! ✨`)
              else if (t.status === 'RECUSADA')
                addToast('troca_recusada',  `Troca recusada por ${t.destinatario.nome}.`)
              else if (t.status.startsWith('CANCELADA'))
                addToast('troca_cancelada', `Troca com ${t.destinatario.nome} foi cancelada.`)
            })
          }

          // Atualiza refs
          prevReceivedIds.current  = recebidas.filter(t => t.status === 'PENDENTE').map(t => t.id)
          prevSentStatuses.current = enviadas.map(t => ({ id: t.id, status: t.status, nome: t.destinatario.nome }))
          setTrocasBadge(recebidas.filter(t => t.status === 'PENDENTE').length)

          if (isFirstPollRef.current) isFirstPollRef.current = false
        })
        .catch(() => {})
    }

    poll()
    const interval = setInterval(poll, 10000)
    return () => clearInterval(interval)
  }, [])
  const pages = useMemo(() => buildPages(sections, setPreview), [sections])
  const total     = pages.length
  const progress  = total > 1 ? (cur / (total - 1)) * 100 : 0

  // Escala responsiva
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight - 140
      const portrait = vw < 600
      // O container do livro é sempre PAGE_W*2. Em portrait queremos que
      // UMA página (PAGE_W) caiba na tela; o overflow da segunda é clipado pelo CSS.
      const targetW = portrait ? PAGE_W + 20 : PAGE_W * 2 + 60
      const availW  = portrait ? vw : vw - 72   // desconta filmstrip no desktop
      setScale(Math.max(0.3, Math.min(1, availW / targetW, vh / (PAGE_H + 40))))
      setIsPortrait(portrait)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  // Centralização da página ativa
  const translationX = useMemo(() => {
    if (isPortrait) return 0  // container já é PAGE_W, sem translação necessária
    if (cur === 0) return -PAGE_W / 2
    if (cur === total - 1) return PAGE_W / 2
    return 0
  }, [cur, total, isPortrait])

  // Navegação rápida
  const navRef = useRef((target: number) => {
    const pf = flipRef.current
    if (!pf) return
    const isPort = pf.getOrientation() === 'portrait'
    if (isPageVisible(curRef.current, target, isPort, total)) {
      rapidTarget.current = -1
      try { pf.getSettings().flippingTime = 900 } catch {}
      return
    }
    rapidTarget.current = target
    try { pf.getSettings().flippingTime = 240 } catch {}
    if (bookState.current === 'read')
      target > curRef.current ? pf.flipNext('bottom') : pf.flipPrev('bottom')
  })

  // Init page-flip
  useEffect(() => {
    if (!bookRef.current) return
    let pf: any = null

    const init = async () => {
      try {
        const mod = await import('page-flip')
        const PF: any = (mod as any).PageFlip ?? (mod as any).default?.PageFlip ?? (mod as any).default

        // Interceptor registrado ANTES do page-flip para que dispare primeiro.
        // Quando o mousedown/click é sobre uma figurinha, para a propagação nativa
        // impedindo que o page-flip inicie a animação de dobra da página.
        const stopFlipOnFigurinha = (e: Event) => {
          if ((e.target as HTMLElement)?.closest?.('[data-figurinha]')) {
            e.stopImmediatePropagation()
          }
        }
        bookRef.current!.addEventListener('mousedown', stopFlipOnFigurinha, false)
        bookRef.current!.addEventListener('click',     stopFlipOnFigurinha, false)

        const portrait = window.innerWidth < 600
        pf = new PF(bookRef.current!, {
          width: PAGE_W, height: PAGE_H,
          size: 'fixed', showCover: true,
          usePortrait: portrait,
          drawShadow: true, flippingTime: portrait ? 700 : 900,
          maxShadowOpacity: 0.85,
          // No mobile desabilitamos o drag interno — swipe é feito por nós
          useMouseEvents: !portrait,
          swipeDistance: portrait ? 999999 : 30,
          clickEventForward: true,
          mobileScrollSupport: false, startZIndex: 1,
          // Em portrait o boundsRect.left é negativo, fazendo flipPrev({x:10}) cair
          // no centro do livro e falhar na verificação de corner — desativamos no mobile.
          autoSize: false, disableFlipByClick: !portrait,
        })

        pf.loadFromHTML(bookRef.current!.querySelectorAll('[data-pb-page]'))

        pf.on('flip', (e: any) => {
          const p = typeof e.data === 'number' ? e.data : 0
          setCur(p); curRef.current = p
        })

        pf.on('changeState', (e: any) => {
          const state = e.data
          const page  = pf.getCurrentPageIndex()
          setCur(page); curRef.current = page; bookState.current = state

          if (state === 'user_fold' || state === 'fold_corner') {
            if (rapidTarget.current >= 0) {
              rapidTarget.current = -1
              try { pf.getSettings().flippingTime = 900 } catch {}
            }
          }

          if (state === 'read') {
            const t = rapidTarget.current
            if (t < 0) return
            const isPort = pf.getOrientation() === 'portrait'
            if (isPageVisible(page, t, isPort, total)) {
              rapidTarget.current = -1
              try { pf.getSettings().flippingTime = 900 } catch {}
              return
            }
            setTimeout(() => {
              if (rapidTarget.current < 0) return
              t > page ? pf.flipNext('bottom') : pf.flipPrev('bottom')
            }, 0)
          }
        })

        pf.on('init', () => {
          try { const idx = pf.getCurrentPageIndex?.() ?? 0; curRef.current = idx; setCur(idx) } catch {}
          setFadeOut(true)
          setTimeout(() => setLoading(false), 600)
        })

        flipRef.current = pf
      } catch (err) {
        console.error('[FlipBook] init error:', err)
        setFadeOut(true)
        setTimeout(() => setLoading(false), 300)
      }
    }

    const t = setTimeout(init, 150)
    return () => { clearTimeout(t); try { pf?.destroy() } catch {}; flipRef.current = null }
  }, [total, isPortrait]) // eslint-disable-line react-hooks/exhaustive-deps

  const btnDesktop: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
    color: 'rgba(240,192,64,0.9)', background: 'transparent',
    border: '1px solid rgba(240,192,64,0.25)', borderRadius: 8,
    padding: '4px 10px', minHeight: 40, cursor: 'pointer', position: 'relative',
    display: 'flex', alignItems: 'center', gap: 4,
  }
  const badge = (bg: string, color: string): React.CSSProperties => ({
    position: 'absolute', top: -6, right: -6,
    background: bg, color, fontSize: 8, fontWeight: 900,
    borderRadius: 10, padding: '1px 5px', lineHeight: 1.4,
  })

  return (
    <>
      {inventarioOpen && <InventarioModal key={inventarioKey} onClose={() => setInventarioOpen(false)} />}
      {trocasOpen     && <TrocasModal onClose={() => { setTrocasOpen(false); setTrocasBadge(0) }} onTrocaConcluida={handleTrocaConcluida} />}
      {pacotesOpen    && <PacoteAbertura onClose={() => { setPacotesOpen(false); setPacotesBadge(0) }} />}
      <ToastList toasts={toasts} onRemove={removeToast} onNavigate={type => {
        if (type === 'pacote') { setPacotesOpen(true) }
        else { setTrocasOpen(true); setTrocasBadge(0) }
      }} />
      {preview && (
        <FigurinhaPreview
          id={preview.id}
          imagemUrl={preview.imagemUrl}
          classificacao={preview.classificacao}
          onClose={() => setPreview(null)}
        />
      )}
      {!isPortrait && <Filmstrip pages={pages} current={cur} onGo={i => navRef.current(i)} />}
      {isPortrait && filmstripMobile && (
        <MobileFilmstrip
          pages={pages}
          current={cur}
          onGo={i => navRef.current(i)}
          onClose={() => setFilmstripMobile(false)}
        />
      )}

      {loading && (
        <div className={`loading-screen${fadeOut ? ' fade-out' : ''}`}>
          <div className="loading-book">📖</div>
          <div className="loading-label">Carregando Álbum</div>
          <div className="loading-dots"><span /><span /><span /></div>
        </div>
      )}

      <div className="album-scene">
        <header className="album-header">
          {/* ── Esquerda ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isPortrait && (
              <button
                onClick={() => setFilmstripMobile(f => !f)}
                style={{
                  background: filmstripMobile ? 'rgba(245,200,0,0.18)' : 'transparent',
                  border: `1px solid ${filmstripMobile ? 'rgba(245,200,0,0.5)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 7, color: filmstripMobile ? '#f5c800' : 'rgba(255,255,255,0.5)',
                  fontSize: 16, width: 36, height: 36,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
              >▤</button>
            )}
            <div className="album-header-title">⚽ Supermédica · Super Copa 2026</div>
          </div>

          {/* ── Direita: Desktop ── */}
          {!isPortrait && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setPacotesOpen(true)} style={btnDesktop}>
                Pacotes
                {pacotesBadge > 0 && <span style={badge('#f07020','#fff')}>{pacotesBadge}</span>}
              </button>
              <button onClick={() => setInventarioOpen(true)} style={btnDesktop}>Inventário</button>
              <button onClick={() => setTrocasOpen(true)} style={{ ...btnDesktop, position: 'relative' }}>
                Trocas
                {trocasBadge > 0 && <span style={badge('#f0c040','#000')}>{trocasBadge}</span>}
              </button>
              <div className="album-header-badge">
                <div className="album-header-dot" />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nomeUsuario ? nomeUsuario.split(' ').slice(0, 2).join(' ') : `${totalFigs} figurinhas`}
                  </span>
                  {matricula && <span style={{ fontSize: 8, letterSpacing: 1, color: 'rgba(255,255,255,0.25)' }}>#{matricula}</span>}
                </div>
              </div>
              {isAdmin && (
                <a href="/admin" style={{ ...btnDesktop, textDecoration: 'none', color: 'rgba(240,192,64,0.7)', borderColor: 'rgba(240,192,64,0.2)', display: 'flex', alignItems: 'center' }}>
                  Admin
                </a>
              )}
              <button onClick={() => startLogout(() => logout())} disabled={logoutPending} style={{ ...btnDesktop, color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.15)' }}>
                Sair
              </button>
            </div>
          )}

          {/* ── Direita: Mobile — botão menu ── */}
          {isPortrait && (
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              style={{
                position: 'relative',
                background: mobileMenuOpen ? 'rgba(245,200,0,0.15)' : 'transparent',
                border: `1px solid ${mobileMenuOpen ? 'rgba(245,200,0,0.45)' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 8, color: mobileMenuOpen ? '#f5c800' : 'rgba(255,255,255,0.6)',
                width: 40, height: 40, fontSize: 18,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
              {/* Badge total no botão */}
              {(pacotesBadge + trocasBadge) > 0 && !mobileMenuOpen && (
                <span style={{ ...badge('#f07020','#fff'), top: -5, right: -5 }}>
                  {pacotesBadge + trocasBadge}
                </span>
              )}
            </button>
          )}
        </header>

        {/* ── Menu mobile overlay ── */}
        {isPortrait && mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 490, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
            />
            {/* Painel */}
            <div style={{
              position: 'fixed', top: 52, right: 0, bottom: 0,
              width: 240, zIndex: 491,
              background: 'rgba(8,12,22,0.98)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', flexDirection: 'column',
              padding: '16px 0 24px',
              overflowY: 'auto',
            }}>
              {/* Info do usuário */}
              <div style={{ padding: '0 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="album-header-dot" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                      {nomeUsuario ? nomeUsuario.split(' ').slice(0, 2).join(' ') : '—'}
                    </div>
                    {matricula && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginTop: 2 }}>#{matricula}</div>}
                  </div>
                </div>
              </div>

              {/* Itens do menu */}
              {[
                {
                  label: 'Pacotes', icon: '🎴', badge: pacotesBadge,
                  color: '#f5c800', onClick: () => { setPacotesOpen(true); setMobileMenuOpen(false) },
                },
                {
                  label: 'Inventário', icon: '📋', badge: 0,
                  color: '#f5c800', onClick: () => { setInventarioOpen(true); setMobileMenuOpen(false) },
                },
                {
                  label: 'Trocas', icon: '🔄', badge: trocasBadge,
                  color: '#f5c800', onClick: () => { setTrocasOpen(true); setTrocasBadge(0); setMobileMenuOpen(false) },
                },
                ...(isAdmin ? [{
                  label: 'Admin', icon: '⚙️', badge: 0,
                  color: 'rgba(240,192,64,0.7)', onClick: () => { window.location.href = '/admin' },
                }] : []),
              ].map(item => (
                <button key={item.label} onClick={item.onClick} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'transparent', border: 'none',
                  padding: '14px 20px', cursor: 'pointer',
                  position: 'relative', width: '100%', textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                  onTouchStart={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                  onTouchEnd={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: item.color }}>{item.label}</span>
                  {item.badge > 0 && (
                    <span style={{ marginLeft: 'auto', background: '#f07020', color: '#fff', fontSize: 10, fontWeight: 900, borderRadius: 10, padding: '2px 8px' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}

              {/* Separador + Sair */}
              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
                <button
                  onClick={() => startLogout(() => logout())}
                  disabled={logoutPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'transparent', border: 'none',
                    padding: '14px 20px', cursor: 'pointer', width: '100%',
                  }}
                >
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🚪</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>{logoutPending ? 'Saindo…' : 'Sair'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        <div className="book-wrapper">
          <div
            className="book-scale-root"
            style={{
              transform: `scale(${scale}) translateX(${translationX}px)`,
              transition: 'transform 0.5s cubic-bezier(0.2,0.8,0.2,1)',
            }}
            onMouseDown={e => { mouseDownPos.current = { x: e.clientX, y: e.clientY } }}
            onTouchStart={e => { mouseDownPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
            onTouchEnd={e => {
              if (!isPortrait) return
              const pf = flipRef.current
              if (!pf || bookState.current !== 'read') return
              const dx = e.changedTouches[0].clientX - mouseDownPos.current.x
              const dy = Math.abs(e.changedTouches[0].clientY - mouseDownPos.current.y)
              if (Math.abs(dx) < 30 || dy > 60) return
              if (dx < 0) pf.flipNext('bottom')
              else pf.flipPrev('bottom')
            }}
            onClick={e => {
              if (isPortrait) return  // mobile usa swipe/botões
              const pf = flipRef.current
              if (!pf) return
              // Aceita 'read', 'fold_corner' e 'user_fold' — 'flip' (animando) é o único bloqueio
              if (bookState.current === 'flipping') return
              // Ignora se o target é uma figurinha (o interceptor nativo já tratou)
              if ((e.target as HTMLElement)?.closest?.('[data-figurinha]')) return
              const dx = Math.abs(e.clientX - mouseDownPos.current.x)
              const dy = Math.abs(e.clientY - mouseDownPos.current.y)
              if (dx > 8 || dy > 8) return
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              const relX = (e.clientX - rect.left) / rect.width
              if (relX < 0.5) pf.flipPrev('bottom')
              else pf.flipNext('bottom')
            }}
          >
            <div ref={bookRef} style={{ width: isPortrait ? PAGE_W : PAGE_W * 2, height: PAGE_H }}>
              {pages.map((content, i) => (
                <div key={i} data-pb-page=""
                  data-density={i === 0 || i === total - 1 ? 'hard' : 'soft'}
                  style={{ width: PAGE_W, height: PAGE_H }}>
                  <div className="page-inner">{content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="album-controls">
          <button className="ctrl-btn ctrl-btn-sm" onClick={() => navRef.current(0)} title="Início">⏮</button>
          <button className="ctrl-btn" onClick={() => flipRef.current?.flipPrev('top')} disabled={cur === 0}>◀</button>
          <span className="page-counter">{cur + 1} / {total}</span>
          <button className="ctrl-btn" onClick={() => flipRef.current?.flipNext('top')} disabled={cur >= total - 1}>▶</button>
          <button className="ctrl-btn ctrl-btn-sm" onClick={() => navRef.current(total - 1)} title="Fim">⏭</button>
        </div>
      </div>
    </>
  )
}
