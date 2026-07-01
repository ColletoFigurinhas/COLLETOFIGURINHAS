'use client'

import { useState, useTransition } from 'react'
import {
  verificarMatricula,
  loginComSenha,
  cadastrar,
  enviarCodigoParaMatricula,
  redefinirSenha,
} from '@/app/actions/auth'

type Step = 'matricula' | 'senha' | 'cadastro' | 'recuperar_enviando' | 'recuperar_codigo' | 'recuperar_ok'

export default function LoginPage() {
  const [step,         setStep]         = useState<Step>('matricula')
  const [matricula,    setMatricula]    = useState('')
  const [nome,         setNome]         = useState('')
  const [isNovo,       setIsNovo]       = useState(false)
  const [senha,        setSenha]        = useState('')
  const [email,        setEmail]        = useState('')
  const [confirmar,    setConfirmar]    = useState('')
  const [codigo,       setCodigo]       = useState('')
  const [novaSenha,    setNovaSenha]    = useState('')
  const [confirmarNova,setConfirmarNova]= useState('')
  const [codigoDebug,  setCodigoDebug]  = useState('')
  const [erro,         setErro]         = useState('')
  const [pending,      startTransition] = useTransition()

  function voltarMatricula() {
    setStep('matricula'); setSenha(''); setEmail(''); setConfirmar('')
    setCodigo(''); setNovaSenha(''); setConfirmarNova(''); setErro(''); setCodigoDebug('')
  }

  function handleVerificar(e: React.FormEvent) {
    e.preventDefault(); setErro('')
    startTransition(async () => {
      const r = await verificarMatricula(matricula)
      if (!r.ok) { setErro(r.error); return }
      setNome(r.nome)
      setIsNovo(r.isNovo)
      setStep(r.temSenha ? 'senha' : 'cadastro')
    })
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setErro('')
    startTransition(async () => {
      const r = await loginComSenha(matricula, senha)
      if (r?.error) setErro(r.error)
    })
  }

  function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim())      { setErro('Informe seu nome.'); return }
    if (senha !== confirmar) { setErro('As senhas não conferem.'); return }
    if (senha.length < 6)    { setErro('A senha deve ter no mínimo 6 caracteres.'); return }
    setErro('')
    startTransition(async () => {
      const r = await cadastrar(matricula, nome, email, senha)
      if (r?.error) setErro(r.error)
    })
  }

  function handleEsqueceu() {
    setErro(''); setCodigoDebug('')
    setStep('recuperar_enviando')
    startTransition(async () => {
      const r = await enviarCodigoParaMatricula(matricula)
      if (!r.ok) { setErro(r.error ?? 'Erro ao enviar código.'); setStep('senha'); return }
      if (r.codigoDebug) setCodigoDebug(r.codigoDebug)
      setStep('recuperar_codigo')
    })
  }

  function handleRedefinir(e: React.FormEvent) {
    e.preventDefault()
    if (novaSenha !== confirmarNova) { setErro('As senhas não conferem.'); return }
    if (novaSenha.length < 6)        { setErro('Mínimo 6 caracteres.'); return }
    setErro('')
    startTransition(async () => {
      const r = await redefinirSenha(matricula, codigo, novaSenha)
      if (!r.ok) { setErro(r.error ?? 'Erro ao redefinir.'); return }
      setStep('recuperar_ok')
    })
  }

  const primeiroNome = nome.split(' ')[0] || 'você'

  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '0 20px' }}>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(var(--brand-bright-rgb),0.2)', borderRadius: 16, padding: '36px 32px', backdropFilter: 'blur(10px)' }}>

        {/* ── STEP 1: Matrícula ── */}
        {step === 'matricula' && (
          <>
            <div style={title}>Entrar no Álbum</div>
            <form onSubmit={handleVerificar} style={form}>
              <div>
                <label style={lbl} htmlFor="matricula">Matrícula</label>
                <input id="matricula" type="text" placeholder="Sua matrícula" autoComplete="username" autoFocus
                  value={matricula} onChange={e => setMatricula(e.target.value)} style={inp} />
              </div>
              {erro && <div style={alert}>{erro}</div>}
              <button type="submit" disabled={pending || !matricula.trim()} style={{ ...btn, background: (pending || !matricula.trim()) ? 'rgba(var(--brand-rgb),0.3)' : 'linear-gradient(135deg,var(--color-verde),var(--color-verde-dark))', color: 'var(--on-primary)', cursor: (pending || !matricula.trim()) ? 'not-allowed' : 'pointer' }}>
                {pending ? 'Verificando…' : 'Continuar →'}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2a: Senha ── */}
        {step === 'senha' && (
          <>
            <div style={{ ...title, marginBottom: 4 }}>Olá, {primeiroNome}!</div>
            <form onSubmit={handleLogin} style={form}>
              <div>
                <label style={lbl} htmlFor="senha">Senha</label>
                <input id="senha" type="password" placeholder="Sua senha" autoComplete="current-password" autoFocus
                  value={senha} onChange={e => setSenha(e.target.value)} style={inp} />
              </div>
              {erro && <div style={alert}>{erro}</div>}
              <button type="submit" disabled={pending} style={{ ...btn, background: pending ? 'rgba(var(--brand-rgb),0.3)' : 'linear-gradient(135deg,var(--color-verde),var(--color-verde-dark))', color: 'var(--on-primary)', cursor: pending ? 'not-allowed' : 'pointer' }}>
                {pending ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={voltarMatricula} style={linkBtn}>← Trocar matrícula</button>
              <button onClick={handleEsqueceu} disabled={pending} style={{ ...linkBtn, color: 'rgba(var(--brand-light-rgb),0.6)' }}>
                Esqueci minha senha
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2b: Cadastro ── */}
        {step === 'cadastro' && (
          <>
            <div style={{ ...title, marginBottom: 4 }}>
              {isNovo ? 'Criar acesso' : `Olá, ${primeiroNome}!`}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(var(--brand-light-rgb),0.6)', letterSpacing: 1, textAlign: 'center', marginBottom: 24 }}>
              {isNovo ? 'Preencha seus dados para entrar no álbum' : 'Defina sua senha para entrar'}
            </div>
            <form onSubmit={handleCadastro} style={form}>
              {/* Nome só aparece para usuários novos */}
              {isNovo && (
                <div>
                  <label style={lbl} htmlFor="nome">Seu nome completo</label>
                  <input id="nome" type="text" placeholder="Nome Sobrenome" autoFocus
                    value={nome} onChange={e => setNome(e.target.value)} style={inp} />
                </div>
              )}
              <div>
                <label style={lbl} htmlFor="email">E-mail</label>
                <input id="email" type="email" placeholder="Seu e-mail" autoComplete="email"
                  autoFocus={!isNovo}
                  value={email} onChange={e => setEmail(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl} htmlFor="nova-senha">Crie uma senha</label>
                <input id="nova-senha" type="password" placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                  value={senha} onChange={e => setSenha(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl} htmlFor="confirmar">Confirme a senha</label>
                <input id="confirmar" type="password" placeholder="Repita a senha" autoComplete="new-password"
                  value={confirmar} onChange={e => setConfirmar(e.target.value)} style={inp} />
              </div>
              {erro && <div style={alert}>{erro}</div>}
              <button type="submit" disabled={pending} style={{ ...btn, background: pending ? 'rgba(var(--brand-rgb),0.2)' : 'linear-gradient(135deg,var(--color-verde),var(--color-verde-dark))', color: 'var(--on-primary)', cursor: pending ? 'not-allowed' : 'pointer' }}>
                {pending ? 'Criando acesso…' : 'Criar acesso'}
              </button>
            </form>
            <div style={{ marginTop: 20 }}>
              <button onClick={voltarMatricula} style={linkBtn}>← Trocar matrícula</button>
            </div>
          </>
        )}

        {/* ── STEP: Enviando código ── */}
        {step === 'recuperar_enviando' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📧</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Enviando código para seu e-mail…</div>
          </div>
        )}

        {/* ── STEP: Código + nova senha ── */}
        {step === 'recuperar_codigo' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                Verifique seu e-mail
              </div>
            </div>

            {codigoDebug && (
              <div style={{ background: 'rgba(var(--brand-light-rgb),0.08)', border: '1px solid rgba(var(--brand-light-rgb),0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: 'rgba(var(--brand-light-rgb),0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Código (dev)</div>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 8, color: 'var(--color-gold)' }}>{codigoDebug}</div>
              </div>
            )}

            <form onSubmit={handleRedefinir} style={form}>
              <div>
                <label style={lbl} htmlFor="codigo">Código de 6 dígitos</label>
                <input id="codigo" type="text" inputMode="numeric" maxLength={6} placeholder="000000" autoFocus
                  value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
                  style={{ ...inp, fontSize: 22, letterSpacing: 8, textAlign: 'center', fontWeight: 700 }} />
              </div>
              <div>
                <label style={lbl} htmlFor="nova-senha-r">Nova senha</label>
                <input id="nova-senha-r" type="password" placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                  value={novaSenha} onChange={e => setNovaSenha(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl} htmlFor="confirmar-r">Confirmar senha</label>
                <input id="confirmar-r" type="password" placeholder="Repita a senha" autoComplete="new-password"
                  value={confirmarNova} onChange={e => setConfirmarNova(e.target.value)} style={inp} />
              </div>
              {erro && <div style={alert}>{erro}</div>}
              <button type="submit" disabled={pending || codigo.length < 6} style={{ ...btn, background: (pending || codigo.length < 6) ? 'rgba(var(--brand-rgb),0.25)' : 'linear-gradient(135deg,var(--color-verde),var(--color-verde-dark))', color: 'var(--on-primary)', cursor: (pending || codigo.length < 6) ? 'not-allowed' : 'pointer' }}>
                {pending ? 'Confirmando…' : 'Confirmar nova senha'}
              </button>
            </form>
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setStep('senha')} style={linkBtn}>← Voltar</button>
            </div>
          </>
        )}

        {/* ── STEP: Senha redefinida ── */}
        {step === 'recuperar_ok' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>Senha redefinida!</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
              Agora entre com sua matrícula e a nova senha.
            </div>
            <button onClick={() => { setSenha(''); setStep('senha') }}
              style={{ ...btn, background: 'linear-gradient(135deg,var(--color-verde),var(--color-verde-dark))', color: 'var(--on-primary)', cursor: 'pointer', width: '100%' }}>
              Entrar agora
            </button>
          </div>
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
