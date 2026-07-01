import { getBranding } from '@/server/branding'
import { ColletoBadge } from '@/components/ColletoBadge'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const b = await getBranding()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(var(--brand-rgb),0.25) 0%, transparent 65%), radial-gradient(ellipse 55% 40% at 100% 100%, rgba(var(--brand-bright-rgb),0.12) 0%, transparent 60%), #070e1a',
      ...b.vars,
    } as React.CSSProperties}>

      {/* Logo — da empresa (se houver) ou marca Colleto padrão */}
      <div style={{ width: '100%', maxWidth: 400, padding: '0 20px', textAlign: 'center', marginBottom: 36 }}>
        {b.logoUrl ? (
          <>
            <img src={b.logoUrl} alt={b.nome ?? 'Logo'} draggable={false}
              style={{ maxWidth: 200, maxHeight: 84, objectFit: 'contain', marginBottom: 10, filter: 'drop-shadow(0 0 24px rgba(var(--brand-rgb),0.35))' }} />
            {b.nome && (
              <div style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{b.nome}</div>
            )}
          </>
        ) : (
          <>
            <img src="/logo-icon.png" alt="Colleto" draggable={false}
              style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 12, filter: 'drop-shadow(0 0 24px rgba(var(--brand-bright-rgb),0.5))' }} />
            <div style={{ fontSize: 9, letterSpacing: 6, textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: 4 }}>Colleto</div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', background: 'linear-gradient(90deg,var(--color-verde-light),var(--color-gold-light),var(--color-verde-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Figurinhas
            </div>
          </>
        )}
      </div>

      {children}

      <ColletoBadge src={b.colletoLogo} claro={b.claro} />
    </div>
  )
}
