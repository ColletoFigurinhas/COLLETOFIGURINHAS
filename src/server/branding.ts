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

const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x)))
const toHex = ([r, g, b]: number[]) =>
  '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')

const mixWhite = ([r, g, b]: number[], t: number) =>
  [r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t]
const mixBlack = ([r, g, b]: number[], t: number) =>
  [r * (1 - t), g * (1 - t), b * (1 - t)]

// luminância perceptual (0 = escuro, 1 = claro)
function luminancia([r, g, b]: number[]): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/** Deriva a paleta (CSS vars) a partir da cor primária da empresa. */
export function paletaDe(cor: string) {
  const base   = /^#[0-9a-fA-F]{6}$/.test(cor) ? cor : DEFAULT_COR
  const rgb    = hexToRgb(base)
  const dark   = mixBlack(rgb, 0.22)
  const bright = mixWhite(rgb, 0.18)
  const light  = mixWhite(rgb, 0.40)
  const pale   = mixWhite(rgb, 0.66)

  const rgbStr = (a: number[]) => a.map(clamp).join(',')
  const claro  = luminancia(rgb) > 0.6

  const vars: Record<string, string> = {
    // vars já consumidas pelo globals.css
    '--color-verde':       base,
    '--color-verde-light': toHex(bright),
    '--color-verde-dim':   `rgba(${rgbStr(rgb)},0.15)`,
    '--color-gold':        toHex(light),
    '--color-gold-light':  toHex(pale),
    '--color-gold-dark':   toHex(bright),
    '--color-gold-dim':    `rgba(${rgbStr(light)},0.18)`,
    // novas vars de marca (usadas nos inline styles refatorados)
    '--color-verde-dark':  toHex(dark),
    '--brand':             base,
    '--brand-dark':        toHex(dark),
    '--brand-bright':      toHex(bright),
    '--brand-light':       toHex(light),
    '--brand-pale':        toHex(pale),
    '--brand-rgb':         rgbStr(rgb),
    '--brand-bright-rgb':  rgbStr(bright),
    '--brand-light-rgb':   rgbStr(light),
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
    // cor clara escolhida → logo colorida (escura); cor escura → logo branca
    colletoLogo: claro ? '/logo colorida COLLETO.png' : '/logo branca COLLETO.png',
    vars,
  }
}
