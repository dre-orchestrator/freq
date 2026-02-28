'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/platform', label: 'Platform' },
  { href: '/solutions/barge-drafting', label: 'Solutions' },
  { href: '/about', label: 'About' },
  { href: '/team', label: 'Team' },
  { href: '/contact', label: 'Contact' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(8,12,24,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link href="/" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: 'var(--white)', textDecoration: 'none' }}>
          FREQ AI
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-desktop">
          {links.map(l => {
            const isActive = l.href === '/solutions/barge-drafting'
              ? pathname.startsWith('/solutions')
              : pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  textDecoration: 'none',
                  color: isActive ? 'var(--white)' : 'var(--text-secondary)',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  paddingBottom: 4,
                  borderBottom: isActive ? '2px solid var(--purple)' : '2px solid transparent',
                  transition: 'color 0.2s',
                }}
              >
                {l.label}
              </Link>
            )
          })}
          <Link href="/contact" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: 32,
            height: 32,
            position: 'relative',
          }}
        >
          <span style={{
            display: 'block',
            width: 20,
            height: 2,
            background: 'var(--white)',
            position: 'absolute',
            left: 6,
            top: open ? 15 : 9,
            transform: open ? 'rotate(45deg)' : 'none',
            transition: 'all 0.2s',
          }} />
          <span style={{
            display: 'block',
            width: 20,
            height: 2,
            background: 'var(--white)',
            position: 'absolute',
            left: 6,
            top: 15,
            opacity: open ? 0 : 1,
            transition: 'opacity 0.2s',
          }} />
          <span style={{
            display: 'block',
            width: 20,
            height: 2,
            background: 'var(--white)',
            position: 'absolute',
            left: 6,
            top: open ? 15 : 21,
            transform: open ? 'rotate(-45deg)' : 'none',
            transition: 'all 0.2s',
          }} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="nav-mobile-menu" style={{
          borderTop: '1px solid var(--border)',
          background: 'rgba(8,12,24,0.98)',
          padding: '16px 0',
        }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{
                  textDecoration: 'none',
                  color: 'var(--text-secondary)',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '1rem',
                  padding: '8px 0',
                }}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/contact" className="btn-primary" onClick={() => setOpen(false)} style={{ textAlign: 'center', marginTop: 8 }}>
              Get Started
            </Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  )
}
