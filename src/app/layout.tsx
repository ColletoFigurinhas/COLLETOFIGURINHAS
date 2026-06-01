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
  title: 'Álbum Oficial Supermédica',
  description: 'Álbum Oficial Supermédica — Super Copa 2026',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={outfit.variable}>
      <head>
        <link rel="icon" type="image/png" href="/album/page-01.png" />
        <link rel="apple-touch-icon" href="/album/page-01.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#1a2218" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>{children}</body>
    </html>
  )
}
