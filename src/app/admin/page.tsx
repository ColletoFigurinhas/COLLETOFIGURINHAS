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
  'PREMIO PRATA',
  'PREMIO OURO',
]

const TIPOS: Record<string, { label: string; desc: string }> = {
  FUNCIONARIO:    { label: 'Funcionário',  desc: 'Carta padrão de departamento' },
  GESTOR:         { label: 'Gestor',       desc: 'Carta de gestor do setor (1 por seção)' },
  ESPECIAL:       { label: 'Especial',     desc: 'Aparece aleatoriamente nos pacotes (~10%)' },
  'PREMIO PRATA': { label: 'Prêmio Prata', desc: 'Carta exclusiva do pacote Prata (5 normais + 1 prata)' },
  'PREMIO OURO':  { label: 'Prêmio Ouro',  desc: 'Carta exclusiva do pacote Ouro (5 normais + 1 prata + 1 ouro)' },
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
    if (val === 'ESPECIAIS')     setEditTipo('ESPECIAL')
    else if (val === 'PREMIO PRATA') setEditTipo('PREMIO PRATA')
    else if (val === 'PREMIO OURO')  setEditTipo('PREMIO OURO')
    else if (['ESPECIAL', 'PREMIO PRATA', 'PREMIO OURO'].includes(editTipo)) setEditTipo('FUNCIONARIO')
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
    if (val === 'ESPECIAIS')     setTipo('ESPECIAL')
    else if (val === 'PREMIO PRATA') setTipo('PREMIO PRATA')
    else if (val === 'PREMIO OURO')  setTipo('PREMIO OURO')
    else if (['ESPECIAL', 'PREMIO PRATA', 'PREMIO OURO'].includes(tipo)) setTipo('FUNCIONARIO')
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
                  <option key={c} value={c} style={opt}>{c}</option>
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
                  <option key={k} value={k} style={opt}>{v.label} — {v.desc}</option>
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
                {CLASSIFICACOES.map(c => <option key={c} value={c} style={opt}>{c}</option>)}
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
                  <option key={k} value={k} style={opt}>{v.label} — {v.desc}</option>
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
type CartaPremio = { id: number; imagemUrl: string | null; ativo: boolean }
type TipoModal   = 'PLUS' | 'PREMIUM'

function AbaPacotes() {
  const [query,            setQuery]            = useState('')
  const [resultados,       setResultados]       = useState<Participante[]>([])
  const [searching,        setSearching]        = useState(false)
  const [sending,          setSending]          = useState<number | null>(null)
  const [feedback,         setFeedback]         = useState<Feedback | null>(null)
  const [modal,            setModal]            = useState<{ id: number; nome: string; tipo: TipoModal } | null>(null)
  const [cartasPrata,      setCartasPrata]      = useState<CartaPremio[]>([])
  const [cartasOuro,       setCartasOuro]       = useState<CartaPremio[]>([])
  const [prataSel,         setPrataSel]         = useState<number | null>(null)
  const [ouroSel,          setOuroSel]          = useState<number | null>(null)
  const [loadingCartas,    setLoadingCartas]    = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (!q) { setResultados([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const r = await fetch(`/api/admin/participantes?q=${encodeURIComponent(q)}`)
      setResultados(await r.json())
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function abrirModal(p: Participante, tipo: TipoModal) {
    setModal({ id: p.id, nome: p.nome, tipo })
    setPrataSel(null); setOuroSel(null)
    setLoadingCartas(true)
    const [prataDados, ouroDados] = await Promise.all([
      fetch('/api/admin/figurinhas?tipo=PREMIO%20PRATA').then(r => r.json()),
      tipo === 'PREMIUM' ? fetch('/api/admin/figurinhas?tipo=PREMIO%20OURO').then(r => r.json()) : Promise.resolve([]),
    ])
    setCartasPrata(Array.isArray(prataDados) ? prataDados.filter((f: CartaPremio) => f.ativo) : [])
    setCartasOuro(Array.isArray(ouroDados)  ? ouroDados.filter((f: CartaPremio) => f.ativo)  : [])
    setLoadingCartas(false)
  }

  async function darPacote(participanteId: number, tipo: 'PADRAO' | 'PLUS' | 'PREMIUM', premioPrataId?: number, premioOuroId?: number) {
    setSending(participanteId)
    const r = await fetch('/api/admin/pacotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participanteId, tipo, premioPrataId, premioOuroId }),
    })
    const data = await r.json()
    setSending(null)
    setFeedback({ id: participanteId, msg: data.ok ? 'Pacote enviado!' : (data.error ?? 'Erro'), ok: !!data.ok })
    setTimeout(() => setFeedback(null), 3500)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Distribuir Pacotes</h2>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: 1 }}>
          Padrão = 14 normais · Prata = 5 normais + 1 prêmio prata · Ouro = 5 normais + 1 prata + 1 ouro
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          type="text" value={query} autoFocus
          onChange={e => setQuery(e.target.value)}
          placeholder="Digite nome ou matrícula para buscar…"
          style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, padding: '0 44px 0 16px', outline: 'none', boxSizing: 'border-box' }}
        />
        {searching && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>…</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {resultados.length === 0 && query.trim() && !searching && (
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
                    onClick={() => darPacote(p.id, 'PADRAO')}
                    disabled={isSending}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: isSending ? 'not-allowed' : 'pointer' }}
                  >
                    📦 Padrão
                  </button>
                  <button
                    onClick={() => abrirModal(p, 'PLUS')}
                    disabled={isSending}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(192,192,255,0.3)', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: isSending ? 'not-allowed' : 'pointer' }}
                  >
                    🥈 Prata
                  </button>
                  <button
                    onClick={() => abrirModal(p, 'PREMIUM')}
                    disabled={isSending}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(245,200,0,0.35)', background: 'rgba(245,200,0,0.07)', color: '#f5c800', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: isSending ? 'not-allowed' : 'pointer' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f1623', border: `1px solid ${modal.tipo === 'PREMIUM' ? 'rgba(245,200,0,0.25)' : 'rgba(165,180,252,0.25)'}`, borderRadius: 16, padding: 28, width: 540, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: modal.tipo === 'PREMIUM' ? 'rgba(245,200,0,0.55)' : 'rgba(165,180,252,0.55)', marginBottom: 4 }}>
                {modal.tipo === 'PREMIUM' ? '🥇 Pacote Ouro' : '🥈 Pacote Prata'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{modal.nome}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                {modal.tipo === 'PREMIUM' ? '5 normais + 1 prêmio prata + 1 prêmio ouro' : '5 normais + 1 prêmio prata'}
              </div>
            </div>

            {loadingCartas ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 32 }}>Carregando…</div>
            ) : (
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Seletor Prêmio Prata */}
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#a5b4fc', marginBottom: 10 }}>
                    🥈 Carta Prêmio Prata
                  </label>
                  {cartasPrata.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: '12px 0' }}>
                      Nenhuma carta Prêmio Prata cadastrada. Vá em Figurinhas → Nova Carta → Classificação: PREMIO PRATA.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                      {cartasPrata.map(c => (
                        <button key={c.id} onClick={() => setPrataSel(c.id === prataSel ? null : c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <div style={{ aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden', position: 'relative', border: prataSel === c.id ? '2.5px solid #a5b4fc' : '2px solid rgba(255,255,255,0.08)', boxShadow: prataSel === c.id ? '0 0 12px rgba(165,180,252,0.5)' : 'none', transition: 'all 0.15s' }}>
                            {c.imagemUrl ? <img src={c.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🥈</div>}
                            {prataSel === c.id && <div style={{ position: 'absolute', top: 3, right: 3, background: '#a5b4fc', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seletor Prêmio Ouro — apenas pacote PREMIUM */}
                {modal.tipo === 'PREMIUM' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#f5c800', marginBottom: 10 }}>
                      🥇 Carta Prêmio Ouro
                    </label>
                    {cartasOuro.length === 0 ? (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: '12px 0' }}>
                        Nenhuma carta Prêmio Ouro cadastrada. Vá em Figurinhas → Nova Carta → Classificação: PREMIO OURO.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                        {cartasOuro.map(c => (
                          <button key={c.id} onClick={() => setOuroSel(c.id === ouroSel ? null : c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <div style={{ aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden', position: 'relative', border: ouroSel === c.id ? '2.5px solid #f5c800' : '2px solid rgba(255,255,255,0.08)', boxShadow: ouroSel === c.id ? '0 0 12px rgba(245,200,0,0.5)' : 'none', transition: 'all 0.15s' }}>
                              {c.imagemUrl ? <img src={c.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🥇</div>}
                              {ouroSel === c.id && <div style={{ position: 'absolute', top: 3, right: 3, background: '#f5c800', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</div>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                disabled={!prataSel || (modal.tipo === 'PREMIUM' && !ouroSel)}
                onClick={() => {
                  darPacote(modal.id, modal.tipo === 'PREMIUM' ? 'PREMIUM' : 'PLUS', prataSel!, ouroSel ?? undefined)
                  setModal(null)
                }}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: (prataSel && (modal.tipo === 'PLUS' || ouroSel))
                    ? modal.tipo === 'PREMIUM' ? 'linear-gradient(135deg,#b45309,#92400e)' : 'linear-gradient(135deg,#4338ca,#3730a3)'
                    : 'rgba(255,255,255,0.05)',
                  color: modal.tipo === 'PREMIUM' ? '#f5c800' : '#a5b4fc',
                  fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                  cursor: (prataSel && (modal.tipo === 'PLUS' || ouroSel)) ? 'pointer' : 'not-allowed',
                }}
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

// ── Aba: Log ──────────────────────────────────────────────────────
type LogEntry = {
  id: number
  participanteNome: string
  matricula: string
  tipoPacote: string
  distribuidoPor: string
  criadoEm: string
}

function AbaLog() {
  const [logs,    setLogs]    = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/logs').then(r => r.json()).then(d => { setLogs(d); setLoading(false) })
  }, [])

  const tipoLabel: Record<string, string> = {
    PADRAO:  '📦 Padrão',
    PLUS:    '🥈 Prata',
    PREMIUM: '🥇 Ouro',
    PADRAO_AUTO: '📦 Padrão (auto)',
  }
  const tipoCor: Record<string, string> = {
    PADRAO:  'rgba(255,255,255,0.55)',
    PLUS:    '#a5b4fc',
    PREMIUM: '#f5c800',
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Log de Distribuições</h2>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: 1 }}>
          Últimas 200 distribuições manuais
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 48 }}>Carregando…</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 48 }}>Nenhuma distribuição manual registrada ainda.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {logs.map(l => (
            <div key={l.id} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              alignItems: 'center', gap: 16,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '12px 16px',
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{l.participanteNome}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginLeft: 8 }}>#{l.matricula}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: tipoCor[l.tipoPacote] ?? '#fff', whiteSpace: 'nowrap' }}>
                {tipoLabel[l.tipoPacote] ?? l.tipoPacote}
              </span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{l.distribuidoPor}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                  {new Date(l.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
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
  background: '#1a2030',
  color: '#fff', fontSize: 12, padding: '0 12px',
  outline: 'none', cursor: 'pointer',
}
const opt: React.CSSProperties = { background: '#1a2030', color: '#fff' }

// ── Aba: Andamento ────────────────────────────────────────────────
type ParticipanteAndamento = {
  id: number
  nome: string
  matricula: string
  totalColetado: number
  totalFigurinhas: number
  percentualGeral: number
  trocasEnviadas: number
  trocasRecebidas: number
  porDepartamento: { classificacao: string; coletado: number; total: number; percentual: number }[]
}

const COR_DEPTO: Record<string, string> = {
  'COMERCIAL':           '#60a5fa',
  'ALMOXARIFADO':        '#34d399',
  'GARANTIA DA QUALIDADE': '#f59e0b',
  'MARKETING / TI':      '#c084fc',
  'FINANCEIRO':          '#f87171',
  'COMPRAS':             '#fb923c',
  'RH / SERVIÇOS GERAIS': '#38bdf8',
  'ESPECIAIS':           '#f5c800',
}

function BarraProgresso({ valor, cor, height = 6 }: { valor: number; cor: string; height?: number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: height, overflow: 'hidden', height }}>
      <div style={{
        width: `${valor}%`, height: '100%', borderRadius: height,
        background: cor, transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

function AbaAndamento() {
  const [dados,     setDados]     = useState<{ totalFigurinhas: number; participantes: ParticipanteAndamento[] } | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [selecionado, setSelecionado] = useState<ParticipanteAndamento | null>(null)
  const [busca,     setBusca]     = useState('')

  useEffect(() => {
    fetch('/api/admin/andamento')
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false) })
  }, [])

  const lista = (dados?.participantes ?? []).filter(p =>
    !busca.trim() ||
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.matricula.includes(busca)
  )

  if (loading) return (
    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 48 }}>Carregando…</div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Andamento dos Álbuns</h2>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: 1 }}>
            {lista.length} participante{lista.length !== 1 ? 's' : ''} · {dados?.totalFigurinhas ?? 0} figurinhas no álbum
          </div>
        </div>
        <input
          type="text" value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou matrícula…"
          style={{ height: 38, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, padding: '0 14px', outline: 'none', width: 240 }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lista.map(p => (
          <button
            key={p.id}
            onClick={() => setSelecionado(p)}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 50px 50px 64px',
              alignItems: 'center', gap: 16,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '14px 18px', cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.nome}</div>
              <div style={{ marginTop: 6 }}>
                <BarraProgresso valor={p.percentualGeral} cor='#009c3b' height={5} />
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: 1 }}>
                #{p.matricula}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: p.percentualGeral >= 80 ? '#4ade80' : p.percentualGeral >= 50 ? '#f5c800' : 'rgba(255,255,255,0.6)' }}>
                {p.percentualGeral}%
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 }}>
                {p.totalColetado}/{p.totalFigurinhas}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#34d399' }}>{p.trocasEnviadas}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 }}>enviadas</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#60a5fa' }}>{p.trocasRecebidas}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 }}>recebidas</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
              ver detalhes →
            </div>
          </button>
        ))}

        {lista.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 48, fontSize: 12 }}>
            Nenhum participante encontrado.
          </div>
        )}
      </div>

      {/* Modal detalhe */}
      {selecionado && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelecionado(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Cabeçalho */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(245,200,0,0.5)', marginBottom: 4 }}>
                Detalhes do álbum
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{selecionado.nome}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginTop: 2 }}>#{selecionado.matricula}</div>
            </div>

            {/* Resumo geral */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
              {[
                { label: 'Progresso geral', valor: `${selecionado.percentualGeral}%`,                                  cor: selecionado.percentualGeral >= 80 ? '#4ade80' : selecionado.percentualGeral >= 50 ? '#f5c800' : '#fff' },
                { label: 'Figurinhas',      valor: `${selecionado.totalColetado}/${selecionado.totalFigurinhas}`,       cor: '#fff' },
                { label: 'Trocas enviadas', valor: String(selecionado.trocasEnviadas),                                 cor: '#34d399' },
                { label: 'Trocas recebidas',valor: String(selecionado.trocasRecebidas),                                cor: '#60a5fa' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: item.cor }}>{item.valor}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Barra geral */}
            <div style={{ marginBottom: 28 }}>
              <BarraProgresso valor={selecionado.percentualGeral} cor='#009c3b' height={8} />
            </div>

            {/* Por departamento */}
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
              Por Departamento
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selecionado.porDepartamento
                .slice()
                .sort((a, b) => b.percentual - a.percentual)
                .map(d => {
                  const cor = COR_DEPTO[d.classificacao] ?? '#94a3b8'
                  return (
                    <div key={d.classificacao}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cor, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{d.classificacao}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{d.coletado}/{d.total}</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: cor, minWidth: 38, textAlign: 'right' }}>{d.percentual}%</span>
                        </div>
                      </div>
                      <BarraProgresso valor={d.percentual} cor={cor} height={5} />
                    </div>
                  )
                })}
            </div>

            <button
              onClick={() => setSelecionado(null)}
              style={{ marginTop: 28, width: '100%', height: 42, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Aba: Prêmios ──────────────────────────────────────────────────
type PremioItem = {
  id:          number
  quantidade:  number
  entregue:    boolean
  entregueEm:  string | null
  entregueBy:  string | null
  participante:{ id: number; nome: string; matricula: string }
  figurinha:   { id: number; classificacao: string; tipo: string; imagemUrl: string | null }
}

function AbaPremios() {
  const [itens,    setItens]    = useState<PremioItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [filtro,   setFiltro]   = useState<'todos' | 'pendente' | 'entregue'>('todos')
  const [marcando, setMarcando] = useState<number | null>(null)

  async function carregar(q = query) {
    setLoading(true)
    try {
      const r    = await fetch(`/api/admin/premios${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
      const data = await r.json()
      setItens(Array.isArray(data) ? data : [])
    } catch {
      setItens([])
    }
    setLoading(false)
  }

  useEffect(() => { carregar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => carregar(query), 300)
    return () => clearTimeout(t)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  async function marcarEntregue(item: PremioItem) {
    setMarcando(item.id)
    await fetch(`/api/admin/premios/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entregue: !item.entregue }),
    })
    await carregar()
    setMarcando(null)
  }

  const lista = itens.filter(i =>
    filtro === 'todos'    ? true :
    filtro === 'pendente' ? !i.entregue :
    i.entregue
  )

  const totalPendente = itens.filter(i => !i.entregue).length
  const totalEntregue = itens.filter(i => i.entregue).length

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Prêmios</h2>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: 1 }}>
          <span style={{ color: '#fbbf24' }}>{totalPendente} pendentes</span>
          {' · '}
          <span style={{ color: '#4ade80' }}>{totalEntregue} entregues</span>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filtrar por nome ou matrícula…"
          style={{ flex: 1, minWidth: 180, height: 38, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1a2030', color: '#fff', fontSize: 12, padding: '0 12px', outline: 'none' }}
        />
        {(['todos','pendente','entregue'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            background: filtro === f ? (f === 'entregue' ? 'rgba(74,222,128,0.15)' : f === 'pendente' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.04)',
            color: filtro === f ? (f === 'entregue' ? '#4ade80' : f === 'pendente' ? '#fbbf24' : '#fff') : 'rgba(255,255,255,0.35)',
          }}>
            {f === 'todos' ? 'Todos' : f === 'pendente' ? 'Pendentes' : 'Entregues'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 48 }}>Carregando…</div>
      ) : lista.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 48, fontSize: 12 }}>Nenhum prêmio encontrado.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lista.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: item.entregue ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${item.entregue ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12, padding: '12px 16px',
            }}>
              {/* Minicard */}
              <div style={{
                width: 40, height: 54, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
                border: `1.5px solid ${item.figurinha.classificacao === 'PREMIO OURO' ? 'rgba(245,158,11,0.5)' : 'rgba(203,213,225,0.4)'}`,
                background: item.figurinha.classificacao === 'PREMIO OURO' ? '#78350f' : '#1e293b',
                position: 'relative',
              }}>
                {item.figurinha.imagemUrl
                  ? <img src={item.figurinha.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {item.figurinha.classificacao === 'PREMIO OURO' ? '🥇' : '🥈'}
                    </div>
                }
                {item.entregue && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>✓</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.participante.nome}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginTop: 2 }}>
                  #{item.participante.matricula} · {item.figurinha.classificacao}
                  {item.quantidade > 1 && ` · ×${item.quantidade}`}
                </div>
                {item.entregue && item.entregueBy && (
                  <div style={{ fontSize: 9, color: '#4ade80', marginTop: 3 }}>
                    Entregue por {item.entregueBy} · {new Date(item.entregueEm!).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>

              {/* Botão */}
              <button
                disabled={marcando === item.id}
                onClick={() => marcarEntregue(item)}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0,
                  background: item.entregue ? 'rgba(255,255,255,0.05)' : 'rgba(74,222,128,0.15)',
                  color: item.entregue ? 'rgba(255,255,255,0.3)' : '#4ade80',
                  transition: 'all 0.15s',
                }}
              >
                {marcando === item.id ? '…' : item.entregue ? '✓ Entregue' : 'Marcar entregue'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────
type Tab = 'figurinhas' | 'pacotes' | 'log' | 'andamento' | 'premios'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('figurinhas')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'figurinhas', label: 'Figurinhas' },
    { id: 'pacotes',    label: 'Pacotes' },
    { id: 'premios',    label: 'Prêmios' },
    { id: 'log',        label: 'Log' },
    { id: 'andamento',  label: 'Andamento' },
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
      {tab === 'premios'    && <AbaPremios />}
      {tab === 'log'        && <AbaLog />}
      {tab === 'andamento'  && <AbaAndamento />}
    </div>
  )
}
