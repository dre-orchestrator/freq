'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'

const operationalSteps = [
  {
    num: '01',
    title: 'LiDAR Scanning',
    desc: 'Fixed or drone-mounted LiDAR sensors emit rapid laser pulses to map the barge\'s exact position relative to the water surface.',
  },
  {
    num: '02',
    title: 'Point Cloud Generation',
    desc: 'AI algorithms process laser pulses to create a high-density point cloud, capturing the barge\'s dimensions and current waterline.',
  },
  {
    num: '03',
    title: 'Digital Twin Synchronization',
    desc: 'Data feeds into a Digital Twin — a virtual 3D model of the specific barge — automatically accounting for yaw, pitch, and roll.',
  },
  {
    num: '04',
    title: 'Automated Calculation',
    desc: 'AI integrates real-time draft measurements with hydrostatic tables to calculate current tonnage and loading flow rates instantly.',
  },
]

const productionOutcomes = [
  {
    value: 'Seconds',
    title: 'Time Optimization',
    desc: 'Measurements taken in seconds and updated continuously during loading/unloading, significantly reducing vessel turnaround time.',
  },
  {
    value: 'Zero',
    title: 'Reduced Man-Risk',
    desc: 'Eliminates the need for surveyors to climb onto barges or use swinging ladders to read draft marks — removing fall and water-related accident risk entirely.',
  },
  {
    value: '½ Inch',
    title: 'Minimized Human Error',
    desc: 'AI eliminates manual mistakes such as misreading hull marks in choppy water or recording incorrect data, ensuring accuracy within half an inch.',
  },
]

