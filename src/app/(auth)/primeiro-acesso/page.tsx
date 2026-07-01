'use client'

import { useActionState } from 'react'
import { definirSenha } from '@/app/actions/auth'

export default function PrimeiroAcessoPage() {
  const [state, action, pending] = useActionState(definirSenha, undefined)

  return (
    <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 48, marginBottom: 10, filter: 'drop-shadow(0 0 20px rgba(var(--brand-light-rgb),0.4))' }}>🔑</div>
        <div style={{ fontSize: 9, letterSpacing: 5, textTransform: 'uppercase', color: 'rgba(var(--brand-light-rgb),0.6)', marginBottom: 6 }}>Primeiro Acesso</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Complete seu cadastro</div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(var(--brand-light-rgb),0.15)', borderRadius: 16, padding: '36px 32px', backdropFilter: 'blur(10px)' }}>

        <div style={{ background: 'rgba(var(--brand-light-rgb),0.06)', border: '1px solid rgba(var(--brand-light-rgb),0.12)', borderRadius: 8, padding: '10px 14px', marginBottom: 24, fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>
          O e-mail será usado para notificações e recuperação de senha.<br/>
          Senha: mínimo 8 caracteres · uma letra · um número.
        </div>

        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* E-mail */}
          <div>
            <label style={lbl} htmlFor="email">E-mail</label>
            <input
              id="email" name="email" type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              style={inp}
            />
            {state?.errors?.email?.map(e => <p key={e} style={err}>{e}</p>)}
          </div>

          {/* Senha */}
          <div>
            <label style={lbl} htmlFor="senha">Criar senha</label>
            <input
              id="senha" name="senha" type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              style={inp}
            />
            {state?.errors?.senha?.map(e => <p key={e} style={err}>{e}</p>)}
          </div>

          {/* Confirmar */}
          <div>
            <label style={lbl} htmlFor="confirmacao">Confirmar senha</label>
            <input
              id="confirmacao" name="confirmacao" type="password"
              placeholder="Repita a senha"
              autoComplete="new-password"
              style={inp}
            />
            {state?.errors?.confirmacao?.map(e => <p key={e} style={err}>{e}</p>)}
          </div>

          {state?.errors?.geral?.map(e => <div key={e} style={alert}>{e}</div>)}

          <button type="submit" disabled={pending} style={{
            height: 48, borderRadius: 10, border: 'none',
            background: pending ? 'rgba(var(--brand-light-rgb),0.3)' : 'linear-gradient(135deg,var(--color-gold),var(--color-verde-dark))',
            color: '#000', fontSize: 12, fontWeight: 800,
            letterSpacing: 3, textTransform: 'uppercase',
            cursor: pending ? 'not-allowed' : 'pointer',
          }}>
            {pending ? 'Salvando…' : 'Entrar no álbum'}
          </button>
        </form>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }
const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, padding: '0 14px', outline: 'none', boxSizing: 'border-box' }
const err: React.CSSProperties = { fontSize: 10, color: '#ff6b6b', marginTop: 4 }
const alert: React.CSSProperties = { background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ff9999' }
