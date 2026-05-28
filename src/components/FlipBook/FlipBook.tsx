'use client'

import { useEffect, useRef, useState, useMemo, type ReactNode } from 'react'

// ============================================================
// TYPES
// ============================================================
type Special = 'golden' | 'silver' | 'legendary' | 'rare'

interface Player {
  name: string
  number: number
  position: string
  special?: Special
  collected: boolean
}

interface Team {
  id: string
  title: string
  flag: string
  primary: string
  secondary: string
  accent: string
  textColor: string
  players: Player[]
}

// ============================================================
// ALBUM DATA — FIFA WORLD CUP 2026
// ============================================================
const TEAMS: Team[] = [
  {
    id: 'brasil', title: 'BRASIL', flag: '🇧🇷',
    primary: '#009c3b', secondary: '#ffdf00', accent: '#002776', textColor: '#fff',
    players: [
      { name: 'Alisson',      number: 1,  position: 'GK',  special: 'golden',    collected: true  },
      { name: 'Militão',      number: 3,  position: 'DEF',                        collected: true  },
      { name: 'Marquinhos',   number: 4,  position: 'DEF',                        collected: true  },
      { name: 'Danilo',       number: 2,  position: 'LAT',                        collected: false },
      { name: 'Casemiro',     number: 5,  position: 'MID', special: 'silver',     collected: true  },
      { name: 'Paquetá',      number: 10, position: 'MID',                        collected: false },
      { name: 'Vinícius Jr.', number: 7,  position: 'ATA', special: 'legendary',  collected: true  },
      { name: 'Rodrygo',      number: 11, position: 'ATA',                        collected: true  },
      { name: 'Endrick',      number: 9,  position: 'ATA', special: 'rare',       collected: false },
      { name: 'Savinho',      number: 17, position: 'ATA',                        collected: true  },
      { name: 'André',        number: 6,  position: 'MID',                        collected: false },
      { name: 'Gerson',       number: 8,  position: 'MID',                        collected: true  },
    ],
  },
  {
    id: 'argentina', title: 'ARGENTINA', flag: '🇦🇷',
    primary: '#74acdf', secondary: '#ffffff', accent: '#003399', textColor: '#003399',
    players: [
      { name: 'E. Martínez',  number: 1,  position: 'GK',  special: 'golden',    collected: true  },
      { name: 'Molina',       number: 26, position: 'DEF',                        collected: true  },
      { name: 'C. Romero',    number: 13, position: 'DEF',                        collected: false },
      { name: 'L. Martínez',  number: 22, position: 'DEF',                        collected: true  },
      { name: 'Tagliafico',   number: 3,  position: 'DEF',                        collected: false },
      { name: 'De Paul',      number: 7,  position: 'MID',                        collected: true  },
      { name: 'Mac Allister', number: 20, position: 'MID',                        collected: true  },
      { name: 'Messi',        number: 10, position: 'CAM', special: 'legendary',  collected: true  },
      { name: 'Di María',     number: 11, position: 'ATA',                        collected: false },
      { name: 'J. Álvarez',   number: 9,  position: 'ATA', special: 'silver',     collected: true  },
      { name: 'Dybala',       number: 21, position: 'ATA',                        collected: false },
      { name: 'Almada',       number: 15, position: 'MID',                        collected: true  },
    ],
  },
  {
    id: 'franca', title: 'FRANÇA', flag: '🇫🇷',
    primary: '#002395', secondary: '#ed2939', accent: '#4a6acd', textColor: '#fff',
    players: [
      { name: 'Maignan',      number: 16, position: 'GK',  special: 'silver',     collected: true  },
      { name: 'Koundé',       number: 5,  position: 'DEF',                        collected: true  },
      { name: 'Upamecano',    number: 4,  position: 'DEF',                        collected: false },
      { name: 'T. Hernández', number: 22, position: 'DEF',                        collected: true  },
      { name: 'Camavinga',    number: 8,  position: 'MID',                        collected: true  },
      { name: 'Tchouaméni',   number: 8,  position: 'MID',                        collected: false },
      { name: 'Griezmann',    number: 7,  position: 'MID', special: 'silver',     collected: true  },
      { name: 'Mbappé',       number: 10, position: 'ATA', special: 'legendary',  collected: true  },
      { name: 'Dembelé',      number: 11, position: 'ATA', special: 'golden',     collected: false },
      { name: 'Giroud',       number: 9,  position: 'ATA',                        collected: true  },
      { name: 'Rabiot',       number: 14, position: 'MID',                        collected: false },
      { name: 'Guendouzi',    number: 6,  position: 'MID',                        collected: true  },
    ],
  },
  {
    id: 'england', title: 'ENGLAND', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    primary: '#003090', secondary: '#cf091e', accent: '#1a5cbd', textColor: '#fff',
    players: [
      { name: 'Pickford',      number: 1,  position: 'GK',                        collected: true  },
      { name: 'Alexander-A.',  number: 66, position: 'DEF',                       collected: true  },
      { name: 'Stones',        number: 5,  position: 'DEF',                       collected: false },
      { name: 'Maguire',       number: 6,  position: 'DEF',                       collected: true  },
      { name: 'Shaw',          number: 23, position: 'DEF',                       collected: false },
      { name: 'Rice',          number: 4,  position: 'MID', special: 'silver',    collected: true  },
      { name: 'Bellingham',    number: 22, position: 'MID', special: 'golden',    collected: true  },
      { name: 'Saka',          number: 7,  position: 'ATA',                       collected: true  },
      { name: 'Kane',          number: 9,  position: 'ATA', special: 'golden',    collected: false },
      { name: 'Rashford',      number: 10, position: 'ATA',                       collected: true  },
      { name: 'Foden',         number: 47, position: 'MID', special: 'silver',    collected: false },
      { name: 'Trippier',      number: 12, position: 'DEF',                       collected: true  },
    ],
  },
  {
    id: 'germany', title: 'ALEMANHA', flag: '🇩🇪',
    primary: '#1a1a1a', secondary: '#dd0000', accent: '#c8a400', textColor: '#fff',
    players: [
      { name: 'Neuer',         number: 1,  position: 'GK',  special: 'silver',    collected: true  },
      { name: 'Rüdiger',       number: 2,  position: 'DEF',                       collected: true  },
      { name: 'Süle',          number: 5,  position: 'DEF',                       collected: false },
      { name: 'Raum',          number: 19, position: 'DEF',                       collected: true  },
      { name: 'Kimmich',       number: 6,  position: 'MID', special: 'golden',    collected: true  },
      { name: 'Gündogan',      number: 21, position: 'MID',                       collected: false },
      { name: 'Müller',        number: 25, position: 'MID', special: 'silver',    collected: true  },
      { name: 'Havertz',       number: 29, position: 'MID',                       collected: true  },
      { name: 'Gnabry',        number: 10, position: 'ATA',                       collected: false },
      { name: 'Wirtz',         number: 10, position: 'MID', special: 'golden',    collected: true  },
      { name: 'Musiala',       number: 14, position: 'MID', special: 'legendary', collected: true  },
      { name: 'Sané',          number: 19, position: 'ATA',                       collected: false },
    ],
  },
  {
    id: 'spain', title: 'ESPANHA', flag: '🇪🇸',
    primary: '#c60b1e', secondary: '#f1bf00', accent: '#8a0010', textColor: '#fff',
    players: [
      { name: 'U. Simón',   number: 1,  position: 'GK',                        collected: true  },
      { name: 'Carvajal',   number: 2,  position: 'DEF',                        collected: true  },
      { name: 'Laporte',    number: 14, position: 'DEF',                        collected: false },
      { name: 'Gayà',       number: 14, position: 'DEF',                        collected: true  },
      { name: 'Pedri',      number: 26, position: 'MID', special: 'golden',     collected: true  },
      { name: 'Busquets',   number: 5,  position: 'MID',                        collected: false },
      { name: 'Gavi',       number: 9,  position: 'MID', special: 'silver',     collected: true  },
      { name: 'Yamal',      number: 19, position: 'ATA', special: 'legendary',  collected: true  },
      { name: 'Morata',     number: 7,  position: 'ATA',                        collected: false },
      { name: 'F. Torres',  number: 20, position: 'ATA',                        collected: true  },
      { name: 'D. Olmo',    number: 8,  position: 'MID',                        collected: true  },
      { name: 'Cucurella',  number: 9,  position: 'DEF',                        collected: false },
    ],
  },
  {
    id: 'portugal', title: 'PORTUGAL', flag: '🇵🇹',
    primary: '#006600', secondary: '#ff0000', accent: '#004400', textColor: '#fff',
    players: [
      { name: 'R. Patrício',  number: 1,  position: 'GK',                        collected: true  },
      { name: 'Cancelo',      number: 20, position: 'DEF',                        collected: true  },
      { name: 'R. Dias',      number: 6,  position: 'DEF',                        collected: false },
      { name: 'Pepe',         number: 3,  position: 'DEF',                        collected: true  },
      { name: 'Neves',        number: 8,  position: 'MID',                        collected: true  },
      { name: 'Moutinho',     number: 8,  position: 'MID',                        collected: false },
      { name: 'B. Fernandes', number: 8,  position: 'MID', special: 'silver',     collected: true  },
      { name: 'Ronaldo',      number: 7,  position: 'ATA', special: 'legendary',  collected: true  },
      { name: 'R. Leão',      number: 17, position: 'ATA', special: 'golden',     collected: true  },
      { name: 'D. Jota',      number: 20, position: 'ATA',                        collected: false },
      { name: 'J. Félix',     number: 11, position: 'ATA', special: 'golden',     collected: false },
      { name: 'G. Horta',     number: 9,  position: 'ATA',                        collected: true  },
    ],
  },
  {
    id: 'morocco', title: 'MARROCOS', flag: '🇲🇦',
    primary: '#c1272d', secondary: '#006233', accent: '#8a1520', textColor: '#fff',
    players: [
      { name: 'Bono',        number: 1,  position: 'GK',  special: 'golden',     collected: true  },
      { name: 'Hakimi',      number: 2,  position: 'DEF', special: 'silver',      collected: true  },
      { name: 'Saïss',       number: 5,  position: 'DEF',                         collected: false },
      { name: 'Amrabat',     number: 4,  position: 'MID', special: 'golden',      collected: true  },
      { name: 'Ounahi',      number: 8,  position: 'MID',                         collected: true  },
      { name: 'Ziyech',      number: 7,  position: 'MID',                         collected: false },
      { name: 'En-Nesyri',   number: 9,  position: 'ATA', special: 'silver',      collected: true  },
      { name: 'Sabiri',      number: 10, position: 'MID',                         collected: true  },
      { name: 'Boufal',      number: 11, position: 'ATA',                         collected: false },
      { name: 'El Yamiq',    number: 3,  position: 'DEF',                         collected: true  },
      { name: 'Dari',        number: 14, position: 'DEF',                         collected: false },
      { name: 'Benoun',      number: 5,  position: 'DEF',                         collected: true  },
    ],
  },
]

