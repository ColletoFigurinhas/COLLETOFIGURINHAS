// Motor de tema — puro (sem server-only): usado no servidor (branding.ts)
// e no client (preview do admin). Deriva a paleta de CSS vars a partir de
// uma cor de ESTRUTURA (primária) e uma de DESTAQUE (acento).

const DEFAULT_COR = '#1d4ed8'
const isHex = (c: string | null | undefined): c is string => !!c && /^#[0-9a-fA-F]{6}$/.test(c)

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  const n = m ? parseInt(m[1], 16) : 0x1d4ed8
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const clamp   = (x: number) => Math.max(0, Math.min(255, Math.round(x)))
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const entre   = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))
const toHex   = ([r, g, b]: number[]) => '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')
const rgbStr  = (a: number[]) => a.map(clamp).join(',')

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
  const f = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255]
}

export function ehClaro(cor: string): boolean {
  const [r, g, b] = hexToRgb(isHex(cor) ? cor : DEFAULT_COR)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6
}

// Tons de UMA cor, com piso/teto de contraste (legível no fundo escuro, sem neon)
function tons(cor: string) {
  const rgb = hexToRgb(cor)
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])
  const Sacc  = Math.min(0.78, Math.max(0.42, s))
  const shade = (ll: number, ss = Sacc) => hslToRgb(h, ss, clamp01(ll))
  return {
    rgb,
    gold:   shade(entre(l + 0.18, 0.56, 0.66)),  // acento principal (texto/borda)
    pale:   shade(entre(l + 0.32, 0.70, 0.80)),  // texto sobre botão
    bright: shade(entre(l + 0.08, 0.46, 0.58)),
    dark:   shade(Math.min(l, 0.42) * 0.60),     // gradiente/hover escuro
    bg:     shade(0.06,  Math.min(0.42, s * 0.55)),
    bgMid:  shade(0.115, Math.min(0.40, s * 0.50)),
  }
}

/**
 * Deriva o tema. `primaria` = estrutura (fundo/botões); `destaque` = acento
 * (títulos, abas ativas, seleção). Se `destaque` faltar, usa a primária.
 */
export function paletaDe(primaria: string, destaque?: string | null): Record<string, string> {
  const P = isHex(primaria) ? primaria : DEFAULT_COR
  const A = isHex(destaque) ? destaque : P
  const est = tons(P)   // estrutura
  const ac  = tons(A)   // acento

  return {
    // fundo tingido + estrutura (da PRIMÁRIA)
    '--color-bg':          toHex(est.bg),
    '--color-bg-mid':      toHex(est.bgMid),
    '--color-bg-rgb':      rgbStr(est.bg),
    '--color-verde':       P,
    '--color-verde-light': toHex(est.bright),
    '--color-verde-dark':  toHex(est.dark),
    '--color-verde-dim':   `rgba(${rgbStr(est.rgb)},0.15)`,
    '--brand':             P,
    '--brand-dark':        toHex(est.dark),
    '--brand-bright':      toHex(est.bright),
    '--brand-rgb':         rgbStr(est.rgb),
    '--brand-bright-rgb':  rgbStr(est.bright),
    // acento (da DESTAQUE)
    '--color-gold':        toHex(ac.gold),
    '--color-gold-light':  toHex(ac.pale),
    '--color-gold-dark':   toHex(ac.bright),
    '--color-gold-dim':    `rgba(${rgbStr(ac.gold)},0.18)`,
    '--brand-light':       toHex(ac.gold),
    '--brand-pale':        toHex(ac.pale),
    '--brand-light-rgb':   rgbStr(ac.gold),
    '--brand-pale-rgb':    rgbStr(ac.pale),
  }
}
