'use client'

import { useState, useTransition } from 'react'
import { verificarMatricula, loginComSenha, cadastrar } from '@/app/actions/auth'

type Step = 'matricula' | 'senha' | 'cadastro'

export default function LoginPage() {
  const [step,      setStep]      = useState<Step>('matricula')
  const [matricula, setMatricula] = useState('')
  const [nome,      setNome]      = useState('')
  const [senha,     setSenha]     = useState('')
  const [email,     setEmail]     = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro,      setErro]      = useState('')
  const [pending,   startTransition] = useTransition()

  function voltar() {
    setStep('matricula')
    setSenha('')
    setEmail('')
    setConfirmar('')
    setErro('')
  }

  function handleVerificar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    startTransition(async () => {
      const r = await verificarMatricula(matricula)
      if (!r.ok) { setErro(r.error); return }
      setNome(r.nome)
      setStep(r.temSenha ? 'senha' : 'cadastro')
    })
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    startTransition(async () => {
      const r = await loginComSenha(matricula, senha)
      if (r?.error) setErro(r.error)
    })
  }

  function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirmar) { setErro('As senhas não conferem.'); return }
    if (senha.length < 6)    { setErro('A senha deve ter no mínimo 6 caracteres.'); return }
    setErro('')
    startTransition(async () => {
      const r = await cadastrar(matricula, email, senha)
      if (r?.error) setErro(r.error)
    })
  }

  const primeiroNome = nome.split(' ')[0]

  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '0 20px' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 12, filter: 'drop-shadow(0 0 24px rgba(240,192,64,0.5))' }}>⚽</div>
        <div style={{ fontSize: 9, letterSpacing: 6, textTransform: 'uppercase', color: 'rgba(240,192,64,0.6)', marginBottom: 4 }}>Supermédica</div>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', background: 'linear-gradient(90deg,#009c3b,#f5c800,#009c3b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Super Copa 2026
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,192,64,0.15)', borderRadius: 16, padding: '36px 32px', backdropFilter: 'blur(10px)' }}>

        {/* ── STEP 1: Matrícula ── */}
        {step === 'matricula' && (
          <>
            <div style={title}>Entrar no Álbum</div>
            <form onSubmit={handleVerificar} style={form}>
              <div>
                <label style={lbl} htmlFor="matricula">Matrícula</label>
                <input
                  id="matricula"
                  type="text"
                  placeholder="Sua matrícula"
                  autoComplete="username"
                  autoFocus
                  value={matricula}
                  onChange={e => setMatricula(e.target.value)}
                  style={inp}
                />
              </div>
              {erro && <div style={alert}>{erro}</div>}
              <button type="submit" disabled={pending} style={{ ...btn, background: pending ? 'rgba(0,156,59,0.3)' : 'linear-gradient(135deg,#009c3b,#006b29)', color: '#f5c800', cursor: pending ? 'not-allowed' : 'pointer' }}>
                {pending ? 'Verificando…' : 'Continuar →'}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2a: Senha ── */}
        {step === 'senha' && (
          <>
            <div style={{ ...title, marginBottom: 4 }}>Olá, {primeiroNome}!</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textAlign: 'center', marginBottom: 24 }}>
              #{matricula.replace(/\D/g, '').padStart(5, '0')}
            </div>
            <form onSubmit={handleLogin} style={form}>
              <div>
                <label style={lbl} htmlFor="senha">Senha</label>
                <input
                  id="senha"
                  type="password"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  autoFocus
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  style={inp}
                />
              </div>
              {erro && <div style={alert}>{erro}</div>}
              <button type="submit" disabled={pending} style={{ ...btn, background: pending ? 'rgba(0,156,59,0.3)' : 'linear-gradient(135deg,#009c3b,#006b29)', color: '#f5c800', cursor: pending ? 'not-allowed' : 'pointer' }}>
                {pending ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={voltar} style={linkBtn}>← Trocar matrícula</button>
              <a href="/recuperar-senha" style={link}>Esqueci minha senha</a>
            </div>
          </>
        )}

        {/* ── STEP 2b: Cadastro (primeiro acesso) ── */}
        {step === 'cadastro' && (
          <>
            <div style={{ ...title, marginBottom: 4 }}>Bem-vindo, {primeiroNome}!</div>
            <div style={{ fontSize: 10, color: 'rgba(240,192,64,0.5)', letterSpacing: 1, textAlign: 'center', marginBottom: 24 }}>
              Crie seu acesso para entrar no álbum
            </div>
            <form onSubmit={handleCadastro} style={form}>
              <div>
                <label style={lbl} htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Seu e-mail"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl} htmlFor="nova-senha">Crie uma senha</label>
                <input
                  id="nova-senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl} htmlFor="confirmar">Confirme a senha</label>
                <input
                  id="confirmar"
                  type="password"
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  style={inp}
                />
              </div>
              {erro && <div style={alert}>{erro}</div>}
              <button type="submit" disabled={pending} style={{ ...btn, background: pending ? 'rgba(240,192,64,0.2)' : 'linear-gradient(135deg,#b45309,#92400e)', color: '#f5c800', cursor: pending ? 'not-allowed' : 'pointer' }}>
                {pending ? 'Criando acesso…' : 'Criar acesso'}
              </button>
            </form>
            <div style={{ marginTop: 20 }}>
              <button onClick={voltar} style={linkBtn}>← Trocar matrícula</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const form:    React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 }
const title:   React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 24, textAlign: 'center' }
const lbl:     React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }
const inp:     React.CSSProperties = { width: '100%', height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, padding: '0 14px', outline: 'none', boxSizing: 'border-box' }
const alert:   React.CSSProperties = { background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ff9999', lineHeight: 1.5 }
const btn:     React.CSSProperties = { height: 48, borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', transition: 'all 0.2s ease' }
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, padding: 0 }
const link:    React.CSSProperties = { fontSize: 10, color: 'rgba(240,192,64,0.5)', textDecoration: 'none', letterSpacing: 1 }
