'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import ImportarParticipantesPanel from '@/components/ImportarParticipantesPanel'

// ─── Tipos ────────────────────────────────────────────────────────
type Figurinha   = { id: number; classificacao: string; tipo: string; imagemUrl: string | null; ativo: boolean }
type Participante = { id: number; matricula: string; nome: string; email: string | null; role: string; ativo: boolean; temSenha?: boolean; ultimoAcessoEm?: string | null }
type Campanha    = {
  id: number; nome: string; dataInicio: string; dataFim: string
  stickersPorDiaPadrao: number; chanceEspecial: number; status: string
  horarioInicio: string; horarioFim: string; frequenciaMinutos: number
  diasSemana: string; qtdCartasFds: number; timezone: string; temperatura: string; pausada: boolean
  ultimaDistribuicao: string | null
} | null

type Ganhador = { id: number; tipoPacotePremio: string; dataRegistro: string; participante: { id: number; nome: string; matricula: string } }
type Acao = { id: number; nome: string; descricao: string | null; dataAcao: string; ganhadores: Ganhador[] }

type Tab = 'visao' | 'figurinhas' | 'participantes' | 'campanha' | 'acoes' | 'pacotes' | 'premios' | 'relatorios'

const CLASSIFICACOES = ['GRUPO A','GRUPO B','GRUPO C','GRUPO D','ESPECIAIS','PREMIO PRATA','PREMIO OURO']
const TIPOS: Record<string, { label: string; desc: string }> = {
  FUNCIONARIO:    { label: 'Padrão',       desc: 'Carta padrão do grupo' },
  GESTOR:         { label: 'Destaque',     desc: 'Carta de destaque (1 por grupo)' },
  ESPECIAL:       { label: 'Especial',     desc: 'Aparece aleatoriamente (~10%)' },
  'PREMIO PRATA': { label: 'Prêmio Prata', desc: 'Carta exclusiva do pacote Prata' },
  'PREMIO OURO':  { label: 'Prêmio Ouro',  desc: 'Carta exclusiva do pacote Ouro' },
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('visao')

  return (
    <div>
      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid rgba(59,130,246,0.12)', paddingBottom: 0 }}>
        {([
          { key: 'visao',         label: '📈 Visão Geral' },
          { key: 'figurinhas',    label: '🃏 Figurinhas' },
          { key: 'participantes', label: '👥 Participantes' },
          { key: 'campanha',      label: '📅 Campanha' },
          { key: 'acoes',         label: '🎯 Ações' },
          { key: 'pacotes',       label: '📦 Pacotes' },
          { key: 'premios',       label: '🎁 Prêmios' },
          { key: 'relatorios',    label: '📊 Relatórios' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
            color: tab === t.key ? '#60a5fa' : 'rgba(255,255,255,0.35)',
            fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
            cursor: 'pointer', transition: 'color 0.15s', marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visao'         && <AbaVisaoGeral />}
      {tab === 'figurinhas'    && <AbaFigurinhas />}
      {tab === 'participantes' && <AbaParticipantes />}
      {tab === 'campanha'      && <AbaCampanha />}
      {tab === 'acoes'         && <AbaAcoes />}
      {tab === 'pacotes'       && <AbaPacotes />}
      {tab === 'premios'       && <AbaPremios />}
      {tab === 'relatorios'    && <AbaRelatorios />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ABA FIGURINHAS
// ═══════════════════════════════════════════════════════════════════
function AbaFigurinhas() {
  const [figurinhas, setFigurinhas] = useState<Figurinha[]>([])
  const [stats,      setStats]      = useState<Record<number, { donos: number; copias: number }>>({})
  const [loading,    setLoading]    = useState(true)
  const [filtro,     setFiltro]     = useState('TODAS')
  const [showForm,   setShowForm]   = useState(false)
  const [classif,    setClassif]    = useState(CLASSIFICACOES[0])
  const [tipo,       setTipo]       = useState('FUNCIONARIO')
  const [fileVerde,  setFileVerde]  = useState<File | null>(null)
  const [fileAmarelo,setFileAmarelo]= useState<File | null>(null)
  const [prevVerde,  setPrevVerde]  = useState<string | null>(null)
  const [prevAmarelo,setPrevAmarelo]= useState<string | null>(null)
  const [file,       setFile]       = useState<File | null>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [uploading,  setUploading]  = useState(false)
  const [errForm,    setErrForm]    = useState('')
  const fileRef        = useRef<HTMLInputElement>(null)
  const fileVerdeRef   = useRef<HTMLInputElement>(null)
  const fileAmareloRef = useRef<HTMLInputElement>(null)

  type EditState = { id: number; classificacao: string; tipo: string; imagemUrl: string | null }
  const [editando,     setEditando]     = useState<EditState | null>(null)
  const [editClassif,  setEditClassif]  = useState('')
  const [editTipo,     setEditTipo]     = useState('')
  const [editFile,     setEditFile]     = useState<File | null>(null)
  const [editPreview,  setEditPreview]  = useState<string | null>(null)
  const [editUploading,setEditUploading]= useState(false)
  const [editErr,      setEditErr]      = useState('')
  const editFileRef = useRef<HTMLInputElement>(null)

  const [deletandoId, setDeletandoId] = useState<number | null>(null)
  const [deleteErr,   setDeleteErr]   = useState('')

  const isFuncionario = tipo === 'FUNCIONARIO'

  async function uploadErroMsg(res: Response) {
    if (res.status === 413) return 'Arquivo muito grande.'
    if (res.status === 401) return 'Sessão expirada.'
    const text = await res.text().catch(() => '')
    try { const j = JSON.parse(text); return `(${res.status}) ${j.detail ?? j.error ?? text}` }
    catch { return `(${res.status}) ${text.slice(0, 200)}` }
  }

  async function load() {
    setLoading(true)
    const [rf, rs] = await Promise.all([fetch('/api/admin/figurinhas'), fetch('/api/admin/figurinhas/stats')])
    setFigurinhas(await rf.json())
    setStats(await rs.json().catch(() => ({})))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function handleClassifChange(val: string) {
    setClassif(val)
    if (val === 'ESPECIAIS')         setTipo('ESPECIAL')
    else if (val === 'PREMIO PRATA') setTipo('PREMIO PRATA')
    else if (val === 'PREMIO OURO')  setTipo('PREMIO OURO')
    else if (['ESPECIAL','PREMIO PRATA','PREMIO OURO'].includes(tipo)) setTipo('FUNCIONARIO')
  }

  function handleEditClassifChange(val: string) {
    setEditClassif(val)
    if (val === 'ESPECIAIS')         setEditTipo('ESPECIAL')
    else if (val === 'PREMIO PRATA') setEditTipo('PREMIO PRATA')
    else if (val === 'PREMIO OURO')  setEditTipo('PREMIO OURO')
    else if (['ESPECIAL','PREMIO PRATA','PREMIO OURO'].includes(editTipo)) setEditTipo('FUNCIONARIO')
  }

  async function handleCadastrar() {
    if (isFuncionario && (!fileVerde || !fileAmarelo)) { setErrForm('Selecione VERDE e AMARELO.'); return }
    if (!isFuncionario && !file) { setErrForm('Selecione uma imagem.'); return }
    setUploading(true); setErrForm('')
    try {
      let imagemUrl: string
      if (isFuncionario) {
        const fdV = new FormData(); fdV.append('file', fileVerde!); fdV.append('folder', 'VERDE')
        const upV = await fetch('/api/admin/upload', { method: 'POST', body: fdV })
        if (!upV.ok) { setErrForm(`Falha VERDE — ${await uploadErroMsg(upV)}`); setUploading(false); return }
        const { url: urlV, filename } = await upV.json()
        imagemUrl = urlV
        const fdA = new FormData(); fdA.append('file', fileAmarelo!); fdA.append('folder', 'AMARELO'); fdA.append('filename', filename)
        const upA = await fetch('/api/admin/upload', { method: 'POST', body: fdA })
        if (!upA.ok) { setErrForm(`Falha AMARELO — ${await uploadErroMsg(upA)}`); setUploading(false); return }
      } else {
        const folder = tipo.startsWith('PREMIO') ? 'Premio' : 'Especiais'
        const fd = new FormData(); fd.append('file', file!); fd.append('folder', folder)
        const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        if (!up.ok) { setErrForm(`Falha — ${await uploadErroMsg(up)}`); setUploading(false); return }
        imagemUrl = (await up.json()).url
      }
      const cr = await fetch('/api/admin/figurinhas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classificacao: classif, tipo, imagemUrl }) })
      if (!cr.ok) { setErrForm('Falha ao cadastrar.'); setUploading(false); return }
      setFile(null); setFileVerde(null); setFileAmarelo(null)
      if (preview)     URL.revokeObjectURL(preview)
      if (prevVerde)   URL.revokeObjectURL(prevVerde)
      if (prevAmarelo) URL.revokeObjectURL(prevAmarelo)
      setPreview(null); setPrevVerde(null); setPrevAmarelo(null)
      setShowForm(false); load()
    } catch { setErrForm('Erro inesperado.') }
    setUploading(false)
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
        if (!up.ok) { setEditErr(`Falha — ${await uploadErroMsg(up)}`); setEditUploading(false); return }
        imagemUrl = (await up.json()).url
      }
      const r = await fetch(`/api/admin/figurinhas/${editando.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classificacao: editClassif, tipo: editTipo, imagemUrl }) })
      if (!r.ok) { setEditErr('Falha ao salvar.'); setEditUploading(false); return }
      setFigurinhas(prev => prev.map(f => f.id === editando.id ? { ...f, classificacao: editClassif, tipo: editTipo, imagemUrl: imagemUrl ?? f.imagemUrl } : f))
      setEditando(null)
    } catch { setEditErr('Erro inesperado.') }
    setEditUploading(false)
  }

  async function handleDeletar(id: number) {
    setDeleteErr('')
    const r = await fetch(`/api/admin/figurinhas/${id}`, { method: 'DELETE' })
    if (!r.ok) { const b = await r.json().catch(() => ({})); setDeleteErr(b.error ?? 'Erro ao deletar.'); setDeletandoId(null); return }
    setFigurinhas(prev => prev.filter(f => f.id !== id))
    setDeletandoId(null)
  }

  async function toggleAtivo(id: number, ativo: boolean) {
    setFigurinhas(prev => prev.map(f => f.id === id ? { ...f, ativo: !f.ativo } : f))
    await fetch(`/api/admin/especiais/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !ativo }) })
  }

  const lista = filtro === 'TODAS' ? figurinhas : figurinhas.filter(f => f.classificacao === filtro)
  const ativas = figurinhas.filter(f => f.ativo).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Figurinhas</h2>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            <span style={{ color: '#4ade80' }}>{ativas} ativas</span> · <span style={{ color: '#f87171' }}>{figurinhas.length - ativas} inativas</span> · {figurinhas.length} total
          </div>
        </div>
        <button onClick={() => { setShowForm(v => !v); setErrForm('') }} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: showForm ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: showForm ? 'rgba(255,255,255,0.5)' : '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
          {showForm ? '✕ Cancelar' : '+ Nova Carta'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={sectionLabel}>Cadastrar Nova Carta</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div><label style={lbl}>Grupo / Classificação</label><select value={classif} onChange={e => handleClassifChange(e.target.value)} style={sel}>{CLASSIFICACOES.map(c => <option key={c} value={c} style={opt}>{c}</option>)}</select></div>
            <div><label style={lbl}>Tipo de Carta</label><select value={tipo} onChange={e => setTipo(e.target.value)} style={sel}>{Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k} style={opt}>{v.label} — {v.desc}</option>)}</select></div>
          </div>
          {isFuncionario ? (
            <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
              {(['VERDE', 'AMARELO'] as const).map(cor => {
                const isV = cor === 'VERDE'; const f = isV ? fileVerde : fileAmarelo; const pv = isV ? prevVerde : prevAmarelo; const ref = isV ? fileVerdeRef : fileAmareloRef; const setF = isV ? setFileVerde : setFileAmarelo; const setPv = isV ? setPrevVerde : setPrevAmarelo; const ac = isV ? '#4ade80' : '#fbbf24'
                return (
                  <div key={cor} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: ac }}>{cor}</div>
                    {pv && <img src={pv} alt="" style={{ width: 52, height: 78, objectFit: 'cover', borderRadius: 7, border: `2px solid ${ac}` }} />}
                    <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const fl = e.target.files?.[0]; if (!fl) return; setF(fl); const old = isV ? prevVerde : prevAmarelo; if (old) URL.revokeObjectURL(old); setPv(URL.createObjectURL(fl)) }} />
                    <button onClick={() => ref.current?.click()} style={{ background: 'rgba(255,255,255,0.04)', border: `1px dashed ${f ? ac : 'rgba(255,255,255,0.2)'}`, borderRadius: 7, color: f ? ac : 'rgba(255,255,255,0.35)', padding: '7px 12px', cursor: 'pointer', fontSize: 10 }}>{f ? `✓ ${f.name.slice(0, 18)}` : `📎 Imagem ${cor}`}</button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              {preview && <img src={preview} alt="" style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)' }} />}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; setFile(f); if (preview) URL.revokeObjectURL(preview); setPreview(URL.createObjectURL(f)) }} />
              <button onClick={() => fileRef.current?.click()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8, color: file ? '#fff' : 'rgba(255,255,255,0.4)', padding: '9px 16px', cursor: 'pointer', fontSize: 11 }}>{file ? `📎 ${file.name}` : '📎 Escolher imagem…'}</button>
            </div>
          )}
          {errForm && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 12 }}>{errForm}</div>}
          <button onClick={handleCadastrar} disabled={uploading || (isFuncionario ? (!fileVerde || !fileAmarelo) : !file)} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
            {uploading ? 'Cadastrando…' : 'Cadastrar Carta'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['TODAS', ...CLASSIFICACOES].map(c => {
          const count = c === 'TODAS' ? figurinhas.length : figurinhas.filter(f => f.classificacao === c).length
          if (c !== 'TODAS' && count === 0) return null
          return (
            <button key={c} onClick={() => setFiltro(c)} style={{ padding: '5px 13px', borderRadius: 20, border: `1px solid ${filtro === c ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`, background: filtro === c ? 'rgba(96,165,250,0.1)' : 'transparent', color: filtro === c ? '#60a5fa' : 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>
              {c} <span style={{ opacity: 0.6 }}>({count})</span>
            </button>
          )
        })}
      </div>

      {deleteErr && <div style={{ fontSize: 11, color: '#f87171', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>{deleteErr}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 48 }}>Carregando…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
          {lista.map(f => (
            <div key={f.id}>
              <div style={{ aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', opacity: f.ativo ? 1 : 0.35 }}>
                {f.imagemUrl ? <img src={f.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🃏</div>}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 3 }}>
                {stats[f.id] ? `${stats[f.id].donos} têm · ${stats[f.id].copias} cóp.` : '—'}
              </div>
              {deletandoId === f.id ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>Deletar?</span>
                  <button onClick={() => handleDeletar(f.id)} style={confirmBtn}>✓</button>
                  <button onClick={() => setDeletandoId(null)} style={cancelBtn}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <button onClick={() => toggleAtivo(f.id, f.ativo)} style={{ width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: f.ativo ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#dc2626,#b91c1c)', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: f.ativo ? 22 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.25s' }} />
                  </button>
                  <button onClick={() => { setEditando({ id: f.id, classificacao: f.classificacao, tipo: f.tipo, imagemUrl: f.imagemUrl }); setEditClassif(f.classificacao); setEditTipo(f.tipo); setEditFile(null); setEditPreview(null); setEditErr('') }} style={editBtn}>✎</button>
                  <button onClick={() => { setDeletandoId(f.id); setDeleteErr('') }} style={delBtn}>🗑</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal edição */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditando(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#070e1a', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={sectionLabel}>Editar Carta #{editando.id}</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>ATUAL</div>
                {editando.imagemUrl ? <img src={editando.imagemUrl} alt="" style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ width: 64, height: 96, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🃏</div>}
              </div>
              {editPreview && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: 'rgba(74,222,128,0.7)', marginBottom: 4 }}>NOVA</div>
                  <img src={editPreview} alt="" style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(74,222,128,0.35)' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; setEditFile(f); if (editPreview) URL.revokeObjectURL(editPreview); setEditPreview(URL.createObjectURL(f)) }} />
                <button onClick={() => editFileRef.current?.click()} style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.18)', borderRadius: 8, color: editFile ? '#fff' : 'rgba(255,255,255,0.35)', padding: '8px 14px', cursor: 'pointer', fontSize: 11, width: '100%', textAlign: 'left' }}>{editFile ? `📎 ${editFile.name}` : '📎 Trocar imagem…'}</button>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>Deixe em branco para manter a atual</div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={lbl}>Grupo / Classificação</label><select value={editClassif} onChange={e => handleEditClassifChange(e.target.value)} style={sel}>{CLASSIFICACOES.map(c => <option key={c} value={c} style={opt}>{c}</option>)}</select></div>
            <div style={{ marginBottom: 20 }}><label style={lbl}>Tipo de Carta</label><select value={editTipo} onChange={e => setEditTipo(e.target.value)} style={sel}>{Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k} style={opt}>{v.label} — {v.desc}</option>)}</select></div>
            {editErr && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 12 }}>{editErr}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditando(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvarEdicao} disabled={editUploading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>{editUploading ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ABA PARTICIPANTES
// ═══════════════════════════════════════════════════════════════════
function AbaParticipantes() {
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [loading,       setLoading]       = useState(true)
  const [busca,         setBusca]         = useState('')
  const [showForm,      setShowForm]      = useState(false)
  const [showImport,    setShowImport]    = useState(false)
  const [pMat,    setPMat]    = useState('')
  const [pNome,   setPNome]   = useState('')
  const [pEmail,  setPEmail]  = useState('')
  const [pRole,   setPRole]   = useState('PARTICIPANTE')
  const [pSenha,  setPSenha]  = useState('')
  const [errF,    setErrF]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [resetId, setResetId] = useState<number | null>(null)
  const [resetSenha, setResetSenha] = useState('')

  async function load(q = '') {
    setLoading(true)
    const r = await fetch(`/api/admin/participantes${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    setParticipantes(await r.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(() => load(busca), 300)
    return () => clearTimeout(t)
  }, [busca])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault(); setErrF(''); setSaving(true)
    const r = await fetch('/api/admin/participantes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matricula: pMat, nome: pNome, email: pEmail || undefined, role: pRole, senha: pSenha || undefined }) })
    setSaving(false)
    if (!r.ok) { const j = await r.json(); setErrF(j.error ?? 'Erro'); return }
    setPMat(''); setPNome(''); setPEmail(''); setPRole('PARTICIPANTE'); setPSenha('')
    setShowForm(false); load(busca)
  }

  async function toggleAtivo(p: Participante) {
    setParticipantes(prev => prev.map(x => x.id === p.id ? { ...x, ativo: !x.ativo } : x))
    await fetch(`/api/admin/participantes/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !p.ativo }) })
  }

  async function handleReset(id: number) {
    if (!resetSenha.trim()) return
    await fetch(`/api/admin/participantes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha: resetSenha }) })
    setResetId(null); setResetSenha('')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Participantes</h2>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{participantes.filter(p => p.ativo).length} ativos · {participantes.length} total</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou matrícula…" style={{ height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, padding: '0 12px', outline: 'none', width: 240 }} />
          <button onClick={() => { setShowForm(v => !v); setErrF('') }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: showForm ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: showForm ? 'rgba(255,255,255,0.5)' : '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
            {showForm ? '✕' : '+ Novo'}
          </button>
          <button onClick={() => setShowImport(v => !v)} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(96,165,250,0.25)', background: showImport ? 'rgba(96,165,250,0.18)' : 'rgba(96,165,250,0.07)', color: 'rgba(96,165,250,0.85)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>
            📥 Importar
          </button>
        </div>
      </div>

      {showImport && <ImportarParticipantesPanel onDone={() => load(busca)} />}

      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={sectionLabel}>Novo Participante</div>
          <form onSubmit={handleCriar} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <div><label style={lbl}>Matrícula</label><input value={pMat} onChange={e => setPMat(e.target.value)} style={inpSm} placeholder="00001" required /></div>
            <div><label style={lbl}>Nome</label><input value={pNome} onChange={e => setPNome(e.target.value)} style={inpSm} placeholder="Nome Sobrenome" required /></div>
            <div><label style={lbl}>E-mail</label><input type="email" value={pEmail} onChange={e => setPEmail(e.target.value)} style={inpSm} placeholder="email@empresa.com" /></div>
            <div><label style={lbl}>Role</label>
              <select value={pRole} onChange={e => setPRole(e.target.value)} style={{ ...inpSm, cursor: 'pointer' }}>
                {['PARTICIPANTE','MARKETING','TI','ADMIN'].map(r => <option key={r} value={r} style={{ background: '#0d1a2e' }}>{r}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Senha inicial</label><input type="password" value={pSenha} onChange={e => setPSenha(e.target.value)} style={inpSm} placeholder="Deixe em branco para pedir no 1º acesso" /></div>
            {errF && <div style={{ ...alertStyle, gridColumn: '1/-1' }}>{errF}</div>}
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" disabled={saving} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>{saving ? 'Criando…' : 'Criar Participante'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 48 }}>Carregando…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {participantes.map(p => (
            <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.08)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', opacity: p.ativo ? 1 : 0.45 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nome}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>
                  #{p.matricula} · {p.email ?? '—'} · {p.ultimoAcessoEm ? `acesso ${new Date(p.ultimoAcessoEm).toLocaleDateString('pt-BR')}` : 'nunca acessou'}
                </div>
              </div>
              {p.temSenha === false && <div style={{ fontSize: 8, padding: '3px 8px', borderRadius: 4, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', letterSpacing: 1, fontWeight: 700, flexShrink: 0 }}>SEM SENHA</div>}
              <div style={{ fontSize: 8, padding: '3px 8px', borderRadius: 4, background: 'rgba(96,165,250,0.1)', color: 'rgba(96,165,250,0.7)', letterSpacing: 1, fontWeight: 700, flexShrink: 0 }}>{p.role}</div>

              {resetId === p.id ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="password" value={resetSenha} onChange={e => setResetSenha(e.target.value)} placeholder="Nova senha" style={{ ...inpSm, width: 140 }} />
                  <button onClick={() => handleReset(p.id)} style={{ ...btnSm, color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }}>Salvar</button>
                  <button onClick={() => { setResetId(null); setResetSenha('') }} style={btnSm}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setResetId(p.id); setResetSenha('') }} style={btnSm}>🔑 Senha</button>
                  <button onClick={() => toggleAtivo(p)} style={{ ...btnSm, color: p.ativo ? '#f87171' : '#4ade80', borderColor: p.ativo ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)' }}>
                    {p.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              )}
            </div>
          ))}
          {participantes.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 32 }}>Nenhum participante encontrado.</div>}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ABA CAMPANHA
// ═══════════════════════════════════════════════════════════════════
const DIAS_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const FREQ_OPCOES = [
  { label: '30 min',  value: 30 },
  { label: '1 hora',  value: 60 },
  { label: '2 horas', value: 120 },
  { label: '4 horas', value: 240 },
  { label: '6 horas', value: 360 },
  { label: '8 horas', value: 480 },
  { label: '1x / dia', value: 1440 },
]
const TEMP_OPCOES = [
  { value: 'LOW',    label: 'Aleatório',   desc: 'Sorteio 100% aleatório' },
  { value: 'MEDIUM', label: 'Equilibrado', desc: 'Reduz repetidas (peso 3× nas que faltam)' },
  { value: 'HIGH',   label: 'Acelerado',   desc: 'Prioriza cartas que faltam (peso 12×)' },
]

function AbaCampanha() {
  const [campanha, setCampanha] = useState<Campanha>(null)
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(false)
  const [showNew,  setShowNew]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  // form
  const [nome,       setNome]       = useState('')
  const [inicio,     setInicio]     = useState('')
  const [fim,        setFim]        = useState('')
  const [stickers,   setStickers]   = useState(14)
  const [stickersFds,setStickersFds]= useState(5)
  const [chance,     setChance]     = useState(10)
  const [hInicio,    setHInicio]    = useState('08:00')
  const [hFim,       setHFim]       = useState('18:00')
  const [freq,       setFreq]       = useState(1440)
  const [dias,       setDias]       = useState<number[]>([1, 2, 3, 4, 5])
  const [temperatura, setTemperatura] = useState('LOW')

  function preencherForm(data: NonNullable<Campanha>) {
    setNome(data.nome)
    setInicio(data.dataInicio.slice(0, 10))
    setFim(data.dataFim.slice(0, 10))
    setStickers(data.stickersPorDiaPadrao)
    setStickersFds(data.qtdCartasFds)
    setChance(Math.round(data.chanceEspecial * 100))
    setHInicio(data.horarioInicio)
    setHFim(data.horarioFim)
    setFreq(data.frequenciaMinutos)
    try { setDias(JSON.parse(data.diasSemana)) } catch { setDias([1,2,3,4,5]) }
    setTemperatura(data.temperatura ?? 'LOW')
  }

  async function load() {
    setLoading(true)
    const r = await fetch('/api/admin/campanha')
    const data = await r.json()
    setCampanha(data)
    if (data) preencherForm(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function togglePausar() {
    if (!campanha) return
    await fetch('/api/admin/campanha', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pausada: !campanha.pausada }) })
    load()
  }

  function toggleDia(d: number) {
    setDias(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setSaving(true)
    if (dias.length === 0) { setErr('Selecione pelo menos um dia da semana.'); setSaving(false); return }
    const body = {
      nome, dataInicio: inicio, dataFim: fim,
      stickersPorDiaPadrao: stickers, chanceEspecial: chance / 100,
      horarioInicio: hInicio, horarioFim: hFim,
      frequenciaMinutos: freq,
      diasSemana: JSON.stringify(dias),
      qtdCartasFds: stickersFds,
      temperatura,
    }
    const r = await fetch('/api/admin/campanha', {
      method: campanha ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!r.ok) { const j = await r.json(); setErr(j.error ?? 'Erro'); return }
    setEditing(false); setShowNew(false); load()
  }

  const temFds = dias.includes(0) || dias.includes(6)

  const form = (
    <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Nome e período */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Nome da Campanha</label>
          <input value={nome} onChange={e => setNome(e.target.value)} style={inpSm} placeholder="Copa Figurinhas 2026" required />
        </div>
        <div><label style={lbl}>Data Início</label><input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={inpSm} required /></div>
        <div><label style={lbl}>Data Fim</label><input type="date" value={fim} onChange={e => setFim(e.target.value)} style={inpSm} required /></div>
      </div>

      {/* Separador */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18 }}>
        <div style={{ ...sectionLabel, marginBottom: 14 }}>Agendamento do Cron</div>

        {/* Dias da semana */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Dias da Semana</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DIAS_LABELS.map((label, idx) => {
              const ativo = dias.includes(idx)
              return (
                <button key={idx} type="button" onClick={() => toggleDia(idx)} style={{
                  padding: '7px 12px', borderRadius: 8,
                  border: `1px solid ${ativo ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: ativo ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
                  color: ativo ? '#93c5fd' : 'rgba(255,255,255,0.3)',
                  fontSize: 10, fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
                }}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Horário e frequência */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
          <div>
            <label style={lbl}>Horário início</label>
            <input type="time" value={hInicio} onChange={e => setHInicio(e.target.value)} style={inpSm} />
          </div>
          <div>
            <label style={lbl}>Horário fim</label>
            <input type="time" value={hFim} onChange={e => setHFim(e.target.value)} style={inpSm} />
          </div>
          <div>
            <label style={lbl}>Frequência</label>
            <select value={freq} onChange={e => setFreq(Number(e.target.value))} style={{ ...inpSm, cursor: 'pointer' }}>
              {FREQ_OPCOES.map(o => <option key={o.value} value={o.value} style={{ background: '#0d1a2e' }}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Cartas por pacote */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18 }}>
        <div style={{ ...sectionLabel, marginBottom: 14 }}>Cartas por Pacote</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
          <div>
            <label style={lbl}>Dias úteis</label>
            <input type="number" min={1} max={99} value={stickers} onChange={e => setStickers(Number(e.target.value))} style={inpSm} />
          </div>
          {temFds && (
            <div>
              <label style={lbl}>Fim de semana</label>
              <input type="number" min={1} max={99} value={stickersFds} onChange={e => setStickersFds(Number(e.target.value))} style={inpSm} />
            </div>
          )}
          <div>
            <label style={lbl}>Chance especial (%)</label>
            <input type="number" min={0} max={100} value={chance} onChange={e => setChance(Number(e.target.value))} style={inpSm} />
          </div>
        </div>
      </div>

      {/* Temperatura */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18 }}>
        <div style={{ ...sectionLabel, marginBottom: 6 }}>Dinâmica do sorteio · Temperatura</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.6 }}>
          Quanto mais quente, mais o sistema prioriza as cartas que faltam para cada pessoa — reduz repetidas e acelera o álbum.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TEMP_OPCOES.map(o => {
            const ativo = temperatura === o.value
            return (
              <button key={o.value} type="button" onClick={() => setTemperatura(o.value)} style={{
                flex: '1 1 160px', textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${ativo ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.1)'}`,
                background: ativo ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.03)', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: ativo ? '#93c5fd' : 'rgba(255,255,255,0.7)' }}>{o.label}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.5 }}>{o.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {err && <div style={alertStyle}>{err}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
          {saving ? 'Salvando…' : campanha ? 'Salvar alterações' : 'Criar campanha'}
        </button>
        <button type="button" onClick={() => { setEditing(false); setShowNew(false) }} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 10, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </form>
  )

  if (loading) return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 48 }}>Carregando…</div>

  return (
    <div>
      <BrandingCard />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Campanha</h2>
        {!editing && !showNew && (
          <button onClick={() => { campanha ? setEditing(true) : setShowNew(true) }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
            {campanha ? 'Editar' : '+ Nova Campanha'}
          </button>
        )}
      </div>

      {(editing || showNew) && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={sectionLabel}>{campanha ? 'Editar Campanha Ativa' : 'Criar Nova Campanha'}</div>
          {form}
        </div>
      )}

      {campanha && !editing ? (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, padding: 24 }}>
          {/* Cabeçalho */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: campanha.status === 'ativo' ? '#4ade80' : '#f87171', flexShrink: 0 }} />
            <div style={{ fontSize: 16, fontWeight: 700 }}>{campanha.nome}</div>
            <div style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: campanha.status === 'ativo' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: campanha.status === 'ativo' ? '#4ade80' : '#f87171', letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' }}>
              {campanha.status}
            </div>
            {campanha.pausada && <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' }}>⏸ Pausada</span>}
            <button onClick={togglePausar} style={{ fontSize: 9, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(96,165,250,0.25)', background: 'rgba(96,165,250,0.07)', color: 'rgba(96,165,250,0.8)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>
              {campanha.pausada ? '▶ Retomar' : '⏸ Pausar'}
            </button>
            {campanha.ultimaDistribuicao && (
              <div style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                última dist. {new Date(campanha.ultimaDistribuicao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Início',           value: new Date(campanha.dataInicio).toLocaleDateString('pt-BR') },
              { label: 'Fim',              value: new Date(campanha.dataFim).toLocaleDateString('pt-BR') },
              { label: 'Cartas (úteis)',   value: campanha.stickersPorDiaPadrao },
              { label: 'Cartas (FDS)',     value: campanha.qtdCartasFds },
              { label: 'Chance especial',  value: `${Math.round(campanha.chanceEspecial * 100)}%` },
              { label: 'Frequência',       value: FREQ_OPCOES.find(o => o.value === campanha.frequenciaMinutos)?.label ?? `${campanha.frequenciaMinutos} min` },
              { label: 'Temperatura',      value: TEMP_OPCOES.find(o => o.value === campanha.temperatura)?.label ?? campanha.temperatura },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#60a5fa' }}>{s.value}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Agendamento */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0 }}>Horário</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{campanha.horarioInicio} – {campanha.horarioFim}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0 }}>Dias</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {DIAS_LABELS.map((label, idx) => {
                let ativos: number[] = []
                try { ativos = JSON.parse(campanha.diasSemana) } catch {}
                const ativo = ativos.includes(idx)
                return (
                  <span key={idx} style={{ fontSize: 9, padding: '3px 7px', borderRadius: 4, background: ativo ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.03)', color: ativo ? '#60a5fa' : 'rgba(255,255,255,0.18)', fontWeight: 700 }}>
                    {label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      ) : !campanha && !showNew ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 64 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>Nenhuma campanha ativa.</div>
        </div>
      ) : null}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ABA AÇÕES
// ═══════════════════════════════════════════════════════════════════
function AbaAcoes() {
  const [acoes,   setAcoes]   = useState<Acao[]>([])
  const [prata,   setPrata]   = useState<Figurinha[]>([])
  const [ouro,    setOuro]    = useState<Figurinha[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [nome,    setNome]    = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')
  const [ganhadorPara, setGanhadorPara] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const [ra, rf] = await Promise.all([fetch('/api/admin/acoes'), fetch('/api/admin/figurinhas')])
    setAcoes(await ra.json())
    const figs: Figurinha[] = await rf.json()
    setPrata(figs.filter(f => f.classificacao === 'PREMIO PRATA' && f.ativo))
    setOuro(figs.filter(f => f.classificacao === 'PREMIO OURO' && f.ativo))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function criar(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setSaving(true)
    const r = await fetch('/api/admin/acoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, descricao: descricao || undefined }) })
    setSaving(false)
    if (!r.ok) { const j = await r.json(); setErr(j.error ?? 'Erro'); return }
    setNome(''); setDescricao(''); setShowNew(false); load()
  }

  if (loading) return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 48 }}>Carregando…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Ações do dia</h2>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{acoes.length} ação(ões) · ganhadores recebem pacote bônus</div>
        </div>
        <button onClick={() => { setShowNew(v => !v); setErr('') }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: showNew ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: showNew ? 'rgba(255,255,255,0.5)' : '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
          {showNew ? '✕' : '+ Nova ação'}
        </button>
      </div>

      {showNew && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={sectionLabel}>Nova Ação</div>
          <form onSubmit={criar} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <div><label style={lbl}>Nome</label><input value={nome} onChange={e => setNome(e.target.value)} style={inpSm} placeholder="Ex.: Quiz da manhã" required /></div>
            <div><label style={lbl}>Descrição (opcional)</label><input value={descricao} onChange={e => setDescricao(e.target.value)} style={inpSm} placeholder="Detalhes da ação" /></div>
            {err && <div style={{ ...alertStyle, gridColumn: '1/-1' }}>{err}</div>}
            <div style={{ gridColumn: '1/-1' }}><button type="submit" disabled={saving} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>{saving ? 'Criando…' : 'Criar Ação'}</button></div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {acoes.map(a => (
          <div key={a.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{a.nome}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{new Date(a.dataAcao).toLocaleDateString('pt-BR')}{a.descricao ? ` · ${a.descricao}` : ''} · {a.ganhadores.length} ganhador(es)</div>
              </div>
              <button onClick={() => setGanhadorPara(ganhadorPara === a.id ? null : a.id)} style={btnSm}>{ganhadorPara === a.id ? '✕ Fechar' : '+ Ganhador'}</button>
            </div>

            {ganhadorPara === a.id && <GanhadorForm acaoId={a.id} prata={prata} ouro={ouro} onDone={() => { setGanhadorPara(null); load() }} />}

            {a.ganhadores.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {a.ganhadores.map(g => (
                  <span key={g.id} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: '#86efac' }}>
                    🏆 {g.participante.nome} · {g.tipoPacotePremio}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {acoes.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 32 }}>Nenhuma ação criada ainda.</div>}
      </div>
    </div>
  )
}

function GanhadorForm({ acaoId, prata, ouro, onDone }: { acaoId: number; prata: Figurinha[]; ouro: Figurinha[]; onDone: () => void }) {
  const [q,   setQ]   = useState('')
  const [res, setRes] = useState<Participante[]>([])
  const [sel, setSel] = useState<Participante | null>(null)
  const [tipo,    setTipo]    = useState('PLUS')
  const [prataId, setPrataId] = useState('')
  const [ouroId,  setOuroId]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')

  useEffect(() => {
    if (sel || q.trim().length < 2) { setRes([]); return }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/admin/participantes?q=${encodeURIComponent(q)}`)
      setRes((await r.json()).slice(0, 6))
    }, 300)
    return () => clearTimeout(t)
  }, [q, sel])

  async function salvar() {
    setErr('')
    if (!sel)     { setErr('Escolha o participante.'); return }
    if (!prataId) { setErr('Escolha a carta Prêmio Prata.'); return }
    if (tipo === 'PREMIUM' && !ouroId) { setErr('Escolha a carta Prêmio Ouro.'); return }
    setSaving(true)
    const r = await fetch(`/api/admin/acoes/${acaoId}/ganhador`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participanteId: sel.id, tipo, premioPrataId: Number(prataId), premioOuroId: tipo === 'PREMIUM' ? Number(ouroId) : undefined }),
    })
    setSaving(false)
    const data = await r.json().catch(() => ({}))
    if (!r.ok) { setErr(data.error ?? 'Erro'); return }
    onDone()
  }

  return (
    <div style={{ marginTop: 12, padding: 14, background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
      <label style={lbl}>Participante</label>
      {sel ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 13 }}>{sel.nome} <span style={{ opacity: 0.4 }}>#{sel.matricula}</span></span>
          <button onClick={() => { setSel(null); setQ('') }} style={{ ...btnSm, padding: '3px 8px' }}>trocar</button>
        </div>
      ) : (
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input value={q} onChange={e => setQ(e.target.value)} style={inpSm} placeholder="Buscar por nome ou matrícula…" />
          {res.length > 0 && (
            <div style={{ position: 'absolute', zIndex: 5, top: 42, left: 0, right: 0, background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, overflow: 'hidden' }}>
              {res.map(p => (
                <button key={p.id} onClick={() => { setSel(p); setRes([]) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                  {p.nome} <span style={{ opacity: 0.4 }}>#{p.matricula}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
        <div>
          <label style={lbl}>Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...inpSm, cursor: 'pointer' }}>
            <option value="PLUS" style={opt}>Plus (Prêmio Prata)</option>
            <option value="PREMIUM" style={opt}>Premium (Prata + Ouro)</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Carta Prêmio Prata</label>
          <select value={prataId} onChange={e => setPrataId(e.target.value)} style={{ ...inpSm, cursor: 'pointer' }}>
            <option value="" style={opt}>—</option>
            {prata.map(f => <option key={f.id} value={f.id} style={opt}>#{f.id}</option>)}
          </select>
        </div>
        {tipo === 'PREMIUM' && (
          <div>
            <label style={lbl}>Carta Prêmio Ouro</label>
            <select value={ouroId} onChange={e => setOuroId(e.target.value)} style={{ ...inpSm, cursor: 'pointer' }}>
              <option value="" style={opt}>—</option>
              {ouro.map(f => <option key={f.id} value={f.id} style={opt}>#{f.id}</option>)}
            </select>
          </div>
        )}
      </div>

      {prata.length === 0 && <div style={{ fontSize: 10, color: '#fbbf24', marginTop: 8 }}>⚠️ Cadastre cartas &quot;Prêmio Prata&quot;/&quot;Prêmio Ouro&quot; na aba Figurinhas para liberar pacotes bônus.</div>}
      {err && <div style={{ ...alertStyle, marginTop: 10 }}>{err}</div>}
      <button onClick={salvar} disabled={saving} style={{ marginTop: 12, padding: '9px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>
        {saving ? 'Salvando…' : '🏆 Confirmar ganhador'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ABA VISÃO GERAL (dashboard)
// ═══════════════════════════════════════════════════════════════════
type Dashboard = {
  semCampanha?: boolean
  campanha?: { nome: string; status: string; dataInicio: string; dataFim: string; temperatura: string; ultimaDistribuicao: string | null }
  totalCartas: number; participantesAtivos: number; completaram: number; percentualMedio: number
  semColetar: number; pacotesTotais: number; pacotesAbertos: number; pacotesDisponiveis: number; trocasAceitas: number
}

function AbaVisaoGeral() {
  const [d, setD] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/admin/dashboard').then(r => r.json()).then(x => { setD(x); setLoading(false) }) }, [])

  if (loading) return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 48 }}>Carregando…</div>
  if (!d || d.semCampanha || !d.campanha) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 64 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
        <div style={{ fontSize: 13 }}>Nenhuma campanha ativa. Crie uma na aba <b>Campanha</b>.</div>
      </div>
    )
  }

  const c = d.campanha
  const tempLabel = TEMP_OPCOES.find(o => o.value === c.temperatura)?.label ?? c.temperatura
  const cards: { label: string; value: string | number; color: string }[] = [
    { label: 'Participantes ativos',   value: d.participantesAtivos,    color: '#60a5fa' },
    { label: 'Completaram o álbum',    value: d.completaram,            color: '#4ade80' },
    { label: '% médio de conclusão',   value: `${d.percentualMedio}%`,  color: '#fbbf24' },
    { label: 'Cartas no álbum',        value: d.totalCartas,            color: '#60a5fa' },
    { label: 'Pacotes a abrir',        value: d.pacotesDisponiveis,     color: '#f0c040' },
    { label: 'Pacotes abertos',        value: d.pacotesAbertos,         color: '#60a5fa' },
    { label: 'Trocas realizadas',      value: d.trocasAceitas,          color: '#a78bfa' },
    { label: 'Ainda não coletaram',    value: d.semColetar,             color: d.semColetar > 0 ? '#f87171' : '#4ade80' },
  ]

  return (
    <div>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Visão Geral</h2>

      {/* Cabeçalho da campanha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '14px 0 22px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.status === 'ativo' ? '#4ade80' : '#f87171' }} />
        <div style={{ fontSize: 15, fontWeight: 700 }}>{c.nome}</div>
        <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: 'rgba(96,165,250,0.12)', color: '#60a5fa', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>🌡️ {tempLabel}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
          {new Date(c.dataInicio).toLocaleDateString('pt-BR')} – {new Date(c.dataFim).toLocaleDateString('pt-BR')}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
          {c.ultimaDistribuicao ? `Última distribuição: ${new Date(c.ultimaDistribuicao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : 'Sem distribuição ainda'}
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        {cards.map(card => (
          <div key={card.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
        Ranking detalhado por pessoa na aba <b>Relatórios</b>.
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ABA PACOTES (distribuição manual)
// ═══════════════════════════════════════════════════════════════════
function AbaPacotes() {
  const [prata, setPrata] = useState<Figurinha[]>([])
  const [ouro,  setOuro]  = useState<Figurinha[]>([])
  const [q,   setQ]   = useState('')
  const [res, setRes] = useState<Participante[]>([])
  const [sel, setSel] = useState<Participante | null>(null)
  const [tipo,    setTipo]    = useState('PADRAO')
  const [prataId, setPrataId] = useState('')
  const [ouroId,  setOuroId]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/figurinhas').then(r => r.json()).then((figs: Figurinha[]) => {
      setPrata(figs.filter(f => f.classificacao === 'PREMIO PRATA' && f.ativo))
      setOuro(figs.filter(f => f.classificacao === 'PREMIO OURO' && f.ativo))
    })
  }, [])

  useEffect(() => {
    if (sel || q.trim().length < 2) { setRes([]); return }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/admin/participantes?q=${encodeURIComponent(q)}`)
      setRes((await r.json()).slice(0, 6))
    }, 300)
    return () => clearTimeout(t)
  }, [q, sel])

  async function distribuir() {
    setErr(''); setMsg('')
    if (!sel) { setErr('Escolha o participante.'); return }
    if (tipo !== 'PADRAO' && !prataId) { setErr('Escolha a carta Prêmio Prata.'); return }
    if (tipo === 'PREMIUM' && !ouroId) { setErr('Escolha a carta Prêmio Ouro.'); return }
    setSaving(true)
    const r = await fetch('/api/admin/pacotes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participanteId: sel.id, tipo, premioPrataId: prataId ? Number(prataId) : undefined, premioOuroId: tipo === 'PREMIUM' ? Number(ouroId) : undefined }),
    })
    setSaving(false)
    const data = await r.json().catch(() => ({}))
    if (!r.ok) { setErr(data.error ?? 'Erro'); return }
    setMsg(`Pacote ${tipo} distribuído para ${sel.nome}.`)
    setSel(null); setQ(''); setTipo('PADRAO'); setPrataId(''); setOuroId('')
  }

  const [massEnviando, setMassEnviando] = useState(false)
  const [massMsg, setMassMsg] = useState('')
  async function distribuirMassa() {
    if (!confirm('Dar 1 pacote Padrão para TODOS os participantes ativos?')) return
    setMassEnviando(true); setMassMsg('')
    const r = await fetch('/api/admin/pacotes/massa', { method: 'POST' })
    setMassEnviando(false)
    const data = await r.json().catch(() => ({}))
    if (!r.ok) { setMassMsg(data.error ?? 'Erro na distribuição.'); return }
    setMassMsg(`✓ ${data.distribuidos} de ${data.total} participantes receberam um pacote.`)
  }

  return (
    <div>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Distribuir pacote manual</h2>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, marginBottom: 20 }}>Entrega um pacote avulso (padrão, plus ou premium) a um participante.</div>

      <div style={{ maxWidth: 520, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: 20 }}>
        <label style={lbl}>Participante</label>
        {sel ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 13 }}>{sel.nome} <span style={{ opacity: 0.4 }}>#{sel.matricula}</span></span>
            <button onClick={() => { setSel(null); setQ('') }} style={{ ...btnSm, padding: '3px 8px' }}>trocar</button>
          </div>
        ) : (
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input value={q} onChange={e => setQ(e.target.value)} style={inpSm} placeholder="Buscar por nome ou matrícula…" />
            {res.length > 0 && (
              <div style={{ position: 'absolute', zIndex: 5, top: 42, left: 0, right: 0, background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, overflow: 'hidden' }}>
                {res.map(p => (
                  <button key={p.id} onClick={() => { setSel(p); setRes([]) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                    {p.nome} <span style={{ opacity: 0.4 }}>#{p.matricula}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
          <div>
            <label style={lbl}>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...inpSm, cursor: 'pointer' }}>
              <option value="PADRAO" style={opt}>Padrão</option>
              <option value="PLUS" style={opt}>Plus (+ Prêmio Prata)</option>
              <option value="PREMIUM" style={opt}>Premium (+ Prata e Ouro)</option>
            </select>
          </div>
          {tipo !== 'PADRAO' && (
            <div>
              <label style={lbl}>Carta Prêmio Prata</label>
              <select value={prataId} onChange={e => setPrataId(e.target.value)} style={{ ...inpSm, cursor: 'pointer' }}>
                <option value="" style={opt}>—</option>
                {prata.map(f => <option key={f.id} value={f.id} style={opt}>#{f.id}</option>)}
              </select>
            </div>
          )}
          {tipo === 'PREMIUM' && (
            <div>
              <label style={lbl}>Carta Prêmio Ouro</label>
              <select value={ouroId} onChange={e => setOuroId(e.target.value)} style={{ ...inpSm, cursor: 'pointer' }}>
                <option value="" style={opt}>—</option>
                {ouro.map(f => <option key={f.id} value={f.id} style={opt}>#{f.id}</option>)}
              </select>
            </div>
          )}
        </div>

        {msg && <div style={{ ...alertStyle, background: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.3)', color: '#86efac', marginTop: 14 }}>{msg}</div>}
        {err && <div style={{ ...alertStyle, marginTop: 14 }}>{err}</div>}

        <button onClick={distribuir} disabled={saving} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
          {saving ? 'Distribuindo…' : '📦 Distribuir pacote'}
        </button>
      </div>

      <div style={{ maxWidth: 520, marginTop: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 14, padding: 20 }}>
        <div style={sectionLabel}>Distribuição em massa</div>
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 12px' }}>
          Dá <b>1 pacote Padrão</b> para <b>todos os participantes ativos</b> de uma vez (respeita a temperatura da campanha).
        </p>
        {massMsg && <div style={{ ...alertStyle, background: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.3)', color: '#86efac', marginBottom: 12 }}>{massMsg}</div>}
        <button onClick={distribuirMassa} disabled={massEnviando} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: massEnviando ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#ddd6fe', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: massEnviando ? 'not-allowed' : 'pointer' }}>
          {massEnviando ? 'Distribuindo…' : '📢 Pacote Padrão para todos'}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ABA PRÊMIOS (entrega de prêmios físicos)
// ═══════════════════════════════════════════════════════════════════
type LinhaPremio = {
  albumItemId: number; unidade: number; entregue: boolean
  participante: { id: number; nome: string; matricula: string }
  figurinha: { id: number; classificacao: string; imagemUrl: string | null }
}

function AbaPremios() {
  const [linhas, setLinhas] = useState<LinhaPremio[]>([])
  const [busca,  setBusca]  = useState('')
  const [loading, setLoading] = useState(true)

  async function load(qv = '') {
    setLoading(true)
    const r = await fetch(`/api/admin/premios${qv ? `?q=${encodeURIComponent(qv)}` : ''}`)
    setLinhas(await r.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  useEffect(() => { const t = setTimeout(() => load(busca), 300); return () => clearTimeout(t) }, [busca])

  async function toggle(l: LinhaPremio) {
    setLinhas(prev => prev.map(x => x === l ? { ...x, entregue: !x.entregue } : x))
    await fetch(`/api/admin/premios/${l.albumItemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entregar: !l.entregue }) })
    load(busca)
  }

  const pendentes = linhas.filter(l => !l.entregue).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Prêmios físicos</h2>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{pendentes} pendente(s) de entrega · {linhas.length} no total</div>
        </div>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar participante…" style={{ height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, padding: '0 12px', outline: 'none', width: 220 }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 48 }}>Carregando…</div>
      ) : linhas.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 32 }}>Nenhum prêmio físico encontrado.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {linhas.map((l, i) => (
            <div key={`${l.albumItemId}-${l.unidade}-${i}`} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.08)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, opacity: l.entregue ? 0.55 : 1 }}>
              <div style={{ width: 34, height: 50, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                {l.figurinha.imagemUrl ? <img src={l.figurinha.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{l.participante.nome}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>#{l.participante.matricula} · {l.figurinha.classificacao}</div>
              </div>
              <button onClick={() => toggle(l)} style={{ ...btnSm, color: l.entregue ? '#4ade80' : '#fbbf24', borderColor: l.entregue ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)' }}>
                {l.entregue ? '✓ Entregue' : 'Marcar entregue'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ABA RELATÓRIOS (ranking de coleção)
// ═══════════════════════════════════════════════════════════════════
type DeptStat = { classificacao: string; total: number; coletado: number; percentual: number }
type LinhaRanking = {
  id: number; nome: string; matricula: string
  totalColetado: number; totalFigurinhas: number; percentualGeral: number
  trocasEnviadas: number; trocasRecebidas: number
  porDepartamento: DeptStat[]
}
type LogDist = { id: number; participanteNome: string; matricula: string; tipoPacote: string; distribuidoPor: string; criadoEm: string }

function AbaRelatorios() {
  const [parts, setParts] = useState<LinhaRanking[]>([])
  const [total, setTotal] = useState(0)
  const [logs,  setLogs]  = useState<LogDist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/andamento').then(r => r.json()),
      fetch('/api/admin/logs').then(r => r.json()),
    ]).then(([d, l]) => {
      setParts(d?.participantes ?? [])
      setTotal(d?.totalFigurinhas ?? 0)
      setLogs(Array.isArray(l) ? l : [])
      setLoading(false)
    })
  }, [])

  const departamentos = useMemo(() => {
    const map = new Map<string, { total: number; soma: number; n: number }>()
    for (const p of parts) for (const d of (p.porDepartamento ?? [])) {
      const cur = map.get(d.classificacao) ?? { total: d.total, soma: 0, n: 0 }
      cur.total = d.total; cur.soma += d.percentual; cur.n++
      map.set(d.classificacao, cur)
    }
    return [...map.entries()].map(([classificacao, v]) => ({ classificacao, total: v.total, mediaPct: v.n ? Math.round(v.soma / v.n) : 0 }))
  }, [parts])

  function exportarCSV() {
    const head = ['Posicao', 'Nome', 'Matricula', 'Coletadas', 'Total', 'Percentual', 'Trocas enviadas', 'Trocas recebidas']
    const linhas = [head, ...parts.map((p, i) => [String(i + 1), p.nome, p.matricula, String(p.totalColetado), String(p.totalFigurinhas), `${p.percentualGeral}%`, String(p.trocasEnviadas), String(p.trocasRecebidas)])]
    const csv = linhas.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio-colecao.csv'; a.click(); URL.revokeObjectURL(url)
  }

  if (loading) return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 48 }}>Carregando…</div>
  const completos = parts.filter(p => p.percentualGeral >= 100).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Relatórios</h2>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, marginBottom: 20 }}>
            {total} figurinhas no álbum · {parts.length} participantes · {completos} completaram
          </div>
        </div>
        {parts.length > 0 && <button onClick={exportarCSV} style={btnSm}>⬇ Exportar CSV</button>}
      </div>

      {departamentos.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Por grupo / departamento</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            {departamentos.map(d => (
              <div key={d.classificacao} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd' }}>{d.classificacao}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '8px 0 3px' }}>
                  <span>{d.total} cartas</span><span>{d.mediaPct}% médio</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, d.mediaPct)}%`, background: 'linear-gradient(90deg,#1d4ed8,#60a5fa)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...sectionLabel, marginBottom: 10 }}>Ranking de coleção</div>
      {parts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 32 }}>Sem dados de coleção ainda.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {parts.map((p, i) => (
            <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.08)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 24, textAlign: 'center', fontSize: 12, fontWeight: 800, color: i < 3 ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nome}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>#{p.matricula} · trocas {p.trocasEnviadas}↑ {p.trocasRecebidas}↓</div>
              </div>
              <div style={{ width: 160, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>
                  <span>{p.totalColetado}/{p.totalFigurinhas}</span><span>{p.percentualGeral}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, p.percentualGeral)}%`, background: p.percentualGeral >= 100 ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'linear-gradient(90deg,#1d4ed8,#60a5fa)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...sectionLabel, margin: '28px 0 10px' }}>Histórico de distribuição manual</div>
      {logs.length === 0 ? (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Nenhuma distribuição manual registrada.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {logs.slice(0, 50).map(l => (
            <div key={l.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.06)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, flexWrap: 'wrap' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', width: 112, flexShrink: 0 }}>{new Date(l.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span style={{ flex: 1, minWidth: 120 }}>{l.participanteNome} <span style={{ opacity: 0.4 }}>#{l.matricula}</span></span>
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(96,165,250,0.12)', color: '#60a5fa', fontWeight: 700 }}>{l.tipoPacote}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>por {l.distribuidoPor}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// IDENTIDADE VISUAL (branding da empresa) — usado na aba Campanha
// ═══════════════════════════════════════════════════════════════════
function BrandingCard() {
  const [logoUrl, setLogoUrl]   = useState<string | null>(null)
  const [cor, setCor]           = useState('#1d4ed8')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/empresa').then(r => r.json()).then(e => { if (e) { setLogoUrl(e.logoUrl ?? null); setCor(e.corPrimaria ?? '#1d4ed8') } })
  }, [])

  async function uploadLogo(f: File) {
    setUploading(true); setMsg('')
    const fd = new FormData(); fd.append('file', f); fd.append('folder', 'Logo')
    const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (!up.ok) { setMsg('Falha no upload do logo.'); return }
    setLogoUrl((await up.json()).url)
  }

  async function salvar() {
    setSaving(true); setMsg('')
    const r = await fetch('/api/admin/empresa', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logoUrl, corPrimaria: cor }) })
    setSaving(false)
    setMsg(r.ok ? 'Identidade salva ✓' : 'Erro ao salvar.')
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
      <div style={sectionLabel}>Identidade visual da empresa</div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {logoUrl ? <img src={logoUrl} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 22, opacity: 0.4 }}>🏢</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={btnSm}>{uploading ? 'Enviando…' : 'Trocar logo'}</button>
        </div>
        <div>
          <label style={lbl}>Cor primária</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="color" value={cor} onChange={e => setCor(e.target.value)} style={{ width: 44, height: 38, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{cor}</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {msg && <span style={{ fontSize: 11, color: msg.includes('✓') ? '#4ade80' : '#f87171' }}>{msg}</span>}
          <button onClick={salvar} disabled={saving} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>{saving ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────
const sectionLabel: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(96,165,250,0.55)', marginBottom: 16 }
const lbl:  React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 7 }
const sel:  React.CSSProperties = { width: '100%', height: 42, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0d1a2e', color: '#fff', fontSize: 12, padding: '0 12px', outline: 'none', cursor: 'pointer' }
const opt:  React.CSSProperties = { background: '#0d1a2e', color: '#fff' }
const inpSm: React.CSSProperties = { width: '100%', height: 38, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0d1a2e', color: '#fff', fontSize: 12, padding: '0 12px', outline: 'none', boxSizing: 'border-box' }
const alertStyle: React.CSSProperties = { background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ff9999' }
const btnSm: React.CSSProperties = { padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.06)', color: 'rgba(96,165,250,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0 }
const editBtn: React.CSSProperties = { width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }
const delBtn:  React.CSSProperties = { width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.06)', color: 'rgba(248,113,113,0.6)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }
const confirmBtn: React.CSSProperties = { width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(220,38,38,0.5)', background: 'rgba(220,38,38,0.15)', color: '#f87171', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }
const cancelBtn:  React.CSSProperties = { width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }
