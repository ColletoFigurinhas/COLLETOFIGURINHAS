'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'

type Figurinha = { id: number; classificacao: string; tipo: string; imagemUrl: string | null }
type Pacote    = { id: number; tipo: 'PADRAO' | 'PLUS' | 'PREMIUM'; dataReferencia: string }
type Tier      = 'padrao' | 'gestor' | 'especial' | 'premio'

const PACK_IMG: Record<string, string> = {
  PADRAO:  '/pacotes/pacote-normal.png',
  PLUS:    '/pacotes/pacote-prateado.png',
  PREMIUM: '/pacotes/pacote-dourado.png',
}

const PACK_VERSO: Record<string, { bg: string; emoji: string; h: number; color: string; glow1: string; glow2: string }> = {
  PADRAO:  { bg: 'linear-gradient(135deg,#1e3a6e,#0f1e3a)', emoji: '⚽', h: 3, color: 'rgba(180,215,255,1)', glow1: 'rgba(150,195,255,0.95)', glow2: 'rgba(100,160,255,0.5)' },
  PLUS:    { bg: 'linear-gradient(135deg,#3a3f50,#1c2030)', emoji: '🌟', h: 4, color: 'rgba(235,245,255,1)', glow1: 'rgba(210,230,255,0.98)', glow2: 'rgba(170,200,240,0.6)' },
  PREMIUM: { bg: 'linear-gradient(135deg,#6a4200,#3a2400)', emoji: '🏆', h: 5, color: 'rgba(255,225,60,1)',  glow1: 'rgba(255,205,0,1)',      glow2: 'rgba(255,140,0,0.7)' },
}

const TIER: Record<Tier, {
  colors: string[]; primary: string; glow: string
  label: string; labelColor: string
  rings: number; particles: number
  border: string; shadow: string
  bgGlow: string; entrance: string
}> = {
  padrao: {
    colors: ['#93c5fd','#60a5fa','#dbeafe'],
    primary: '#3b82f6', glow: 'rgba(59,130,246,0.7)',
    label: '', labelColor: '#93c5fd',
    rings: 1, particles: 10,
    border: '1.5px solid rgba(147,197,253,0.6)',
    shadow: '0 0 28px rgba(59,130,246,0.55), 0 16px 50px rgba(0,0,0,0.85)',
    bgGlow: 'rgba(59,130,246,0.1)', entrance: 'enter-slide',
  },
  gestor: {
    colors: ['#fde68a','#fbbf24','#f59e0b','#fff'],
    primary: '#f59e0b', glow: 'rgba(245,158,11,0.9)',
    label: '★  GESTOR', labelColor: '#fde68a',
    rings: 2, particles: 18,
    border: '2px solid #f59e0b',
    shadow: '0 0 45px rgba(245,158,11,0.8), 0 0 90px rgba(245,158,11,0.3), 0 20px 60px rgba(0,0,0,0.9)',
    bgGlow: 'rgba(245,158,11,0.18)', entrance: 'enter-bounce',
  },
  especial: {
    colors: ['#c084fc','#f472b6','#60a5fa','#34d399','#fbbf24'],
    primary: '#a855f7', glow: 'rgba(168,85,247,0.95)',
    label: '✦  ESPECIAL', labelColor: '#e9d5ff',
    rings: 3, particles: 24,
    border: '2px solid #a855f7',
    shadow: '0 0 55px rgba(168,85,247,0.85), 0 0 110px rgba(168,85,247,0.3), 0 24px 70px rgba(0,0,0,0.9)',
    bgGlow: 'rgba(168,85,247,0.2)', entrance: 'enter-zoom',
  },
  premio: {
    colors: ['#fb923c','#fbbf24','#ef4444','#fff','#fed7aa'],
    primary: '#f97316', glow: 'rgba(249,115,22,1)',
    label: '🏆  PRÊMIO', labelColor: '#fed7aa',
    rings: 4, particles: 36,
    border: '2px solid #f97316',
    shadow: '0 0 65px rgba(249,115,22,0.95), 0 0 130px rgba(249,115,22,0.4), 0 28px 80px rgba(0,0,0,0.95)',
    bgGlow: 'rgba(249,115,22,0.25)', entrance: 'enter-slam',
  },
}