// ============================================================
// HELPERS
// ============================================================
const POS_ICON: Record<string, string> = {
  GK: '🧤', DEF: '🛡️', LAT: '🏃', MID: '⚙️', CAM: '🎯', ATA: '⚽',
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function cardGradient(player: Player, team: Team): string {
  if (player.special === 'legendary')
    return `linear-gradient(145deg, ${team.accent}cc 0%, ${team.primary}ee 100%)`
  if (player.special === 'golden')
    return 'linear-gradient(145deg, #5a3c0a 0%, #b88a20 45%, #5a3c0a 100%)'
  if (player.special === 'silver')
    return 'linear-gradient(145deg, #2e3540 0%, #6a7888 45%, #2e3540 100%)'
  if (player.special === 'rare')
    return 'linear-gradient(145deg, #003d34 0%, #007a6a 45%, #003d34 100%)'
  return `linear-gradient(145deg, ${team.primary} 0%, ${team.accent}ee 100%)`
}

function badge(s?: Special) {
  return s === 'legendary' ? '👑' : s === 'golden' ? '⭐' : s === 'silver' ? '🌟' : s === 'rare' ? '💎' : null
}

// ============================================================
// PAGE COMPONENTS
// ============================================================
function CoverPage() {
  return (
    <div className="page-cover">
      <div className="page-cover-bg-texture" />
      <div className="cover-corner-tl" />
      <div className="cover-corner-br" />
      <div className="cover-ribbon">OFICIAL</div>
      <div className="cover-brand">Panini × FIFA</div>
      <div className="cover-fifa">FIFA</div>
      <div className="cover-title">World<br />Cup</div>
      <div className="cover-world-cup">Copa do Mundo</div>
      <div className="cover-trophy">🏆</div>
      <div className="cover-year">2026</div>
      <div className="cover-stars">
        {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
      </div>
      <div className="cover-panini-footer">Álbum Oficial de Figurinhas</div>
    </div>
  )
}

function BackCoverPage() {
  const bars = [3, 2, 4, 2, 5, 3, 4, 2, 3, 5, 4, 2, 3, 4, 3, 2, 4, 3, 5, 4, 2, 3]
  return (
    <div className="page-back-cover">
      <div className="page-cover-bg-texture" />
      <div className="back-cover-logo">🏆</div>
      <div className="back-cover-title">FIFA World Cup 2026™</div>
      <div className="back-cover-sub">Álbum Oficial Panini</div>
      <div className="back-cover-qr">📱</div>
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: 2 }}>
        COLECIONE · TROQUE · COMPLETE
      </div>
      <div className="back-cover-barcode">
        {bars.map((h, i) => (
          <div key={i} className="back-cover-barcode-bar"
            style={{ width: i % 3 === 0 ? 3 : 1, height: 28 + h * 2 }} />
        ))}
      </div>
      <div className="back-cover-isbn">ISBN 978-85-01-00000-0 · © 2026 FIFA · © 2026 Panini</div>
    </div>
  )
}

