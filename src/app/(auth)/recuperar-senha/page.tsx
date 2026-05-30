'use client'

import { useActionState, useState } from 'react'
import { enviarCodigo, verificarCodigo } from '@/app/actions/auth'

export default function RecuperarSenhaPage() {
  const [matricula, setMatricula] = useState('')
  const [etapa, setEtapa] = useState<'matricula' | 'codigo' | 'ok'>('matricula')
  const [codigoDebug, setCodigoDebug] = useState('')
  const [emailFalhou, setEmailFalhou] = useState(false)

  const [stateEnvio, actionEnvio, pendingEnvio] = useActionState(
    async (prev: any, form: FormData) => {
      const result = await enviarCodigo(prev, form)
      if (result?.codigoEnviado) {
        if (result.codigoDebug) { setCodigoDebug(result.codigoDebug); setEmailFalhou(true) }
        setEtapa('codigo')
      }
      return result
    },
    undefined
  )

  const [stateCodigo, actionCodigo, pendingCodigo] = useActionState(
    async (prev: any, form: FormData) => {
      const result = await verificarCodigo(prev, form)
      if (result?.ok) setEtapa('ok')
      return result
    },
    undefined
  )

  // ── Sucesso ────────────────────────────────────────────────────
  if (etapa === 'ok') return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 12 }}>Senha redefinida!</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
        Agora entre com sua matrícula e a nova senha.
      </div>
      <a href="/login" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#009c3b,#006b29)', color: '#f5c800', fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', borderRadius: 10, padding: '12px 28px', textDecoration: 'none' }}>
        Ir para o login
      </a>
    </div>
  )

  // ── Etapa 2: código + nova senha ───────────────────────────────
  if (etapa === 'codigo') return (
    <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>📧</div>
        <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(240,192,64,0.6)', marginBottom: 6 }}>
          Verifique seu e-mail
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          {emailFalhou
            ? 'SMTP não configurado — use o código abaixo para testar:'
            : 'Enviamos um código de 6 dígitos para o e-mail cadastrado. Válido por 1 hora.'}
        </div>
      </div>

      {/* Código debug (dev sem SMTP) */}
      {codigoDebug && (
        <div style={{
          background: 'rgba(245,200,0,0.1)', border: '1px solid rgba(245,200,0,0.3)',
          borderRadius: 12, padding: '16px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 9, color: 'rgba(245,200,0,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            Código (modo desenvolvimento)
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 10, color: '#f5c800' }}>
            {codigoDebug}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
            Configure SMTP_HOST no .env.local para receber por e-mail
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,192,64,0.15)', borderRadius: 16, padding: '32px 28px', backdropFilter: 'blur(10px)' }}>
        <form action={actionCodigo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input type="hidden" name="matricula" value={matricula} />

          <div>
            <label style={lbl} htmlFor="codigo">Código de 6 dígitos</label>
            <input
              id="codigo" name="codigo" type="text"
              inputMode="numeric" maxLength={6}
              placeholder="000000"
              style={{ ...inp, fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 700 }}
            />
            {stateCodigo?.errors?.codigo?.map(e => <p key={e} style={err}>{e}</p>)}
          </div>

          <div>
            <label style={lbl} htmlFor="senha">Nova senha</label>
            <input id="senha" name="senha" type="password" placeholder="Nova senha" autoComplete="new-password" style={inp} />
            {stateCodigo?.errors?.senha?.map(e => <p key={e} style={err}>{e}</p>)}
          </div>

          <div>
            <label style={lbl} htmlFor="confirmacao">Confirmar senha</label>
            <input id="confirmacao" name="confirmacao" type="password" placeholder="Repita a senha" autoComplete="new-password" style={inp} />
            {stateCodigo?.errors?.confirmacao?.map(e => <p key={e} style={err}>{e}</p>)}
          </div>

          {stateCodigo?.errors?.geral?.map(e => <div key={e} style={alertStyle}>{e}</div>)}

          <button type="submit" disabled={pendingCodigo} style={btnGold(pendingCodigo)}>
            {pendingCodigo ? 'Verificando…' : 'Confirmar'}
          </button>
        </form>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button onClick={() => setEtapa('matricula')} style={{ background: 'none', border: 'none', fontSize: 10, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', letterSpacing: 1 }}>
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
        <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(240,192,64,0.6)', marginBottom: 6 }}>Recuperar senha</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Informe sua matrícula</div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,192,64,0.15)', borderRadius: 16, padding: '36px 32px', backdropFilter: 'blur(10px)' }}>
        <form action={actionEnvio} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl} htmlFor="matricula">Matrícula</label>
            <input
              id="matricula" name="matricula" type="text" placeholder="Sua matrícula"
              value={matricula} onChange={e => setMatricula(e.target.value)}
              style={inp}
            />
            {stateEnvio?.errors?.matricula?.map(e => <p key={e} style={err}>{e}</p>)}
          </div>
          {stateEnvio?.errors?.geral?.map(e => <div key={e} style={alertStyle}>{e}</div>)}
          <button type="submit" disabled={pendingEnvio} style={btnGold(pendingEnvio)}>
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
const err: React.CSSProperties = { fontSize: 10, color: '#ff6b6b', marginTop: 4 }
const alertStyle: React.CSSProperties = { background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ff9999' }
const btnGold = (d: boolean): React.CSSProperties => ({ height: 48, borderRadius: 10, border: 'none', background: d ? 'rgba(0,156,59,0.3)' : 'linear-gradient(135deg,#009c3b,#006b29)', color: '#f5c800', fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', cursor: d ? 'not-allowed' : 'pointer' })
