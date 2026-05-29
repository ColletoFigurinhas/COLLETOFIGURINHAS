'use client'

import dynamic from 'next/dynamic'
import type { SectionData } from './page'

const FlipBook = dynamic(
  () => import('@/components/FlipBook/FlipBook'),
  { ssr: false }
)

export default function AlbumClient({ sections }: { sections: SectionData[] }) {
  return <FlipBook sections={sections} />
}
