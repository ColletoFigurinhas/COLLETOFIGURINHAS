'use client'

import { useState, useEffect } from 'react'

type Empresa = {
  id: number; nome: string; slug: string; cnpj: string
  corPrimaria: string; ativo: boolean; plano: string
  apiKey: string | null
  valorMensal: number | null
  statusCobranca: string
  proximoVencimento: string | null
  criadoEm: string
  _count: { participantes: number; campanhas: number }
}

const STATUS_COB: Record<string, { l: string; c: string; b: string }> = {
  em_dia:   { l: 'Em dia',   c: '#4ade80', b: 'rgba(74,222,128,0.12)' },
  atrasado: { l: 'Atrasado', c: '#f87171', b: 'rgba(248,113,113,0.12)' },
  cortesia: { l: 'Cortesia', c: '#93c5fd', b: 'rgba(96,165,250,0.12)' },
}

export default function EmpresasPage() {
  const [empresas,     setEmpresas]     = useState<Empresa[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [showAdmin,    setShowAdmin]    = useState<number | null>(null)
  const [keyRevelada,  setKeyRevelada]  = useState<{ id: number; key: string } | null>(null)
  const [showCobranca, setShowCobranca] = useState<number | null>(null)
  const [cobValor,  setCobValor]  = useState('')
  const [cobStatus, setCobStatus] = useState('em_dia')
  const [cobVenc,   setCobVenc]   = useState('')
  const [savingCob, setSavingCob] = useState(false)

  // form nova empresa
  const [nome,  setNome]  = useState('')
  const [slug,  setSlug]  = useState('')
  const [cnpj,  setCnpj]  = useState('')
  const [cor,   setCor]   = useState('#1d4ed8')
  const [errF,  setErrF]  = useState('')
  const [saving,setSaving]= useState(false)

  // form novo admin
  const [adminMat,   setAdminMat]   = useState('')
  const [adminNome,  setAdminNome]  = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminSenha, setAdminSenha] = useState('')
  const [errA,       setErrA]       = useState('')
  const [savingA,    setSavingA]    = useState(false)

  async function load() {
    setLoading(true)
    const r = await fetch('/api/super/empresas')
    setEmpresas(await r.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleCriarEmpresa(e: React.FormEvent) {
    e.preventDefault(); setErrF(''); setSaving(true)
    const r = await fetch('/api/super/empresas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, slug, cnpj, corPrimaria: cor }),
    })
    setSaving(false)
    if (!r.ok) { const j = await r.json(); setErrF(j.error ?? 'Erro'); return }
    setNome(''); setSlug(''); setCnpj(''); setCor('#1d4ed8')
    setShowForm(false); load()
  }

  async function handleToggleAtivo(empresa: Empresa) {
    await fetch(`/api/super/empresas/${empresa.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !empresa.ativo }),
    })
    setEmpresas(prev => prev.map(e => e.id === empresa.id ? { ...e, ativo: !e.ativo } : e))
  }

  async function handleCriarAdmin(e: React.FormEvent) {
    e.preventDefault(); setErrA(''); setSavingA(true)
    const r = await fetch('/api/super/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresaId: showAdmin, matricula: adminMat, nome: adminNome, email: adminEmail, senha: adminSenha }),
    })
    setSavingA(false)
    if (!r.ok) { const j = await r.json(); setErrA(j.error ?? 'Erro'); return }
    setAdminMat(''); setAdminNome(''); setAdminEmail(''); setAdminSenha('')
    setShowAdmin(null); load()
  }

  async function gerarApiKey(id: number) {
    if (!confirm('Gerar/rotacionar a API key desta empresa? A key anterior deixa de funcionar.')) return
    const r = await fetch(`/api/super/empresas/${id}/apikey`, { method: 'POST' })
    if (!r.ok) return
    const data = await r.json()
    setKeyRevelada({ id, key: data.apiKey })
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, apiKey: data.apiKey } : e))
  }

  function abrirCobranca(emp: Empresa) {
    setShowCobranca(showCobranca === emp.id ? null : emp.id)
    setCobValor(emp.valorMensal != null ? String(emp.valorMensal) : '')
    setCobStatus(emp.statusCobranca ?? 'em_dia')
    setCobVenc(emp.proximoVencimento ? emp.proximoVencimento.slice(0, 10) : '')
  }

  async function salvarCobranca(id: number) {
    setSavingCob(true)
    const r = await fetch(`/api/super/empresas/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valorMensal: cobValor === '' ? null : Number(cobValor), statusCobranca: cobStatus, proximoVencimento: cobVenc || null }),
    })
    setSavingCob(false)
    if (r.ok) { setShowCobranca(null); load() }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Empresas</h1>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{empresas.length} empresa{empresas.length !== 1 ? 's' : ''} cadastrada{empresas.length !== 1 ? 's' : ''}</div>
        </div>
        <button onClick={() => { setShowForm(v => !v); setErrF('') }} style={{ ...btnPrimary, background: showForm ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#1d4ed8,#1e40af)' }}>
          {showForm ? '✕ Cancelar' : '+ Nova Empresa'}
        </button>
      </div>

      {/* Formulário nova empresa */}
      {showForm && (
        <div style={card}>
          <div style={sectionLabel}>Nova Empresa</div>
          <form onSubmit={handleCriarEmpresa} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            <div><label style={lbl}>Nome</label><input value={nome} onChange={e => setNome(e.target.value)} style={inp} placeholder="Supermédica RH" required /></div>
            <div>
              <label style={lbl}>Slug (URL)</label>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} style={inp} placeholder="supermedica" required />
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>supermedica.colleto.com.br</div>
            </div>
            <div><label style={lbl}>CNPJ</label><input value={cnpj} onChange={e => setCnpj(e.target.value)} style={inp} placeholder="00.000.000/0001-00" required /></div>
            <div><label style={lbl}>Cor primária</label><input type="color" value={cor} onChange={e => setCor(e.target.value)} style={{ ...inp, height: 42, padding: 4, cursor: 'pointer' }} /></div>
            {errF && <div style={{ ...alertStyle, gridColumn: '1/-1' }}>{errF}</div>}
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Criando…' : 'Criar Empresa'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 48 }}>Carregando…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {empresas.map(e => (
            <div key={e.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '16px 20px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: e.ativo ? '#4ade80' : '#f87171', flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: e.corPrimaria, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{e.nome}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>{e.slug} · {e.cnpj}</div>
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 8, padding: '3px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', background: (STATUS_COB[e.statusCobranca] ?? STATUS_COB.em_dia).b, color: (STATUS_COB[e.statusCobranca] ?? STATUS_COB.em_dia).c }}>
                  {(STATUS_COB[e.statusCobranca] ?? STATUS_COB.em_dia).l}{e.valorMensal != null ? ` · R$ ${e.valorMensal}` : ''}
                </span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{e._count.participantes} participantes · {e._count.campanhas} campanhas</span>
                <button onClick={() => setShowAdmin(showAdmin === e.id ? null : e.id)} style={btnSm}>
                  + Admin
                </button>
                <button onClick={() => gerarApiKey(e.id)} style={btnSm}>
                  🔑 {e.apiKey ? 'Rotacionar API' : 'Gerar API'}
                </button>
                <button onClick={() => abrirCobranca(e)} style={btnSm}>
                  💰 Cobrança
                </button>
                <button onClick={() => handleToggleAtivo(e)} style={{ ...btnSm, color: e.ativo ? '#f87171' : '#4ade80', borderColor: e.ativo ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)' }}>
                  {e.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>

              {/* Form criar admin para esta empresa */}
              {showAdmin === e.id && (
                <div style={{ width: '100%', marginTop: 12, paddingTop: 16, borderTop: '1px solid rgba(59,130,246,0.1)' }}>
                  <div style={{ ...sectionLabel, marginBottom: 12 }}>Criar Admin para {e.nome}</div>
                  <form onSubmit={handleCriarAdmin} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                    <div><label style={lbl}>Matrícula</label><input value={adminMat} onChange={e => setAdminMat(e.target.value)} style={inp} placeholder="admin01" required /></div>
                    <div><label style={lbl}>Nome</label><input value={adminNome} onChange={e => setAdminNome(e.target.value)} style={inp} placeholder="Nome Admin" required /></div>
                    <div><label style={lbl}>E-mail</label><input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} style={inp} placeholder="admin@empresa.com" required /></div>
                    <div><label style={lbl}>Senha</label><input type="password" value={adminSenha} onChange={e => setAdminSenha(e.target.value)} style={inp} placeholder="Senha inicial" required /></div>
                    {errA && <div style={{ ...alertStyle, gridColumn: '1/-1' }}>{errA}</div>}
                    <div style={{ gridColumn: '1/-1' }}>
                      <button type="submit" disabled={savingA} style={btnPrimary}>{savingA ? 'Criando…' : 'Criar Admin'}</button>
                    </div>
                  </form>
                </div>
              )}

              {keyRevelada?.id === e.id && (
                <div style={{ width: '100%', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(59,130,246,0.1)' }}>
                  <div style={{ fontSize: 9, color: 'rgba(96,165,250,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>API key — copie agora (só aparece uma vez)</div>
                  <code style={{ display: 'block', background: '#0d1a2e', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#93c5fd', wordBreak: 'break-all' }}>{keyRevelada.key}</code>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 6, lineHeight: 1.7 }}>
                    POST <b>/api/v1/participantes</b> · header <b>Authorization: Bearer &lt;key&gt;</b><br />
                    body: {'{ "participantes": [{ "matricula": "...", "nome": "...", "email": "..." }] }'}
                  </div>
                </div>
              )}

              {showCobranca === e.id && (
                <div style={{ width: '100%', marginTop: 12, paddingTop: 16, borderTop: '1px solid rgba(59,130,246,0.1)' }}>
                  <div style={{ ...sectionLabel, marginBottom: 12 }}>Cobrança — {e.nome}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
                    <div><label style={lbl}>Valor mensal (R$)</label><input type="number" value={cobValor} onChange={ev => setCobValor(ev.target.value)} style={inp} placeholder="2500" /></div>
                    <div>
                      <label style={lbl}>Status</label>
                      <select value={cobStatus} onChange={ev => setCobStatus(ev.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                        <option value="em_dia"   style={{ background: '#0d1a2e' }}>Em dia</option>
                        <option value="atrasado" style={{ background: '#0d1a2e' }}>Atrasado</option>
                        <option value="cortesia" style={{ background: '#0d1a2e' }}>Cortesia</option>
                      </select>
                    </div>
                    <div><label style={lbl}>Próximo vencimento</label><input type="date" value={cobVenc} onChange={ev => setCobVenc(ev.target.value)} style={inp} /></div>
                  </div>
                  <button onClick={() => salvarCobranca(e.id)} disabled={savingCob} style={{ ...btnPrimary, marginTop: 12 }}>{savingCob ? 'Salvando…' : 'Salvar cobrança'}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const card:         React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 12, padding: '20px 24px', marginBottom: 0 }
const sectionLabel: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(96,165,250,0.55)', marginBottom: 16 }
const lbl:          React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }
const inp:          React.CSSProperties = { width: '100%', height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0d1a2e', color: '#fff', fontSize: 12, padding: '0 12px', outline: 'none', boxSizing: 'border-box' }
const alertStyle:   React.CSSProperties = { background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ff9999' }
const btnPrimary:   React.CSSProperties = { padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }
const btnSm:        React.CSSProperties = { padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(96,165,250,0.25)', background: 'rgba(96,165,250,0.07)', color: 'rgba(96,165,250,0.7)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }
