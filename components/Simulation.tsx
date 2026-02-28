'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Script from 'next/script'
import { CameraController, STATION_IDS, STATION_LABELS } from '@/components/cameraController'
import type { CameraState } from '@/components/cameraController'
import CameraToolbar from '@/components/CameraToolbar'

// ─── State Machine ───
const SIM_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETE: 'complete',
  ALERT: 'alert',
} as const

type SimState = typeof SIM_STATES[keyof typeof SIM_STATES]

// Phase durations at 1x (ms)
const PHASE_DURATIONS = [20000, 15000, 60000, 20000, 20000, 15000]
const PHASE_NAMES = [
  'Initial Survey',
  'Pre-Load Assessment',
  'Active Loading',
  'Cargo Verification',
  'Post-Load Assessment',
  'Final Survey & Report',
]
const PHASE_DESCS = [
  'Vessel ID and baseline condition assessment.',
  'Empty vessel readings. Loading parameters confirmed.',
  'Real-time monitoring during cargo loading. All parameters nominal.',
  'Progressive verification against target parameters.',
  'Final readings locked. Stability analysis complete.',
  'Complete draft survey generated and logged.',
]

// Manual process steps
const MANUAL_STEPS = [
  { title: 'CREW DEPLOYMENT', desc: 'A crew member is dispatched to the barge deck. Active crane and loading equipment present in the operational zone.', annotation: 'Man-overboard risk: ACTIVE', severity: 'red' },
  { title: 'FORE DRAFT READING', desc: 'Crew member visually reads the painted draft mark at the bow. Reading estimated to nearest half-inch by eye. Value radioed to shore operator.', annotation: 'Visual estimate accuracy: \u00B10.5 inch', severity: 'amber' },
  { title: 'MIDSHIP READING', desc: 'Crew walks to midship. Second reading taken and radioed. Each transit across the active deck is an additional exposure event.', annotation: 'Radio relay \u2014 compounding error risk', severity: 'amber' },
  { title: 'AFT DRAFT READING', desc: 'Crew walks to stern for final reading. Three readings now radioed and recorded manually on paper.', annotation: 'Paper log \u2014 no digital audit trail', severity: 'amber' },
  { title: 'SHORE CALCULATION', desc: 'Shore operator manually calculates displacement using hydrostatic tables. Process requires 45\u201390 minutes.', annotation: 'No real-time feedback during loading', severity: 'amber' },
  { title: 'UNMONITORED LOADING', desc: 'Loading commences on pre-calculated targets. No real-time monitoring. Crew returns periodically to re-check marks by eye.', annotation: 'UNMONITORED INTERVAL \u2014 drift undetected', severity: 'red' },
  { title: 'POST-LOAD REPEAT', desc: 'Entire process repeats for final survey. Total: 3\u20134 hours. Paper report.', annotation: 'TOTAL: ~4 HOURS | ERROR: 1-3% | MOB RISK: THROUGHOUT', severity: 'red' },
]

// Station labels
const STATIONS = ['FP', 'FS', 'MP', 'MS', 'AP', 'AS']
const STATION_FULL = ['FORE PORT', 'FORE STBD', 'MID PORT', 'MID STBD', 'AFT PORT', 'AFT STBD']

// ─── Tooltip definitions ───
const TOOLTIPS: Record<string, string> = {
  Draft: 'How deep the barge sits in water. Increases as cargo loads.',
  Fore: 'Front (bow) of the vessel.',
  Aft: 'Rear (stern) of the vessel.',
  Port: 'Left side when facing forward.',
  Starboard: 'Right side when facing forward.',
  Trim: 'Fore-to-aft balance. Zero = level keel.',
  Heel: 'Side-to-side tilt from uneven cargo distribution.',
  'GM Height': 'Metacentric height \u2014 stability measure. Higher = safer.',
  Displacement: 'Water displaced = total weight of vessel + cargo (Archimedes).',
  'Cargo Mass': 'Displacement minus vessel weight = cargo weight.',
  Freeboard: 'Waterline to deck. Decreases as loading increases.',
  'E-Stop': 'Emergency Stop triggered by safety event. Halts all operations.',
  MOB: 'Man Overboard. Leading non-navigational fatality in commercial maritime.',
  'USCG 46 CFR': 'US Coast Guard regulations governing commercial vessel operations.',
}

function Tooltip({ term, children }: { term: string; children: React.ReactNode }) {
  const def = TOOLTIPS[term]
  if (!def) return <>{children}</>
  return (
    <span className="tooltip-term">
      {children}
      <span className="tooltip-content">{def}</span>
    </span>
  )
}

