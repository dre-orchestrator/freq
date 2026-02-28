'use client'

import dynamic from 'next/dynamic'

const Simulation = dynamic(() => import('@/components/Simulation'), { ssr: false })

export default function SimulationWrapper() {
  return <Simulation />
}
