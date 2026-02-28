import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Team',
}

const openRoles = [
  { title: 'AI/ML Engineer', desc: 'Build intelligence models for autonomous cargo measurement.' },
  { title: 'Maritime Operations Specialist', desc: 'Bridge industry expertise and autonomous system design.' },
  { title: 'Simulation Developer', desc: 'Build high-fidelity digital twin environments.' },
]

export default function TeamPage() {
  return (
    <>
      {/* Hero */}
      <section className="blueprint-grid" style={{ padding: '120px 0 60px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginBottom: 20 }}>The Team Behind FREQ AI</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Built by people who understand both the water and the technology.
          </p>
        </div>
      </section>

      {/* Founder */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--purple)',
            borderRadius: 8,
            padding: 40,
            display: 'flex',
            gap: 32,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}>
            {/* Avatar */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: '1.4rem',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}>
              DA
            </div>

            <div style={{ flex: 1, minWidth: 280 }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Dre Alvarez</h2>
              <div style={{ color: 'var(--purple)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', marginBottom: 16 }}>Founder &amp; Chief Executive Officer</div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                Former maritime cargo operations professional with direct experience in barge drafting, terminal operations, and inland waterway logistics. Combining firsthand industry knowledge with expertise in AI systems architecture, Dre founded FREQ AI to solve the operational challenges he witnessed daily.
              </p>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Slidell, Louisiana</span>
                <a href="https://linkedin.com/in/andry-alvarez" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)', fontSize: '0.85rem', fontFamily: "'JetBrains Mono', monospace" }}>LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 12 }}>We&#39;re Building the Team</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.7 }}>
            FREQ AI is in active growth phase. Looking for exceptional people who want to build technology that transforms a critical industry.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {openRoles.map(r => (
              <div key={r.title} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{r.desc}</div>
                </div>
                <Link href="/contact" style={{ color: 'var(--teal)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', textDecoration: 'none' }}>
                  Reach out.
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnerships */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 16 }}>Strategic Partnerships</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            FREQ AI is building relationships with industry leaders in cloud infrastructure, maritime technology, and autonomous systems.
          </p>
        </div>
      </section>
    </>
  )
}
