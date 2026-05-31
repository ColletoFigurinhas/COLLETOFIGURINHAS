'use client'

import { useState, useEffect, useRef } from 'react'

// ── Tipos ─────────────────────────────────────────────────────────
type Figurinha    = { id: number; classificacao: string; tipo: string; imagemUrl: string | null; ativo: boolean }
type Participante = { id: number; matricula: string; nome: string }
type Feedback     = { id: number; msg: string; ok: boolean }

// ── Constantes ────────────────────────────────────────────────────
const CLASSIFICACOES = [
  'COMERCIAL',
  'ALMOXARIFADO',
  'GARANTIA DA QUALIDADE',
  'MARKETING / TI',
  'FINANCEIRO',
  'COMPRAS',
  'RH / SERVIÇOS GERAIS',
  'ESPECIAIS',
]

const TIPOS: Record<string, { label: string; desc: string }> = {
  FUNCIONARIO: { label: 'Funcionário', desc: 'Carta padrão de departamento' },
  GESTOR:      { label: 'Gestor',      desc: 'Carta de gestor do setor (1 por seção)' },
  ESPECIAL:    { label: 'Especial',    desc: 'Aparece aleatoriamente nos pacotes (~10%)' },
  PREMIO:      { label: 'Prêmio',      desc: 'Distribuída manualmente pelo marketing' },
}

// ── Aba: Figurinhas ───────────────────────────────────────────────
type EditState = { id: number; classificacao: string; tipo: string; imagemUrl: string | null }

