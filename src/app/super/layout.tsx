import { verifySuperAdmin } from '@/lib/dal'
import Link from 'next/link'
import { superAdminLogout } from '@/app/actions/auth'

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  let admin: { nome: string } | null = null
  try { admin = await verifySuperAdmin() } catch {}

  return (
    <div style={{ minHeight: '100vh', background: '#070e1a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {admin && (
        <header style={{ height: 52, background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 20 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(96,165,250,0.7)' }}>
            🃏 Colleto · Super Admin
          </span>
          <Link href="/super" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', letterSpacing: 1 }}>Dashboard</Link>
          <Link href="/super/empresas" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', letterSpacing: 1 }}>Empresas</Link>
          <form action={superAdminLogout} style={{ marginLeft: 'auto' }}>
            <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
              Sair
            </button>
          </form>
        </header>
      )}
      <main style={{ padding: '28px 24px', maxWidth: 1100, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
