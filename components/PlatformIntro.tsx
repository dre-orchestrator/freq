'use client'

function scrollToSimAndSetView(view: string) {
  document.getElementById('simSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  setTimeout(() => {
    ;(window as any).__freqSimSetView?.(view)
  }, 600)
}

export default function PlatformIntro() {
  return (
    <section style={{ padding: '4rem 0 2.5rem', textAlign: 'center' }}>
      <div className="container">
        <div className="section-label" style={{ fontSize: '0.75rem', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
          LIVE SIMULATION
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Experience Autonomous Barge Drafting
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 2rem', fontSize: '1rem', lineHeight: 1.7 }}>
          This is a real-time simulation of the FREQ AI autonomous drafting sequence.
          Choose your camera angle. Walk the deck in first person. Start the sequence
          when you&apos;re ready. Nothing moves until you do.
        </p>

        {/* View shortcut pills */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <button
            className="view-pill"
            onClick={() => scrollToSimAndSetView('overhead')}
          >
            &uarr; Overhead View
          </button>
          <button
            className="view-pill"
            onClick={() => scrollToSimAndSetView('side')}
          >
            &larr; Side Profile
          </button>
          <button
            className="view-pill view-pill--fp"
            onClick={() => scrollToSimAndSetView('fp')}
          >
            Walk the Deck (First Person)
          </button>
        </div>
      </div>
    </section>
  )
}
