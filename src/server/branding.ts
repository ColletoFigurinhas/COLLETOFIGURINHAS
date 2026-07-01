import 'server-only'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

const DEFAULT_COR = '#1d4ed8'

export type Branding = {
  slug:        string | null
  nome:        string | null
  logoUrl:     string | null
  corPrimaria: string
  claro:       boolean               // a cor escolhida é clara?
  colletoLogo: string                // selo Colleto adaptado ao contraste
  vars:        Record<string, string> // CSS custom properties (tema)
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  const n = m ? parseInt(m[1], 16) : 0x1d4ed8
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const clamp   = (x: number) => Math.max(0, Math.min(255, Math.round(x)))
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const toHex   = ([r, g, b]: number[]) =>
  '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')
const rgbStr  = (a: number[]) => a.map(clamp).join(',')

// ── HSL: derivar tons mantendo matiz + saturação (não lava pra branco) ──
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255]
}

/** Deriva a paleta (CSS vars) a partir da cor primária — forte e característica. */
export function paletaDe(cor: string) {
  const base    = /^#[0-9a-fA-F]{6}$/.test(cor) ? cor : DEFAULT_COR
  const baseRgb = hexToRgb(base)
  const [h, s, l] = rgbToHsl(baseRgb[0], baseRgb[1], baseRgb[2])

  // Saturação reforçada nos acentos → cor "forte e característica"
  const Sv    = Math.min(1, s * 1.15 + 0.05)
  const shade = (ll: number, ss = Sv) => hslToRgb(h, ss, clamp01(ll))

  // Tons claros: sobem POUCO de brilho (ficam perto da cor, não lavam)
  const dark   = shade(l * 0.70)
  const bright = shade(Math.min(0.58, l + 0.10))
  const gold   = shade(Math.min(0.62, l + 0.18))   // acento principal — vivo
  const pale   = shade(Math.min(0.74, l + 0.30))
  // Fundo escuro TINGIDO com a cor escolhida (não mais azul fixo)
  const bg     = shade(0.055, Math.min(0.60, s * 0.75))
  const bgMid  = shade(0.11,  Math.min(0.55, s * 0.70))

  const claro = (0.2126 * baseRgb[0] + 0.7152 * baseRgb[1] + 0.0722 * baseRgb[2]) / 255 > 0.6

  const vars: Record<string, string> = {
    // fundo tingido
    '--color-bg':          toHex(bg),
    '--color-bg-mid':      toHex(bgMid),
    '--color-bg-rgb':      rgbStr(bg),
    // vars consumidas pelo globals.css
    '--color-verde':       base,
    '--color-verde-light': toHex(bright),
    '--color-verde-dark':  toHex(dark),
    '--color-verde-dim':   `rgba(${rgbStr(baseRgb)},0.15)`,
    '--color-gold':        toHex(gold),
    '--color-gold-light':  toHex(pale),
    '--color-gold-dark':   toHex(bright),
    '--color-gold-dim':    `rgba(${rgbStr(gold)},0.18)`,
    // vars de marca (inline styles)
    '--brand':             base,
    '--brand-dark':        toHex(dark),
    '--brand-bright':      toHex(bright),
    '--brand-light':       toHex(gold),
    '--brand-pale':        toHex(pale),
    '--brand-rgb':         rgbStr(baseRgb),
    '--brand-bright-rgb':  rgbStr(bright),
    '--brand-light-rgb':   rgbStr(gold),
    '--brand-pale-rgb':    rgbStr(pale),
  }

  return { base, claro, vars }
}

/** Lê a empresa pelo slug do header (setado pelo middleware) e monta o branding. */
export async function getBranding(): Promise<Branding> {
  const h    = await headers()
  const slug = h.get('x-empresa-slug')

  let empresa: { nome: string; logoUrl: string | null; corPrimaria: string } | null = null
  if (slug) {
    empresa = await db.empresa.findFirst({
      where:  { slug, ativo: true },
      select: { nome: true, logoUrl: true, corPrimaria: true },
    })
  }

  const { base, claro, vars } = paletaDe(empresa?.corPrimaria ?? DEFAULT_COR)

  return {
    slug,
    nome:        empresa?.nome ?? null,
    logoUrl:     empresa?.logoUrl ?? null,
    corPrimaria: base,
    claro,
    colletoLogo: claro ? '/logo colorida COLLETO.png' : '/logo branca COLLETO.png',
    vars,
  }
}
