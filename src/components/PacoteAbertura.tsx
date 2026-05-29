'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Figurinha = { id: number; classificacao: string; imagemUrl: string | null }
type Pacote    = { id: number; tipo: 'PADRAO' | 'PLUS' | 'PREMIUM'; dataReferencia: string }

const PACK_IMG: Record<string, string> = {
  PADRAO:  '/pacotes/pacote-normal.png',
  PLUS:    '/pacotes/pacote-prateado.png',
  PREMIUM: '/pacotes/pacote-dourado.png',
}

const CUT_PCT = 12

const TIPO_CFG = {
  PADRAO:  { color:'rgba(180,215,255,1)', glow1:'rgba(150,195,255,0.95)', glow2:'rgba(100,160,255,0.5)', h:3, versoColor:'linear-gradient(135deg,#1e3a6e,#0f1e3a)', versoEmoji:'⚽', cardGlow:'' },
  PLUS:    { color:'rgba(235,245,255,1)', glow1:'rgba(210,230,255,0.98)', glow2:'rgba(170,200,240,0.6)', h:4, versoColor:'linear-gradient(135deg,#3a3f50,#1c2030)', versoEmoji:'🌟', cardGlow:'0 0 14px rgba(200,215,240,0.4)' },
  PREMIUM: { color:'rgba(255,225,60,1)',  glow1:'rgba(255,205,0,1)',      glow2:'rgba(255,140,0,0.7)',   h:5, versoColor:'linear-gradient(135deg,#6a4200,#3a2400)', versoEmoji:'🏆', cardGlow:'0 0 20px rgba(255,200,0,0.5)' },
}

// ── Seleção ───────────────────────────────────────────────────────
function SelecaoPacote({ pacotes, onSelect, onClose }: { pacotes:Pacote[]; onSelect:(p:Pacote)=>void; onClose:()=>void }) {
  const conta = { PADRAO:0, PLUS:0, PREMIUM:0 }
  pacotes.forEach(p => conta[p.tipo]++)
  const tipos = [
    { tipo:'PADRAO'  as const, label:'Padrão',  cor:'#aaa',    glow:'rgba(180,180,180,0.4)' },
    { tipo:'PLUS'    as const, label:'Prateado', cor:'#c8d4e0', glow:'rgba(190,210,235,0.6)' },
    { tipo:'PREMIUM' as const, label:'Dourado',  cor:'#f0c040', glow:'rgba(240,192,64,0.7)'  },
  ].filter(t => conta[t.tipo] > 0)
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(10px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:40 }}>
      <div style={{ fontSize:11, fontWeight:900, letterSpacing:5, textTransform:'uppercase', color:'#f5c800' }}>Escolha um pacote para abrir</div>
      <div style={{ display:'flex', gap:48, alignItems:'flex-end' }}>
        {tipos.map(t => (
          <div key={t.tipo} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:t.cor }}>{conta[t.tipo]}× {t.label}</div>
            <button onClick={() => onSelect(pacotes.find(p=>p.tipo===t.tipo)!)}
              style={{ background:'none', border:'none', cursor:'pointer', padding:0, filter:`drop-shadow(0 0 24px ${t.glow})`, transition:'transform 0.25s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='scale(1.1) translateY(-12px)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform=''}}>
              <img src={PACK_IMG[t.tipo]} alt={t.label} style={{ height:280, objectFit:'contain', display:'block' }}/>
            </button>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ fontSize:10, color:'rgba(255,255,255,0.25)', background:'none', border:'none', cursor:'pointer', letterSpacing:2 }}>FECHAR</button>
    </div>
  )
}

// ── Abertura com arrastar ─────────────────────────────────────────
type Phase = 'idle' | 'dragging' | 'completing' | 'split' | 'burst' | 'grid' | 'done'