const aiImprovements = [
  {
    title: 'Predictive Maintenance',
    desc: 'Analyzing sensor data (vibration, temperature) to forecast equipment failure before it happens, reducing unplanned downtime by up to 45%.',
    stat: '45%',
    statLabel: 'Downtime reduction',
  },
  {
    title: 'Dynamic Route Optimization',
    desc: 'AI suggests the most fuel-efficient routes by processing real-time weather, currents, and port congestion data.',
    stat: '20%',
    statLabel: 'Shipping cost reduction',
  },
  {
    title: 'Smart Port & Cargo Handling',
    desc: 'AI-powered automated cranes and guided vehicles (AGVs) streamline container movement, reducing bottlenecks and idle times.',
    stat: null,
    statLabel: null,
  },
  {
    title: 'Hazardous Cargo Monitoring',
    desc: 'Real-time AI surveillance detects temperature or pressure anomalies in dangerous goods containers, triggering immediate alerts.',
    stat: null,
    statLabel: null,
  },
  {
    title: 'Automated Inspections',
    desc: 'Drones with AI image recognition inspect hulls and cargo holds for rust or cracks in areas inaccessible to humans safely.',
    stat: null,
    statLabel: null,
  },
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
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep(prev => (prev + 1) % operationalSteps.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

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

      // ── WATER ────────────────────────────────────────────────────────────────
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

      const deckMat = new pc.StandardMaterial()
      deckMat.diffuse = new pc.Color(0.12, 0.18, 0.28)
      deckMat.emissive = new pc.Color(0.02, 0.03, 0.05)
      deckMat.update()

      const deck = new pc.Entity('deck')
      deck.addComponent('render', { type: 'box', material: deckMat })
      deck.setLocalScale(22, 0.22, 9)
      deck.setPosition(0, 1.1, 0)
      app.root.addChild(deck)

      // ── DECK GRID (blueprint) ────────────────────────────────────────────────
      const gridMat = new pc.StandardMaterial()
      gridMat.diffuse = new pc.Color(0.0, 0.4, 0.5)
      gridMat.emissive = new pc.Color(0.0, 0.25, 0.3)
      gridMat.opacity = 0.55
      gridMat.blendType = pc.BLEND_NORMAL
      gridMat.update()

      for (let z = -4; z <= 4; z += 2) {
        const ln = new pc.Entity()
        ln.addComponent('render', { type: 'box', material: gridMat })
        ln.setLocalScale(22, 0.02, 0.06)
        ln.setPosition(0, 1.22, z)
        app.root.addChild(ln)
      }
      for (let x = -10; x <= 10; x += 5) {
        const ln = new pc.Entity()
        ln.addComponent('render', { type: 'box', material: gridMat })
        ln.setLocalScale(0.06, 0.02, 9)
        ln.setPosition(x, 1.22, 0)
        app.root.addChild(ln)
      }

      // ── LIDAR SCAN STATIONS (6) ──────────────────────────────────────────────
      const stationDefs = [
        { x: -9, z: -3.5 }, { x: -9, z: 3.5 },
        { x:  0, z: -3.5 }, { x:  0, z: 3.5 },
        { x:  9, z: -3.5 }, { x:  9, z: 3.5 },
      ]

      interface ScannerEntry {
        beam: any; beamMat: any; markerMat: any; x: number; z: number; phase: number
      }

      const scanners: ScannerEntry[] = stationDefs.map(({ x, z }, i) => {
        const phase = (i / stationDefs.length) * Math.PI * 2

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

      // ── POINT CLOUD PARTICLES ────────────────────────────────────────────────
      const pMat = new pc.StandardMaterial()
      pMat.diffuse = new pc.Color(0.0, 1.0, 0.9)
      pMat.emissive = new pc.Color(0.0, 0.8, 0.72)
      pMat.emissiveIntensity = 5
      pMat.update()

      interface ParticleEntry { entity: any; x: number; z: number; y: number; speed: number }
      const particles: ParticleEntry[] = Array.from({ length: 40 }, () => {
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

      // ── HORIZON PLANES ───────────────────────────────────────────────────────
      const fogMat = new pc.StandardMaterial()
      fogMat.diffuse = new pc.Color(0.01, 0.05, 0.12)
      fogMat.emissive = new pc.Color(0.0, 0.03, 0.07)
      fogMat.opacity = 0.6
      fogMat.blendType = pc.BLEND_NORMAL
      fogMat.update()

      ;[
        { pos: [0, 0, -70], rotY: 0 },
        { pos: [0, 0, 70],  rotY: 180 },
        { pos: [-70, 0, 0], rotY: 90 },
        { pos: [70, 0, 0],  rotY: -90 },
      ].forEach(({ pos, rotY }) => {
        const h = new pc.Entity()
        h.addComponent('render', { type: 'plane', material: fogMat })
        h.setEulerAngles(90, rotY, 0)
        h.setLocalScale(160, 1, 1)
        h.setPosition(pos[0], pos[1], pos[2])
        app.root.addChild(h)
      })

      // ── ANIMATION LOOP ───────────────────────────────────────────────────────
      let time = 0
      let cameraAngle = 0.65

      app.on('update', (dt: number) => {
        time += dt

        cameraAngle += dt * 0.1
        const radius = 38
        camera.setPosition(
          Math.cos(cameraAngle) * radius,
          13 + Math.sin(time * 0.22) * 2.5,
          Math.sin(cameraAngle) * radius
        )
        camera.lookAt(new pc.Vec3(0, 1.5, 0))

        barge.setEulerAngles(Math.cos(time * 0.28) * 0.6, 0, Math.sin(time * 0.38) * 0.9)
        deck.setEulerAngles(Math.cos(time * 0.28) * 0.6, 0, Math.sin(time * 0.38) * 0.9)

        tealLight.light.intensity = 2.5 + Math.sin(time * 1.8) * 0.7

        scanners.forEach(s => {
          const phase = time * 1.8 + s.phase
          const beamH = 5 + Math.sin(phase) * 3.5
          s.beam.setLocalScale(0.12, beamH, 0.12)
          s.beam.setPosition(s.x, 1.26 + beamH / 2, s.z)
          s.beamMat.opacity = 0.12 + Math.abs(Math.sin(phase)) * 0.38
          s.beamMat.update()
          s.markerMat.emissiveIntensity = 2.5 + Math.abs(Math.sin(phase + 0.5)) * 3
          s.markerMat.update()
        })

        particles.forEach(p => {
          p.y += dt * p.speed
          if (p.y > 16) p.y = 0.8
          p.entity.setPosition(p.x, p.y, p.z)
        })

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

      {/* ── HERO: Full-viewport PlayCanvas Scene ── */}
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

        {/* Left overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 clamp(24px, 8vw, 100px)',
          background: 'linear-gradient(to right, rgba(7,11,24,0.92) 40%, rgba(7,11,24,0.4) 65%, transparent 85%)',
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
            FREQ AI · Autonomous Barge Drafting with AI &amp; LiDAR
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
            Optimizing Barge Drafting with AI &amp; LiDAR
          </h1>

          <p style={{
            fontSize: '1.02rem',
            color: '#94A3B8',
            maxWidth: 500,
            lineHeight: 1.72,
            marginBottom: 38,
          }}>
            High-frequency laser scanning and AI replace visual inspection of hull marks —
            delivering continuous, sub-inch draft measurements with zero crew exposure.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', pointerEvents: 'auto' }}>
            <Link href="/contact" className="btn-primary">Request Demo</Link>
            <Link href="/solutions/barge-drafting" className="btn-outline">View Solution</Link>
          </div>
        </div>

        {/* Stats strip */}
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
            <div key={s.value} style={{ borderLeft: '2px solid #06B6D4', paddingLeft: 12 }}>
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

        {/* System status */}
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
          <div>LIDAR SCAN · ACTIVE</div>
          <div>POINT CLOUD · GENERATING</div>
          <div>DIGITAL TWIN · SYNCHRONIZED</div>
          <div>COMPLIANCE · USCG 46 CFR</div>
        </div>

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

      {/* ── HOW IT WORKS: Operational Steps ── */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-label">Operational Pipeline</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', marginBottom: 12 }}>
            From LiDAR Pulse to Verified Tonnage
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 700, lineHeight: 1.75, marginBottom: 48 }}>
            The integration of AI and LiDAR automates the traditional draft survey by replacing
            visual inspection of hull marks with high-frequency laser scanning.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {operationalSteps.map((s, i) => (
              <div
                key={s.num}
                className="card"
                style={{
                  borderColor: activeStep === i ? 'var(--teal)' : undefined,
                  boxShadow: activeStep === i ? '0 0 24px rgba(6,182,212,0.14)' : undefined,
                  transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
                }}
              >
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--teal)',
                  marginBottom: 10,
                  opacity: 0.85,
                }}>
                  {s.num}
                </div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  marginBottom: 8,
                }}>
                  {s.title}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEY PRODUCTION OUTCOMES ── */}
      <section className="section">
        <div className="container">
          <div className="section-label">Key Production Outcomes</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', marginBottom: 40 }}>
            Measurable Impact on Every Operation
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {productionOutcomes.map(o => (
              <div key={o.title} className="card">
                <div className="data-value-lg" style={{ fontSize: '2rem', marginBottom: 8 }}>
                  {o.value}
                </div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  marginBottom: 8,
                }}>
                  {o.title}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                  {o.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMMEDIATE AI IMPROVEMENTS ── */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-label">Beyond Drafting</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', marginBottom: 12 }}>
            Immediate AI Improvements in Maritime Cargo
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 700, lineHeight: 1.75, marginBottom: 40 }}>
            Beyond drafting, AI offers immediate efficiency gains across critical cargo operations.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {aiImprovements.map(a => (
              <div key={a.title} className="card">
                {a.stat && (
                  <div className="data-value-lg" style={{ fontSize: '1.8rem', marginBottom: 6 }}>
                    {a.stat}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 6 }}>
                      {a.statLabel}
                    </span>
                  </div>
                )}
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  marginBottom: 8,
                }}>
                  {a.title}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                  {a.desc}
                </div>
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
