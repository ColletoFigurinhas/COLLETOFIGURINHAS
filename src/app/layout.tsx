import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Álbum Panini FIFA 2026 — Coleção Oficial',
  description: 'Colecionador digital de figurinhas estilo Panini com efeito 3D de virada de páginas. Copa do Mundo FIFA 2026.',
  keywords: ['panini', 'álbum', 'figurinhas', 'FIFA', 'Copa do Mundo', '2026', '3D', 'flipbook'],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={outfit.variable}>
      <body style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>{children}</body>
    </html>
  )
}
