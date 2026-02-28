import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Autonomous Barge Draft Measurement',
  description: 'FREQ AI automates the 4-hour manual barge drafting process. Sub-inch accuracy, zero crew exposure, results in 10-15 minutes.',
}

export default function BargeDraftingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
