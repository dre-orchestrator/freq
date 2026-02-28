'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '60px 0 32px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }} className="footer-grid">
          {/* Col 1 */}
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--white)', marginBottom: 8 }}>FREQ AI</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Autonomous Maritime Intelligence</div>
          </div>

          {/* Col 2 */}
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Product</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/platform" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Platform</Link>
              <Link href="/solutions/barge-drafting" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Barge Drafting</Link>
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>About</Link>
              <Link href="/team" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Team</Link>
              <Link href="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Contact</Link>
            </div>
          </div>

          {/* Col 4 */}
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Connect</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="mailto:info@freqai.io" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>info@freqai.io</a>
              <a href="https://linkedin.com/in/andry-alvarez" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>LinkedIn</a>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Slidell, Louisiana</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: 48, paddingTop: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          &copy; 2026 FREQ AI. All rights reserved.
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