function getTier(f: Figurinha): Tier {
  if (f.tipo === 'PREMIO')   return 'premio'
  if (f.tipo === 'ESPECIAL') return 'especial'
  if (f.tipo === 'GESTOR')   return 'gestor'
  return 'padrao'
}

// ── CSS de animações ──────────────────────────────────────────────
const ANIM_CSS = `
  /* Entradas por tier */
  @keyframes enter-slide  { from{transform:translateX(110px) scale(0.88);opacity:0} 60%{transform:translateX(-8px) scale(1.04)} to{transform:translateX(0) scale(1);opacity:1} }
  @keyframes enter-bounce { from{transform:translateY(-140px) scale(0.75) rotate(-4deg);opacity:0} 55%{transform:translateY(12px) scale(1.07) rotate(1deg)} 75%{transform:translateY(-5px) scale(0.97)} to{transform:translateY(0) scale(1) rotate(0deg);opacity:1} }
  @keyframes enter-zoom   { from{transform:scale(0.1) rotate(-8deg);opacity:0} 55%{transform:scale(1.1) rotate(2deg)} 75%{transform:scale(0.96)} to{transform:scale(1) rotate(0deg);opacity:1} }
  @keyframes enter-slam   { from{transform:translateY(-380px) scale(0.6) rotate(6deg);opacity:0} 50%{transform:translateY(18px) scale(1.12) rotate(-1deg);opacity:1} 68%{transform:translateY(-7px) scale(0.95)} 84%{transform:translateY(4px) scale(1.03)} to{transform:translateY(0) scale(1) rotate(0deg);opacity:1} }
  /* Saída universal */
  @keyframes card-exit    { from{transform:translateX(0) scale(1);opacity:1} to{transform:translateX(-100px) scale(0.82);opacity:0} }
  /* Efeitos */
  @keyframes ring-out-1   { from{transform:translate(-50%,-50%) scale(0.3);opacity:1} to{transform:translate(-50%,-50%) scale(2.8);opacity:0} }
  @keyframes ring-out-2   { from{transform:translate(-50%,-50%) scale(0.3);opacity:1} to{transform:translate(-50%,-50%) scale(3.6);opacity:0} }
  @keyframes ring-out-3   { from{transform:translate(-50%,-50%) scale(0.3);opacity:1} to{transform:translate(-50%,-50%) scale(4.4);opacity:0} }
  @keyframes ring-out-4   { from{transform:translate(-50%,-50%) scale(0.3);opacity:1} to{transform:translate(-50%,-50%) scale(5.2);opacity:0} }
  @keyframes p-fly        { from{transform:translate(-50%,-50%) rotate(var(--a)) translateX(4px) scale(1);opacity:1} to{transform:translate(-50%,-50%) rotate(var(--a)) translateX(var(--d)) scale(0);opacity:0} }
  @keyframes rays-spin    { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
  @keyframes star-orbit   { from{transform:rotate(var(--s)) translateX(var(--r)) rotate(calc(-1 * var(--s)))} to{transform:rotate(calc(var(--s) + 360deg)) translateX(var(--r)) rotate(calc(-1 * var(--s) - 360deg))} }
  @keyframes aura-idle    { 0%,100%{transform:translate(-50%,-50%) scale(0.93);opacity:0.5} 50%{transform:translate(-50%,-50%) scale(1.1);opacity:1} }
  @keyframes bg-flash     { 0%{opacity:0} 12%{opacity:1} 100%{opacity:0} }
  @keyframes confetti-drop{ from{transform:translateY(-20px) rotate(var(--r));opacity:1} 85%{opacity:1} to{transform:translateY(110vh) rotate(calc(var(--r)+600deg));opacity:0} }
  @keyframes shake        { 0%,100%{transform:translate(0,0)} 12%{transform:translate(-6px,-4px)} 25%{transform:translate(6px,4px)} 37%{transform:translate(-6px,4px)} 50%{transform:translate(5px,-3px)} 62%{transform:translate(-3px,2px)} 75%{transform:translate(3px,-2px)} }
  @keyframes label-in     { from{transform:translateY(-20px) scale(0.7);opacity:0} 65%{transform:translateY(3px) scale(1.06)} to{transform:translateY(0) scale(1);opacity:1} }
  @keyframes hue-cycle    { from{filter:hue-rotate(0deg) brightness(1.4)} to{filter:hue-rotate(360deg) brightness(1.4)} }
  @keyframes rainbow-border{ 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
  /* Pack */
  @keyframes pack-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
  @keyframes pack-top-fly { to{transform:translateY(-380px) rotate(-22deg);opacity:0} }
  @keyframes pack-bot-drop{ to{transform:translateY(200px);opacity:0} }
  @keyframes dot-glow     { 0%,100%{opacity:0.4} 50%{opacity:1} }
  @keyframes gold-burst   { from{transform:translate(-50%,-50%) scale(0);opacity:1} to{transform:translate(-50%,-50%) scale(14);opacity:0} }
  @keyframes hint-slide   { 0%,100%{opacity:0.25;transform:translateX(0)} 50%{opacity:0.7;transform:translateX(6px)} }
  @keyframes counter-in   { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
`

