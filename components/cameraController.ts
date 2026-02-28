// CameraController — Imperative PlayCanvas camera system for FREQ AI simulation
// Manages 7 views: orbit, overhead, side, fore, aft, first-person, station close-up
// Communicates state to React via onStateChange callback

export type CameraViewId = 'orbit' | 'overhead' | 'side' | 'fore' | 'aft' | 'fp' | 'station'

export interface CameraState {
  activeView: CameraViewId
  activeStationIndex: number
  nearbyStationIndex: number
  firstPersonRegion: 'fore' | 'mid' | 'aft'
  fpActive: boolean
  fpInstructionsDismissed: boolean
}

interface ViewDef {
  pos: [number, number, number]
  lookAt: [number, number, number]
}

// Camera view positions adapted to scene coordinates (X=beam, Z=length, +Z=fore)
const VIEWS: Record<string, ViewDef> = {
  orbit: { pos: [0, 18, 42], lookAt: [0, 1, 0] },
  overhead: { pos: [0.1, 65, 0], lookAt: [0, 0, 0] },
  side: { pos: [55, 5, 0], lookAt: [0, 1, 0] },
  fore: { pos: [0, 6, 28], lookAt: [0, 2, -10] },
  aft: { pos: [0, 6, -28], lookAt: [0, 2, 10] },
}

// Station marker positions (matching Simulation.tsx scene)
const STATION_POSITIONS: [number, number][] = [
  [3, 18],   // FP - Fore Port
  [-3, 18],  // FS - Fore Starboard
  [3, 0],    // MP - Mid Port
  [-3, 0],   // MS - Mid Starboard
  [3, -18],  // AP - Aft Port
  [-3, -18], // AS - Aft Starboard
]

// Station close-up camera angles
const STATION_VIEWS: ViewDef[] = [
  { pos: [8, 6, 14], lookAt: [3, 3.2, 18] },     // FP
  { pos: [-8, 6, 14], lookAt: [-3, 3.2, 18] },    // FS
  { pos: [8, 6, -4], lookAt: [3, 3.2, 0] },       // MP
  { pos: [-8, 6, -4], lookAt: [-3, 3.2, 0] },     // MS
  { pos: [8, 6, -14], lookAt: [3, 3.2, -18] },    // AP
  { pos: [-8, 6, -14], lookAt: [-3, 3.2, -18] },  // AS
]

export const STATION_IDS = ['FP', 'FS', 'MP', 'MS', 'AP', 'AS']
export const STATION_LABELS = [
  'FORE PORT', 'FORE STARBOARD', 'MID PORT', 'MID STARBOARD', 'AFT PORT', 'AFT STARBOARD',
]

export class CameraController {
  private pc: any
  private camera: any
  private canvas: HTMLCanvasElement
  private onStateChange: (state: CameraState) => void

  // Current state
  private activeView: CameraViewId = 'orbit'
  private prevView: CameraViewId = 'orbit'
  private activeStationIndex = -1
  private nearbyStationIndex = -1
  private firstPersonRegion: 'fore' | 'mid' | 'aft' = 'mid'

  // Transition
  private transitioning = false
  private transitionTime = 1.2
  private transitionElapsed = 0
  private startPos: any
  private startRot: any
  private targetPos: any
  private targetRot: any

  // Orbit state
  private orbitTheta = 0.52 // ~30 degrees
  private orbitPhi = 0.44   // ~25 degrees
  private orbitRadius = 42
  private orbitTarget: any
  private isDragging = false
  private dragButton = 0
  private lastMouse = { x: 0, y: 0 }

  // First person state
  private fpPos: any
  private fpYaw = -90 // degrees, facing toward -Z initially then adjusted
  private fpPitch = 0
  private fpSpeed = 4
  private keys: Record<string, boolean> = {}
  private pointerLocked = false
  private fpInstructionsDismissed = false

  // RAF
  private rafId = 0
  private lastTime = 0
  private destroyed = false

