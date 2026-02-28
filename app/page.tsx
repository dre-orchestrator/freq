import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FREQ AI | Autonomous Maritime Cargo Intelligence',
}

const stats = [
  { value: '$2.1B', label: 'Annual cargo discrepancies on US inland waterways' },
  { value: '4 Hours', label: 'Average manual drafting time per barge' },
  { value: '1-3%', label: 'Industry-standard measurement error rate' },
  { value: '#1 Risk', label: 'Man overboard — leading non-navigational fatality' },
]

const solutions = [
  { value: '10-15 Min', title: 'Autonomous Drafting', desc: 'What took 4 hours now takes minutes' },
  { value: 'Sub-Inch', title: 'Precision Measurement', desc: 'Exceeding manual accuracy by orders of magnitude' },
  { value: 'Zero', title: 'Crew Exposure', desc: 'No personnel required on deck. MOB risk eliminated.' },
  { value: 'Real-Time', title: 'Continuous Intelligence', desc: 'Live cargo status and stability metrics at all times.' },
]

const steps = [
  { num: '01', title: 'Target', desc: 'Identify the vessel and define operational parameters.' },
  { num: '02', title: 'Execute', desc: 'Autonomous data acquisition captures precise measurements.' },
  { num: '03', title: 'Analyze', desc: 'AI-driven intelligence processes raw data into verified metrics.' },
  { num: '04', title: 'Report', desc: 'Draft readings, stability analysis, and compliance docs delivered instantly.' },
]

const market = [
  { value: '22,356', label: 'Active barges on US inland waterways' },
  { value: '600M+', label: 'Tons of cargo transported annually' },
  { value: '$6.96B', label: 'Autonomous maritime market size (2025)' },
  { value: 'D+', label: 'ASCE infrastructure grade for inland waterways' },
]

export default function HomePage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'FREQ AI',
            url: 'https://freqai.io',
            foundingDate: '2024',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Slidell',
              addressRegion: 'LA',
              addressCountry: 'US',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              email: 'info@freqai.io',
            },
          }),
        }}
      />

      {/* Hero */}
      <section className="blueprint-grid" style={{ padding: '120px 0 80px', minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-label">Maritime Intelligence Platform</div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 700, marginBottom: 24, color: 'var(--white)' }}>
            Maritime Cargo Drafting, Reinvented.
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 640, lineHeight: 1.7 }}>
            FREQ AI replaces the 4-hour manual barge drafting process with autonomous intelligence — delivering results in 15 minutes with zero crew exposure.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/platform" className="btn-primary">Explore the Platform</Link>
            <Link href="/contact" className="btn-outline">Contact Us</Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-label">The Problem</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', marginBottom: 24 }}>An Industry Running on Outdated Methods</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 720, marginBottom: 48, lineHeight: 1.7 }}>
            Every day, thousands of barges on America&#39;s inland waterways undergo a manual cargo drafting process that hasn&#39;t changed in decades. Crew members walk barge decks in hazardous conditions, take manual gauge readings, relay numbers by radio, and compile reports by hand. The process takes 4 hours per barge, introduces 1-3% measurement error, and exposes workers to the highest non-navigational fatality risk in the maritime industry.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {stats.map(s => (
              <div key={s.value} className="card">
                <div className="data-value-lg" style={{ fontSize: '2rem', marginBottom: 8 }}>{s.value}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="section">
        <div className="container">
          <div className="section-label">The Solution</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', marginBottom: 24 }}>The Intelligence Layer Maritime Has Been Missing</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 720, marginBottom: 48, lineHeight: 1.7 }}>
            FREQ AI builds autonomous intelligence for maritime cargo operations. Our platform replaces manual processes with AI-driven data acquisition, real-time analysis, and verified reporting — reducing drafting time by over 90% while eliminating crew safety risk entirely.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {solutions.map(s => (
              <div key={s.value} className="card">
                <div className="data-value-lg" style={{ fontSize: '1.6rem', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, marginBottom: 8 }}>{s.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', marginBottom: 48, textAlign: 'center' }}>Four Steps from Vessel to Verified Report</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {steps.map(s => (
              <div key={s.num} style={{ textAlign: 'center' }}>
                <div className="data-value" style={{ fontSize: '2.4rem', fontWeight: 700, marginBottom: 8 }}>{s.num}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>{s.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market */}
      <section className="section">
        <div className="container">
          <div className="section-label">The Opportunity</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', marginBottom: 48 }}>America&#39;s Inland Waterways Are Ready for Transformation</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {market.map(s => (
              <div key={s.value} className="card">
                <div className="data-value-lg" style={{ fontSize: '2rem', marginBottom: 8 }}>{s.value}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 16 }}>Ready to modernize your cargo operations?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
            Connect with our team to learn how FREQ AI can transform your maritime drafting process.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Link href="/contact" className="btn-primary">Get in Touch</Link>
            <a href="mailto:info@freqai.io" style={{ color: 'var(--teal)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem' }}>info@freqai.io</a>
          </div>
        </div>
      </section>
    </>
  )
}
