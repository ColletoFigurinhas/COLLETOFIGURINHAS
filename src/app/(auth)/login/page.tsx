'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 12, filter: 'drop-shadow(0 0 24px rgba(240,192,64,0.5))' }}>⚽</div>
        <div style={{ fontSize: 9, letterSpacing: 6, textTransform: 'uppercase', color: 'rgba(240,192,64,0.6)', marginBottom: 4 }}>Supermédica</div>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', background: 'linear-gradient(90deg,#009c3b,#f5c800,#009c3b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Super Copa 2026
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,192,64,0.15)', borderRadius: 16, padding: '36px 32px', backdropFilter: 'blur(10px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 24, textAlign: 'center' }}>
          Entrar no Álbum
        </div>

        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl} htmlFor="matricula">Matrícula</label>
            <input id="matricula" name="matricula" type="text" placeholder="Ex: 00931" autoComplete="username" style={inp}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('senha')?.focus() } }}
            />
            {state?.errors?.matricula?.map(e => <p key={e} style={err}>{e}</p>)}
          </div>

          <div>
            <label style={lbl} htmlFor="senha">Senha</label>
            <input id="senha" name="senha" type="password" placeholder="Sua senha" autoComplete="current-password" style={inp} />
            {state?.errors?.senha?.map(e => <p key={e} style={err}>{e}</p>)}
          </div>

          {state?.errors?.geral?.map(e => <div key={e} style={alert}>{e}</div>)}

          <button type="submit" disabled={pending} style={{ ...btn, background: pending ? 'rgba(0,156,59,0.3)' : 'linear-gradient(135deg,#009c3b,#006b29)', color: '#f5c800', cursor: pending ? 'not-allowed' : 'pointer' }}>
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a href="/recuperar-senha" style={{ fontSize: 10, color: 'rgba(240,192,64,0.5)', textDecoration: 'none', letterSpacing: 1 }}>
            Esqueci minha senha
          </a>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
        Primeiro acesso? Entre com sua matrícula e defina sua senha.
      </p>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }
const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, padding: '0 14px', outline: 'none', boxSizing: 'border-box' }
const err: React.CSSProperties = { fontSize: 10, color: '#ff6b6b', marginTop: 4, letterSpacing: 0.5 }
const alert: React.CSSProperties = { background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ff9999', lineHeight: 1.5 }
const btn: React.CSSProperties = { height: 48, borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', transition: 'all 0.2s ease' }
