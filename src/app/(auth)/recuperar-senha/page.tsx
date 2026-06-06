'use client'

import { useState, useTransition } from 'react'
import { enviarCodigoParaMatricula, redefinirSenha } from '@/app/actions/auth'

export default function RecuperarSenhaPage() {
  const [matricula,   setMatricula]   = useState('')
  const [etapa,       setEtapa]       = useState<'matricula' | 'codigo' | 'ok'>('matricula')
  const [codigoDebug, setCodigoDebug] = useState('')
  const [emailFalhou, setEmailFalhou] = useState(false)
  const [erro,        setErro]        = useState('')

  const [codigo,         setCodigo]         = useState('')
  const [novaSenha,      setNovaSenha]      = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')

  const [pendingEnvio,   startEnvio]   = useTransition()
  const [pendingCodigo,  startCodigo]  = useTransition()

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault(); setErro('')
    startEnvio(async () => {
      const r = await enviarCodigoParaMatricula(matricula)
      if (!r.ok) { setErro(r.error ?? 'Erro ao enviar.'); return }
      if (r.codigoDebug) { setCodigoDebug(r.codigoDebug); setEmailFalhou(true) }
      setEtapa('codigo')
    })
  }

  function handleCodigo(e: React.FormEvent) {
    e.preventDefault(); setErro('')
    if (novaSenha !== confirmacaoSenha) { setErro('As senhas não coincidem.'); return }
    if (novaSenha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    startCodigo(async () => {
      const r = await redefinirSenha(matricula, codigo, novaSenha)
      if (!r.ok) { setErro(r.error ?? 'Código inválido.'); return }
      setEtapa('ok')
    })
  }

  // ── Sucesso ────────────────────────────────────────────────────
  if (etapa === 'ok') return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 12 }}>Senha redefinida!</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
        Agora entre com sua matrícula e a nova senha.
      </div>
      <a href="/login" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', borderRadius: 10, padding: '12px 28px', textDecoration: 'none' }}>
        Ir para o login
      </a>
    </div>
  )

  // ── Etapa 2: código + nova senha ───────────────────────────────
  if (etapa === 'codigo') return (
    <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>📧</div>
        <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(96,165,250,0.6)', marginBottom: 6 }}>
          Verifique seu e-mail
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          {emailFalhou
            ? 'SMTP não configurado — use o código abaixo para testar:'
            : 'Enviamos um código de 6 dígitos para o e-mail cadastrado. Válido por 1 hora.'}
        </div>
      </div>

      {codigoDebug && (
        <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'rgba(96,165,250,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            Código (modo desenvolvimento)
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 10, color: '#60a5fa' }}>
            {codigoDebug}
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 16, padding: '32px 28px' }}>
        <form onSubmit={handleCodigo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Código de 6 dígitos</label>
            <input value={codigo} onChange={e => setCodigo(e.target.value)} type="text" inputMode="numeric" maxLength={6} placeholder="000000"
              style={{ ...inp, fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 700 }} />
          </div>
          <div>
            <label style={lbl}>Nova senha</label>
            <input value={novaSenha} onChange={e => setNovaSenha(e.target.value)} type="password" placeholder="Nova senha" autoComplete="new-password" style={inp} />
          </div>
          <div>
            <label style={lbl}>Confirmar senha</label>
            <input value={confirmacaoSenha} onChange={e => setConfirmacaoSenha(e.target.value)} type="password" placeholder="Repita a senha" autoComplete="new-password" style={inp} />
          </div>
          {erro && <div style={alertStyle}>{erro}</div>}
          <button type="submit" disabled={pendingCodigo} style={btn(pendingCodigo)}>
            {pendingCodigo ? 'Verificando…' : 'Confirmar'}
          </button>
        </form>
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button onClick={() => { setEtapa('matricula'); setErro('') }} style={{ background: 'none', border: 'none', fontSize: 10, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', letterSpacing: 1 }}>
            ← Tentar outra matrícula
          </button>
        </div>
      </div>
    </div>
  )

  // ── Etapa 1: matrícula ─────────────────────────────────────────
  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(96,165,250,0.6)', marginBottom: 6 }}>Recuperar senha</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Informe sua matrícula</div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 16, padding: '36px 32px' }}>
        <form onSubmit={handleEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Matrícula</label>
            <input value={matricula} onChange={e => setMatricula(e.target.value)} type="text" placeholder="Sua matrícula" style={inp} />
          </div>
          {erro && <div style={alertStyle}>{erro}</div>}
          <button type="submit" disabled={pendingEnvio} style={btn(pendingEnvio)}>
            {pendingEnvio ? 'Enviando…' : 'Enviar código'}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a href="/login" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: 1 }}>← Voltar ao login</a>
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }
const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, padding: '0 14px', outline: 'none', boxSizing: 'border-box' }
const alertStyle: React.CSSProperties = { background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ff9999' }
const btn = (d: boolean): React.CSSProperties => ({ height: 48, borderRadius: 10, border: 'none', background: d ? 'rgba(29,78,216,0.3)' : 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#93c5fd', fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', cursor: d ? 'not-allowed' : 'pointer' })
