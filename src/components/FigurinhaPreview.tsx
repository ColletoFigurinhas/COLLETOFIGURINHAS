'use client'

import { useEffect } from 'react'

type Props = {
  id: number
  imagemUrl: string
  classificacao?: string
  onClose: () => void
  onTrocar?: () => void
}

export default function FigurinhaPreview({ id, imagemUrl, classificacao, onClose, onTrocar }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function baixar() {
    const a = document.createElement('a')
    a.href = imagemUrl
    a.download = `figurinha-${id}.png`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          maxWidth: 320,
        }}
      >
        {/* Figurinha ampliada */}
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
          width: 246, height: 376,
        }}>
          <img
            src={imagemUrl}
            alt={`Figurinha #${id}`}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* Info */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
            {classificacao ?? ''}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f5c800', marginTop: 2 }}>
            Figurinha #{id}
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button onClick={baixar} style={{
            flex: 1, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,var(--color-verde),var(--color-verde-dark))',
            color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}>
            ⬇ Baixar
          </button>

          {onTrocar && (
            <button onClick={onTrocar} style={{
              flex: 1, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#f5c800,#c49200)',
              color: '#000', fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}>
              🔄 Trocar
            </button>
          )}
        </div>

        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, color: 'rgba(255,255,255,0.4)',
          padding: '6px 20px', fontSize: 10, letterSpacing: 2, cursor: 'pointer',
          textTransform: 'uppercase',
        }}>
          Fechar
        </button>
      </div>
    </div>
  )
}
