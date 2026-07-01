// Selo fixo "powered by Colleto" — canto inferior-direito.
// Adapta ao contraste: cor clara escolhida → chip claro + logo colorida;
// cor escura → sem chip + logo branca (que aparece bem no fundo escuro).
export function ColletoBadge({ src, claro }: { src: string; claro: boolean }) {
  return (
    <a
      href="https://colletofigurinhas.com.br"
      target="_blank"
      rel="noopener noreferrer"
      className="colleto-badge"
      title="Powered by Colleto"
      style={{
        background: claro ? 'rgba(255,255,255,0.9)' : 'rgba(6,8,15,0.45)',
        border: claro ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span className="colleto-badge-label" style={{ color: claro ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}>
        powered by
      </span>
      <img src={src} alt="Colleto" draggable={false} />
    </a>
  )
}
