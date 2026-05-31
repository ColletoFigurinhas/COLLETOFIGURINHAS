'use client'

import dynamic from 'next/dynamic'
import type { SectionData } from './page'
import type { Role } from '@prisma/client'

const FlipBook = dynamic(
  () => import('@/components/FlipBook/FlipBook'),
  { ssr: false }
)

export default function AlbumClient({
  sections,
  nomeUsuario,
  matricula,
  role,
}: {
  sections: SectionData[]
  nomeUsuario: string
  matricula: string
  role: Role
}) {
  return <FlipBook sections={sections} nomeUsuario={nomeUsuario} matricula={matricula} role={role} />
}
