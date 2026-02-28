import type { Metadata } from 'next'
import Link from 'next/link'
import SimulationWrapper from '@/components/SimulationWrapper'

export const metadata: Metadata = {
  title: 'Platform',
  description: 'FREQ AI hardware-agnostic intelligence platform for autonomous maritime cargo operations. Live 3D simulation of barge drafting sequence.',
}

const capabilities = [
  { title: 'Autonomous Measurement', desc: 'Precision cargo draft readings without manual intervention.' },
  { title: 'Real-Time Monitoring', desc: 'Continuous visibility into cargo status and vessel stability.' },
  { title: 'Safety Governance', desc: 'Integrated hazard detection. Man-overboard risk eliminated.' },
  { title: 'Compliance & Reporting', desc: 'Automated draft surveys and regulatory documentation.' },
  { title: 'Hardware Agnostic', desc: 'Radar, LiDAR, pressure, drone, or visual — any input.' },
  { title: 'Fleet Scale', desc: 'Single vessel to enterprise fleet management.' },
]

const useCases = [
  { title: 'Barge Draft Measurement', desc: '10-15 min autonomous cycle, zero crew exposure.', link: '/solutions/barge-drafting', linkText: 'View Solution' },
  { title: 'Cargo Load Optimization', desc: 'Precision loading for maximum revenue per trip.', link: null, linkText: null },
  { title: 'Safety Monitoring', desc: 'Continuous zone monitoring with automatic hazard detection.', link: null, linkText: null },
  { title: 'Fleet Intelligence', desc: 'Real-time visibility across your entire barge fleet.', link: null, linkText: null },
]

export default function PlatformPage() {
  return (
    <>
      {/* Hero */}
      <section className="blueprint-grid" style={{ padding: '120px 0 60px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginBottom: 20 }}>The Intelligence Layer for Maritime Cargo Operations</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            FREQ AI&#39;s platform sits between your existing hardware and your operational decisions — transforming raw sensor data into actionable cargo intelligence.
          </p>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-label">Platform Overview</div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Our platform is hardware-agnostic by design. Whether your operation uses radar, LiDAR, pressure sensors, or visual monitoring, FREQ AI&#39;s intelligence layer normalizes data from any source into a unified operational picture. The result: autonomous drafting, real-time monitoring, and verified compliance reporting — regardless of what hardware generates the input.
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {capabilities.map(c => (
              <div key={c.title} className="card">
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, marginBottom: 8 }}>{c.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simulation */}
      <section style={{ padding: '40px 0 80px', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <SimulationWrapper />
        </div>
      </section>

      {/* Use Cases */}
      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 32 }}>Use Cases</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {useCases.map(u => (
              <div key={u.title} className="card">
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, marginBottom: 8 }}>{u.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 12 }}>{u.desc}</div>
                {u.link && (
                  <Link href={u.link} style={{ color: 'var(--teal)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', textDecoration: 'none' }}>
                    {u.linkText} &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