function AbaFigurinhas() {
  const [figurinhas, setFigurinhas] = useState<Figurinha[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filtro,     setFiltro]     = useState('TODAS')
  const [showForm,   setShowForm]   = useState(false)

  // Form nova carta
  const [classif,   setClassif]   = useState(CLASSIFICACOES[0])
  const [tipo,      setTipo]      = useState('FUNCIONARIO')
  const [file,      setFile]      = useState<File | null>(null)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errForm,   setErrForm]   = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Modal de edição
  const [editando,      setEditando]      = useState<EditState | null>(null)
  const [editClassif,   setEditClassif]   = useState('')
  const [editTipo,      setEditTipo]      = useState('')
  const [editFile,      setEditFile]      = useState<File | null>(null)
  const [editPreview,   setEditPreview]   = useState<string | null>(null)
  const [editUploading, setEditUploading] = useState(false)
  const [editErr,       setEditErr]       = useState('')
  const editFileRef = useRef<HTMLInputElement>(null)

  function abrirEdicao(f: Figurinha) {
    setEditando({ id: f.id, classificacao: f.classificacao, tipo: f.tipo, imagemUrl: f.imagemUrl })
    setEditClassif(f.classificacao)
    setEditTipo(f.tipo)
    setEditFile(null)
    setEditPreview(null)
    setEditErr('')
  }

  function handleEditClassifChange(val: string) {
    setEditClassif(val)
    if (val === 'ESPECIAIS') setEditTipo('ESPECIAL')
    else if (editTipo === 'ESPECIAL' || editTipo === 'PREMIO') setEditTipo('FUNCIONARIO')
  }

  async function salvarEdicao() {
    if (!editando) return
    setEditUploading(true); setEditErr('')
    try {
      let imagemUrl = editando.imagemUrl
      if (editFile) {
        const fd = new FormData(); fd.append('file', editFile)
        const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        if (!up.ok) { setEditErr('Falha no upload.'); setEditUploading(false); return }
        imagemUrl = (await up.json()).url
      }
      const r = await fetch(`/api/admin/figurinhas/${editando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classificacao: editClassif, tipo: editTipo, imagemUrl }),
      })
      if (!r.ok) { setEditErr('Falha ao salvar.'); setEditUploading(false); return }
      setFigurinhas(prev => prev.map(f =>
        f.id === editando.id
          ? { ...f, classificacao: editClassif, tipo: editTipo, imagemUrl: imagemUrl ?? f.imagemUrl }
          : f
      ))
      setEditando(null)
    } catch { setEditErr('Erro inesperado.') }
    setEditUploading(false)
  }

  async function load() {
    setLoading(true)
    const r = await fetch('/api/admin/figurinhas')
    setFigurinhas(await r.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Quando classificação muda para ESPECIAIS, sugere ESPECIAL como padrão
  function handleClassifChange(val: string) {
    setClassif(val)
    if (val === 'ESPECIAIS') setTipo('ESPECIAL')
    else if (tipo === 'ESPECIAL' || tipo === 'PREMIO') setTipo('FUNCIONARIO')
  }

  async function handleCadastrar() {
    if (!file) { setErrForm('Selecione uma imagem.'); return }
    setUploading(true); setErrForm('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!up.ok) { setErrForm('Falha no upload.'); setUploading(false); return }
      const { url } = await up.json()

      const cr = await fetch('/api/admin/figurinhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classificacao: classif, tipo, imagemUrl: url }),
      })
      if (!cr.ok) { setErrForm('Falha ao cadastrar.'); setUploading(false); return }

      // Reset form
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      setShowForm(false)
      load()
    } catch { setErrForm('Erro inesperado.') }
    setUploading(false)
  }

  async function toggleAtivo(id: number, ativo: boolean) {
    setFigurinhas(prev => prev.map(f => f.id === id ? { ...f, ativo: !f.ativo } : f))
    await fetch(`/api/admin/especiais/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !ativo }),
    })
  }

  const todasClassifs = ['TODAS', ...CLASSIFICACOES]
  const lista = filtro === 'TODAS' ? figurinhas : figurinhas.filter(f => f.classificacao === filtro)
  const ativas   = figurinhas.filter(f => f.ativo).length
  const inativas = figurinhas.length - ativas

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Figurinhas</h2>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: 1 }}>
            <span style={{ color: '#4ade80' }}>{ativas} ativas</span>
            {' · '}
            <span style={{ color: '#f87171' }}>{inativas} inativas</span>
            {' · '}{figurinhas.length} total
          </div>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setErrForm('') }}
          style={{
            padding: '9px 20px', borderRadius: 10, border: 'none',
            background: showForm ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#009c3b,#006b29)',
            color: showForm ? 'rgba(255,255,255,0.5)' : '#f5c800',
            fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {showForm ? '✕ Cancelar' : '+ Nova Carta'}
        </button>
      </div>

      {/* Formulário nova carta */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,192,64,0.2)',
          borderRadius: 14, padding: 24, marginBottom: 24,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(240,192,64,0.55)', marginBottom: 18 }}>
            Cadastrar Nova Carta
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            {/* Classificação */}
            <div>
              <label style={lbl}>Classificação / Departamento</label>
              <select
                value={classif}
                onChange={e => handleClassifChange(e.target.value)}
                style={sel}
              >
                {CLASSIFICACOES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label style={lbl}>Tipo de Carta</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                style={sel}
              >
                {Object.entries(TIPOS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} — {v.desc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Upload imagem */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            {preview && (
              <img src={preview} alt="" style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setFile(f); setErrForm('')
                  if (preview) URL.revokeObjectURL(preview)
                  setPreview(URL.createObjectURL(f))
                }}
              />
              <button onClick={() => fileRef.current?.click()} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)',
                borderRadius: 8, color: file ? '#fff' : 'rgba(255,255,255,0.4)',
                padding: '9px 16px', cursor: 'pointer', fontSize: 11,
              }}>
                {file ? `📎 ${file.name}` : '📎 Escolher imagem…'}
              </button>
            </div>
          </div>

          {errForm && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 12 }}>{errForm}</div>}

          <button
            onClick={handleCadastrar}
            disabled={!file || uploading}
            style={{
              padding: '10px 28px', borderRadius: 10, border: 'none',
              background: file && !uploading ? 'linear-gradient(135deg,#009c3b,#006b29)' : 'rgba(0,156,59,0.15)',
              color: '#f5c800', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              cursor: file && !uploading ? 'pointer' : 'not-allowed',
            }}
          >
            {uploading ? 'Cadastrando…' : 'Cadastrar Carta'}
          </button>
        </div>
      )}

      {/* Filtros por classificação */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {todasClassifs.map(c => {
          const count = c === 'TODAS' ? figurinhas.length : figurinhas.filter(f => f.classificacao === c).length
          if (c !== 'TODAS' && count === 0) return null
          return (
            <button key={c} onClick={() => setFiltro(c)} style={{
              padding: '5px 13px', borderRadius: 20,
              border: `1px solid ${filtro === c ? 'rgba(245,200,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: filtro === c ? 'rgba(245,200,0,0.1)' : 'transparent',
              color: filtro === c ? '#f5c800' : 'rgba(255,255,255,0.35)',
              fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {c} <span style={{ opacity: 0.6 }}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 48 }}>Carregando…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
          {lista.map(f => (
            <div key={f.id}>
              {/* Card */}
              <div style={{
                aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                opacity: f.ativo ? 1 : 0.35,
                transition: 'opacity 0.2s',
              }}>
                {f.imagemUrl
                  ? <img src={f.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🃏</div>
                }
              </div>

              {/* Tipo badge */}
              {f.tipo !== 'FUNCIONARIO' && (
                <div style={{ textAlign: 'center', fontSize: 7, marginTop: 3, letterSpacing: 0.5, textTransform: 'uppercase', color: f.tipo === 'GESTOR' ? '#f5c800' : '#c084fc' }}>
                  {f.tipo === 'GESTOR' ? '★ Gestor' : '✦ Especial'}
                </div>
              )}

              {/* Toggle + Editar */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 6 }}>
                {/* Toggle ativo/inativo */}
                <button
                  onClick={() => toggleAtivo(f.id, f.ativo)}
                  title={f.ativo ? 'Ativa — clique para desativar' : 'Inativa — clique para ativar'}
                  style={{
                    width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: f.ativo
                      ? 'linear-gradient(135deg,#16a34a,#15803d)'
                      : 'linear-gradient(135deg,#dc2626,#b91c1c)',
                    position: 'relative', transition: 'background 0.25s', flexShrink: 0,
                    boxShadow: f.ativo
                      ? '0 0 10px rgba(22,163,74,0.55)'
                      : '0 0 10px rgba(220,38,38,0.45)',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3,
                    left: f.ativo ? 22 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.25s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }} />
                </button>

                {/* Botão editar */}
                <button
                  onClick={() => abrirEdicao(f)}
                  title="Editar carta"
                  style={{
                    width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                    fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, lineHeight: 1,
                  }}
                >
                  ✎
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal de edição ── */}
      {editando && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setEditando(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(240,192,64,0.55)', marginBottom: 18 }}>
              Editar Carta #{editando.id}
            </div>

            {/* Preview atual + novo */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginBottom: 4, letterSpacing: 1 }}>ATUAL</div>
                {editando.imagemUrl
                  ? <img src={editando.imagemUrl} alt="" style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
                  : <div style={{ width: 64, height: 96, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🃏</div>
                }
              </div>
              {editPreview && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: 'rgba(74,222,128,0.7)', marginBottom: 4, letterSpacing: 1 }}>NOVA</div>
                  <img src={editPreview} alt="" style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(74,222,128,0.35)' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    setEditFile(f)
                    if (editPreview) URL.revokeObjectURL(editPreview)
                    setEditPreview(URL.createObjectURL(f))
                  }}
                />
                <button onClick={() => editFileRef.current?.click()} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.18)',
                  borderRadius: 8, color: editFile ? '#fff' : 'rgba(255,255,255,0.35)',
                  padding: '8px 14px', cursor: 'pointer', fontSize: 11, width: '100%', textAlign: 'left',
                }}>
                  {editFile ? `📎 ${editFile.name}` : '📎 Trocar imagem…'}
                </button>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>Deixe em branco para manter a atual</div>
              </div>
            </div>

            {/* Classificação */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Classificação / Departamento</label>
              <select value={editClassif} onChange={e => handleEditClassifChange(e.target.value)} style={sel}>
                {CLASSIFICACOES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Tipo */}
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Tipo de Carta</label>
              <select
                value={editTipo}
                onChange={e => setEditTipo(e.target.value)}
                style={sel}
              >
                {Object.entries(TIPOS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} — {v.desc}</option>
                ))}
              </select>
            </div>

            {editErr && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 12 }}>{editErr}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditando(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={editUploading}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: editUploading ? 'rgba(0,156,59,0.2)' : 'linear-gradient(135deg,#009c3b,#006b29)', color: '#f5c800', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: editUploading ? 'not-allowed' : 'pointer' }}
              >
                {editUploading ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Aba: Pacotes ──────────────────────────────────────────────────
function AbaPacotes() {
  const [query,      setQuery]      = useState('')
  const [resultados, setResultados] = useState<Participante[]>([])
  const [searching,  setSearching]  = useState(false)
  const [sending,    setSending]    = useState<number | null>(null)
  const [feedback,   setFeedback]   = useState<Feedback | null>(null)
  const [modal,      setModal]      = useState<{ id: number; nome: string } | null>(null)
  const [descPremio, setDescPremio] = useState('')

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    const r = await fetch(`/api/admin/participantes?q=${encodeURIComponent(query.trim())}`)
    setResultados(await r.json())
    setSearching(false)
  }

  async function darPacote(participanteId: number, tipo: 'PLUS' | 'PREMIUM', descricao?: string) {
    setSending(participanteId)
    const r = await fetch('/api/admin/pacotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participanteId, tipo, descricaoPremio: descricao }),
    })
    const data = await r.json()
    setSending(null)
    setFeedback({ id: participanteId, msg: data.ok ? 'Pacote enviado!' : (data.error ?? 'Erro'), ok: !!data.ok })
    setTimeout(() => setFeedback(null), 3500)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Distribuir Pacotes</h2>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: 1 }}>
          Prata = Plus (15 figurinhas) · Ouro = Premium (15 figurinhas + prêmio físico)
        </div>
      </div>

      <form onSubmit={buscar} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input
          type="text" value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Nome ou matrícula do participante…"
          style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, padding: '0 16px', outline: 'none' }}
        />
        <button type="submit" disabled={searching} style={{
          height: 44, padding: '0 24px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg,#009c3b,#006b29)',
          color: '#f5c800', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
          cursor: searching ? 'not-allowed' : 'pointer',
        }}>
          {searching ? '…' : 'Buscar'}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {resultados.length === 0 && query && !searching && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 32, fontSize: 12 }}>
            Nenhum participante encontrado.
          </div>
        )}
        {resultados.map(p => {
          const fb = feedback?.id === p.id ? feedback : null
          const isSending = sending === p.id
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '14px 18px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nome}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginTop: 2 }}>#{p.matricula}</div>
              </div>
              {fb ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: fb.ok ? '#4ade80' : '#f87171' }}>{fb.msg}</span>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => darPacote(p.id, 'PLUS')}
                    disabled={isSending}
                    style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(192,192,255,0.3)', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: isSending ? 'not-allowed' : 'pointer' }}
                  >
                    🥈 Prata
                  </button>
                  <button
                    onClick={() => { setModal({ id: p.id, nome: p.nome }); setDescPremio('') }}
                    disabled={isSending}
                    style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(245,200,0,0.35)', background: 'rgba(245,200,0,0.07)', color: '#f5c800', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: isSending ? 'not-allowed' : 'pointer' }}
                  >
                    🥇 Ouro
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f1623', border: '1px solid rgba(245,200,0,0.25)', borderRadius: 16, padding: 32, width: 420, maxWidth: '90vw' }}>
            <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(245,200,0,0.55)', marginBottom: 8 }}>Pacote Ouro — Premium</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal.nome}</div>
            <label style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
              Prêmio físico
            </label>
            <input
              type="text" value={descPremio}
              onChange={e => setDescPremio(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && descPremio.trim()) { darPacote(modal.id, 'PREMIUM', descPremio); setModal(null) } }}
              placeholder="Ex: Barra de chocolate Lacta 90g"
              autoFocus
              style={{ width: '100%', height: 42, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, padding: '0 14px', outline: 'none', boxSizing: 'border-box', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                disabled={!descPremio.trim()}
                onClick={() => { darPacote(modal.id, 'PREMIUM', descPremio); setModal(null) }}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: descPremio.trim() ? 'linear-gradient(135deg,#b45309,#92400e)' : 'rgba(180,83,9,0.25)', color: '#f5c800', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: descPremio.trim() ? 'pointer' : 'not-allowed' }}
              >
                Enviar pacote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Estilos compartilhados ────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2,
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 7,
}
const sel: React.CSSProperties = {
  width: '100%', height: 42, borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff', fontSize: 12, padding: '0 12px',
  outline: 'none', cursor: 'pointer',
}

// ── Página principal ──────────────────────────────────────────────
type Tab = 'figurinhas' | 'pacotes'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('figurinhas')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'figurinhas', label: 'Figurinhas' },
    { id: 'pacotes',    label: 'Pacotes' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
            color: tab === t.id ? '#f5c800' : 'rgba(255,255,255,0.3)',
            padding: '10px 18px',
            borderBottom: `2px solid ${tab === t.id ? '#f5c800' : 'transparent'}`,
            transition: 'all 0.2s', marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'figurinhas' && <AbaFigurinhas />}
      {tab === 'pacotes'    && <AbaPacotes />}
    </div>
  )
}
