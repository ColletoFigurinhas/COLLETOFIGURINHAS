import 'server-only'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { paletaDe, ehClaro } from '@/lib/palette'

const DEFAULT_COR = '#1d4ed8'

export type Branding = {
  slug:        string | null
  nome:        string | null
  logoUrl:     string | null
  corPrimaria: string
  corDestaque: string
  claro:       boolean               // a cor primária é clara?
  colletoLogo: string                // selo Colleto adaptado ao contraste
  vars:        Record<string, string> // CSS custom properties (tema)
}

/** Lê a empresa pelo slug do header (setado pelo middleware) e monta o branding. */
export async function getBranding(): Promise<Branding> {
  const h    = await headers()
  const slug = h.get('x-empresa-slug')

  let empresa: { nome: string; logoUrl: string | null; corPrimaria: string; corDestaque: string | null } | null = null
  if (slug) {
    empresa = await db.empresa.findFirst({
      where:  { slug, ativo: true },
      select: { nome: true, logoUrl: true, corPrimaria: true, corDestaque: true },
    })
  }

  const primaria = empresa?.corPrimaria ?? DEFAULT_COR
  const destaque = empresa?.corDestaque ?? primaria
  const claro    = ehClaro(primaria)

  return {
    slug,
    nome:        empresa?.nome ?? null,
    logoUrl:     empresa?.logoUrl ?? null,
    corPrimaria: primaria,
    corDestaque: destaque,
    claro,
    colletoLogo: claro ? '/logo colorida COLLETO.png' : '/logo branca COLLETO.png',
    vars:        paletaDe(primaria, destaque),
  }
}
