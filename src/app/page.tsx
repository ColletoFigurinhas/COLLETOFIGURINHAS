'use client'

import dynamic from 'next/dynamic'

// Disable SSR — FlipBook needs browser APIs (DOM, animation)
const FlipBook = dynamic(() => import('@/components/FlipBook/FlipBook'), {
  ssr: false,
})

export default function HomePage() {
  return <FlipBook />
}
