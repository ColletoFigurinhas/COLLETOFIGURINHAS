import { getBranding } from '@/server/branding'
import { ColletoBadge } from './ColletoBadge'

// Envolve uma área do app aplicando o tema da empresa (CSS vars) a toda a
// subárvore, sem gerar caixa própria (display:contents), e renderiza o selo
// Colleto fixo. As CSS vars sobrescrevem as de :root só aqui dentro.
export async function BrandRoot({ children }: { children: React.ReactNode }) {
  const b = await getBranding()
  return (
    <div style={{ display: 'contents', ...b.vars } as React.CSSProperties}>
      {children}
      <ColletoBadge src={b.colletoLogo} claro={b.claro} />
    </div>
  )
}