function IntroPage({ onTeamClick }: { onTeamClick: (page: number) => void }) {
  return (
    <div className="page-intro">
      <div className="intro-header">Álbum Oficial</div>
      <div className="intro-title">Índice das Seleções</div>
      <div className="intro-list">
        {TEAMS.map((t, i) => {
          // Each team occupies 3 pages: section + stickers A + stickers B
          // Cover=0, Intro=1, then teams start at page 2
          const teamPage = 2 + i * 3
          return (
            <div
              key={t.id}
              className="intro-item intro-item-clickable"
              style={{ borderLeftColor: t.primary, cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onTeamClick(teamPage); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  onTeamClick(teamPage);
                }
              }}
              aria-label={`Ir para ${t.title}`}
            >
              <span className="intro-item-flag">{t.flag}</span>
              <span className="intro-item-name">{t.title}</span>
              <span className="intro-item-page">Pág. {i * 3 + 3}</span>
              <span className="intro-item-arrow">›</span>
            </div>
          )
        })}
      </div>
      <div className="intro-footer">
        © 2026 FIFA™ – © 2026 Panini Group. Todos os direitos reservados.
      </div>
    </div>
  )
}

function SectionPage({ team }: { team: Team }) {
  return (
    <div className="page-section"
      style={{ background: `linear-gradient(145deg, ${team.primary} 0%, ${team.accent} 100%)`, color: team.textColor }}>
      <div className="section-bg-pattern" style={{ color: team.textColor }} />
      <div className="section-bg-glow" />
      <div className="section-flag">{team.flag}</div>
      <div className="section-country" style={{ color: team.textColor }}>{team.title}</div>
      <div className="section-divider" style={{ background: team.secondary }} />
      <div className="section-subtitle" style={{ color: team.textColor }}>Copa do Mundo FIFA 2026™</div>
      <div className="section-num-badge" style={{ color: team.textColor }}>
        {team.players.filter(p => p.collected).length}/{team.players.length}
      </div>
    </div>
  )
}

