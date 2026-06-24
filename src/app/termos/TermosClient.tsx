'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { aceitarTermos } from '@/app/actions/auth'
import { TERMOS_SECOES, TERMOS_TITULO, TERMOS_VERSAO, TERMOS_AVISO } from '@/lib/termos'

export default function TermosClient({ nome, ehAdmin }: { nome: string; ehAdmin: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [leuTudo, setLeuTudo] = useState(false)
  const [aceito, setAceito]   = useState(false)
  const [pending, startTransition] = useTransition()

  // Se o conteúdo não precisa de scroll (tela grande), já libera.
  useEffect(() => {
    const el = boxRef.current
    if (el && el.scrollHeight - el.clientHeight <= 8) setLeuTudo(true)
  }, [])

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) setLeuTudo(true)
  }

  function confirmar() {
    if (!aceito) return
    startTransition(() => { aceitarTermos() })
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ marginBottom: 18 }}>
          <div style={kicker}>● Antes de continuar</div>
          <h1 style={titulo}>{TERMOS_TITULO}</h1>
          <p style={sub}>
            Olá, {nome.split(' ')[0]}. {ehAdmin ? 'Como administrador da empresa, ' : ''}
            leia os termos abaixo até o final para prosseguir.
          </p>
          <div style={aviso}>⚠️ {TERMOS_AVISO}</div>
        </div>

        <div ref={boxRef} onScroll={onScroll} style={scrollBox}>
          {TERMOS_SECOES.map(sec => (
            <section key={sec.titulo} style={{ marginBottom: 18 }}>
              <h2 style={secTitulo}>{sec.titulo}</h2>
              {sec.paragrafos.map((p, i) => (
                <p key={i} style={paragrafo}>{p}</p>
              ))}
            </section>
          ))}
          <div style={fim}>— Fim dos termos (versão {TERMOS_VERSAO}) —</div>
        </div>

        {!leuTudo && (
          <div style={dica}>↓ Role até o fim do texto para habilitar o aceite</div>
        )}

        <label style={{ ...checkRow, opacity: leuTudo ? 1 : 0.4, cursor: leuTudo ? 'pointer' : 'not-allowed' }}>
          <input
            type="checkbox"
            disabled={!leuTudo}
            checked={aceito}
            onChange={e => setAceito(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#f0c040' }}
          />
          <span>Li e concordo com os Termos de Uso e a Política de Privacidade.</span>
        </label>

        <button
          onClick={confirmar}
          disabled={!aceito || pending}
          style={{
            ...botao,
            background: (!aceito || pending) ? 'rgba(240,192,64,0.25)' : 'linear-gradient(135deg,#f0c040,#b8902c)',
            color: (!aceito || pending) ? 'rgba(255,255,255,0.5)' : '#000',
            cursor: (!aceito || pending) ? 'not-allowed' : 'pointer',
          }}
        >
          {pending ? 'Confirmando…' : 'Aceito e quero continuar'}
        </button>
      </div>
    </div>
  )
}

const wrap: React.CSSProperties = {
  minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20, background: 'radial-gradient(1200px 600px at 50% -10%, #15233f 0%, #0a1120 60%, #070b15 100%)',
}
const card: React.CSSProperties = {
  width: '100%', maxWidth: 720, background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(240,192,64,0.15)', borderRadius: 16, padding: '28px 28px 24px',
  backdropFilter: 'blur(10px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
}
const kicker: React.CSSProperties = { fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(240,192,64,0.7)', marginBottom: 8 }
const titulo: React.CSSProperties = { margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }
const sub: React.CSSProperties = { margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }
const aviso: React.CSSProperties = { marginTop: 14, background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.18)', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }
const scrollBox: React.CSSProperties = {
  marginTop: 16, height: '46vh', overflowY: 'auto', padding: '4px 16px 4px 4px',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, background: 'rgba(0,0,0,0.2)',
}
const secTitulo: React.CSSProperties = { margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: '#f0c040' }
const paragrafo: React.CSSProperties = { margin: '0 0 8px', fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }
const fim: React.CSSProperties = { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', padding: '10px 0 4px' }
const dica: React.CSSProperties = { marginTop: 12, textAlign: 'center', fontSize: 11, color: 'rgba(240,192,64,0.8)' }
const checkRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.8)' }
const botao: React.CSSProperties = {
  width: '100%', height: 50, marginTop: 16, borderRadius: 10, border: 'none',
  fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase',
}