// ── Rings ─────────────────────────────────────────────────────────
function Rings({ tier, tick }: { tier: Tier; tick: number }) {
  const { rings, primary, glow } = TIER[tier]
  return <>
    {Array.from({ length: rings }, (_, i) => (
      <div key={`r${tick}-${i}`} style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 210, height: 290, borderRadius: 14,
        border: `${2.5 - i * 0.4}px solid ${primary}`,
        boxShadow: `0 0 ${14 + i * 10}px ${glow}`,
        animation: `ring-out-${i + 1} ${0.65 + i * 0.1}s ${i * 0.07}s ease-out forwards`,
        pointerEvents: 'none',
      }} />
    ))}
  </>
}

// ── Partículas ────────────────────────────────────────────────────
function Particles({ tier, tick }: { tier: Tier; tick: number }) {
  const { particles, colors } = TIER[tier]
  const items = useMemo(() =>
    Array.from({ length: particles }, (_, i) => ({
      a: (360 / particles) * i + (Math.random() * 28 - 14),
      d: 90 + Math.random() * 130,
      s: 4 + Math.random() * (tier === 'premio' ? 9 : 6),
      delay: Math.random() * 0.14,
      dur: 0.55 + Math.random() * 0.4,
      color: colors[i % colors.length],
      round: Math.random() > 0.35,
    })), // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick])
  return <>
    {items.map((p, i) => (
      <div key={i} style={{
        position: 'absolute', top: '50%', left: '50%',
        width: p.s, height: p.s,
        borderRadius: p.round ? '50%' : 2,
        background: p.color,
        boxShadow: `0 0 ${p.s * 2}px ${p.color}`,
        '--a': `${p.a}deg`, '--d': `${p.d}px`,
        animation: `p-fly ${p.dur}s ${p.delay}s ease-out forwards`,
        pointerEvents: 'none',
      } as any} />
    ))}
  </>
}

// ── Raios ─────────────────────────────────────────────────────────
function Rays({ color, n, speed }: { color: string; n: number; speed: string }) {
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 700, height: 700, animation: `rays-spin ${speed} linear infinite`, pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 2, height: 370, marginLeft: -1, marginTop: -185,
          background: `linear-gradient(to bottom,${color}00,${color}50 40%,${color}00)`,
          transform: `rotate(${(360 / n) * i}deg)`, transformOrigin: 'center',
        }} />
      ))}
    </div>
  )
}

// ── Órbita ────────────────────────────────────────────────────────
function Orbit({ color, n, r, speed }: { color: string; n: number; r: number; speed: number }) {
  return <>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 8, height: 8, marginLeft: -4, marginTop: -4,
        borderRadius: '50%', background: color,
        boxShadow: `0 0 10px ${color}, 0 0 22px ${color}`,
        '--s': `${(360 / n) * i}deg`, '--r': `${r}px`,
        animation: `star-orbit ${speed + i * 0.25}s ${i * 0.08}s linear infinite`,
        pointerEvents: 'none',
      } as any} />
    ))}
  </>
}

