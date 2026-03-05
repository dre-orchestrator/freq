'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'

const capabilities = [
  { num: '01', title: 'Autonomous Measurement', desc: 'Precision cargo draft readings without manual intervention.' },
  { num: '02', title: 'Real-Time Monitoring', desc: 'Continuous visibility into cargo status and vessel stability.' },
  { num: '03', title: 'Safety Governance', desc: 'Integrated hazard detection. Man-overboard risk eliminated.' },
  { num: '04', title: 'Compliance & Reporting', desc: 'Automated draft surveys and regulatory documentation.' },
  { num: '05', title: 'Hardware Agnostic', desc: 'Radar, LiDAR, pressure, drone, or visual — any input.' },
  { num: '06', title: 'Fleet Scale', desc: 'Single vessel to enterprise fleet management.' },
]

const useCases = [
  { title: 'Barge Draft Measurement', desc: '10-15 min autonomous cycle, zero crew exposure.', link: '/solutions/barge-drafting', linkText: 'View Solution' },
  { title: 'Cargo Load Optimization', desc: 'Precision loading for maximum revenue per trip.', link: null, linkText: null },
  { title: 'Safety Monitoring', desc: 'Continuous zone monitoring with automatic hazard detection.', link: null, linkText: null },
  { title: 'Fleet Intelligence', desc: 'Real-time visibility across your entire barge fleet.', link: null, linkText: null },
]

const heroStats = [
  { value: '15 Min', label: 'Autonomous cycle' },
  { value: 'Sub-Inch', label: 'Precision' },
  { value: 'Zero', label: 'Crew exposure' },
  { value: '90%+', label: 'Time reduction' },
]

