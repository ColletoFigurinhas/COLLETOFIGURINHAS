'use client'

import { useState, useEffect, useRef } from 'react'

type Figurinha = { id: number; classificacao: string; tipo: string; imagemUrl: string | null; ativo: boolean }

const CLASSIFICACOES = [
  'GRUPO A',
  'GRUPO B',
  'GRUPO C',
  'GRUPO D',
  'ESPECIAIS',
  'PREMIO PRATA',
  'PREMIO OURO',
]

const TIPOS: Record<string, { label: string; desc: string }> = {
  FUNCIONARIO:    { label: 'Padrão',       desc: 'Carta padrão do grupo' },
  GESTOR:         { label: 'Destaque',     desc: 'Carta de destaque (1 por grupo)' },
  ESPECIAL:       { label: 'Especial',     desc: 'Aparece aleatoriamente (~10%)' },
  'PREMIO PRATA': { label: 'Prêmio Prata', desc: 'Carta exclusiva do pacote Prata' },
  'PREMIO OURO':  { label: 'Prêmio Ouro',  desc: 'Carta exclusiva do pacote Ouro' },
}

type EditState = { id: number; classificacao: string; tipo: string; imagemUrl: string | null }

export default function AdminPage() {
  const [figurinhas, setFigurinhas] = useState<Figurinha[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filtro,     setFiltro]     = useState('TODAS')
  const [showForm,   setShowForm]   = useState(false)

  const [classif,      setClassif]      = useState(CLASSIFICACOES[0])
  const [tipo,         setTipo]         = useState('FUNCIONARIO')
  const [fileVerde,    setFileVerde]    = useState<File | null>(null)
  const [fileAmarelo,  setFileAmarelo]  = useState<File | null>(null)
  const [prevVerde,    setPrevVerde]    = useState<string | null>(null)
  const [prevAmarelo,  setPrevAmarelo]  = useState<string | null>(null)
  const [file,         setFile]         = useState<File | null>(null)
  const [preview,      setPreview]      = useState<string | null>(null)
  const [uploading,    setUploading]    = useState(false)
  const [errForm,      setErrForm]      = useState('')
  const fileRef        = useRef<HTMLInputElement>(null)
  const fileVerdeRef   = useRef<HTMLInputElement>(null)
  const fileAmareloRef = useRef<HTMLInputElement>(null)

  const isFuncionario = tipo === 'FUNCIONARIO'

  const [editando,      setEditando]      = useState<EditState | null>(null)
  const [editClassif,   setEditClassif]   = useState('')
  const [editTipo,      setEditTipo]      = useState('')
  const [editFile,      setEditFile]      = useState<File | null>(null)
  const [editPreview,   setEditPreview]   = useState<string | null>(null)
  const [editUploading, setEditUploading] = useState(false)
  const [editErr,       setEditErr]       = useState('')
  const editFileRef = useRef<HTMLInputElement>(null)

  const [deletandoId, setDeletandoId] = useState<number | null>(null)
  const [deleteErr,   setDeleteErr]   = useState<string>('')

  async function uploadErroMsg(res: Response): Promise<string> {
    if (res.status === 413) return 'Arquivo muito grande.'
    if (res.status === 401) return 'Sessão expirada — faça login novamente.'
    const text = await res.text().catch(() => '')
    try {
      const j = JSON.parse(text)
      return `(${res.status}) ${(j.detail ?? j.error ?? text) || 'erro desconhecido'}`
    } catch {
      return `(${res.status}) ${text.slice(0, 200) || 'erro desconhecido'}`
    }
  }

  async function handleDeletar(id: number) {
    setDeleteErr('')
    const r = await fetch(`/api/admin/figurinhas/${id}`, { method: 'DELETE' })
    if (!r.ok) {
      const body = await r.json().catch(() => ({}))
      setDeleteErr(body.error ?? 'Erro ao deletar.')
      setDeletandoId(null)
      return
    }
    setFigurinhas(prev => prev.filter(f => f.id !== id))
    setDeletandoId(null)
  }

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
    if (val === 'ESPECIAIS')          setEditTipo('ESPECIAL')
    else if (val === 'PREMIO PRATA')  setEditTipo('PREMIO PRATA')
    else if (val === 'PREMIO OURO')   setEditTipo('PREMIO OURO')
    else if (['ESPECIAL', 'PREMIO PRATA', 'PREMIO OURO'].includes(editTipo)) setEditTipo('FUNCIONARIO')
  }

  async function salvarEdicao() {
    if (!editando) return
    setEditUploading(true); setEditErr('')
    try {
      let imagemUrl = editando.imagemUrl
      if (editFile) {
        const folder = editTipo.startsWith('PREMIO') ? 'Premio' : 'Especiais'
        const fd = new FormData(); fd.append('file', editFile); fd.append('folder', folder)
        const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        if (!up.ok) { setEditErr(`Falha no upload — ${await uploadErroMsg(up)}`); setEditUploading(false); return }
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

  function handleClassifChange(val: string) {
    setClassif(val)
    if (val === 'ESPECIAIS')          setTipo('ESPECIAL')
    else if (val === 'PREMIO PRATA')  setTipo('PREMIO PRATA')
    else if (val === 'PREMIO OURO')   setTipo('PREMIO OURO')
    else if (['ESPECIAL', 'PREMIO PRATA', 'PREMIO OURO'].includes(tipo)) setTipo('FUNCIONARIO')
  }

  async function handleCadastrar() {
    if (isFuncionario && (!fileVerde || !fileAmarelo)) {
      setErrForm('Selecione a imagem VERDE e a imagem AMARELO.'); return
    }
    if (!isFuncionario && !file) { setErrForm('Selecione uma imagem.'); return }
    setUploading(true); setErrForm('')
    try {
      let imagemUrl: string

      if (isFuncionario) {
        const fdV = new FormData(); fdV.append('file', fileVerde!); fdV.append('folder', 'VERDE')
        const upV = await fetch('/api/admin/upload', { method: 'POST', body: fdV })
        if (!upV.ok) { setErrForm(`Falha no upload VERDE — ${await uploadErroMsg(upV)}`); setUploading(false); return }
        const { url: urlV, filename } = await upV.json()
        imagemUrl = urlV

        const fdA = new FormData(); fdA.append('file', fileAmarelo!); fdA.append('folder', 'AMARELO'); fdA.append('filename', filename)
        const upA = await fetch('/api/admin/upload', { method: 'POST', body: fdA })
        if (!upA.ok) { setErrForm(`Falha no upload AMARELO — ${await uploadErroMsg(upA)}`); setUploading(false); return }
      } else {
        const folder = tipo.startsWith('PREMIO') ? 'Premio' : 'Especiais'
        const fd = new FormData(); fd.append('file', file!); fd.append('folder', folder)
        const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        if (!up.ok) { setErrForm(`Falha no upload — ${await uploadErroMsg(up)}`); setUploading(false); return }
        imagemUrl = (await up.json()).url
      }

      const cr = await fetch('/api/admin/figurinhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classificacao: classif, tipo, imagemUrl }),
      })
      if (!cr.ok) { setErrForm('Falha ao cadastrar.'); setUploading(false); return }

      setFile(null); setFileVerde(null); setFileAmarelo(null)
      if (preview)     URL.revokeObjectURL(preview)
      if (prevVerde)   URL.revokeObjectURL(prevVerde)
      if (prevAmarelo) URL.revokeObjectURL(prevAmarelo)
      setPreview(null); setPrevVerde(null); setPrevAmarelo(null)
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
  const lista  = filtro === 'TODAS' ? figurinhas : figurinhas.filter(f => f.classificacao === filtro)
  const ativas   = figurinhas.filter(f => f.ativo).length
  const inativas = figurinhas.length - ativas

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
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
            background: showForm ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#1d4ed8,#1e40af)',
            color: showForm ? 'rgba(255,255,255,0.5)' : '#93c5fd',
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
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 14, padding: 24, marginBottom: 24,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(96,165,250,0.55)', marginBottom: 18 }}>
            Cadastrar Nova Carta
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Grupo / Classificação</label>
              <select value={classif} onChange={e => handleClassifChange(e.target.value)} style={sel}>
                {CLASSIFICACOES.map(c => <option key={c} value={c} style={opt}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tipo de Carta</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} style={sel}>
                {Object.entries(TIPOS).map(([k, v]) => (
                  <option key={k} value={k} style={opt}>{v.label} — {v.desc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Upload */}
          {isFuncionario ? (
            <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
              {(['VERDE', 'AMARELO'] as const).map(cor => {
                const isVerde  = cor === 'VERDE'
                const f        = isVerde ? fileVerde  : fileAmarelo
                const prev     = isVerde ? prevVerde  : prevAmarelo
                const ref      = isVerde ? fileVerdeRef : fileAmareloRef
                const setF     = isVerde ? setFileVerde : setFileAmarelo
                const setPrev  = isVerde ? setPrevVerde : setPrevAmarelo
                const accentCor = isVerde ? '#4ade80' : '#fbbf24'
                return (
                  <div key={cor} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: accentCor }}>{cor}</div>
                    {prev && <img src={prev} alt="" style={{ width: 52, height: 78, objectFit: 'cover', borderRadius: 7, border: `2px solid ${accentCor}` }} />}
                    <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => {
                        const fl = e.target.files?.[0]; if (!fl) return
                        setF(fl); setErrForm('')
                        const old = isVerde ? prevVerde : prevAmarelo
                        if (old) URL.revokeObjectURL(old)
                        setPrev(URL.createObjectURL(fl))
                      }}
                    />
                    <button onClick={() => ref.current?.click()} style={{
                      background: 'rgba(255,255,255,0.04)', border: `1px dashed ${f ? accentCor : 'rgba(255,255,255,0.2)'}`,
                      borderRadius: 7, color: f ? accentCor : 'rgba(255,255,255,0.35)',
                      padding: '7px 12px', cursor: 'pointer', fontSize: 10, whiteSpace: 'nowrap',
                    }}>
                      {f ? `✓ ${f.name.slice(0, 18)}` : `📎 Imagem ${cor}`}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              {preview && <img src={preview} alt="" style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return
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
          )}

          {errForm && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 12 }}>{errForm}</div>}

          <button
            onClick={handleCadastrar}
            disabled={uploading || (isFuncionario ? (!fileVerde || !fileAmarelo) : !file)}
            style={{
              padding: '10px 28px', borderRadius: 10, border: 'none',
              background: (!uploading && (isFuncionario ? (fileVerde && fileAmarelo) : file))
                ? 'linear-gradient(135deg,#1d4ed8,#1e40af)' : 'rgba(29,78,216,0.15)',
              color: '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {uploading ? 'Cadastrando…' : 'Cadastrar Carta'}
          </button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {todasClassifs.map(c => {
          const count = c === 'TODAS' ? figurinhas.length : figurinhas.filter(f => f.classificacao === c).length
          if (c !== 'TODAS' && count === 0) return null
          return (
            <button key={c} onClick={() => setFiltro(c)} style={{
              padding: '5px 13px', borderRadius: 20,
              border: `1px solid ${filtro === c ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: filtro === c ? 'rgba(96,165,250,0.1)' : 'transparent',
              color: filtro === c ? '#60a5fa' : 'rgba(255,255,255,0.35)',
              fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {c} <span style={{ opacity: 0.6 }}>({count})</span>
            </button>
          )
        })}
      </div>

      {deleteErr && (
        <div style={{ fontSize: 11, color: '#f87171', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
          {deleteErr}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 48 }}>Carregando…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
          {lista.map(f => (
            <div key={f.id}>
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

              {deletandoId === f.id ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>Deletar?</span>
                  <button onClick={() => handleDeletar(f.id)} style={{
                    width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(220,38,38,0.5)',
                    background: 'rgba(220,38,38,0.15)', color: '#f87171',
                    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, lineHeight: 1,
                  }}>✓</button>
                  <button onClick={() => setDeletandoId(null)} style={{
                    width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, lineHeight: 1,
                  }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <button
                    onClick={() => toggleAtivo(f.id, f.ativo)}
                    title={f.ativo ? 'Ativa' : 'Inativa'}
                    style={{
                      width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                      background: f.ativo
                        ? 'linear-gradient(135deg,#16a34a,#15803d)'
                        : 'linear-gradient(135deg,#dc2626,#b91c1c)',
                      position: 'relative', transition: 'background 0.25s', flexShrink: 0,
                      boxShadow: f.ativo ? '0 0 10px rgba(22,163,74,0.55)' : '0 0 10px rgba(220,38,38,0.45)',
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
                  <button onClick={() => abrirEdicao(f)} title="Editar" style={{
                    width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                    fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, lineHeight: 1,
                  }}>✎</button>
                  <button onClick={() => { setDeletandoId(f.id); setDeleteErr('') }} title="Deletar" style={{
                    width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(220,38,38,0.2)',
                    background: 'rgba(220,38,38,0.06)', color: 'rgba(248,113,113,0.6)',
                    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, lineHeight: 1,
                  }}>🗑</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de edição */}
      {editando && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setEditando(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#070e1a', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(96,165,250,0.55)', marginBottom: 18 }}>
              Editar Carta #{editando.id}
            </div>

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
                    const f = e.target.files?.[0]; if (!f) return
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

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Grupo / Classificação</label>
              <select value={editClassif} onChange={e => handleEditClassifChange(e.target.value)} style={sel}>
                {CLASSIFICACOES.map(c => <option key={c} value={c} style={opt}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Tipo de Carta</label>
              <select value={editTipo} onChange={e => setEditTipo(e.target.value)} style={sel}>
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
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: editUploading ? 'rgba(29,78,216,0.2)' : 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: editUploading ? 'not-allowed' : 'pointer' }}
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

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2,
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 7,
}
const sel: React.CSSProperties = {
  width: '100%', height: 42, borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#0d1a2e',
  color: '#fff', fontSize: 12, padding: '0 12px',
  outline: 'none', cursor: 'pointer',
}
const opt: React.CSSProperties = { background: '#0d1a2e', color: '#fff' }
