'use client'

import Link from 'next/link'

function scrollToSimAndSetView(view: string) {
  document.getElementById('simSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  setTimeout(() => {
    ;(window as any).__freqSimSetView?.(view)
  }, 600)
}

const useCases = [
  {
    num: '01',
    label: 'CORE SOLUTION',
    labelColor: 'var(--purple)',
    title: 'Barge Draft Measurement',
    desc: 'The 4-hour manual process automated in 10\u201315 minutes. Zero crew exposure.',
    action: 'link' as const,
    href: '/solutions/barge-drafting',
    linkText: 'View Full Solution',
    linkColor: 'var(--purple)',
  },
  {
    num: '02',
    label: 'EXPLORE',
    labelColor: 'var(--teal)',
    title: 'Cargo Load Monitoring',
    desc: 'Watch cargo distribute in real-time from above. See stability metrics update live.',
    action: 'view' as const,
    view: 'overhead',
    linkText: 'View Overhead Simulation',
    linkColor: 'var(--teal)',
  },
  {
    num: '03',
    label: 'EXPERIENCE',
    labelColor: 'var(--green)',
    title: 'Safety Governance',
    desc: 'Walk the deck in first person. Understand why crew exposure is the core risk eliminated.',
    action: 'view' as const,
    view: 'fp',
    linkText: 'Enter First Person',
    linkColor: 'var(--green)',
  },
  {
    num: '04',
    label: 'GET STARTED',
    labelColor: 'var(--amber)',
    title: 'Fleet Intelligence',
    desc: 'Scale from single vessel to enterprise fleet. Contact us to discuss your operation.',
    action: 'link' as const,
    href: '/contact',
    linkText: 'Contact Us',
    linkColor: 'var(--amber)',
  },
]

export default function PlatformUseCases() {
  return (
    <section className="section" id="useCases">
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
          What You Can Do With FREQ AI
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {useCases.map((u) => (
            <div
              key={u.num}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (u.action === 'link' && u.href) {
                  window.location.href = u.href
                } else if (u.action === 'view' && u.view) {
                  scrollToSimAndSetView(u.view)
                }
              }}
            >
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: u.labelColor,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                marginBottom: '0.75rem',
              }}>
                {u.num} &mdash; {u.label}
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>{u.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {u.desc}
              </p>
              <div style={{
                marginTop: '1rem',
                color: u.linkColor,
                fontSize: '0.85rem',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {u.linkText} &rarr;
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