function StickerCard({ player, team }: { player: Player; team: Team }) {
  if (!player.collected) {
    return (
      <div className="sticker sticker-empty">
        <div className="sticker-empty-icon">?</div>
        <div className="sticker-empty-num">#{player.number}</div>
      </div>
    )
  }
  const b = badge(player.special)
  const icon = POS_ICON[player.position] ?? '⚽'
  const cls = `sticker${player.special ? ` sticker-${player.special}` : ''}`
  return (
    <div className={cls} style={{ background: cardGradient(player, team) }}>
      <div className="sticker-header">
        <span className="sticker-number">#{player.number}</span>
        <span className="sticker-pos">{player.position}</span>
      </div>
      <div className="sticker-body">
        <div className="sticker-bg-initials">{initials(player.name)}</div>
        <div className="sticker-icon">{icon}</div>
        {b && <div className="sticker-special-badge">{b}</div>}
      </div>
      <div className="sticker-footer">
        <div className="sticker-name">{player.name}</div>
        <div className="sticker-flag-row">
          <span>{team.flag}</span>
          <span>{team.title}</span>
        </div>
      </div>
    </div>
  )
}

function StickerPage({ team, players, label }: { team: Team; players: Player[]; label: string }) {
  return (
    <div className="page-stickers">
      <div className="page-header" style={{ borderBottomColor: team.primary }}>
        <span className="page-header-flag">{team.flag}</span>
        <span className="page-header-title" style={{ color: team.primary }}>{team.title}</span>
        <span className="page-header-num">{label}</span>
      </div>
      <div className="stickers-grid">
        {players.map((p, i) => <StickerCard key={i} player={p} team={team} />)}
      </div>
    </div>
  )
}