  // Bound event handlers (for removal)
  private _onMouseDown: (e: MouseEvent) => void
  private _onMouseUp: (e: MouseEvent) => void
  private _onMouseMove: (e: MouseEvent) => void
  private _onWheel: (e: WheelEvent) => void
  private _onClick: (e: MouseEvent) => void
  private _onKeyDown: (e: KeyboardEvent) => void
  private _onKeyUp: (e: KeyboardEvent) => void
  private _onPointerLockChange: () => void
  private _onContextMenu: (e: Event) => void
  private _onTouchStart: (e: TouchEvent) => void
  private _onTouchMove: (e: TouchEvent) => void
  private _onTouchEnd: () => void
  private touchDist = 0

  constructor(
    pcLib: any,
    camera: any,
    canvas: HTMLCanvasElement,
    onStateChange: (state: CameraState) => void,
  ) {
    this.pc = pcLib
    this.camera = camera
    this.canvas = canvas
    this.onStateChange = onStateChange

    // Init Vec3 objects
    this.startPos = new pcLib.Vec3()
    this.startRot = new pcLib.Quat()
    this.targetPos = new pcLib.Vec3()
    this.targetRot = new pcLib.Quat()
    this.orbitTarget = new pcLib.Vec3(0, 1, 0)
    this.fpPos = new pcLib.Vec3(0, 4.7, 18)

    // Set initial orbit position (no transition)
    this._computeOrbitPosition()
    this.camera.lookAt(this.orbitTarget)

    // Bind all event handlers
    this._onMouseDown = this._handleMouseDown.bind(this)
    this._onMouseUp = this._handleMouseUp.bind(this)
    this._onMouseMove = this._handleMouseMove.bind(this)
    this._onWheel = this._handleWheel.bind(this)
    this._onClick = this._handleClick.bind(this)
    this._onKeyDown = this._handleKeyDown.bind(this)
    this._onKeyUp = this._handleKeyUp.bind(this)
    this._onPointerLockChange = this._handlePointerLockChange.bind(this)
    this._onContextMenu = (e: Event) => e.preventDefault()
    this._onTouchStart = this._handleTouchStart.bind(this)
    this._onTouchMove = this._handleTouchMove.bind(this)
    this._onTouchEnd = () => { this.isDragging = false }

    this.canvas.addEventListener('mousedown', this._onMouseDown)
    window.addEventListener('mouseup', this._onMouseUp)
    window.addEventListener('mousemove', this._onMouseMove)
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false })
    this.canvas.addEventListener('click', this._onClick)
    this.canvas.addEventListener('contextmenu', this._onContextMenu)
    this.canvas.addEventListener('touchstart', this._onTouchStart)
    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', this._onTouchEnd)
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    document.addEventListener('pointerlockchange', this._onPointerLockChange)

    // Start update loop
    this.lastTime = performance.now()
    this._tick = this._tick.bind(this)
    this.rafId = requestAnimationFrame(this._tick)
  }

  // ─── Public API ───────────────────────────────────────

  setView(viewId: string) {
    if (viewId === 'fp') {
      this.enterFirstPerson()
      return
    }
    if (viewId === 'station') {
      this.cycleStation(1)
      return
    }
    const v = VIEWS[viewId]
    if (!v) return
    if (this.activeView === 'fp') this._exitFPInternal(false)
    this._closeStationCard()
    this.prevView = this.activeView
    this.activeView = viewId as CameraViewId
    this._beginTransition(v.pos, v.lookAt)
    this._emitState()
  }

  setStation(index: number) {
    if (index < 0 || index >= STATION_VIEWS.length) return
    if (this.activeView === 'fp') return
    this.prevView = this.activeView === 'station' ? this.prevView : this.activeView
    this.activeView = 'station'
    this.activeStationIndex = index
    const sv = STATION_VIEWS[index]
    this._beginTransition(sv.pos, sv.lookAt)
    this._emitState()
  }

  cycleStation(direction: number) {
    if (this.activeView === 'fp') return
    let next = this.activeStationIndex + direction
    if (next >= STATION_VIEWS.length) next = 0
    if (next < 0) next = STATION_VIEWS.length - 1
    this.setStation(next)
  }

  enterFirstPerson() {
    if (this.activeView !== 'fp') {
      this.prevView = this.activeView
    }
    this._closeStationCard()
    this.activeView = 'fp'
    this.fpPos.set(0, 4.7, 18)
    this.fpYaw = -90
    this.fpPitch = 0
    this.fpInstructionsDismissed = false
    this._beginTransition([0, 4.7, 18], [0, 4.7, 0])
    this._emitState()
  }

  exitFirstPerson() {
    this._exitFPInternal(true)
  }

  dismissFPInstructions() {
    this.fpInstructionsDismissed = true
    this._emitState()
    // Request pointer lock
    try {
      this.canvas.requestPointerLock()
    } catch {
      // Pointer lock not available — fall back to drag-look
    }
  }

  clearStationInspection() {
    this.activeStationIndex = -1
    this._emitState()
  }

  resetCamera() {
    if (this.activeView === 'fp') this._exitFPInternal(false)
    this._closeStationCard()
    this.orbitTheta = 0.52
    this.orbitPhi = 0.44
    this.orbitRadius = 42
    this.orbitTarget = new this.pc.Vec3(0, 1, 0)
    this.activeView = 'orbit'
    this._computeOrbitPosition()
    this.camera.lookAt(this.orbitTarget)
    this._emitState()
  }

  getState(): CameraState {
    return {
      activeView: this.activeView,
      activeStationIndex: this.activeStationIndex,
      nearbyStationIndex: this.nearbyStationIndex,
      firstPersonRegion: this.firstPersonRegion,
      fpActive: this.activeView === 'fp',
      fpInstructionsDismissed: this.fpInstructionsDismissed,
    }
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.rafId)
    this.canvas.removeEventListener('mousedown', this._onMouseDown)
    window.removeEventListener('mouseup', this._onMouseUp)
    window.removeEventListener('mousemove', this._onMouseMove)
    this.canvas.removeEventListener('wheel', this._onWheel)
    this.canvas.removeEventListener('click', this._onClick)
    this.canvas.removeEventListener('contextmenu', this._onContextMenu)
    this.canvas.removeEventListener('touchstart', this._onTouchStart)
    this.canvas.removeEventListener('touchmove', this._onTouchMove)
    this.canvas.removeEventListener('touchend', this._onTouchEnd)
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    document.removeEventListener('pointerlockchange', this._onPointerLockChange)
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock()
    }
  }

  // ─── Internal ─────────────────────────────────────────

  private _exitFPInternal(returnToPrev: boolean) {
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock()
    }
    this.pointerLocked = false
    this.fpInstructionsDismissed = false
    this.nearbyStationIndex = -1
    this.activeStationIndex = -1
    if (returnToPrev) {
      const target = this.prevView === 'fp' ? 'orbit' : this.prevView
      this.activeView = target
      const v = VIEWS[target]
      if (v) {
        this._beginTransition(v.pos, v.lookAt)
      }
    }
    this._emitState()
  }

  private _closeStationCard() {
    if (this.activeView === 'station') {
      this.activeStationIndex = -1
    }
  }

  private _beginTransition(pos: [number, number, number], lookAt: [number, number, number]) {
    this.startPos.copy(this.camera.getPosition())
    this.startRot.copy(this.camera.getRotation())

    this.targetPos.set(pos[0], pos[1], pos[2])

    // Compute target rotation from lookAt
    const tempEntity = new this.pc.Entity()
    tempEntity.setPosition(pos[0], pos[1], pos[2])
    tempEntity.lookAt(new this.pc.Vec3(lookAt[0], lookAt[1], lookAt[2]))
    this.targetRot.copy(tempEntity.getRotation())
    tempEntity.destroy()

    this.transitionElapsed = 0
    this.transitioning = true
  }

  private _easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  private _tick() {
    if (this.destroyed) return
    const now = performance.now()
    const dt = Math.min((now - this.lastTime) / 1000, 0.1) // cap at 100ms
    this.lastTime = now

    if (this.transitioning) {
      this._updateTransition(dt)
    } else if (this.activeView === 'fp' && this.fpInstructionsDismissed) {
      this._updateFirstPerson(dt)
    } else if (this.activeView === 'orbit') {
      // Orbit position is updated on mouse input, not every frame
      // But we still need lookAt to be correct
    }

    this.rafId = requestAnimationFrame(this._tick)
  }

  private _updateTransition(dt: number) {
    this.transitionElapsed += dt
    let t = Math.min(this.transitionElapsed / this.transitionTime, 1)
    t = this._easeInOutCubic(t)

    const pos = new this.pc.Vec3()
    pos.lerp(this.startPos, this.targetPos, t)

    const rot = new this.pc.Quat()
    rot.slerp(this.startRot, this.targetRot, t)

    this.camera.setPosition(pos)
    this.camera.setRotation(rot)

    if (t >= 1) {
      this.transitioning = false
      // If entering orbit, update orbit params from final position
      if (this.activeView === 'orbit') {
        this._syncOrbitFromPosition()
      }
      // If entering FP, sync fpPos
      if (this.activeView === 'fp') {
        this.fpPos.copy(pos)
      }
    }
  }

  private _computeOrbitPosition() {
    const x = this.orbitRadius * Math.sin(this.orbitTheta) * Math.cos(this.orbitPhi)
    const y = this.orbitRadius * Math.sin(this.orbitPhi)
    const z = this.orbitRadius * Math.cos(this.orbitTheta) * Math.cos(this.orbitPhi)
    this.camera.setPosition(
      this.orbitTarget.x + x,
      this.orbitTarget.y + Math.max(y, 1),
      this.orbitTarget.z + z,
    )
    this.camera.lookAt(this.orbitTarget)
  }

  private _syncOrbitFromPosition() {
    const pos = this.camera.getPosition()
    const dx = pos.x - this.orbitTarget.x
    const dy = pos.y - this.orbitTarget.y
    const dz = pos.z - this.orbitTarget.z
    this.orbitRadius = Math.sqrt(dx * dx + dy * dy + dz * dz)
    this.orbitPhi = Math.asin(Math.max(-1, Math.min(1, dy / this.orbitRadius)))
    this.orbitTheta = Math.atan2(dx, dz)
  }

  private _updateFirstPerson(dt: number) {
    const DEG2RAD = Math.PI / 180
    const cosPitch = Math.cos(this.fpPitch * DEG2RAD)
    const sinPitch = Math.sin(this.fpPitch * DEG2RAD)
    const cosYaw = Math.cos(this.fpYaw * DEG2RAD)
    const sinYaw = Math.sin(this.fpYaw * DEG2RAD)

    // Forward direction (horizontal)
    const dirX = cosPitch * cosYaw
    const dirZ = cosPitch * sinYaw

    // Right direction
    const rightX = -sinYaw
    const rightZ = cosYaw

    // Movement
    let moveX = 0
    let moveZ = 0
    if (this.keys['KeyW'] || this.keys['ArrowUp']) { moveX += dirX; moveZ += dirZ }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) { moveX -= dirX; moveZ -= dirZ }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) { moveX -= rightX; moveZ -= rightZ }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) { moveX += rightX; moveZ += rightZ }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
    if (len > 0) {
      const speed = this.fpSpeed * dt / len
      this.fpPos.x += moveX * speed
      this.fpPos.z += moveZ * speed
    }

    // Clamp to deck bounds
    this.fpPos.x = Math.max(-4.5, Math.min(4.5, this.fpPos.x))
    this.fpPos.z = Math.max(-21, Math.min(21, this.fpPos.z))
    this.fpPos.y = 4.7

    this.camera.setPosition(this.fpPos)

    // Look direction
    const lookX = this.fpPos.x + cosPitch * cosYaw
    const lookY = this.fpPos.y + sinPitch
    const lookZ = this.fpPos.z + cosPitch * sinYaw
    this.camera.lookAt(new this.pc.Vec3(lookX, lookY, lookZ))

    // Check station proximity
    this._checkStationProximity()

    // Update region for narration
    const z = this.fpPos.z
    const newRegion = z > 10 ? 'fore' : z < -10 ? 'aft' : 'mid'
    if (newRegion !== this.firstPersonRegion) {
      this.firstPersonRegion = newRegion
      this._emitState()
    }
  }

  private _checkStationProximity() {
    let nearest = -1
    let minDist = Infinity
    for (let i = 0; i < STATION_POSITIONS.length; i++) {
      const [sx, sz] = STATION_POSITIONS[i]
      const dx = this.fpPos.x - sx
      const dz = this.fpPos.z - sz
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    }
    const newNearby = minDist < 3.5 ? nearest : -1
    if (newNearby !== this.nearbyStationIndex) {
      this.nearbyStationIndex = newNearby
      this._emitState()
    }
  }

  // ─── Event Handlers ───────────────────────────────────

  private _handleMouseDown(e: MouseEvent) {
    this.isDragging = true
    this.dragButton = e.button
    this.lastMouse = { x: e.clientX, y: e.clientY }
  }

  private _handleMouseUp() {
    this.isDragging = false
  }

  private _handleMouseMove(e: MouseEvent) {
    // First person pointer lock look
    if (this.activeView === 'fp' && this.pointerLocked) {
      this.fpYaw += e.movementX * 0.15
      this.fpPitch = Math.max(-60, Math.min(60, this.fpPitch - e.movementY * 0.15))
      return
    }

    if (!this.isDragging || this.transitioning) return

    const dx = e.clientX - this.lastMouse.x
    const dy = e.clientY - this.lastMouse.y
    this.lastMouse = { x: e.clientX, y: e.clientY }

    if (this.activeView === 'orbit') {
      if (this.dragButton === 2) {
        // Right-drag: pan
        const panSpeed = 0.08
        this.orbitTarget.x -= dx * panSpeed
        this.orbitTarget.z += dy * panSpeed
      } else {
        // Left-drag: rotate
        this.orbitTheta -= dx * 0.008
        this.orbitPhi = Math.max(0.087, Math.min(1.3, this.orbitPhi + dy * 0.008)) // min ~5°
      }
      this._computeOrbitPosition()
    }

    // Pan for locked views
    if (['overhead', 'side', 'fore', 'aft'].includes(this.activeView)) {
      const panSpeed = 0.08
      const pos = this.camera.getPosition()
      if (this.activeView === 'overhead') {
        pos.x += dx * panSpeed
        pos.z -= dy * panSpeed
      } else {
        // For side/fore/aft, pan along the view plane
        const right = this.camera.right.clone().mulScalar(-dx * panSpeed)
        const up = this.camera.up.clone().mulScalar(dy * panSpeed)
        pos.add(right).add(up)
      }
      this.camera.setPosition(pos)
      // Keep looking at original target direction
      if (this.activeView === 'overhead') {
        this.camera.lookAt(new this.pc.Vec3(pos.x, 0, pos.z))
      }
    }

    // FP fallback drag-look (no pointer lock)
    if (this.activeView === 'fp' && !this.pointerLocked && this.fpInstructionsDismissed) {
      this.fpYaw += dx * 0.3
      this.fpPitch = Math.max(-60, Math.min(60, this.fpPitch - dy * 0.3))
    }
  }

  private _handleWheel(e: WheelEvent) {
    e.preventDefault()
    if (this.transitioning || this.activeView === 'fp') return

    if (this.activeView === 'orbit') {
      this.orbitRadius = Math.max(20, Math.min(90, this.orbitRadius + e.deltaY * 0.04))
      this._computeOrbitPosition()
    } else if (['overhead', 'side', 'fore', 'aft', 'station'].includes(this.activeView)) {
      // Zoom along view direction
      const forward = this.camera.forward.clone().mulScalar(-e.deltaY * 0.05)
      const pos = this.camera.getPosition()
      pos.add(forward)
      this.camera.setPosition(pos)
    }
  }

  private _handleClick(e: MouseEvent) {
    // In FP mode, clicking near a station marker inspects it
    if (this.activeView === 'fp' && this.nearbyStationIndex >= 0) {
      // Don't switch to station view — show station card as overlay
      this.activeStationIndex = this.nearbyStationIndex
      this._emitState()
      return
    }

    // Station marker click detection via screen-space proximity
    if (this.activeView !== 'fp' && this.camera.camera) {
      const rect = this.canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      const canvasW = this.canvas.clientWidth
      const canvasH = this.canvas.clientHeight

      let closestIdx = -1
      let closestDist = 25 // pixel threshold

      for (let i = 0; i < STATION_POSITIONS.length; i++) {
        const [sx, sz] = STATION_POSITIONS[i]
        const worldPos = new this.pc.Vec3(sx, 3.2, sz)
        const screenPos = new this.pc.Vec3()
        this.camera.camera.worldToScreen(worldPos, screenPos)

        // worldToScreen returns in canvas pixel coordinates
        const px = screenPos.x
        const py = screenPos.y

        // Check if marker is in front of camera (z > 0)
        if (screenPos.z > 0) {
          const dist = Math.sqrt((px - clickX) ** 2 + (py - clickY) ** 2)
          if (dist < closestDist) {
            closestDist = dist
            closestIdx = i
          }
        }
      }

      if (closestIdx >= 0) {
        this.setStation(closestIdx)
      }
    }
  }

  private _handleKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true

    // Don't process number keys when typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    if (this.activeView !== 'fp') {
      if (e.code === 'Digit1') this.setView('orbit')
      if (e.code === 'Digit2') this.setView('overhead')
      if (e.code === 'Digit3') this.setView('side')
      if (e.code === 'Digit4') this.setView('fore')
      if (e.code === 'Digit5') this.setView('aft')
      if (e.code === 'Digit6') this.setView('fp')
      if (e.code === 'Digit7') this.cycleStation(1)
    }

    if (e.code === 'Escape') {
      if (this.activeView === 'fp') {
        this.exitFirstPerson()
      } else if (this.activeView === 'station') {
        this._closeStationCard()
        const target = this.prevView === 'station' ? 'orbit' : this.prevView
        this.setView(target)
      }
    }
  }

  private _handleKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false
  }

  private _handlePointerLockChange() {
    this.pointerLocked = document.pointerLockElement === this.canvas
  }

  private _handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.isDragging = true
      this.dragButton = 0
      this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      this.touchDist = Math.sqrt(dx * dx + dy * dy)
    }
  }

  private _handleTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1 && this.isDragging) {
      const fakeEvent = {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        movementX: e.touches[0].clientX - this.lastMouse.x,
        movementY: e.touches[0].clientY - this.lastMouse.y,
      } as MouseEvent
      this._handleMouseMove(fakeEvent)
      this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    if (e.touches.length === 2 && this.activeView !== 'fp') {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const newDist = Math.sqrt(dx * dx + dy * dy)
      const delta = -(newDist - this.touchDist) * 2 // Simulate wheel delta
      this._handleWheel({ deltaY: delta, preventDefault: () => {} } as WheelEvent)
      this.touchDist = newDist
    }
  }

  // ─── State Emission ───────────────────────────────────

  private _emitState() {
    this.onStateChange({
      activeView: this.activeView,
      activeStationIndex: this.activeStationIndex,
      nearbyStationIndex: this.nearbyStationIndex,
      firstPersonRegion: this.firstPersonRegion,
      fpActive: this.activeView === 'fp',
      fpInstructionsDismissed: this.fpInstructionsDismissed,
    })
  }
}
