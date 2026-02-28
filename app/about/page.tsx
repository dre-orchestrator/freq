import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
}

const principles = [
  { title: 'Safety First', desc: 'Every decision prioritizes crew safety above all objectives.' },
  { title: 'Precision', desc: 'Sub-inch accuracy is the baseline, not the aspiration.' },
  { title: 'Speed', desc: '4 hours to 15 minutes — time returned is value created.' },
  { title: 'Intelligence', desc: 'Data collection is not enough. We deliver autonomous decisions.' },
]

const timeline = [
  { year: '2024', desc: 'Founded. Initial R&D and platform architecture.' },
  { year: '2025', desc: 'Core platform development. Strategic partnerships initiated.' },
  { year: '2026', desc: 'Phase 3 — Simulation, digital twin, partnership expansion.' },
  { year: '2027', desc: 'Planned commercial deployment and fleet-scale operations.' },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="blueprint-grid" style={{ padding: '120px 0 60px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginBottom: 20 }}>Building the Future of Maritime Intelligence</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            FREQ AI was founded with a single conviction: the inland waterway industry deserves the same technological transformation that has modernized every other sector of global logistics.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-label">Our Story</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>
              FREQ AI was born from direct experience on the water. Our founder spent years working in maritime cargo operations, watching skilled professionals perform critical measurements using processes that hadn&#39;t changed in decades — walking barge decks in hazardous conditions, reading analog gauges, relaying numbers by radio, and compiling reports by hand.
            </p>
            <p>
              The inland waterway system carries over 600 million tons of cargo annually across more than 12,000 miles of navigable waterways. It is the quiet backbone of American commerce — moving grain, coal, petroleum, aggregates, and manufactured goods that touch nearly every sector of the economy.
            </p>
            <p>
              FREQ AI exists to close that gap. We are building an autonomous intelligence platform that transforms how maritime cargo operations are measured, monitored, and managed — starting with the most fundamental operation: barge drafting.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 20 }}>Mission</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>
            To eliminate risk, error, and inefficiency from maritime cargo operations through autonomous intelligence — making the inland waterway system safer, more accurate, and more productive for every operator, every barge, every load.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {principles.map(p => (
              <div key={p.title} className="card">
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '1.1rem', marginBottom: 8, color: 'var(--white)' }}>{p.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location + Timeline */}
      <section className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 12 }}>Based in Slidell, Louisiana</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 48, lineHeight: 1.7 }}>
            Headquartered on the Gulf Intracoastal Waterway. We build where the barges are.
          </p>

          <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 32 }}>
            {timeline.map(t => (
              <div key={t.year} style={{ marginBottom: 32, position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: -41,
                  top: 4,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'var(--bg-primary)',
                  border: '2px solid var(--purple)',
                }} />
                <div className="data-value" style={{ fontSize: '1.2rem', marginBottom: 4 }}>{t.year}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
