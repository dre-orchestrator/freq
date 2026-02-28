import type { Metadata } from 'next'
import Link from 'next/link'
import SimulationWrapper from '@/components/SimulationWrapper'
import PlatformIntro from '@/components/PlatformIntro'
import PlatformUseCases from '@/components/PlatformUseCases'

export const metadata: Metadata = {
  title: 'Platform',
  description: 'FREQ AI hardware-agnostic intelligence platform for autonomous maritime cargo operations. Live 3D simulation of barge drafting sequence.',
}

export default function PlatformPage() {
  return (
    <>
      {/* Live Simulation Intro */}
      <PlatformIntro />

      {/* Simulation */}
      <section id="simSection" style={{ padding: '0 0 80px', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <SimulationWrapper />
        </div>
      </section>

      {/* Use Cases */}
      <PlatformUseCases />
    </>
  )
}