function BonusPage() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(145deg, #0a0520 0%, #1a0840 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.015) 0,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 14px)',
      }} />
      <div style={{ fontSize: 64, marginBottom: 16 }}>🌟</div>
      <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 4, color: 'rgba(240,192,64,0.8)', textTransform: 'uppercase', textAlign: 'center' }}>
        Figurinhas Especiais
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
        Em Breve
      </div>
    </div>
  )
}

// ============================================================
// BUILD PAGES ARRAY
// ============================================================
function buildPages(onTeamClick: (page: number) => void): ReactNode[] {
  const pages: ReactNode[] = []
  pages.push(<CoverPage key="cover" />)
  pages.push(<IntroPage key="intro" onTeamClick={onTeamClick} />)
  TEAMS.forEach((team) => {
    pages.push(<SectionPage key={`sec-${team.id}`} team={team} />)
    pages.push(
      <StickerPage key={`st-${team.id}-a`} team={team}
        players={team.players.slice(0, 6)} label={`Pág. ${pages.length + 1}`} />
    )
    pages.push(
      <StickerPage key={`st-${team.id}-b`} team={team}
        players={team.players.slice(6, 12)} label={`Pág. ${pages.length + 1}`} />
    )
  })
  pages.push(<BonusPage key="bonus" />)
  pages.push(<BackCoverPage key="back-cover" />)
  // Ensure even page count for proper book
  if (pages.length % 2 !== 0) {
    pages.push(<div key="pad" style={{ width: '100%', height: '100%', background: '#06080f' }} />)
  }
  return pages
}

// ============================================================
// CONSTANTS
// ============================================================
const PAGE_W = 450
const PAGE_H = 620

