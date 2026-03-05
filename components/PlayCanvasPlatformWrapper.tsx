'use client'

import dynamic from 'next/dynamic'

const PlayCanvasPlatform = dynamic(
  () => import('@/components/PlayCanvasPlatform'),
  { ssr: false }
)

export default function PlayCanvasPlatformWrapper() {
  return <PlayCanvasPlatform />
}