function AberturaAnimation({ pacote, onClose }: { pacote:Pacote; onClose:()=>void }) {
  const [phase,    setPhase]    = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)   // 0–1
  const [dir,      setDir]      = useState<'right'|'left'>('right')
  const [figurinhas, setFigurinhas] = useState<Figurinha[]>([])
  const [flipped,    setFlipped]    = useState<boolean[]>([])
  const [erro,       setErro]       = useState('')

  const packRef    = useRef<HTMLDivElement>(null)
  const progRef    = useRef(0)
  const dirRef     = useRef<'right'|'left'>('right')
  const startXRef  = useRef(0)
  const isDragRef  = useRef(false)
  const rafRef     = useRef(0)
  const fetchedRef = useRef(false)
  const cfg = TIPO_CFG[pacote.tipo]

  // Snap-back suave quando larga sem completar
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

  // Dispara a sequência de abertura após completar o arraste
  const completar = useCallback(async () => {
    setPhase('completing')
    if (fetchedRef.current) return
    fetchedRef.current = true

    const r    = await fetch(`/api/pacotes/${pacote.id}/abrir`, { method:'POST' })
    const data = await r.json()
    if (!data.ok) { setErro(data.error ?? 'Erro'); setPhase('idle'); fetchedRef.current = false; return }

    setFigurinhas(data.figurinhas)
    setFlipped(new Array(data.figurinhas.length).fill(false))

    setTimeout(() => setPhase('split'),  700)
    setTimeout(() => setPhase('burst'),  1400)
    setTimeout(() => setPhase('grid'),   2200)
    setTimeout(() => {
      setPhase('done')
      data.figurinhas.forEach((_:Figurinha, i:number) => {
        setTimeout(() => setFlipped(prev => { const n=[...prev]; n[i]=true; return n }), i*90)
      })
    }, 2800)
  }, [pacote.id])

  const onStart = useCallback((clientX: number) => {
    if (phase !== 'idle' && phase !== 'dragging') return
    cancelAnimationFrame(rafRef.current)
    isDragRef.current = true
    const rect = packRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX    = (clientX - rect.left) / rect.width   // 0–1 dentro do pack
    const anchoProg = progRef.current
    // Se começa da esquerda → vai pra direita; da direita → vai pra esquerda
    // Ancora baseado na posição atual
    startXRef.current = clientX - anchoProg * rect.width * (dirRef.current === 'right' ? 1 : -1)
    setPhase('dragging')
  }, [phase])

  const onMove = useCallback((clientX: number) => {
    if (!isDragRef.current) return
    const rect = packRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = clientX - startXRef.current
    // Define direção na primeira vez
    if (phase === 'idle' || Math.abs(dx) < 6) return

    const dir = dx > 0 ? 'right' : 'left'
    dirRef.current = dir
    setDir(dir)

    const prog = Math.max(0, Math.min(1, Math.abs(dx) / rect.width))
    progRef.current = prog
    setProgress(prog)
    if (prog >= 0.95) { isDragRef.current = false; completar() }
  }, [phase, completar])

  const onEnd = useCallback(() => {
    if (!isDragRef.current) return
    isDragRef.current = false
    if (progRef.current >= 0.70) completar()
    else if (progRef.current < 0.05) completar()  // clique sem arrastar
    else snapBack()
  }, [completar, snapBack])

  useEffect(() => {
    const mv = (e:MouseEvent) => onMove(e.clientX)
    const mt = (e:TouchEvent) => onMove(e.touches[0].clientX)
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', mt, { passive:true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', mv)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', mt)
      window.removeEventListener('touchend', onEnd)
    }
  }, [onMove, onEnd])

  // Posição X do laser em % do pack (0=esquerda, 100=direita)
  const laserPct = dir === 'right' ? progress * 100 : 100 - progress * 100

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.93)', backdropFilter:'blur(12px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
      <style>{`
        @keyframes pack-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes pack-top-fly  { to{transform:translateY(-380px) rotate(-22deg);opacity:0} }
        @keyframes pack-bot-drop { to{transform:translateY(200px);opacity:0} }
        @keyframes dot-glow      { 0%,100%{opacity:0.45} 50%{opacity:1} }
        @keyframes laser-finish  { from{left:var(--laser-start)} to{left:110%;opacity:0} }
        @keyframes laser-snapback{ from{left:var(--laser-start)} to{left:var(--laser-end);opacity:0} }
        @keyframes gold-burst    { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 100%{transform:translate(-50%,-50%) scale(14);opacity:0} }
        @keyframes hint-slide    { 0%,100%{opacity:0.25;transform:translateX(0)} 50%{opacity:0.7;transform:translateX(6px)} }
        @keyframes card-burst    { 0%{transform:translate(0,0) rotate(0deg) scale(0.05);opacity:0} 30%{opacity:1} 100%{transform:translate(var(--bx),var(--by)) rotate(var(--br)) scale(1);opacity:1} }
        @keyframes card-to-grid  { from{transform:translate(var(--bx),var(--by)) rotate(var(--br))} to{transform:translate(var(--gx),var(--gy)) rotate(0deg)} }
        @keyframes card-flip-in  { 0%{transform:translate(var(--gx),var(--gy)) rotateY(90deg) scale(0.9)} 100%{transform:translate(var(--gx),var(--gy)) rotateY(0deg) scale(1)} }
      `}</style>

      {/* ── Pack ── */}
      {(phase==='idle'||phase==='dragging'||phase==='completing'||phase==='split') && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:22 }}>

          <div
            ref={packRef}
            style={{
              position:'relative', width:220,
              cursor: phase==='idle' ? 'pointer' : phase==='dragging' ? 'grabbing' : 'default',
              userSelect:'none',
              animation: phase==='idle' ? 'pack-float 3s ease-in-out infinite' : 'none',
            }}
            onMouseDown={e => onStart(e.clientX)}
            onTouchStart={e => onStart(e.touches[0].clientX)}
          >
            {/* Pack base — sempre visível durante o arraste */}
            <img src={PACK_IMG[pacote.tipo]} alt="" draggable={false} style={{
              display:'block', width:220,
              // Só esconde o topo quando o pack está se dividindo (split)
              clipPath: phase==='split' ? `inset(${CUT_PCT}% 0 0 0)` : 'none',
              animation: phase==='split' ? 'pack-bot-drop 0.6s ease-in forwards' : 'none',
            }}/>

            {/* Parte de cima — separada visualmente quando laser passou */}
            {(phase==='dragging'||phase==='completing'||phase==='split') && progress > 0.02 && (
              <img src={PACK_IMG[pacote.tipo]} alt="" draggable={false} style={{
                position:'absolute', top:0, left:0, width:220,
                clipPath:`inset(0 0 ${100-CUT_PCT}% 0)`,
                // Leve separação: sobe 1-2px e adiciona sombra abaixo
                transform:`translateY(${phase==='split' ? 0 : -Math.min(2, progress*4)}px)`,
                filter: phase==='split' ? 'none' : `drop-shadow(0 ${Math.min(6, progress*10)}px ${Math.min(10, progress*14)}px rgba(0,0,0,0.65))`,
                animation: phase==='split' ? 'pack-top-fly 0.6s ease-in forwards' : 'none',
                transition: phase==='dragging' ? 'none' : 'transform 0.1s',
              }}/>
            )}

            {/* Linha pontilhada (idle) */}
            {phase==='idle' && (
              <div style={{
                position:'absolute', top:`${CUT_PCT}%`, left:'6%', right:'6%', height:2,
                background:'repeating-linear-gradient(90deg,rgba(255,255,255,0.65) 0,rgba(255,255,255,0.65) 5px,transparent 5px,transparent 10px)',
                animation:'dot-glow 1.4s ease-in-out infinite', pointerEvents:'none',
              }}/>
            )}

            {/* ── LASER que segue o arraste ── */}
            {(phase==='dragging'||phase==='completing') && progress > 0.01 && (
              <>
                {/* Halo externo */}
                <div style={{
                  position:'absolute', top:`${CUT_PCT}%`,
                  left: 0, width:`${laserPct}%`,
                  height: cfg.h * 3,
                  background:`linear-gradient(90deg, transparent, ${cfg.glow2} 80%, ${cfg.glow1})`,
                  transform:'translateY(-50%)',
                  pointerEvents:'none',
                  transition: phase==='completing' ? 'none' : 'width 0.04s linear',
                }}/>
                {/* Linha brilhante */}
                <div style={{
                  position:'absolute', top:`${CUT_PCT}%`,
                  left:`${laserPct}%`,
                  width: 4, height: cfg.h,
                  background: cfg.color,
                  boxShadow:`0 0 10px 4px ${cfg.glow1}, 0 0 24px 8px ${cfg.glow2}`,
                  transform:'translateX(-50%) translateY(-50%)',
                  pointerEvents:'none',
                  transition: phase==='completing' ? 'none' : 'left 0.04s linear',
                }}/>
                {/* Rastro da região rasgada */}
                <div style={{
                  position:'absolute', top:`${CUT_PCT}%`,
                  left: dir==='right' ? 0 : `${laserPct}%`,
                  width:`${laserPct}%`,
                  height:1,
                  background: `linear-gradient(${dir==='right'?'90deg':'270deg'}, transparent, ${cfg.glow2})`,
                  transform:'translateY(-50%)',
                  pointerEvents:'none',
                }}/>
                {/* Explosão premium */}
                {pacote.tipo==='PREMIUM' && phase==='completing' && (
                  <div style={{
                    position:'absolute', top:`${CUT_PCT}%`, left:`${laserPct}%`,
                    width:30, height:30, borderRadius:'50%',
                    background:`radial-gradient(circle,${cfg.color},transparent)`,
                    animation:'gold-burst 0.7s ease-out forwards',
                    pointerEvents:'none',
                  }}/>
                )}
              </>
            )}
          </div>

          {/* Instrução */}
          {phase==='idle' && (
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:4, textTransform:'uppercase', color:'rgba(255,255,255,0.28)', animation:'hint-slide 1.8s ease-in-out infinite' }}>
              Clique ou arraste para abrir
            </div>
          )}
        </div>
      )}

      {/* ── Cartas ── */}
      {(phase==='burst'||phase==='grid'||phase==='done') && figurinhas.length>0 && (() => {
        const CW=100, CH=140, GAP=10
        const COLS=Math.min(figurinhas.length,7), ROWS=Math.ceil(figurinhas.length/COLS)
        const tW=COLS*CW+(COLS-1)*GAP, tH=ROWS*CH+(ROWS-1)*GAP
        return (
          <div style={{ position:'relative', width:'100vw', height:'80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {figurinhas.map((fig,i) => {
              const col=i%COLS, row=Math.floor(i/COLS)
              const gx=col*(CW+GAP)-tW/2+CW/2, gy=row*(CH+GAP)-tH/2+CH/2
              const bx=((i%5)-2)*90, by=-70-(i%4)*55, br=((i%7)-3)*24
              return (
                <div key={fig.id} style={{ position:'absolute', width:CW, height:CH, borderRadius:8, perspective:800,
                  '--bx':`${bx}px`,'--by':`${by}px`,'--br':`${br}deg`,
                  '--gx':`${gx}px`,'--gy':`${gy}px`,
                  animation: phase==='burst' ? `card-burst 0.55s cubic-bezier(0.2,0.8,0.2,1) ${i*38}ms both`
                    : phase==='grid' ? `card-to-grid 0.5s ease-out ${i*16}ms both`
                    : flipped[i] ? `card-flip-in 0.35s ease-out both`
                    : `card-to-grid 0.5s ease-out ${i*16}ms both`,
                } as React.CSSProperties}>
                  <div style={{ position:'absolute', inset:0, borderRadius:8, background:cfg.versoColor, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 6px 24px rgba(0,0,0,0.7)${cfg.cardGlow?`, ${cfg.cardGlow}`:''}`, opacity:flipped[i]?0:1, transition:'opacity 0.15s' }}>
                    <span style={{ fontSize:30 }}>{cfg.versoEmoji}</span>
                  </div>
                  <div style={{ position:'absolute', inset:0, borderRadius:8, overflow:'hidden', opacity:flipped[i]?1:0, transition:'opacity 0.15s 0.15s', boxShadow:`0 6px 24px rgba(0,0,0,0.7)${cfg.cardGlow?`, ${cfg.cardGlow}`:''}` }}>
                    {fig.imagemUrl
                      ? <img src={fig.imagemUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                      : <div style={{ width:'100%', height:'100%', background:'#222' }}/>
                    }
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.65)', padding:'3px 5px', fontSize:8, color:'rgba(255,255,255,0.85)', textAlign:'center' }}>#{fig.id}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {phase==='done' && (
        <button onClick={onClose} style={{ position:'absolute', bottom:28, background:'linear-gradient(135deg,#009c3b,#006b29)', border:'none', borderRadius:10, color:'#f5c800', fontSize:11, fontWeight:800, letterSpacing:3, textTransform:'uppercase', padding:'12px 32px', cursor:'pointer', boxShadow:'0 4px 20px rgba(0,156,59,0.4)' }}>
          Fechar · {figurinhas.length} figurinhas recebidas
        </button>
      )}
      {erro && <div style={{ color:'#f87171', fontSize:12, marginTop:16 }}>{erro}</div>}
    </div>
  )
}

// ── Principal ─────────────────────────────────────────────────────
export default function PacoteAbertura({ onClose }: { onClose: () => void }) {
  const router   = useRouter()
  const [pacotes,  setPacotes]  = useState<Pacote[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Pacote|null>(null)

  useEffect(() => {
    fetch('/api/pacotes').then(r=>r.json())
      .then(data => { setPacotes(Array.isArray(data)?data:[]); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleClose = useCallback(() => { onClose(); router.refresh() }, [onClose, router])

  if (loading) return <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.4)', fontSize:12 }}>Carregando…</div>
  if (selected) return <AberturaAnimation pacote={selected} onClose={handleClose}/>
  if (!pacotes.length) return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ fontSize:48 }}>📦</div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>Nenhum pacote disponível</div>
      <button onClick={onClose} style={{ fontSize:10, color:'rgba(255,255,255,0.25)', background:'none', border:'none', cursor:'pointer', letterSpacing:2, marginTop:8 }}>FECHAR</button>
    </div>
  )
  return <SelecaoPacote pacotes={pacotes} onSelect={setSelected} onClose={onClose}/>
}
