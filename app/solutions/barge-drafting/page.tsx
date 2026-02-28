'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { useState } from 'react'

const risks = [
  { title: 'Safety', desc: 'Man overboard is the highest non-navigational cause of fatality in maritime. Every manual drafting operation puts crew on exposed decks alongside active crane and loading equipment.' },
  { title: 'Accuracy', desc: 'A 1-3% discrepancy on a 1,500-ton barge = 15-45 tons unaccounted cargo. Real revenue loss on every load.' },
  { title: 'Time', desc: '4 hours per barge creates supply chain bottlenecks. Demurrage charges accumulate. Fleet utilization drops.' },
]

const beforeAfter = [
  ['4-hour process', '10-15 minute process'],
  ['Crew on deck required', 'Zero crew exposure'],
  ['Visual gauge reading', 'Autonomous measurement'],
  ['Radio relay to shore', 'Real-time digital output'],
  ['Paper documentation', 'Complete digital audit trail'],
  ['1-3% error rate', 'Sub-inch accuracy'],
  ['Man-overboard risk active', 'Safety risk eliminated'],
]

const phases = [
  { num: 1, title: 'Initial Survey', desc: 'Vessel ID and baseline condition assessment.' },
  { num: 2, title: 'Pre-Load Assessment', desc: 'Empty vessel readings. Loading parameters confirmed.' },
  { num: 3, title: 'Active Loading', desc: 'Real-time monitoring during loading.' },
  { num: 4, title: 'Cargo Verification', desc: 'Progressive verification against target parameters.' },
  { num: 5, title: 'Post-Load Assessment', desc: 'Final readings locked. Stability analysis complete.' },
  { num: 6, title: 'Final Survey & Report', desc: 'Complete draft survey generated and logged.' },
]

const glossary = [
  { term: 'Barge Draft', def: 'Vertical distance from waterline to lowest hull point.' },
  { term: 'Draft Survey', def: 'Calculating cargo weight from draft measurements (Archimedes).' },
  { term: 'Trim', def: 'Fore-to-aft balance. Zero trim = level keel.' },
  { term: 'Heel', def: 'Side-to-side tilt from asymmetric loading.' },
  { term: 'Freeboard', def: 'Waterline to deck. Decreases as loading increases.' },
  { term: 'Displacement', def: "Water displaced = vessel + cargo weight (Archimedes' principle)." },
  { term: 'GM Height', def: 'Metacentric height. Stability measure. Higher = more stable.' },
  { term: 'Man Overboard', def: 'Maritime emergency. Top non-navigational fatality cause.' },
  { term: 'Draft Marks', def: 'Measurements painted on hull for manual visual reading.' },
  { term: 'Inland Waterway', def: 'Navigable rivers and canals for commercial cargo transport.' },
  { term: 'USCG 46 CFR', def: 'US Coast Guard commercial vessel operations regulations.' },
]

export default function BargeDraftingPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <>
      {/* Hero */}
      <section className="blueprint-grid" style={{ padding: '120px 0 60px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginBottom: 20 }}>Autonomous Barge Draft Measurement</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            The most fundamental operation in inland waterway logistics — transformed.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 24 }}>How Barge Drafting Works Today</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>
              Barge drafting — the process of measuring how deep a loaded barge sits in the water to determine cargo weight — is performed manually on virtually every vessel in the US inland waterway system. The process has remained largely unchanged for decades.
            </p>
            <p>
              A typical manual drafting sequence requires a crew member to walk the barge deck to each draft mark location, visually read painted marks on the hull at the waterline, relay readings by radio to a shore-based operator, repeat the process at multiple measurement points, and compile all readings into a survey.
            </p>
            <p>
              This process takes approximately 4 hours per barge, requires crew presence on deck in active operational zones, introduces 1-3% measurement error, and produces paper-based documentation with limited traceability.
            </p>
          </div>
        </div>
      </section>

      {/* Risk Cards */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {risks.map(r => (
              <div key={r.title} className="card">
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  marginBottom: 12,
                  color: r.title === 'Safety' ? 'var(--red)' : r.title === 'Accuracy' ? 'var(--amber)' : 'var(--teal)',
                }}>{r.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {/* Headers */}
            <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: 'var(--red)' }}>BEFORE (Manual)</span>
            </div>
            <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: 'var(--green)' }}>AFTER (FREQ AI)</span>
            </div>
            {/* Rows */}
            {beforeAfter.map(([before, after], i) => (
              <>
                <div key={`b-${i}`} style={{ padding: '12px 24px', borderBottom: i < beforeAfter.length - 1 ? '1px solid var(--border)' : 'none', borderRight: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {before}
                </div>
                <div key={`a-${i}`} style={{ padding: '12px 24px', borderBottom: i < beforeAfter.length - 1 ? '1px solid var(--border)' : 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {after}
                </div>
              </>
            ))}
          </div>
        </div>
      </section>

      {/* 6-Phase Sequence */}
      <section className="section">
        <div className="container" style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 48, textAlign: 'center' }}>6-Phase Autonomous Sequence</h2>
          <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 32 }}>
            {phases.map(p => (
              <div key={p.num} style={{ marginBottom: 36, position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: -41,
                  top: 2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'var(--teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: 'var(--bg-primary)',
                }}>
                  {p.num}
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, marginBottom: 4 }}>Phase {p.num}: {p.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Glossary */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', marginBottom: 32 }}>Glossary</h2>
          {glossary.map((g, i) => (
            <div key={g.term} className="accordion-item">
              <button
                className="accordion-trigger"
                aria-expanded={openItems.has(i)}
                onClick={() => toggle(i)}
              >
                <span>{g.term}</span>
                <span className="chevron" style={{ fontSize: '0.8rem' }}>&#9660;</span>
              </button>
              <div className={`accordion-content${openItems.has(i) ? ' open' : ''}`}>
                <div className="accordion-content-inner">{g.def}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container">
          <Link href="/contact" className="btn-primary">Contact Us</Link>
        </div>
      </section>
    </>
  )
}