// ============================================================
// HELPERS FOR NAVIGATION
// ============================================================
function isPageVisible(currentPage: number, target: number, isPortrait: boolean, total: number) {
  if (isPortrait) {
    return currentPage === target
  }
  if (currentPage === 0) {
    return target === 0
  }
  if (currentPage === total - 1) {
    return target === total - 1
  }
  return target === currentPage || target === currentPage + 1
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function FlipBook() {
  const bookRef       = useRef<HTMLDivElement>(null)
  const flipRef       = useRef<any>(null)
  const curRef        = useRef(0)          // mirrors `cur` but always up-to-date
  const rapidTarget   = useRef(-1)         // -1 = idle; >=0 = destination page
  const bookStateRef  = useRef('read')     // tracks page-flip state ('read', 'flipping', etc.)
  const [cur,       setCur]    = useState(0)
  const [loading,   setLoading]  = useState(true)
  const [fadeOut,   setFadeOut]  = useState(false)
  const [scale,     setScale]    = useState(1)
  const [isPortrait, setIsPortrait] = useState(false)

  // ── Rapid-flip navigation ─────────────────────────────────────
  // Captured once by buildPages via navRef.current.
  const navRef = useRef((targetPage: number) => {
    const pf = flipRef.current
    if (!pf) return

    const isPort = pf.getOrientation() === 'portrait'
    if (isPageVisible(curRef.current, targetPage, isPort, total)) {
      rapidTarget.current = -1
      try { pf.getSettings().flippingTime = 900 } catch {}
      return
    }

    rapidTarget.current = targetPage
    try { pf.getSettings().flippingTime = 240 } catch {}

    // If the book is currently idle ('read'), start the transition immediately.
    // Otherwise, when the current flip completes, changeState handler will continue.
    if (bookStateRef.current === 'read') {
      targetPage > curRef.current ? pf.flipNext('bottom') : pf.flipPrev('bottom')
    }
  })

  const pages     = useMemo(() => buildPages(navRef.current), [])
  const total     = pages.length
  const collected = TEAMS.reduce((a, t) => a + t.players.filter(p => p.collected).length, 0)
  const allCards  = TEAMS.reduce((a, t) => a + t.players.length, 0)
  const progress  = total > 1 ? (cur / (total - 1)) * 100 : 0

  // Responsive scale
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight - 140
      const s  = Math.min(1, vw / (PAGE_W * 2 + 60), vh / (PAGE_H + 40))
      setScale(Math.max(0.3, s))
      setIsPortrait(vw < 600)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  // Center alignment offset for closed book in landscape mode
  const translationX = useMemo(() => {
    if (isPortrait) return 0
    if (cur === 0) return -PAGE_W / 2
    if (cur === total - 1) return PAGE_W / 2
    return 0
  }, [cur, total, isPortrait])

  // Init page-flip
  useEffect(() => {
    if (!bookRef.current) return
    let pf: any = null

    const init = async () => {
      try {
        const mod = await import('page-flip')
        const PF: any = (mod as any).PageFlip
          ?? (mod as any).default?.PageFlip
          ?? (mod as any).default

        pf = new PF(bookRef.current!, {
          width: PAGE_W,
          height: PAGE_H,
          size: 'fixed',
          showCover: true,
          usePortrait: window.innerWidth < 600,
          drawShadow: true,
          flippingTime: 900,
          maxShadowOpacity: 0.85,
          useMouseEvents: true,
          swipeDistance: 30,
          clickEventForward: true,
          mobileScrollSupport: false,
          startZIndex: 1,
          autoSize: false,
          disableFlipByClick: true,
        })

        const els = bookRef.current!.querySelectorAll('[data-pb-page]')
        pf.loadFromHTML(els)

        pf.on('flip', (e: any) => {
          const page = typeof e.data === 'number' ? e.data : 0
          setCur(page)
          curRef.current = page
        })

        pf.on('changeState', (e: any) => {
          const state = e.data
          const page = pf.getCurrentPageIndex()
          setCur(page)
          curRef.current = page
          bookStateRef.current = state

          // Cancel rapid flipping if user interacts manually (drags or opens corner)
          if (state === 'user_fold' || state === 'fold_corner') {
            if (rapidTarget.current >= 0) {
              rapidTarget.current = -1
              try { pf.getSettings().flippingTime = 900 } catch {}
            }
          }

          if (state === 'read') {
            const target = rapidTarget.current
            if (target < 0) return

            const isPort = pf.getOrientation() === 'portrait'
            if (isPageVisible(page, target, isPort, total)) {
              rapidTarget.current = -1
              try { pf.getSettings().flippingTime = 900 } catch {}
              return
            }

            const diff = target - page
            setTimeout(() => {
              if (rapidTarget.current < 0) return // cancelled
              diff > 0 ? pf.flipNext('bottom') : pf.flipPrev('bottom')
            }, 0)
          }
        })

        pf.on('init', () => {
          try {
            const idx = pf.getCurrentPageIndex?.() ?? 0
            curRef.current = idx
            setCur(idx)
          } catch {}
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
    return () => {
      clearTimeout(t)
      try { pf?.destroy() } catch {}
      flipRef.current = null
    }
  }, [total]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Loading */}
      {loading && (
        <div className={`loading-screen${fadeOut ? ' fade-out' : ''}`}>
          <div className="loading-book">📖</div>
          <div className="loading-label">Carregando Álbum</div>
          <div className="loading-dots"><span /><span /><span /></div>
        </div>
      )}

      <div className="album-scene">
        {/* Header */}
        <header className="album-header">
          <div className="album-header-title">⚽ Álbum FIFA 2026</div>
          <div className="album-header-badge">
            <div className="album-header-dot" />
            <span>{collected} / {allCards} figurinhas</span>
          </div>
        </header>

        {/* Book */}
        <div className="book-wrapper">
          <div 
            className="book-scale-root" 
            style={{ 
              transform: `scale(${scale}) translateX(${translationX}px)`,
              transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          >
            <div ref={bookRef} style={{ width: PAGE_W * 2, height: PAGE_H }}>
              {pages.map((content, i) => (
                <div
                  key={i}
                  data-pb-page=""
                  data-density={i === 0 || i === total - 1 ? 'hard' : 'soft'}
                  style={{ width: PAGE_W, height: PAGE_H }}
                >
                  <div className="page-inner">{content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Controls */}
        <div className="album-controls">
          <button id="btn-first" className="ctrl-btn ctrl-btn-sm"
            onClick={() => navRef.current(0)} title="Capa" aria-label="Ir para o início">
            ⏮
          </button>

          <button id="btn-prev" className="ctrl-btn"
            onClick={() => flipRef.current?.flipPrev('top')}
            disabled={cur === 0} aria-label="Página anterior">
            ◀
          </button>

          <span className="page-counter">{cur + 1} / {total}</span>

          <button id="btn-next" className="ctrl-btn"
            onClick={() => flipRef.current?.flipNext('top')}
            disabled={cur >= total - 1} aria-label="Próxima página">
            ▶
          </button>

          <button id="btn-last" className="ctrl-btn ctrl-btn-sm"
            onClick={() => navRef.current(total - 1)} title="Contracapa" aria-label="Ir para o final">
            ⏭
          </button>
        </div>
      </div>
    </>
  )
}