// ─── Main Component ───
export default function Simulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pcAppRef = useRef<any>(null)
  const pcEntitiesRef = useRef<any>({})
  const [pcLoaded, setPcLoaded] = useState(false)
  const [state, setState] = useState<SimState>(SIM_STATES.IDLE)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [speed, setSpeed] = useState(2)
  const [view, setView] = useState<'3d' | 'telemetry'>('3d')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [totalElapsedMs, setTotalElapsedMs] = useState(0)
  const [showMobReset, setShowMobReset] = useState(false)
  const [containersLoaded, setContainersLoaded] = useState(0)

  // Draft readings — baseline values that tick during running
  const [readings, setReadings] = useState([7.42, 7.38, 7.51, 7.49, 7.63, 7.61])
  const [cargoMass, setCargoMass] = useState(0)
  const [trim, setTrim] = useState(0.0)
  const [heel, setHeel] = useState(0.0)
  const [loadProgress, setLoadProgress] = useState(0)
  const [mobDetected, setMobDetected] = useState(false)

  // Camera state
  const [cameraView, setCameraView] = useState<string>('orbit')
  const [activeStation, setActiveStation] = useState(-1)
  const [fpActive, setFpActive] = useState(false)
  const [showFPInstructions, setShowFPInstructions] = useState(false)
  const [showStationCard, setShowStationCard] = useState(false)
  const [nearbyStation, setNearbyStation] = useState(-1)
  const [fpRegion, setFpRegion] = useState<'fore' | 'mid' | 'aft'>('mid')
  const cameraControllerRef = useRef<CameraController | null>(null)
  const simHasRunRef = useRef(false)

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(state)
  const speedRef = useRef(speed)
  const phaseRef = useRef(currentPhase)
  const elapsedRef = useRef(elapsedMs)
  const totalElapsedRef = useRef(totalElapsedMs)

  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { phaseRef.current = currentPhase }, [currentPhase])
  useEffect(() => { elapsedRef.current = elapsedMs }, [elapsedMs])
  useEffect(() => { totalElapsedRef.current = totalElapsedMs }, [totalElapsedMs])

  // Initialize PlayCanvas scene
  const initScene = useCallback(() => {
    if (!canvasRef.current || !(window as any).pc) return
    const pc = (window as any).pc

    // Destroy previous app if exists
    if (pcAppRef.current) {
      try { pcAppRef.current.destroy() } catch {}
    }

    const canvas = canvasRef.current
    const app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      touch: 'ontouchstart' in window ? new pc.TouchDevice(canvas) : undefined,
    })
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)
    app.setCanvasResolution(pc.RESOLUTION_AUTO)
    pcAppRef.current = app
    app.start()

    // Background color
    app.scene.ambientLight = new pc.Color(0.69, 0.77, 0.85) // soft blue-gray
    app.scene.skyboxIntensity = 0

    // Camera
    const camera = new pc.Entity('camera')
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.039, 0.059, 0.118), // #0A0F1E
      fov: 45,
      nearClip: 0.1,
      farClip: 200,
    })
    camera.setPosition(0, 18, 42)
    camera.lookAt(0, 1, 0)
    app.root.addChild(camera)

    // Camera Controller — manages 7 views, transitions, FP, station clicks
    const camController = new CameraController(pc, camera, canvas, (camState: CameraState) => {
      setCameraView(camState.activeView)
      setActiveStation(camState.activeStationIndex)
      setFpActive(camState.fpActive)
      setShowFPInstructions(camState.fpActive && !camState.fpInstructionsDismissed)
      setShowStationCard(
        (camState.activeView === 'station' && camState.activeStationIndex >= 0) ||
        (camState.fpActive && camState.activeStationIndex >= 0)
      )
      setNearbyStation(camState.nearbyStationIndex)
      setFpRegion(camState.firstPersonRegion)
    })
    cameraControllerRef.current = camController
    pcEntitiesRef.current.resetCamera = () => camController.resetCamera()

    // Expose global for platform page view shortcut pills
    ;(window as any).__freqSimSetView = (viewName: string) => {
      camController.setView(viewName)
    }

    // Lighting
    const dirLight = new pc.Entity('dirLight')
    dirLight.addComponent('light', { type: 'directional', color: new pc.Color(1, 1, 1), intensity: 0.8, castShadows: true })
    dirLight.setEulerAngles(45, -45, 0)
    app.root.addChild(dirLight)

    const ambLight = new pc.Entity('ambLight')
    ambLight.addComponent('light', { type: 'directional', color: new pc.Color(0.69, 0.77, 0.85), intensity: 0.4 })
    ambLight.setEulerAngles(-30, 45, 0)
    app.root.addChild(ambLight)

    // Dock point light
    const dockLight = new pc.Entity('dockLight')
    dockLight.addComponent('light', { type: 'point', color: new pc.Color(0.96, 0.62, 0.04), intensity: 0.3, range: 20 })
    dockLight.setPosition(-15, 5, 0)
    app.root.addChild(dockLight)

    // Water plane
    const water = new pc.Entity('water')
    water.addComponent('render', { type: 'plane' })
    water.setLocalScale(120, 1, 120)
    water.setPosition(0, 0, 0)
    const waterMat = new pc.StandardMaterial()
    waterMat.diffuse = new pc.Color(0.02, 0.71, 0.83)
    waterMat.opacity = 0.4
    waterMat.blendType = pc.BLEND_NORMAL
    waterMat.emissive = new pc.Color(0.02, 0.45, 0.52)
    waterMat.emissiveIntensity = 0.2
    waterMat.update()
    water.render!.meshInstances[0].material = waterMat
    app.root.addChild(water)
    pcEntitiesRef.current.water = water

    // Water grid lines
    for (let i = -30; i <= 30; i += 2) {
      const lineX = new pc.Entity()
      lineX.addComponent('render', { type: 'box' })
      lineX.setLocalScale(60, 0.02, 0.04)
      lineX.setPosition(0, 0.01, i)
      const lineMat = new pc.StandardMaterial()
      lineMat.diffuse = new pc.Color(0.12, 0.16, 0.24)
      lineMat.opacity = 0.3
      lineMat.blendType = pc.BLEND_NORMAL
      lineMat.update()
      lineX.render!.meshInstances[0].material = lineMat
      app.root.addChild(lineX)

      const lineZ = new pc.Entity()
      lineZ.addComponent('render', { type: 'box' })
      lineZ.setLocalScale(0.04, 0.02, 60)
      lineZ.setPosition(i, 0.01, 0)
      lineZ.render!.meshInstances[0].material = lineMat
      app.root.addChild(lineZ)
    }

    // Barge hull
    const barge = new pc.Entity('barge')
    barge.addComponent('render', { type: 'box' })
    barge.setLocalScale(10, 3, 45)
    barge.setPosition(0, 1.5, 0)
    const bargeMat = new pc.StandardMaterial()
    bargeMat.diffuse = new pc.Color(0.12, 0.16, 0.24) // #1E293B
    bargeMat.update()
    barge.render!.meshInstances[0].material = bargeMat
    app.root.addChild(barge)
    pcEntitiesRef.current.barge = barge

    // Barge wireframe edges (8 thin lines along edges)
    const edgeMat = new pc.StandardMaterial()
    edgeMat.diffuse = new pc.Color(0.95, 0.96, 0.97) // #F1F5F9
    edgeMat.emissive = new pc.Color(0.95, 0.96, 0.97)
    edgeMat.emissiveIntensity = 0.3
    edgeMat.update()

    const makeEdge = (sx: number, sy: number, sz: number, px: number, py: number, pz: number) => {
      const e = new pc.Entity()
      e.addComponent('render', { type: 'box' })
      e.setLocalScale(sx, sy, sz)
      e.setPosition(px, py, pz)
      e.render!.meshInstances[0].material = edgeMat
      barge.addChild(e)
    }
    // Length edges (along Z)
    makeEdge(0.02, 0.02, 1, 0.5, 0.5, 0)
    makeEdge(0.02, 0.02, 1, -0.5, 0.5, 0)
    makeEdge(0.02, 0.02, 1, 0.5, -0.5, 0)
    makeEdge(0.02, 0.02, 1, -0.5, -0.5, 0)
    // Width edges
    makeEdge(1, 0.02, 0.02, 0, 0.5, 0.5)
    makeEdge(1, 0.02, 0.02, 0, 0.5, -0.5)
    makeEdge(1, 0.02, 0.02, 0, -0.5, 0.5)
    makeEdge(1, 0.02, 0.02, 0, -0.5, -0.5)

    // Draft measurement stations
    const stationPositions = [
      [3, 18],   // Fore Port
      [-3, 18],  // Fore Starboard
      [3, 0],    // Mid Port
      [-3, 0],   // Mid Starboard
      [3, -18],  // Aft Port
      [-3, -18], // Aft Starboard
    ]
    const stationEntities: any[] = []
    const inactiveColor = new pc.Color(0.58, 0.64, 0.72) // #94A3B8

    stationPositions.forEach(([x, z], i) => {
      const marker = new pc.Entity(`station-${i}`)
      marker.addComponent('render', { type: 'sphere' })
      marker.setLocalScale(0.6, 0.6, 0.6)
      marker.setPosition(x, 3.2, z)
      const mat = new pc.StandardMaterial()
      mat.diffuse = inactiveColor
      mat.update()
      marker.render!.meshInstances[0].material = mat
      app.root.addChild(marker)
      stationEntities.push({ entity: marker, mat })
    })
    pcEntitiesRef.current.stations = stationEntities

    // Dock
    const dock = new pc.Entity('dock')
    dock.addComponent('render', { type: 'box' })
    dock.setLocalScale(12, 1, 50)
    dock.setPosition(-11, 0.5, 0)
    const dockMat = new pc.StandardMaterial()
    dockMat.diffuse = new pc.Color(0.22, 0.26, 0.32) // #374151
    dockMat.update()
    dock.render!.meshInstances[0].material = dockMat
    app.root.addChild(dock)

    // Container storage
    pcEntitiesRef.current.containers = []
    pcEntitiesRef.current.mobSphere = null

    // Resize handler
    const onResize = () => { app.resizeCanvas() }
    window.addEventListener('resize', onResize)
    pcEntitiesRef.current.cleanup = () => { window.removeEventListener('resize', onResize) }
  }, [])

  // Load PlayCanvas and init scene
  useEffect(() => {
    if (pcLoaded) initScene()
  }, [pcLoaded, initScene])

  // Cleanup
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      if (cameraControllerRef.current) cameraControllerRef.current.destroy()
      delete (window as any).__freqSimSetView
      if (pcEntitiesRef.current.cleanup) pcEntitiesRef.current.cleanup()
      if (pcAppRef.current) {
        try { pcAppRef.current.destroy() } catch {}
      }
    }
  }, [])

  // ─── Simulation Tick ───
  const startTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    const TICK_MS = 100

    tickRef.current = setInterval(() => {
      if (stateRef.current !== SIM_STATES.RUNNING) return

      const sp = speedRef.current
      const phase = phaseRef.current
      const newElapsed = elapsedRef.current + TICK_MS * sp
      const phaseDuration = PHASE_DURATIONS[phase]

      setElapsedMs(newElapsed)
      elapsedRef.current = newElapsed
      setTotalElapsedMs(prev => {
        const n = prev + TICK_MS * sp
        totalElapsedRef.current = n
        return n
      })

      // Update readings with small ticks
      setReadings(prev => prev.map((v, i) => {
        const phaseAdd = phase === 2 ? (newElapsed / phaseDuration) * 2.4 : (phase > 2 ? 2.4 : 0)
        const base = [7.42, 7.38, 7.51, 7.49, 7.63, 7.61][i] + phaseAdd
        const tick = (Math.random() - 0.5) * 0.04
        return Math.round((base + tick) * 100) / 100
      }))

      // Cargo mass
      if (phase === 2) {
        const progress = Math.min(newElapsed / phaseDuration, 1)
        setCargoMass(Math.round(progress * 1482.6 * 10) / 10)
        setLoadProgress(Math.round(progress * 100 * 10) / 10)
        setContainersLoaded(Math.floor(progress * 8))
      } else if (phase > 2) {
        setCargoMass(1482.6)
        setLoadProgress(100)
      }

      // Trim and heel
      setTrim(Math.round((0.08 + (Math.random() - 0.5) * 0.06) * 100) / 100)
      setHeel(Math.round((0.01 + (Math.random() - 0.5) * 0.02) * 100) / 100)

      // Map manual step to phase
      const stepMap = [0, 1, 2, 3, 4, 5, 6]
      const mappedStep = Math.min(Math.floor((phase / 6) * 7 + (newElapsed / phaseDuration) * (7 / 6)), 6)
      setCurrentStep(Math.min(mappedStep, 6))

      // Update 3D scene
      updateScene(phase, newElapsed / phaseDuration)

      // Phase complete
      if (newElapsed >= phaseDuration) {
        if (phase >= 5) {
          // Simulation complete
          setState(SIM_STATES.COMPLETE)
          stateRef.current = SIM_STATES.COMPLETE
          setCurrentPhase(5)
          setCargoMass(1482.6)
          setLoadProgress(100)
          setCurrentStep(6)
          setReadings([9.82, 9.80, 9.85, 9.83, 9.90, 9.88])
          setTrim(0.08)
          setHeel(0.01)
          if (tickRef.current) clearInterval(tickRef.current)
        } else {
          setCurrentPhase(phase + 1)
          phaseRef.current = phase + 1
          setElapsedMs(0)
          elapsedRef.current = 0
        }
      }
    }, TICK_MS)
  }, [])

  // Update 3D scene based on phase progress
  const updateScene = (phase: number, progress: number) => {
    const pc = (window as any).pc
    if (!pc || !pcAppRef.current || !pcEntitiesRef.current.barge) return

    const barge = pcEntitiesRef.current.barge
    const water = pcEntitiesRef.current.water
    const stations = pcEntitiesRef.current.stations

    // Barge sinking: during phase 2, the barge sinks from y=1.5 to y=0.6
    if (phase === 2) {
      const sinkAmount = progress * 0.9
      barge.setPosition(0, 1.5 - sinkAmount, 0)
    } else if (phase > 2) {
      barge.setPosition(0, 0.6, 0)
    }

    // Trim/heel rotation
    const trimAngle = phase >= 1 ? 0.3 : 0
    const heelAngle = phase >= 2 ? 0.15 : 0
    barge.setEulerAngles(trimAngle, 0, heelAngle)

    // Station colors
    if (stations) {
      const activeStation = phase < 6 ? Math.floor(progress * 6) % 6 : -1
      stations.forEach((s: any, i: number) => {
        if (phase >= 5 || (phase > 0 && i <= activeStation + phase * 1)) {
          s.mat.diffuse = new pc.Color(0.06, 0.73, 0.51) // green
          s.mat.emissive = new pc.Color(0.06, 0.73, 0.51)
          s.mat.emissiveIntensity = 0.3
        } else if (i === activeStation) {
          s.mat.diffuse = new pc.Color(0.02, 0.71, 0.83) // teal
          s.mat.emissive = new pc.Color(0.02, 0.71, 0.83)
          s.mat.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3
        }
        s.mat.update()
      })
    }

    // Containers during phase 2
    if (phase === 2) {
      const numContainers = Math.floor(progress * 8)
      const existing = pcEntitiesRef.current.containers || []
      while (existing.length < numContainers) {
        const idx = existing.length
        const container = new pc.Entity(`container-${idx}`)
        container.addComponent('render', { type: 'box' })
        container.setLocalScale(2.5, 2.5, 6)
        const row = Math.floor(idx / 2)
        const side = idx % 2 === 0 ? 2.5 : -2.5
        container.setPosition(side, 3.5 + (1.5 - progress * 0.9), -15 + row * 8)
        const cMat = new pc.StandardMaterial()
        cMat.diffuse = new pc.Color(0.49, 0.23, 0.93) // #7C3AED
        cMat.opacity = 0.7
        cMat.blendType = pc.BLEND_NORMAL
        cMat.update()
        container.render!.meshInstances[0].material = cMat
        pcAppRef.current.root.addChild(container)
        existing.push(container)
      }
      pcEntitiesRef.current.containers = existing
    }
  }

  // ─── Controls ───
  const initiate = () => {
    simHasRunRef.current = true
    setState(SIM_STATES.RUNNING)
    stateRef.current = SIM_STATES.RUNNING
    setCurrentPhase(0)
    phaseRef.current = 0
    setElapsedMs(0)
    elapsedRef.current = 0
    setTotalElapsedMs(0)
    totalElapsedRef.current = 0
    setCurrentStep(0)
    setCargoMass(0)
    setLoadProgress(0)
    setContainersLoaded(0)
    setTrim(0)
    setHeel(0)
    setReadings([7.42, 7.38, 7.51, 7.49, 7.63, 7.61])
    setMobDetected(false)
    setShowMobReset(false)
    startTick()
  }

  const pause = () => {
    setState(SIM_STATES.PAUSED)
    stateRef.current = SIM_STATES.PAUSED
  }

  const resume = () => {
    setState(SIM_STATES.RUNNING)
    stateRef.current = SIM_STATES.RUNNING
  }

  const reset = () => {
    if (tickRef.current) clearInterval(tickRef.current)
    setState(SIM_STATES.IDLE)
    stateRef.current = SIM_STATES.IDLE
    setCurrentPhase(0)
    phaseRef.current = 0
    setElapsedMs(0)
    elapsedRef.current = 0
    setTotalElapsedMs(0)
    totalElapsedRef.current = 0
    setCurrentStep(0)
    setCargoMass(0)
    setLoadProgress(0)
    setContainersLoaded(0)
    setTrim(0)
    setHeel(0)
    setReadings([7.42, 7.38, 7.51, 7.49, 7.63, 7.61])
    setMobDetected(false)
    setShowMobReset(false)

    // Reset 3D scene
    if (pcEntitiesRef.current.barge) {
      pcEntitiesRef.current.barge.setPosition(0, 1.5, 0)
      pcEntitiesRef.current.barge.setEulerAngles(0, 0, 0)
    }
    if (pcEntitiesRef.current.stations) {
      const pc = (window as any).pc
      pcEntitiesRef.current.stations.forEach((s: any) => {
        s.mat.diffuse = new pc.Color(0.58, 0.64, 0.72)
        s.mat.emissive = new pc.Color(0, 0, 0)
        s.mat.emissiveIntensity = 0
        s.mat.update()
      })
    }
    // Remove containers
    if (pcEntitiesRef.current.containers) {
      pcEntitiesRef.current.containers.forEach((c: any) => c.destroy())
      pcEntitiesRef.current.containers = []
    }
    // Remove MOB sphere
    if (pcEntitiesRef.current.mobSphere) {
      pcEntitiesRef.current.mobSphere.destroy()
      pcEntitiesRef.current.mobSphere = null
    }
    if (pcEntitiesRef.current.resetCamera) pcEntitiesRef.current.resetCamera()
  }

  const triggerMob = () => {
    setState(SIM_STATES.ALERT)
    stateRef.current = SIM_STATES.ALERT
    setMobDetected(true)
    setShowMobReset(false)

    // Add red sphere in 3D
    const pc = (window as any).pc
    if (pc && pcAppRef.current && !pcEntitiesRef.current.mobSphere) {
      const mob = new pc.Entity('mob')
      mob.addComponent('render', { type: 'sphere' })
      mob.setLocalScale(1.2, 1.2, 1.2)
      mob.setPosition(4.5, 0.2, 0) // port side, midship, at water
      const mobMat = new pc.StandardMaterial()
      mobMat.diffuse = new pc.Color(0.94, 0.27, 0.27) // red
      mobMat.emissive = new pc.Color(0.94, 0.27, 0.27)
      mobMat.emissiveIntensity = 0.8
      mobMat.update()
      mob.render!.meshInstances[0].material = mobMat
      pcAppRef.current.root.addChild(mob)
      pcEntitiesRef.current.mobSphere = mob
    }

    setTimeout(() => setShowMobReset(true), 5000)
  }

  const resetMob = () => {
    setMobDetected(false)
    setShowMobReset(false)
    setState(SIM_STATES.PAUSED)
    stateRef.current = SIM_STATES.PAUSED
    if (pcEntitiesRef.current.mobSphere) {
      pcEntitiesRef.current.mobSphere.destroy()
      pcEntitiesRef.current.mobSphere = null
    }
  }

  // Format elapsed time
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const statusLabel = state === SIM_STATES.IDLE ? 'SYSTEM READY'
    : state === SIM_STATES.RUNNING ? 'RUNNING'
    : state === SIM_STATES.PAUSED ? 'SEQUENCE PAUSED'
    : state === SIM_STATES.COMPLETE ? 'SURVEY COMPLETE'
    : 'SAFETY ALERT \u2014 E-STOP ACTIVE'

  const statusDotClass = state === SIM_STATES.IDLE ? 'status-dot--gray'
    : state === SIM_STATES.RUNNING ? 'status-dot--green pulse'
    : state === SIM_STATES.PAUSED ? 'status-dot--amber'
    : state === SIM_STATES.COMPLETE ? 'status-dot--blue'
    : 'status-dot--red pulse'

  return (
    <>
      <Script
        src="https://code.playcanvas.com/playcanvas-stable.min.js"
        strategy="afterInteractive"
        onLoad={() => setPcLoaded(true)}
      />

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-card)' }}>
        {/* MOB Alert Banner */}
        {state === SIM_STATES.ALERT && (
          <div style={{
            background: 'var(--red)',
            color: 'var(--white)',
            padding: '12px 24px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            textAlign: 'center',
            fontSize: '0.9rem',
          }}>
            EMERGENCY STOP \u2014 MAN OVERBOARD DETECTED
          </div>
        )}

        {/* Control Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.9rem' }}>
              FREQ AI SOL \u2014 BARGE DRAFTING SIMULATION
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>
              <span className={`status-dot ${statusDotClass}`} />
              {statusLabel}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Action buttons */}
            {(state === SIM_STATES.IDLE || state === SIM_STATES.COMPLETE) && (
              <button className="btn-primary" onClick={initiate} style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
                {state === SIM_STATES.COMPLETE ? '\u21BA RUN AGAIN' : '\u25B6 INITIATE SEQUENCE'}
              </button>
            )}
            {state === SIM_STATES.RUNNING && (
              <button onClick={pause} style={{
                padding: '8px 20px', fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                background: 'var(--amber)', color: 'var(--bg-primary)', border: 'none', borderRadius: 6, cursor: 'pointer',
              }}>
                \u23F8 PAUSE
              </button>
            )}
            {state === SIM_STATES.PAUSED && (
              <button onClick={resume} style={{
                padding: '8px 20px', fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                background: 'var(--teal)', color: 'var(--bg-primary)', border: 'none', borderRadius: 6, cursor: 'pointer',
              }}>
                \u25B6 RESUME
              </button>
            )}
            {state !== SIM_STATES.IDLE && state !== SIM_STATES.ALERT && (
              <button onClick={reset} style={{
                padding: '8px 20px', fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer',
              }}>
                \u21BA RESET
              </button>
            )}
            {state === SIM_STATES.IDLE && (
              <button disabled style={{
                padding: '8px 20px', fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'not-allowed', opacity: 0.5,
              }}>
                \u21BA RESET
              </button>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Speed */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", marginRight: 4 }}>Speed:</span>
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    padding: '4px 10px', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                    background: speed === s ? 'var(--purple)' : 'transparent',
                    color: speed === s ? 'var(--white)' : 'var(--text-secondary)',
                    border: `1px solid ${speed === s ? 'var(--purple)' : 'var(--border)'}`,
                    borderRadius: 4, cursor: 'pointer',
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['3d', 'telemetry'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '4px 10px', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                    background: view === v ? 'var(--purple)' : 'transparent',
                    color: view === v ? 'var(--white)' : 'var(--text-secondary)',
                    border: `1px solid ${view === v ? 'var(--purple)' : 'var(--border)'}`,
                    borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase',
                  }}
                >
                  {v === '3d' ? '3D' : 'TELEMETRY'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Camera Toolbar */}
        {view === '3d' && (
          <CameraToolbar
            activeView={cameraView}
            activeStationIndex={activeStation}
            onViewChange={(v) => cameraControllerRef.current?.setView(v)}
            onCycleStation={() => cameraControllerRef.current?.cycleStation(1)}
            onResetCamera={() => cameraControllerRef.current?.resetCamera()}
          />
        )}

        {/* Main content area */}
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
          {/* Left Panel — Manual Process */}
          <div style={{ width: 320, minWidth: 280, borderRight: '1px solid var(--border)', padding: 20, background: 'var(--bg-primary)', flexShrink: 0 }} className="sim-left-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.8rem', color: 'var(--amber)' }}>MANUAL PROCESS</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 3 }}>CURRENT INDUSTRY STANDARD</span>
            </div>

            {/* Step display */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: 'var(--white)' }}>
                Step {currentStep + 1}: {MANUAL_STEPS[currentStep].title}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                {MANUAL_STEPS[currentStep].desc}
              </p>
              <div style={{
                fontSize: '0.75rem',
                fontFamily: "'JetBrains Mono', monospace",
                padding: '6px 10px',
                borderRadius: 4,
                background: MANUAL_STEPS[currentStep].severity === 'red' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                color: MANUAL_STEPS[currentStep].severity === 'red' ? 'var(--red)' : 'var(--amber)',
                border: `1px solid ${MANUAL_STEPS[currentStep].severity === 'red' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
              }}>
                {MANUAL_STEPS[currentStep].severity === 'red' ? '\u26A0' : '\u26A0'} {MANUAL_STEPS[currentStep].annotation}
              </div>
            </div>

            {/* Step navigation */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                style={{
                  flex: 1, padding: '6px 12px', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
                  background: 'transparent', color: currentStep === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: 4, cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                PREV
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
                disabled={currentStep === 6}
                style={{
                  flex: 1, padding: '6px 12px', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
                  background: 'transparent', color: currentStep === 6 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: 4, cursor: currentStep === 6 ? 'not-allowed' : 'pointer',
                }}
              >
                NEXT
              </button>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 4, marginTop: 12, justifyContent: 'center' }}>
              {MANUAL_STEPS.map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i === currentStep ? 'var(--amber)' : i < currentStep ? 'var(--text-muted)' : 'var(--border)',
                }} />
              ))}
            </div>
          </div>

          {/* Right: Canvas or Telemetry */}
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            {/* 3D Canvas */}
            <div style={{ display: view === '3d' ? 'block' : 'none', position: 'relative' }}>
              <canvas
                ref={canvasRef}
                id="freq-simulation"
                style={{ width: '100%', height: 500, display: 'block', background: '#0A0F1E' }}
              />

              {/* HUD Overlay */}
              <div className="corner-brackets scanline-overlay" style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(8,12,24,0.85)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '12px 16px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem',
                lineHeight: 1.8,
                zIndex: 2,
                minWidth: 220,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--white)', fontWeight: 700 }}>BARGE-402</span>
                  <span style={{ color: 'var(--teal)' }}>PHASE {currentPhase + 1}/6</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0 6px' }} />
                {STATIONS.map((s, i) => (
                  <div key={s} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>{s}</span>
                    <span className="data-value">{readings[i].toFixed(2)} ft</span>
                    <span style={{ color: 'var(--green)', fontSize: '0.6rem' }}>{'\u25B2'} NOM</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0 4px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <Tooltip term="Cargo Mass"><span>CARGO</span></Tooltip>
                  <span className="data-value">{cargoMass.toFixed(1)} T</span>
                  <span style={{ color: state === SIM_STATES.RUNNING && currentPhase === 2 ? 'var(--green)' : 'var(--text-muted)', fontSize: '0.6rem' }}>
                    {currentPhase === 2 && state === SIM_STATES.RUNNING ? '\u25B2 ACTIVE' : '\u25B2 NOM'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <Tooltip term="Trim"><span>TRIM</span></Tooltip>
                  <span className="data-value">{trim.toFixed(2)} ft</span>
                  <span style={{ color: 'var(--green)', fontSize: '0.6rem' }}>{'\u25B2'} NOM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <Tooltip term="Heel"><span>HEEL</span></Tooltip>
                  <span className="data-value">{Math.abs(heel).toFixed(2)}&deg;</span>
                  <span style={{ color: 'var(--green)', fontSize: '0.6rem' }}>{'\u25B2'} NOM</span>
                </div>
                {mobDetected && (
                  <>
                    <div style={{ borderTop: '1px solid var(--red)', margin: '6px 0 4px' }} />
                    <div style={{ color: 'var(--red)', fontWeight: 700 }}>
                      <Tooltip term="MOB"><span>MOB DETECTED</span></Tooltip> | ZONE MID-PORT | <span className="status-dot status-dot--red pulse" style={{ display: 'inline-block', verticalAlign: 'middle' }} /> EMERGENCY
                    </div>
                  </>
                )}
              </div>

              {/* First Person Instructions Overlay */}
              {showFPInstructions && !showStationCard && (
                <div style={{
                  display: 'flex', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  zIndex: 50, background: 'rgba(8,12,24,0.95)', border: '1px solid var(--purple)',
                  borderRadius: '0.75rem', padding: '2rem', minWidth: 320, flexDirection: 'column', gap: '0.75rem',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1rem', color: 'var(--purple)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    FIRST PERSON MODE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.4rem', fontSize: '0.875rem' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--teal)' }}>W / &uarr;</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Move forward</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--teal)' }}>S / &darr;</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Move backward</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--teal)' }}>A / &larr;</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Move left</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--teal)' }}>D / &rarr;</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Move right</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--teal)' }}>Mouse</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Look around</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--teal)' }}>Click</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Inspect nearby station</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--teal)' }}>ESC</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Exit first person</span>
                  </div>
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    You are on the barge deck. Walk to each measurement station. This is what the manual process requires crew to do &mdash; in all weather, alongside active crane and loading equipment.
                  </div>
                  <button
                    onClick={() => cameraControllerRef.current?.dismissFPInstructions()}
                    style={{
                      marginTop: '0.5rem', background: 'var(--purple)', color: '#fff', border: 'none',
                      padding: '0.6rem 1.25rem', borderRadius: '0.4rem', cursor: 'pointer',
                      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, alignSelf: 'flex-end',
                    }}
                  >
                    Got it &mdash; Enter Deck &rarr;
                  </button>
                </div>
              )}

              {/* First Person Context Narration */}
              {fpActive && !showFPInstructions && simHasRunRef.current && (
                <div style={{
                  position: 'absolute', bottom: '1.5rem', left: '1.5rem',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
                  color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.5,
                  pointerEvents: 'none', transition: 'opacity 0.6s', zIndex: 3,
                }}>
                  {fpRegion === 'fore' && 'FORE DRAFT STATION \u2014 Manual read: \u00B10.5 inch error'}
                  {fpRegion === 'mid' && 'MIDSHIP STATION \u2014 Radio relay required to shore'}
                  {fpRegion === 'aft' && 'AFT STATION \u2014 Third reading. Process takes 4 hours total.'}
                </div>
              )}

              {/* First Person Station Proximity Tooltip */}
              {fpActive && !showFPInstructions && nearbyStation >= 0 && (
                <div style={{
                  position: 'absolute', bottom: '4rem', left: '50%', transform: 'translateX(-50%)',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--teal)',
                  background: 'rgba(8,12,24,0.9)', border: '1px solid var(--teal)', borderRadius: '0.35rem',
                  padding: '0.4rem 0.75rem', pointerEvents: 'none', zIndex: 3, whiteSpace: 'nowrap',
                }}>
                  DRAFT STATION: {STATION_IDS[nearbyStation]} &mdash; Click to inspect
                </div>
              )}

              {/* Station Close-Up Data Card */}
              {showStationCard && activeStation >= 0 && (
                <div style={{
                  position: 'absolute', bottom: '1.5rem', right: '1.5rem',
                  background: 'rgba(8,12,24,0.95)', border: '1px solid var(--teal)',
                  borderRadius: '0.75rem', padding: '1.25rem', minWidth: 240,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', zIndex: 10,
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '0.85rem', marginBottom: '0.75rem', letterSpacing: '0.08em' }}>
                    DRAFT STATION &mdash; {STATION_LABELS[activeStation]}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ID</span>
                    <span style={{ color: 'var(--text-primary)' }}>{STATION_IDS[activeStation]}</span>
                    <span style={{ color: 'var(--text-muted)' }}>READING</span>
                    <span style={{ color: 'var(--teal)' }}>{readings[activeStation].toFixed(2)} ft</span>
                    <span style={{ color: 'var(--text-muted)' }}>STATUS</span>
                    <span style={{ color: 'var(--green)' }}>{'\u25B2'} NOMINAL</span>
                    <span style={{ color: 'var(--text-muted)' }}>METHOD</span>
                    <span style={{ color: 'var(--text-primary)' }}>AUTONOMOUS</span>
                    <span style={{ color: 'var(--text-muted)' }}>ACCURACY</span>
                    <span style={{ color: 'var(--green)' }}>&plusmn; 0.02 ft</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.72rem', lineHeight: 1.6 }}>
                    Manual equivalent:<br />
                    Visual read &plusmn;0.5 in | Radio relay to shore
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    {!fpActive && (
                      <>
                        <button onClick={() => cameraControllerRef.current?.cycleStation(-1)} style={{
                          background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                          padding: '0.3rem 0.5rem', borderRadius: '0.3rem', cursor: 'pointer',
                          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
                        }}>&larr; PREV</button>
                        <button onClick={() => cameraControllerRef.current?.cycleStation(1)} style={{
                          background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                          padding: '0.3rem 0.5rem', borderRadius: '0.3rem', cursor: 'pointer',
                          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
                        }}>NEXT &rarr;</button>
                      </>
                    )}
                    <button onClick={() => {
                      if (fpActive) {
                        cameraControllerRef.current?.clearStationInspection()
                      } else {
                        cameraControllerRef.current?.setView('orbit')
                      }
                    }} style={{
                      background: 'transparent', border: 'none', color: 'var(--text-muted)',
                      padding: '0.3rem', cursor: 'pointer', fontSize: '0.8rem',
                      marginLeft: fpActive ? 'auto' : undefined,
                    }}>&times;</button>
                  </div>
                </div>
              )}
            </div>

            {/* Telemetry View */}
            <div style={{ display: view === 'telemetry' ? 'block' : 'none', padding: 24, height: 500, overflow: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', lineHeight: 2, background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--white)', fontWeight: 700, marginBottom: 4 }}>FREQ AI SOL \u2014 LIVE TELEMETRY FEED</div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
                VESSEL: BARGE-402 | OP: DRAFT-SURVEY-001 | PHASE: {currentPhase + 1} OF 6
              </div>

              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}><Tooltip term="Draft"><span>DRAFT READINGS</span></Tooltip></div>
              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 80px 60px', gap: '0 8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>STATION</span>
                <span style={{ color: 'var(--text-muted)' }}>READING</span>
                <span style={{ color: 'var(--text-muted)' }}>STATUS</span>
                <span style={{ color: 'var(--text-muted)' }}>DELTA</span>
                {STATION_FULL.map((s, i) => (
                  <>
                    <span key={`n-${i}`} style={{ color: 'var(--text-primary)' }}>{s}</span>
                    <span key={`r-${i}`} className="data-value">{readings[i].toFixed(2)} ft</span>
                    <span key={`s-${i}`} style={{ color: 'var(--green)' }}>{'\u25B2'} NOMINAL</span>
                    <span key={`d-${i}`} className="data-value">+0.0{Math.floor(Math.random() * 4 + 1)}</span>
                  </>
                ))}
              </div>

              <div style={{ color: 'var(--text-muted)', marginTop: 16, marginBottom: 4 }}>STABILITY</div>
              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 80px auto', gap: '0 8px' }}>
                <span><Tooltip term="Trim"><span style={{ color: 'var(--text-primary)' }}>TRIM</span></Tooltip></span>
                <span className="data-value">{trim.toFixed(2)} ft</span>
                <span style={{ color: 'var(--green)' }}>{'\u25B2'} NOMINAL</span>
                <span style={{ color: 'var(--text-muted)' }}>(AFT HEAVY)</span>

                <span><Tooltip term="Heel"><span style={{ color: 'var(--text-primary)' }}>HEEL</span></Tooltip></span>
                <span className="data-value">{Math.abs(heel).toFixed(2)}&deg;</span>
                <span style={{ color: 'var(--green)' }}>{'\u25B2'} NOMINAL</span>
                <span style={{ color: 'var(--text-muted)' }}>(PORT)</span>

                <span><Tooltip term="GM Height"><span style={{ color: 'var(--text-primary)' }}>GM HEIGHT</span></Tooltip></span>
                <span className="data-value">4.82 ft</span>
                <span style={{ color: 'var(--green)' }}>{'\u25B2'} SAFE</span>
                <span />

                <span><Tooltip term="Freeboard"><span style={{ color: 'var(--text-primary)' }}>FREEBOARD</span></Tooltip></span>
                <span className="data-value">{(2.31 + (state === SIM_STATES.IDLE ? 0 : -loadProgress * 0.01)).toFixed(2)} ft</span>
                <span style={{ color: 'var(--green)' }}>{'\u25B2'} ADEQUATE</span>
                <span />
              </div>

              <div style={{ color: 'var(--text-muted)', marginTop: 16, marginBottom: 4 }}>CARGO INTELLIGENCE</div>
              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 80px auto', gap: '0 8px' }}>
                <span><Tooltip term="Displacement"><span style={{ color: 'var(--text-primary)' }}>DISPLACEMENT</span></Tooltip></span>
                <span className="data-value">{(1000 + cargoMass).toFixed(1)} T</span>
                <span style={{ color: 'var(--green)' }}>{'\u25B2'} CALCULATED</span>
                <span />

                <span><Tooltip term="Cargo Mass"><span style={{ color: 'var(--text-primary)' }}>CARGO MASS</span></Tooltip></span>
                <span className="data-value">{cargoMass.toFixed(1)} T</span>
                <span style={{ color: 'var(--green)' }}>{'\u25B2'} VERIFIED</span>
                <span />

                <span style={{ color: 'var(--text-primary)' }}>LOAD PROG</span>
                <span className="data-value">{loadProgress.toFixed(1)}%</span>
                <span style={{ color: state === SIM_STATES.RUNNING && currentPhase === 2 ? 'var(--green)' : 'var(--text-muted)' }}>
                  {currentPhase === 2 && state === SIM_STATES.RUNNING ? '\u25B2 ACTIVE' : '\u2501 HOLD'}
                </span>
                <span />

                <span style={{ color: 'var(--text-primary)' }}>EST COMPLETE</span>
                <span className="data-value">{formatTime(Math.max(0, PHASE_DURATIONS.reduce((a, b) => a + b, 0) / speed - totalElapsedMs / speed))}</span>
                <span style={{ color: 'var(--text-muted)' }}>{'\u2501'} COUNTING</span>
                <span />
              </div>

              <div style={{ color: 'var(--text-muted)', marginTop: 16, marginBottom: 4 }}>GOVERNANCE</div>
              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 80px auto', gap: '0 8px' }}>
                <span style={{ color: 'var(--text-primary)' }}>WATCHDOG</span>
                <span style={{ color: 'var(--green)' }}>ACTIVE</span>
                <span style={{ color: 'var(--green)' }}>{'\u25B2'} ALL CLEAR</span>
                <span />

                <span><Tooltip term="MOB"><span style={{ color: 'var(--text-primary)' }}>MOB DETECT</span></Tooltip></span>
                <span style={{ color: mobDetected ? 'var(--red)' : 'var(--green)' }}>{mobDetected ? 'ALERT' : 'MONITORING'}</span>
                <span style={{ color: mobDetected ? 'var(--red)' : 'var(--green)' }}>{mobDetected ? '\u25B2 DETECTED' : '\u25B2 CLEAR'}</span>
                <span />

                <span><Tooltip term="E-Stop"><span style={{ color: 'var(--text-primary)' }}>E-STOP</span></Tooltip></span>
                <span style={{ color: state === SIM_STATES.ALERT ? 'var(--red)' : 'var(--green)' }}>{state === SIM_STATES.ALERT ? 'TRIGGERED' : 'ARMED'}</span>
                <span style={{ color: state === SIM_STATES.ALERT ? 'var(--red)' : 'var(--green)' }}>{state === SIM_STATES.ALERT ? '\u25B2 ACTIVE' : '\u25B2 STANDBY'}</span>
                <span />

                <span><Tooltip term="USCG 46 CFR"><span style={{ color: 'var(--text-primary)' }}>COMPLIANCE</span></Tooltip></span>
                <span style={{ color: 'var(--green)' }}>USCG-46CFR</span>
                <span style={{ color: 'var(--green)' }}>{'\u25B2'} COMPLIANT</span>
                <span />
              </div>
            </div>
          </div>
        </div>

        {/* Phase Progress Bar */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 12 }}>
            {PHASE_NAMES.map((name, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div className="tooltip-term" style={{ cursor: 'default', borderBottom: 'none', position: 'relative' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                    background: i < currentPhase || state === SIM_STATES.COMPLETE ? 'var(--teal)' : i === currentPhase && state === SIM_STATES.RUNNING ? 'var(--bg-card)' : 'transparent',
                    border: i === currentPhase && state === SIM_STATES.RUNNING ? '2px solid var(--teal)' : i < currentPhase || state === SIM_STATES.COMPLETE ? 'none' : '1px solid var(--text-muted)',
                    color: i < currentPhase || state === SIM_STATES.COMPLETE ? 'var(--bg-primary)' : i === currentPhase ? 'var(--teal)' : 'var(--text-muted)',
                    animation: i === currentPhase && state === SIM_STATES.RUNNING ? 'pulse-green 2s infinite' : 'none',
                  }}>
                    {i + 1}
                  </div>
                  <span className="tooltip-content">{name}: {PHASE_DESCS[i]}</span>
                </div>
                {i < 5 && (
                  <div style={{
                    width: 40, height: 2,
                    background: i < currentPhase || state === SIM_STATES.COMPLETE ? 'var(--teal)' : 'var(--border)',
                  }} />
                )}
              </div>
            ))}
          </div>
          {(state === SIM_STATES.RUNNING || state === SIM_STATES.PAUSED) && (
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>Phase {currentPhase + 1}: {PHASE_NAMES[currentPhase]}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 12 }}>{PHASE_DESCS[currentPhase]}</span>
            </div>
          )}
        </div>

        {/* Completion Summary */}
        {state === SIM_STATES.COMPLETE && (
          <div style={{
            margin: '0 24px 24px',
            padding: 24,
            background: 'var(--bg-primary)',
            border: '1px solid var(--teal)',
            borderRadius: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.8rem',
            lineHeight: 2,
          }}>
            <div style={{ color: 'var(--white)', fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>SURVEY COMPLETE \u2014 BARGE-402</div>
            <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '200px auto', gap: '0 16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Operation Time:</span>
              <span className="data-value">{formatTime(totalElapsedMs)}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Final Cargo Mass:</span>
              <span className="data-value">1,482.6 T &nbsp;<span style={{ color: 'var(--green)', fontSize: '0.7rem' }}>{'\u25B2'} VERIFIED</span></span>
              <span style={{ color: 'var(--text-secondary)' }}>Final Average <Tooltip term="Draft"><span>Draft</span></Tooltip>:</span>
              <span className="data-value">9.84 ft</span>
              <span style={{ color: 'var(--text-secondary)' }}><Tooltip term="Trim"><span>Trim</span></Tooltip>:</span>
              <span className="data-value">0.08 ft &nbsp;<span style={{ color: 'var(--green)', fontSize: '0.7rem' }}>{'\u25B2'} NOMINAL</span></span>
              <span style={{ color: 'var(--text-secondary)' }}><Tooltip term="Heel"><span>Heel</span></Tooltip>:</span>
              <span className="data-value">0.01&deg; &nbsp;<span style={{ color: 'var(--green)', fontSize: '0.7rem' }}>{'\u25B2'} NOMINAL</span></span>
              <span style={{ color: 'var(--text-secondary)' }}>Measurement Accuracy:</span>
              <span className="data-value">&plusmn; 0.02 ft &nbsp;SUB-INCH</span>
              <span style={{ color: 'var(--text-secondary)' }}>Crew Deck Exposure:</span>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>ZERO</span>
              <span style={{ color: 'var(--text-secondary)' }}>Report Status:</span>
              <span style={{ color: 'var(--green)' }}>GENERATED AND LOGGED</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0 8px' }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              vs. Manual: &nbsp;
              <span className="data-value">4 hours &rarr; {formatTime(totalElapsedMs)}</span> &nbsp;|&nbsp;
              <span className="data-value">1-3% error &rarr; sub-inch</span> &nbsp;|&nbsp;
              <span className="data-value">MOB risk &rarr; ELIMINATED</span>
            </div>
          </div>
        )}

        {/* MOB Demo Button & Reset */}
        <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 12, justifyContent: 'center' }}>
          {state !== SIM_STATES.IDLE && state !== SIM_STATES.ALERT && state !== SIM_STATES.COMPLETE && (
            <button onClick={triggerMob} style={{
              padding: '6px 16px', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
              background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 4, cursor: 'pointer',
            }}>
              {'\u26A0'} DEMO SAFETY EVENT \u2014 MOB SCENARIO
            </button>
          )}
          {state === SIM_STATES.ALERT && showMobReset && (
            <button onClick={resetMob} style={{
              padding: '8px 20px', fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
              background: 'var(--amber)', color: 'var(--bg-primary)', border: 'none', borderRadius: 6, cursor: 'pointer',
            }}>
              RESET SAFETY EVENT
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .sim-left-panel {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border) !important;
          }
        }
      `}</style>
    </>
  )
}