// ── Confetti ──────────────────────────────────────────────────────
function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 55 }, (_, i) => ({
      x: Math.random() * 100,
      r: Math.random() * 360,
      dur: 1.6 + Math.random() * 1.6,
      del: Math.random() * 0.7,
      w: 7 + Math.random() * 8,
      h: 4 + Math.random() * 3,
      color: ['#fb923c','#fbbf24','#ef4444','#fff','#fed7aa','#fde68a','#f472b6'][i % 7],
    })), [])
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 2005 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: -24, left: `${p.x}%`,
          width: p.w, height: p.h, borderRadius: 2, background: p.color,
          '--r': `${p.r}deg`,
          animation: `confetti-drop ${p.dur}s ${p.del}s ease-in forwards`,
        } as any} />
      ))}
    </div>
  )
}

// ── Seleção ───────────────────────────────────────────────────────
function SelecaoPacote({ pacotes, onSelect, onClose }: { pacotes: Pacote[]; onSelect: (p: Pacote) => void; onClose: () => void }) {
  const conta = { PADRAO: 0, PLUS: 0, PREMIUM: 0 }
  pacotes.forEach(p => conta[p.tipo]++)
  const tipos = [
    { tipo: 'PADRAO'  as const, label: 'Padrão',   cor: '#aaa',    glow: 'rgba(180,180,180,0.4)' },
    { tipo: 'PLUS'    as const, label: 'Prateado',  cor: '#c8d4e0', glow: 'rgba(190,210,235,0.6)' },
    { tipo: 'PREMIUM' as const, label: 'Dourado',   cor: '#f0c040', glow: 'rgba(240,192,64,0.7)'  },
  ].filter(t => conta[t.tipo] > 0)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#f5c800' }}>Escolha um pacote para abrir</div>
      <div style={{ display: 'flex', gap: 48, alignItems: 'flex-end' }}>
        {tipos.map(t => (
          <div key={t.tipo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.cor }}>{conta[t.tipo]}× {t.label}</div>
            <button onClick={() => onSelect(pacotes.find(p => p.tipo === t.tipo)!)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, filter: `drop-shadow(0 0 24px ${t.glow})`, transition: 'transform 0.25s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1) translateY(-12px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}>
              <img src={PACK_IMG[t.tipo]} alt={t.label} style={{ height: 280, objectFit: 'contain', display: 'block' }} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 2 }}>FECHAR</button>
    </div>
  )
}

// ── Abertura ──────────────────────────────────────────────────────
const CUT_PCT = 12
type Phase = 'idle' | 'dragging' | 'completing' | 'split' | 'done'

