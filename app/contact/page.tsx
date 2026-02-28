'use client'

import { useState, FormEvent } from 'react'

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const FORMSPREE_ID = ''

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget

    if (!FORMSPREE_ID) {
      window.location.href = `mailto:info@freqai.io?subject=${encodeURIComponent('FREQ AI Contact')}&body=${encodeURIComponent(new FormData(form).get('message') as string || '')}`
      return
    }

    setStatus('sending')
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        setStatus('success')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="blueprint-grid" style={{ padding: '120px 0 60px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginBottom: 20 }}>Get in Touch</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Whether you&#39;re an operator, technology partner, or investor — we&#39;d like to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48 }}>
            {/* Left — Form */}
            <div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, fontFamily: "'IBM Plex Sans', sans-serif" }}>Name *</label>
                  <input
                    name="name"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      color: 'var(--text-primary)',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, fontFamily: "'IBM Plex Sans', sans-serif" }}>Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      color: 'var(--text-primary)',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, fontFamily: "'IBM Plex Sans', sans-serif" }}>Company</label>
                  <input
                    name="company"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      color: 'var(--text-primary)',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, fontFamily: "'IBM Plex Sans', sans-serif" }}>Message *</label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      color: 'var(--text-primary)',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>

                {status === 'success' && (
                  <div style={{ color: 'var(--green)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>&#10003;</span> Message sent. We&#39;ll be in touch shortly.
                  </div>
                )}
                {status === 'error' && (
                  <div style={{ color: 'var(--red)', fontSize: '0.9rem' }}>
                    Something went wrong. Please email <a href="mailto:info@freqai.io" style={{ color: 'var(--teal)' }}>info@freqai.io</a> directly.
                  </div>
                )}
              </form>
            </div>

            {/* Right — Direct Contact */}
            <div style={{ paddingTop: 8 }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: 24 }}>Direct Contact</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Email</div>
                  <a href="mailto:info@freqai.io" style={{ color: 'var(--teal)', fontFamily: "'JetBrains Mono', monospace", textDecoration: 'none' }}>info@freqai.io</a>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Location</div>
                  <span style={{ color: 'var(--text-secondary)' }}>Slidell, Louisiana</span>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>LinkedIn</div>
                  <a href="https://linkedin.com/in/andry-alvarez" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)', fontFamily: "'JetBrains Mono', monospace", textDecoration: 'none' }}>linkedin.com/in/andry-alvarez</a>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Response Time</div>
                  <span style={{ color: 'var(--text-secondary)' }}>We typically respond within 24 hours.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
