'use client'

import { useState, useTransition } from 'react'
import { superAdminLogin } from '@/app/actions/auth'

export default function SuperLoginPage() {
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [erro,    setErro]    = useState('')
  const [pending, start]      = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErro('')
    start(async () => {
      const r = await superAdminLogin(email, senha)
      if (r?.error) setErro(r.error)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/logo-icon.png" alt="Colleto" draggable={false}
            style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 10, filter: 'drop-shadow(0 0 18px rgba(59,130,246,0.45))' }} />
          <div style={{ fontSize: 9, letterSpacing: 5, textTransform: 'uppercase', color: 'rgba(96,165,250,0.6)', marginBottom: 4 }}>Colleto</div>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, color: '#fff' }}>Super Admin</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, padding: '32px 28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={lbl}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus
                style={inp} placeholder="admin@colleto.com.br" />
            </div>
            <div>
              <label style={lbl}>Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
                style={inp} placeholder="Senha" />
            </div>
            {erro && (
              <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ff9999' }}>
                {erro}
              </div>
            )}
            <button type="submit" disabled={pending} style={{
              height: 46, borderRadius: 10, border: 'none',
              background: pending ? 'rgba(29,78,216,0.3)' : 'linear-gradient(135deg,#1d4ed8,#1e40af)',
              color: '#93c5fd', fontSize: 11, fontWeight: 800, letterSpacing: 3,
              textTransform: 'uppercase', cursor: pending ? 'not-allowed' : 'pointer',
            }}>
              {pending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }
const inp: React.CSSProperties = { width: '100%', height: 42, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, padding: '0 14px', outline: 'none', boxSizing: 'border-box' }