export default function PlayCanvasPlatform() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pcAppRef = useRef<any>(null)
  const [pcLoaded, setPcLoaded] = useState(false)
  const [activeCapability, setActiveCapability] = useState(0)

  // Cycle through capabilities to highlight them
  useEffect(() => {
    const id = setInterval(() => {
      setActiveCapability(prev => (prev + 1) % capabilities.length)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  // Build PlayCanvas scene once engine is ready
  useEffect(() => {
    if (!pcLoaded || !canvasRef.current) return

    const pc = (window as any).pc
    const canvas = canvasRef.current

    try {
      const app = new pc.Application(canvas, {
        mouse: new pc.Mouse(canvas),
        touch: new pc.TouchDevice(canvas),
      })

      app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)
      app.setCanvasResolution(pc.RESOLUTION_AUTO)
      app.scene.ambientLight = new pc.Color(0.02, 0.06, 0.12)
      app.start()
      pcAppRef.current = app

      // ── CAMERA ──────────────────────────────────────────────────────────────
      const camera = new pc.Entity('camera')
      camera.addComponent('camera', {
        clearColor: new pc.Color(0.028, 0.047, 0.094),
        fov: 52,
        nearClip: 0.1,
        farClip: 600,
      })
      camera.setPosition(32, 14, 28)
      camera.lookAt(new pc.Vec3(0, 0, 0))
      app.root.addChild(camera)

      // ── LIGHTS ───────────────────────────────────────────────────────────────
      const mainLight = new pc.Entity('mainLight')
      mainLight.addComponent('light', {
        type: 'directional',
        color: new pc.Color(0.55, 0.75, 1.0),
        intensity: 1.4,
        castShadows: true,
        shadowBias: 0.2,
        shadowDistance: 120,
      })
      mainLight.setEulerAngles(38, -50, 0)
      app.root.addChild(mainLight)

      const tealLight = new pc.Entity('tealLight')
      tealLight.addComponent('light', {
        type: 'point',
        color: new pc.Color(0.0, 0.72, 0.83),
        intensity: 3.0,
        range: 40,
      })
      tealLight.setPosition(0, 10, 0)
      app.root.addChild(tealLight)

      const rimLight = new pc.Entity('rimLight')
      rimLight.addComponent('light', {
        type: 'point',
        color: new pc.Color(0.3, 0.0, 0.8),
        intensity: 1.5,
        range: 60,
      })
      rimLight.setPosition(-20, 5, -15)
      app.root.addChild(rimLight)

      // ── WATER PLANE ──────────────────────────────────────────────────────────
      const waterMat = new pc.StandardMaterial()
      waterMat.diffuse = new pc.Color(0.01, 0.1, 0.2)
      waterMat.emissive = new pc.Color(0.0, 0.04, 0.09)
      waterMat.opacity = 0.88
      waterMat.blendType = pc.BLEND_NORMAL
      waterMat.update()

      const water = new pc.Entity('water')
      water.addComponent('render', { type: 'plane', material: waterMat })
      water.setLocalScale(160, 1, 160)
      water.setPosition(0, -0.6, 0)
      app.root.addChild(water)

      // ── BARGE HULL ───────────────────────────────────────────────────────────
      const hullMat = new pc.StandardMaterial()
      hullMat.diffuse = new pc.Color(0.08, 0.13, 0.22)
      hullMat.emissive = new pc.Color(0.01, 0.03, 0.06)
      hullMat.update()

      const barge = new pc.Entity('barge')
      barge.addComponent('render', { type: 'box', material: hullMat })
      barge.setLocalScale(22, 4, 9)
      barge.setPosition(0, -0.9, 0)
      app.root.addChild(barge)

      // Barge deck
      const deckMat = new pc.StandardMaterial()
      deckMat.diffuse = new pc.Color(0.12, 0.18, 0.28)
      deckMat.emissive = new pc.Color(0.02, 0.03, 0.05)
      deckMat.update()

      const deck = new pc.Entity('deck')
      deck.addComponent('render', { type: 'box', material: deckMat })
      deck.setLocalScale(22, 0.22, 9)
      deck.setPosition(0, 1.1, 0)
      app.root.addChild(deck)

      // ── DECK GRID LINES ──────────────────────────────────────────────────────
      const gridMat = new pc.StandardMaterial()
      gridMat.diffuse = new pc.Color(0.0, 0.4, 0.5)
      gridMat.emissive = new pc.Color(0.0, 0.25, 0.3)
      gridMat.opacity = 0.55
      gridMat.blendType = pc.BLEND_NORMAL
      gridMat.update()

      // Longitudinal lines
      for (let z = -4; z <= 4; z += 2) {
        const ln = new pc.Entity()
        ln.addComponent('render', { type: 'box', material: gridMat })
        ln.setLocalScale(22, 0.02, 0.06)
        ln.setPosition(0, 1.22, z)
        app.root.addChild(ln)
      }
      // Cross lines
      for (let x = -10; x <= 10; x += 5) {
        const ln = new pc.Entity()
        ln.addComponent('render', { type: 'box', material: gridMat })
        ln.setLocalScale(0.06, 0.02, 9)
        ln.setPosition(x, 1.22, 0)
        app.root.addChild(ln)
      }

      // ── DRAFT MEASUREMENT STATIONS ───────────────────────────────────────────
      const stationDefs = [
        { x: -9, z: -3.5 }, { x: -9, z: 3.5 },
        { x:  0, z: -3.5 }, { x:  0, z: 3.5 },
        { x:  9, z: -3.5 }, { x:  9, z: 3.5 },
      ]

      interface ScannerEntry {
        beam: any
        beamMat: any
        markerMat: any
        x: number
        z: number
        phase: number
      }

      const scanners: ScannerEntry[] = stationDefs.map(({ x, z }, i) => {
        const phase = (i / stationDefs.length) * Math.PI * 2

        // Marker sphere
        const mMat = new pc.StandardMaterial()
        mMat.diffuse = new pc.Color(0.0, 0.85, 0.75)
        mMat.emissive = new pc.Color(0.0, 0.55, 0.48)
        mMat.emissiveIntensity = 3
        mMat.update()

        const marker = new pc.Entity()
        marker.addComponent('render', { type: 'sphere', material: mMat })
        marker.setLocalScale(0.45, 0.45, 0.45)
        marker.setPosition(x, 1.26, z)
        app.root.addChild(marker)

        // Scan beam
        const bMat = new pc.StandardMaterial()
        bMat.diffuse = new pc.Color(0.0, 0.7, 0.85)
        bMat.emissive = new pc.Color(0.0, 0.5, 0.65)
        bMat.opacity = 0.2
        bMat.blendType = pc.BLEND_NORMAL
        bMat.emissiveIntensity = 4
        bMat.update()

        const beam = new pc.Entity()
        beam.addComponent('render', { type: 'cylinder', material: bMat })
        beam.setLocalScale(0.12, 6, 0.12)
        beam.setPosition(x, 1.26 + 3, z)
        app.root.addChild(beam)

        return { beam, beamMat: bMat, markerMat: mMat, x, z, phase }
      })

      // ── DATA PARTICLES ───────────────────────────────────────────────────────
      const pMat = new pc.StandardMaterial()
      pMat.diffuse = new pc.Color(0.0, 1.0, 0.9)
      pMat.emissive = new pc.Color(0.0, 0.8, 0.72)
      pMat.emissiveIntensity = 5
      pMat.update()

      interface ParticleEntry { entity: any; x: number; z: number; y: number; speed: number }
      const particles: ParticleEntry[] = Array.from({ length: 40 }, (_, i) => {
        const x = (Math.random() - 0.5) * 22
        const z = (Math.random() - 0.5) * 9
        const y = Math.random() * 14
        const e = new pc.Entity()
        e.addComponent('render', { type: 'sphere', material: pMat })
        e.setLocalScale(0.07, 0.07, 0.07)
        e.setPosition(x, y, z)
        app.root.addChild(e)
        return { entity: e, x, z, y, speed: 0.6 + Math.random() * 1.8 }
      })

      // ── HORIZON FOG PLANES ───────────────────────────────────────────────────
      const fogMat = new pc.StandardMaterial()
      fogMat.diffuse = new pc.Color(0.01, 0.05, 0.12)
      fogMat.emissive = new pc.Color(0.0, 0.03, 0.07)
      fogMat.opacity = 0.6
      fogMat.blendType = pc.BLEND_NORMAL
      fogMat.update()

      const horizonDefs = [
        { pos: [0, 0, -70], rot: [0, 0, 0], scale: [160, 30, 1] },
        { pos: [0, 0, 70],  rot: [0, 180, 0], scale: [160, 30, 1] },
        { pos: [-70, 0, 0], rot: [0, 90, 0],  scale: [160, 30, 1] },
        { pos: [70, 0, 0],  rot: [0, -90, 0], scale: [160, 30, 1] },
      ]
      horizonDefs.forEach(({ pos, rot, scale }) => {
        const h = new pc.Entity()
        h.addComponent('render', { type: 'plane', material: fogMat })
        h.setEulerAngles(90, rot[1], 0)
        h.setLocalScale(scale[0], 1, scale[2])
        h.setPosition(pos[0], pos[1], pos[2])
        app.root.addChild(h)
      })

      // ── ANIMATION LOOP ───────────────────────────────────────────────────────
      let time = 0
      let cameraAngle = 0.65

      app.on('update', (dt: number) => {
        time += dt

        // Slow camera orbit
        cameraAngle += dt * 0.1
        const radius = 38
        const cx = Math.cos(cameraAngle) * radius
        const cz = Math.sin(cameraAngle) * radius
        const cy = 13 + Math.sin(time * 0.22) * 2.5
        camera.setPosition(cx, cy, cz)
        camera.lookAt(new pc.Vec3(0, 1.5, 0))

        // Barge gentle rock
        barge.setEulerAngles(
          Math.cos(time * 0.28) * 0.6,
          0,
          Math.sin(time * 0.38) * 0.9
        )
        deck.setEulerAngles(
          Math.cos(time * 0.28) * 0.6,
          0,
          Math.sin(time * 0.38) * 0.9
        )

        // Teal light heartbeat
        tealLight.light.intensity = 2.5 + Math.sin(time * 1.8) * 0.7

        // Scanner beam pulse
        scanners.forEach(s => {
          const phase = time * 1.8 + s.phase
          const beamH = 5 + Math.sin(phase) * 3.5
          s.beam.setLocalScale(0.12, beamH, 0.12)
          s.beam.setPosition(s.x, 1.26 + beamH / 2, s.z)
          s.beamMat.opacity = 0.12 + Math.abs(Math.sin(phase)) * 0.38
          s.beamMat.update()
          // Marker glow pulse
          s.markerMat.emissiveIntensity = 2.5 + Math.abs(Math.sin(phase + 0.5)) * 3
          s.markerMat.update()
        })

        // Particles float up
        particles.forEach(p => {
          p.y += dt * p.speed
          if (p.y > 16) p.y = 0.8
          p.entity.setPosition(p.x, p.y, p.z)
        })

        // Water shimmer
        waterMat.emissive = new pc.Color(
          0.0,
          0.035 + Math.sin(time * 0.6) * 0.015,
          0.08 + Math.sin(time * 0.5) * 0.02
        )
        waterMat.update()
      })

    } catch (err) {
      console.error('[PlayCanvasPlatform] init error:', err)
    }

    return () => {
      if (pcAppRef.current) {
        pcAppRef.current.destroy()
        pcAppRef.current = null
      }
    }
  }, [pcLoaded])

  // Canvas resize
  useEffect(() => {
    const onResize = () => pcAppRef.current?.resizeCanvas()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <Script
        src="https://code.playcanvas.com/playcanvas-stable.min.js"
        strategy="afterInteractive"
        onLoad={() => setPcLoaded(true)}
      />

      {/* ── HERO: Full-viewport PlayCanvas canvas ── */}
      <section style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: 600,
        overflow: 'hidden',
        background: '#070B18',
      }}>
        <canvas
          ref={canvasRef}
          id="freq-platform-canvas"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />

        {/* Left content overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 clamp(24px, 8vw, 100px)',
          background: 'linear-gradient(to right, rgba(7,11,24,0.9) 38%, rgba(7,11,24,0.4) 65%, transparent 85%)',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.72rem',
            color: '#06B6D4',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 18,
            opacity: 0.9,
          }}>
            FREQ AI · Maritime Intelligence Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(1.9rem, 3.8vw, 3.2rem)',
            fontWeight: 700,
            lineHeight: 1.14,
            marginBottom: 20,
            maxWidth: 580,
            color: '#fff',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            The Intelligence Layer for Maritime Cargo Operations
          </h1>

          <p style={{
            fontSize: '1.02rem',
            color: '#94A3B8',
            maxWidth: 480,
            lineHeight: 1.72,
            marginBottom: 38,
          }}>
            Hardware-agnostic AI that transforms raw sensor data into autonomous
            drafting, real-time monitoring, and verified compliance — in 15 minutes.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', pointerEvents: 'auto' }}>
            <Link href="/contact" className="btn-primary">Request Demo</Link>
            <Link href="/solutions/barge-drafting" className="btn-outline">View Solution</Link>
          </div>
        </div>

        {/* Bottom stat strip */}
        <div style={{
          position: 'absolute',
          bottom: 44,
          left: 'clamp(24px, 8vw, 100px)',
          display: 'flex',
          gap: 'clamp(16px, 3vw, 40px)',
          flexWrap: 'wrap',
          pointerEvents: 'none',
        }}>
          {heroStats.map(s => (
            <div key={s.value} style={{
              borderLeft: '2px solid #06B6D4',
              paddingLeft: 12,
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
                fontWeight: 700,
                color: '#06B6D4',
                lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: '0.68rem',
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                marginTop: 4,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Top-right system status */}
        <div style={{
          position: 'absolute',
          top: 100,
          right: 'clamp(16px, 4vw, 48px)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.68rem',
          color: '#06B6D4',
          opacity: 0.65,
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}>
          <div>SCAN MODE · AUTONOMOUS</div>
          <div>DRAFT STATIONS · 6 / 6 ONLINE</div>
          <div>COMPLIANCE · USCG 46 CFR</div>
          <div>MOB DETECTION · ACTIVE</div>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: 'absolute',
          bottom: 28,
          right: 'clamp(16px, 4vw, 48px)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.65rem',
          color: '#64748B',
          pointerEvents: 'none',
          letterSpacing: '0.12em',
        }}>
          SCROLL TO EXPLORE ↓
        </div>
      </section>

      {/* ── PLATFORM OVERVIEW ── */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="section-label">Platform Overview</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', marginBottom: 20 }}>
            Hardware-Agnostic Intelligence
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.82, fontSize: '1.02rem' }}>
            Whether your operation uses radar, LiDAR, pressure sensors, or visual monitoring,
            FREQ AI&#39;s intelligence layer normalizes data from any source into a unified
            operational picture. The result: autonomous drafting, real-time monitoring, and
            verified compliance reporting — regardless of what hardware generates the input.
          </p>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="section">
        <div className="container">
          <div className="section-label">Capabilities</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', marginBottom: 40 }}>
            Built for Maritime Intelligence at Scale
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {capabilities.map((c, i) => (
              <div
                key={c.title}
                className="card"
                style={{
                  borderColor: activeCapability === i ? 'var(--teal)' : undefined,
                  transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
                  boxShadow: activeCapability === i
                    ? '0 0 20px rgba(6,182,212,0.15)'
                    : undefined,
                }}
              >
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.68rem',
                  color: 'var(--teal)',
                  marginBottom: 10,
                  opacity: 0.7,
                }}>
                  {c.num}
                </div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  marginBottom: 8,
                }}>
                  {c.title}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {c.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-label">Use Cases</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', marginBottom: 32 }}>
            Where FREQ AI Deploys
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {useCases.map(u => (
              <div key={u.title} className="card">
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  marginBottom: 8,
                }}>
                  {u.title}
                </div>
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  marginBottom: 14,
                }}>
                  {u.desc}
                </div>
                {u.link && (
                  <Link
                    href={u.link}
                    style={{
                      color: 'var(--teal)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                    }}
                  >
                    {u.linkText} &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 580 }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', marginBottom: 16 }}>
            Ready to deploy autonomous intelligence?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
            Connect with our team to learn how FREQ AI can transform your maritime
            drafting process.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Link href="/contact" className="btn-primary">Get in Touch</Link>
            <a
              href="mailto:info@freqai.io"
              style={{
                color: 'var(--teal)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.9rem',
              }}
            >
              info@freqai.io
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
