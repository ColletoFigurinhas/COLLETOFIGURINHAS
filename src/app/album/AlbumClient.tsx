'use client'

import dynamic from 'next/dynamic'
import type { SectionData } from './page'

const FlipBook = dynamic(
  () => import('@/components/FlipBook/FlipBook'),
  { ssr: false }
)

export default function AlbumClient({
  sections,
  nomeUsuario,
  matricula,
}: {
  sections: SectionData[]
  nomeUsuario: string
  matricula: string
}) {
  return <FlipBook sections={sections} nomeUsuario={nomeUsuario} matricula={matricula} />
}
