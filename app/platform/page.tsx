import type { Metadata } from 'next'
import PlayCanvasPlatformWrapper from '@/components/PlayCanvasPlatformWrapper'

export const metadata: Metadata = {
  title: 'Platform | FREQ AI',
  description:
    'FREQ AI hardware-agnostic intelligence platform for autonomous maritime cargo operations. Live 3D PlayCanvas visualization of barge drafting sequence.',
}

export default function PlatformPage() {
  return <PlayCanvasPlatformWrapper />
}
