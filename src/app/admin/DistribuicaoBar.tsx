'use client'

import { useState, useEffect, useTransition } from 'react'
import { distribuirPacotesHoje } from '@/app/actions/distribuir'

// Calcula próxima distribuição: 18h horário de Brasília (UTC-3) = 21h UTC, seg-sex
// Pula o dia de início da campanha (coberto pelo nivelamento no login)
function proximaDistribuicao(dataInicio: string | null): Date {
  const now  = new Date()
  const next = new Date(now)
  next.setUTCHours(21, 0, 0, 0) // 18:00 BRT

  if (now >= next) next.setDate(next.getDate() + 1)

  // Pula o dia 1 da campanha
  if (dataInicio) {
    const inicioDia = new Date(dataInicio)
    inicioDia.setUTCHours(0, 0, 0, 0)
    const nextDia = new Date(next)
    nextDia.setUTCHours(0, 0, 0, 0)
    if (nextDia.getTime() === inicioDia.getTime()) next.setDate(next.getDate() + 1)
  }

  // Pula fim de semana
  while (next.getUTCDay() === 0 || next.getUTCDay() === 6) {
    next.setDate(next.getDate() + 1)
  }
  return next
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '—'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function formatData(d: Date): string {
  return d.toLocaleString('pt-BR', { weekday:'short', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', timeZone:'America/Sao_Paulo' })
}

export default function DistribuicaoBar({ dataInicioCampanha }: { dataInicioCampanha: string | null }) {
  const [prox,       setProx]       = useState<Date>(() => proximaDistribuicao(dataInicioCampanha))
  const [countdown,  setCountdown]  = useState('')
  const [resultado,  setResultado]  = useState<{ distribuidos: number; jaReceberam: number } | null>(null)
  const [erro,       setErro]       = useState('')
  const [pending,    startTransition] = useTransition()

  useEffect(() => {
    const tick = () => {
      const next = proximaDistribuicao(dataInicioCampanha)
      setProx(next)
      setCountdown(formatCountdown(next.getTime() - Date.now()))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  function distribuir() {
    setResultado(null); setErro('')
    startTransition(async () => {
      try {
        const r = await distribuirPacotesHoje()
        setResultado({ distribuidos: r.distribuidos, jaReceberam: r.jaReceberam })
      } catch (e: any) {
        setErro(e.message ?? 'Erro ao distribuir')
      }
    })
  }

  return (
    <div style={{
      background: 'rgba(0,156,59,0.06)',
      borderBottom: '1px solid rgba(0,156,59,0.15)',
      padding: '10px 24px',
      display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
    }}>
      {/* Timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
          Próxima distribuição automática
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>
            {countdown}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
            ({formatData(prox)})
          </span>
        </div>
      </div>

      {/* Separador */}
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Botão distribuir agora */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={distribuir}
          disabled={pending}
          style={{
            padding: '7px 18px', borderRadius: 8, border: 'none',
            background: pending ? 'rgba(0,156,59,0.2)' : 'linear-gradient(135deg,#009c3b,#006b29)',
            color: '#f5c800', fontSize: 9, fontWeight: 700, letterSpacing: 2,
            textTransform: 'uppercase', cursor: pending ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {pending ? 'Distribuindo…' : '⚡ Distribuir agora'}
        </button>

        {resultado && (
          <span style={{ fontSize: 11, color: '#4ade80' }}>
            ✓ {resultado.distribuidos} pacotes enviados
            {resultado.jaReceberam > 0 && ` · ${resultado.jaReceberam} já tinham recebido`}
          </span>
        )}
        {erro && <span style={{ fontSize: 11, color: '#f87171' }}>{erro}</span>}
      </div>
    </div>
  )
}