function AberturaAnimation({ pacote, onClose }: { pacote: Pacote; onClose: () => void }) {
  const [phase,       setPhase]       = useState<Phase>('idle')
  const [progress,    setProgress]    = useState(0)
  const [dir,         setDir]         = useState<'right' | 'left'>('right')
  const [figurinhas,  setFigurinhas]  = useState<Figurinha[]>([])
  const [idx,         setIdx]         = useState(0)
  const [leaving,     setLeaving]     = useState(false)   // animação de saída
  const [fxTick,      setFxTick]      = useState(0)
  const [showFx,      setShowFx]      = useState(false)
  const [showFlash,   setShowFlash]   = useState(false)
  const [showShake,   setShowShake]   = useState(false)
  const [showConfetti,setShowConfetti]= useState(false)
  const [erro,        setErro]        = useState('')

  const packRef    = useRef<HTMLDivElement>(null)
  const progRef    = useRef(0)
  const dirRef     = useRef<'right' | 'left'>('right')
  const startXRef  = useRef(0)
  const isDragRef  = useRef(false)
  const rafRef     = useRef(0)
  const fetchedRef = useRef(false)
  const pv = PACK_VERSO[pacote.tipo]

  const fig     = figurinhas[idx]
  const tier    = fig ? getTier(fig) : 'padrao'
  const tcfg    = TIER[tier]

  // Dispara FX ao mostrar nova carta
  useEffect(() => {
    if (phase !== 'done' || !fig) return
    const t = getTier(fig)
    setFxTick(v => v + 1)
    setShowFx(true)
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 420)
    if (t === 'premio') {
      setShowShake(true); setShowConfetti(true)
      setTimeout(() => setShowShake(false), 600)
      setTimeout(() => setShowConfetti(false), 3200)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase])

  // Avança para próxima carta
  function avancar() {
    if (leaving) return
    if (idx >= figurinhas.length - 1) { onClose(); return }
    setLeaving(true)
    setShowFx(false)
    setTimeout(() => {
      setIdx(v => v + 1)
      setLeaving(false)
    }, 190)
  }

  // Pack arrastar
  const snapBack = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    const run = () => {
      progRef.current = Math.max(0, progRef.current - 0.04)
      setProgress(progRef.current)
      if (progRef.current > 0) rafRef.current = requestAnimationFrame(run)
      else setPhase('idle')
    }
    rafRef.current = requestAnimationFrame(run)
  }, [])

  const completar = useCallback(async () => {
    setPhase('completing')
    if (fetchedRef.current) return
    fetchedRef.current = true
    const r    = await fetch(`/api/pacotes/${pacote.id}/abrir`, { method: 'POST' })
    const data = await r.json()
    if (!data.ok) { setErro(data.error ?? 'Erro'); setPhase('idle'); fetchedRef.current = false; return }
    setFigurinhas(data.figurinhas)
    setIdx(0)
    setTimeout(() => setPhase('split'), 700)
    setTimeout(() => setPhase('done'),  1450)
  }, [pacote.id])

  const onStart = useCallback((clientX: number) => {
    if (phase !== 'idle' && phase !== 'dragging') return
    cancelAnimationFrame(rafRef.current); isDragRef.current = true
    startXRef.current = clientX - progRef.current * (packRef.current?.getBoundingClientRect().width ?? 220) * (dirRef.current === 'right' ? 1 : -1)
    setPhase('dragging')
  }, [phase])

  const onMove = useCallback((clientX: number) => {
    if (!isDragRef.current) return
    const rect = packRef.current?.getBoundingClientRect(); if (!rect) return
    const dx = clientX - startXRef.current; if (Math.abs(dx) < 6) return
    const d = dx > 0 ? 'right' : 'left'; dirRef.current = d; setDir(d)
    const prog = Math.max(0, Math.min(1, Math.abs(dx) / rect.width))
    progRef.current = prog; setProgress(prog)
    if (prog >= 0.95) { isDragRef.current = false; completar() }
  }, [completar])

  const onEnd = useCallback(() => {
    if (!isDragRef.current) return; isDragRef.current = false
    if (progRef.current >= 0.70) completar()
    else if (progRef.current < 0.05) completar()
    else snapBack()
  }, [completar, snapBack])

  useEffect(() => {
    const mv = (e: MouseEvent) => onMove(e.clientX)
    const mt = (e: TouchEvent) => onMove(e.touches[0].clientX)
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', mt, { passive: true }); window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', mt); window.removeEventListener('touchend', onEnd)
    }
  }, [onMove, onEnd])

  const laserPct = dir === 'right' ? progress * 100 : 100 - progress * 100

  return (
    <>
      <style>{ANIM_CSS}</style>
      {showConfetti && <Confetti />}

      <div style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(14px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        animation: showShake ? 'shake 0.55s ease-out' : 'none',
      }}>

        {/* Flash */}
        {showFlash && (
          <div style={{ position: 'absolute', inset: 0, background: tcfg.bgGlow, animation: 'bg-flash 0.42s ease-out forwards', pointerEvents: 'none', zIndex: 1 }} />
        )}

        {/* Glow de fundo permanente */}
        {phase === 'done' && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${tcfg.bgGlow} 0%, transparent 70%)`, transition: 'background 0.4s' }} />
        )}

        {/* ── Pack ── */}
        {(phase === 'idle' || phase === 'dragging' || phase === 'completing' || phase === 'split') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <div ref={packRef} style={{ position: 'relative', width: 220, cursor: phase === 'idle' ? 'pointer' : 'default', userSelect: 'none', animation: phase === 'idle' ? 'pack-float 3s ease-in-out infinite' : 'none' }}
              onMouseDown={e => onStart(e.clientX)} onTouchStart={e => onStart(e.touches[0].clientX)}>
              <img src={PACK_IMG[pacote.tipo]} alt="" draggable={false} style={{ display: 'block', width: 220, clipPath: phase === 'split' ? `inset(${CUT_PCT}% 0 0 0)` : 'none', animation: phase === 'split' ? 'pack-bot-drop 0.6s ease-in forwards' : 'none' }} />
              {(phase === 'dragging' || phase === 'completing' || phase === 'split') && progress > 0.02 && (
                <img src={PACK_IMG[pacote.tipo]} alt="" draggable={false} style={{ position: 'absolute', top: 0, left: 0, width: 220, clipPath: `inset(0 0 ${100 - CUT_PCT}% 0)`, transform: `translateY(${phase === 'split' ? 0 : -Math.min(2, progress * 4)}px)`, filter: phase === 'split' ? 'none' : `drop-shadow(0 ${Math.min(6, progress * 10)}px ${Math.min(10, progress * 14)}px rgba(0,0,0,0.65))`, animation: phase === 'split' ? 'pack-top-fly 0.6s ease-in forwards' : 'none' }} />
              )}
              {phase === 'idle' && (
                <div style={{ position: 'absolute', top: `${CUT_PCT}%`, left: '6%', right: '6%', height: 2, background: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.65) 0,rgba(255,255,255,0.65) 5px,transparent 5px,transparent 10px)', animation: 'dot-glow 1.4s ease-in-out infinite', pointerEvents: 'none' }} />
              )}
              {(phase === 'dragging' || phase === 'completing') && progress > 0.01 && (
                <>
                  <div style={{ position: 'absolute', top: `${CUT_PCT}%`, left: 0, width: `${laserPct}%`, height: pv.h * 3, background: `linear-gradient(90deg,transparent,${pv.glow2} 80%,${pv.glow1})`, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: `${CUT_PCT}%`, left: `${laserPct}%`, width: 4, height: pv.h, background: pv.color, boxShadow: `0 0 10px 4px ${pv.glow1},0 0 24px 8px ${pv.glow2}`, transform: 'translateX(-50%) translateY(-50%)', pointerEvents: 'none' }} />
                  {pacote.tipo === 'PREMIUM' && phase === 'completing' && (
                    <div style={{ position: 'absolute', top: `${CUT_PCT}%`, left: `${laserPct}%`, width: 30, height: 30, borderRadius: '50%', background: `radial-gradient(circle,${pv.color},transparent)`, animation: 'gold-burst 0.7s ease-out forwards', pointerEvents: 'none' }} />
                  )}
                </>
              )}
            </div>
            {phase === 'idle' && <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', animation: 'hint-slide 1.8s ease-in-out infinite' }}>Clique ou arraste para abrir</div>}
          </div>
        )}

        {/* ── Reveal ── */}
        {phase === 'done' && fig && (
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}
            onClick={avancar}>

            {/* Raios */}
            {(tier === 'gestor' || tier === 'especial' || tier === 'premio') && (
              <Rays color={tcfg.primary} n={tier === 'premio' ? 22 : 14} speed={tier === 'premio' ? '3.5s' : '6s'} />
            )}
            {(tier === 'especial' || tier === 'premio') && (
              <Rays color={tcfg.colors[2]} n={10} speed={tier === 'especial' ? '9s' : '5s'} />
            )}

            {/* Aura */}
            {tier !== 'padrao' && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: 260, height: 340, borderRadius: 18, background: `radial-gradient(ellipse,${tcfg.glow} 0%,transparent 70%)`, filter: 'blur(10px)', animation: 'aura-idle 1.5s ease-in-out infinite', pointerEvents: 'none' }} />
            )}

            {/* Órbitas */}
            {tier === 'gestor'  && <Orbit color="#fde68a" n={5} r={155} speed={2.8} />}
            {tier === 'especial' && <><Orbit color="#c084fc" n={7} r={165} speed={2.5} /><Orbit color="#34d399" n={4} r={195} speed={3.5} /></>}
            {tier === 'premio'  && <><Orbit color="#fb923c" n={9} r={175} speed={2} /><Orbit color="#fff" n={5} r={210} speed={3.2} /></>}

            {/* Partículas e rings ao aparecer */}
            {showFx && <Rings tier={tier} tick={fxTick} />}
            {showFx && <Particles tier={tier} tick={fxTick} />}

            {/* ── CARTA (sem flip — imagem direta) ── */}
            <div
              key={`card-${idx}`}
              style={{
                width: 188, height: 262, borderRadius: 14,
                overflow: 'hidden', position: 'relative', zIndex: 10,
                border: tcfg.border, boxShadow: tcfg.shadow,
                cursor: 'pointer',
                animation: leaving
                  ? 'card-exit 0.19s ease-in forwards'
                  : `${tcfg.entrance} 0.6s cubic-bezier(0.2,0.8,0.2,1)`,
                ...(tier === 'especial' ? {
                  border: 'none',
                  backgroundImage: 'linear-gradient(#0a0a0a,#0a0a0a), linear-gradient(90deg,#c084fc,#f472b6,#fbbf24,#34d399,#60a5fa,#c084fc)',
                  backgroundOrigin: 'border-box', backgroundClip: 'padding-box,border-box',
                  outline: '2px solid transparent',
                } : {}),
              }}
            >
              {/* Borda rainbow animada para especial */}
              {tier === 'especial' && (
                <div style={{ position: 'absolute', inset: -2, zIndex: -1, borderRadius: 16, background: 'linear-gradient(90deg,#c084fc,#f472b6,#fbbf24,#34d399,#60a5fa,#c084fc)', backgroundSize: '300% 100%', animation: 'rainbow-border 2.5s linear infinite' }} />
              )}

              {fig.imagemUrl
                ? <img src={fig.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                : <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🃏</div>
              }
            </div>

            {/* Label de raridade */}
            {tcfg.label && (
              <div key={`lbl-${idx}`} style={{
                marginTop: 12, fontSize: tier === 'premio' ? 14 : 11,
                fontWeight: 900, letterSpacing: 4.5, textTransform: 'uppercase',
                color: tcfg.labelColor, textShadow: `0 0 18px ${tcfg.glow}, 0 0 40px ${tcfg.glow}`,
                animation: `label-in 0.45s cubic-bezier(0.2,0.8,0.2,1)${tier === 'especial' ? ', hue-cycle 3s linear infinite' : ''}`,
              }}>
                {tcfg.label}
              </div>
            )}

            {/* Contador */}
            <div key={`cnt-${idx}`} style={{
              marginTop: tcfg.label ? 8 : 14,
              fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
              color: tier === 'padrao' ? 'rgba(255,255,255,0.45)' : tcfg.labelColor,
              textShadow: tier !== 'padrao' ? `0 0 10px ${tcfg.glow}` : 'none',
              animation: 'counter-in 0.3s ease-out',
              cursor: 'pointer',
            }}>
              {idx < figurinhas.length - 1 ? `${idx + 1} / ${figurinhas.length}  →` : `${idx + 1} / ${figurinhas.length}  ✓`}
            </div>
          </div>
        )}

        {erro && <div style={{ color: '#f87171', fontSize: 12, marginTop: 16 }}>{erro}</div>}
      </div>
    </>
  )
}

// ── Principal ─────────────────────────────────────────────────────
export default function PacoteAbertura({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [pacotes,  setPacotes]  = useState<Pacote[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Pacote | null>(null)

  useEffect(() => {
    fetch('/api/pacotes').then(r => r.json())
      .then(d => { setPacotes(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleClose = useCallback(() => { onClose(); router.refresh() }, [onClose, router])

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
      Carregando…
    </div>
  )
  if (selected) return <AberturaAnimation pacote={selected} onClose={handleClose} />
  if (!pacotes.length) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>📦</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Nenhum pacote disponível</div>
      <button onClick={onClose} style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 2, marginTop: 8 }}>FECHAR</button>
    </div>
  )
  return <SelecaoPacote pacotes={pacotes} onSelect={setSelected} onClose={onClose} />
}
