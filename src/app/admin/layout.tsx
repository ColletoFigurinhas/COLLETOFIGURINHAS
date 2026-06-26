import { verifyRole } from '@/lib/dal'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verifyRole('MARKETING', 'TI', 'ADMIN')

  return (
    <>
      <style>{`html, body { overflow: auto !important; height: auto !important; }`}</style>
      <div style={{ minHeight: '100vh', background: '#070e1a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

        {/* Header */}
        <header style={{
          height: 52, background: 'rgba(0,0,0,0.6)',
          borderBottom: '1px solid rgba(59,130,246,0.12)',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <img src="/logo-icon.png" alt="Colleto" draggable={false}
              style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(96,165,250,0.7)' }}>
              Colleto · Admin
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
            <Link href="/admin/importar" style={{ fontSize: 9, color: 'rgba(96,165,250,0.85)', textDecoration: 'none', letterSpacing: 1 }}>
              📥 Importar planilha
            </Link>
            <Link href="/album" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: 1 }}>
              ← Voltar ao álbum
            </Link>
          </div>
        </header>

        <main style={{ padding: '28px 24px', maxWidth: 960, margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </>
  )
}
