import { verifyRole } from '@/lib/dal'
import Link from 'next/link'
import DistribuicaoBar from './DistribuicaoBar'
import { db } from '@/lib/db'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verifyRole('MARKETING', 'TI', 'ADMIN')
  const campanha = await db.campanha.findFirst({ where: { slug: 'super-copa-2026' }, select: { dataInicio: true } })

  return (
    <>
      <style>{`html, body { overflow: auto !important; height: auto !important; }`}</style>
      <div style={{ minHeight: '100vh', background: '#080d16', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

        {/* Header */}
        <header style={{
          height: 52, background: 'rgba(0,0,0,0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(240,192,64,0.7)', flexShrink: 0 }}>
            ⚽ Backoffice Marketing
          </span>
          <Link href="/album" style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: 1, flexShrink: 0 }}>
            ← Voltar ao álbum
          </Link>
        </header>

        {/* Barra de distribuição */}
        <DistribuicaoBar dataInicioCampanha={campanha?.dataInicio?.toISOString() ?? null} />

        <main style={{ padding: '28px 24px', maxWidth: 960, margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </>
  )
}
