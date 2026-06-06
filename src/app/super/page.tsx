import { verifySuperAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function SuperDashboard() {
  await verifySuperAdmin()

  const [totalEmpresas, totalParticipantes, totalAtivos] = await Promise.all([
    db.empresa.count(),
    db.participante.count(),
    db.empresa.count({ where: { ativo: true } }),
  ])

  const empresas = await db.empresa.findMany({
    orderBy: { criadoEm: 'desc' },
    take: 10,
    include: { _count: { select: { participantes: true } } },
  })

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Dashboard</h1>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: 1 }}>Visão geral do SaaS Colleto</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Empresas totais',  value: totalEmpresas },
          { label: 'Empresas ativas',  value: totalAtivos },
          { label: 'Participantes',    value: totalParticipantes },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#60a5fa' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Últimas empresas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Empresas recentes</h2>
        <Link href="/super/empresas" style={{ fontSize: 10, color: '#60a5fa', textDecoration: 'none', letterSpacing: 1 }}>Ver todas →</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {empresas.map(e => (
          <div key={e.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.ativo ? '#4ade80' : '#f87171', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{e.nome}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>{e.slug} · {e.cnpj}</div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{e._count.participantes} participantes</div>
          </div>
        ))}
      </div>
    </div>
  )
}
