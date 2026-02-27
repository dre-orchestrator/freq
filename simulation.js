/* ============================================================
   FREQ AI — Barge Drafting Simulation
   State machine: IDLE → RUNNING → PAUSED → COMPLETE / ALERT
   ============================================================ */

'use strict';

// ── State constants ──────────────────────────────────────────
const SIM_STATES = {
  IDLE:     'idle',
  RUNNING:  'running',
  PAUSED:   'paused',
  COMPLETE: 'complete',
  ALERT:    'alert'
};

// ── Simulation state ─────────────────────────────────────────
let state        = SIM_STATES.IDLE;
let currentPhase = 0;      // 0-based index
let currentStep  = 0;      // left panel manual step (0-based)
let speed        = 2;      // default 2×
let phaseTimer   = null;
let tickTimer    = null;
let phaseElapsed = 0;      // ms elapsed in current phase
let totalElapsed = 0;      // total ms elapsed
let mobActive    = false;
let savedState   = null;   // state before MOB alert
let view         = 'schematic'; // 'schematic' or 'telemetry'

// ── Phase data ───────────────────────────────────────────────
const PHASES = [
  {
    id: 1, name: 'Initial Survey', baseDuration: 20000,
    desc: 'Vessel identified. Baseline survey initiated. Environmental parameters acquired.',
    draftBase: 3.2, cargoMass: 0, progress: 0
  },
  {
    id: 2, name: 'Pre-Load Assessment', baseDuration: 15000,
    desc: 'Empty vessel assessment complete. Baseline confirmed. Loading authorization: GRANTED.',
    draftBase: 3.2, cargoMass: 0, progress: 0
  },
  {
    id: 3, name: 'Active Loading', baseDuration: 60000,
    desc: 'Cargo loading in progress. Continuous monitoring active. All parameters nominal.',
    draftBase: 3.2, draftTarget: 9.84, cargoMass: 1482.6, progress: 100
  },
  {
    id: 4, name: 'Cargo Verification', baseDuration: 20000,
    desc: 'Cargo verification in progress. Distribution analysis running. Trim within tolerance.',
    draftBase: 9.84, cargoMass: 1482.6, progress: 100
  },
  {
    id: 5, name: 'Post-Load Assessment', baseDuration: 20000,
    desc: 'Final draft readings acquired. Stability analysis complete. All metrics nominal.',
    draftBase: 9.84, cargoMass: 1482.6, progress: 100
  },
  {
    id: 6, name: 'Final Survey & Report', baseDuration: 15000,
    desc: 'Draft survey complete. Report generated. Operation verified and logged.',
    draftBase: 9.84, cargoMass: 1482.6, progress: 100
  }
];

// ── Left panel manual steps ──────────────────────────────────
const MANUAL_STEPS = [
  {
    num: 1, title: 'Crew Deployment',
    body: 'A crew member is dispatched to the barge deck. Active crane and loading equipment present in the operational zone. No automated monitoring.',
    noteClass: 'note-red', note: 'Man-overboard risk: ACTIVE'
  },
  {
    num: 2, title: 'Fore Draft Reading',
    body: 'Crew member visually reads the painted draft mark at the bow. Reading estimated to nearest half-inch by eye. Value radioed to shore operator.',
    noteClass: 'note-amber', note: 'Visual estimate accuracy: ±0.5 inch'
  },
  {
    num: 3, title: 'Midship Reading',
    body: 'Crew walks to midship position. Second reading taken and radioed. Each transit across the active deck is an additional exposure event.',
    noteClass: 'note-amber', note: '2nd radio relay — compounding error risk'
  },
  {
    num: 4, title: 'Aft Draft Reading',
    body: 'Crew walks to stern for final reading. Three readings now radioed to shore and recorded manually on paper.',
    noteClass: 'note-amber', note: 'Paper log — no digital audit trail'
  },
  {
    num: 5, title: 'Shore Calculation',
    body: 'Shore operator manually calculates displacement using hydrostatic tables. Arithmetic errors possible. Process requires 45–90 minutes for calculation and verification.',
    noteClass: 'note-amber', note: 'No real-time feedback during loading operations'
  },
  {
    num: 6, title: 'Unmonitored Loading',
    body: 'Loading commences based on pre-calculated targets. No real-time draft monitoring during active loading. Crew returns periodically to re-check draft marks by eye.',
    noteClass: 'note-red', note: 'UNMONITORED INTERVAL — drift undetected'
  },
  {
    num: 7, title: 'Post-Load Repeat',
    body: 'After loading completes, the entire measurement process repeats for the final draft survey. Total elapsed time: 3–4 hours. Report compiled and submitted on paper.',
    noteClass: 'note-red', note: 'TOTAL: ~4 HOURS  |  ERROR RATE: 1–3%  |  MOB RISK: THROUGHOUT'
  }
];

// ── Station offsets from base draft ─────────────────────────
const STATION_OFFSETS = {
  FP: 0.00, FS: -0.04,
  MP: 0.09, MS:  0.07,
  AP: 0.21, AS:  0.19
};

// ── Telemetry base variances ─────────────────────────────────
let telemVariance = {
  FP: 0, FS: 0, MP: 0, MS: 0, AP: 0, AS: 0
};

// ── DOM references ───────────────────────────────────────────
let dom = {};

function initDOM() {
  dom = {
    btnStart:    document.getElementById('sim-btn-start'),
    btnPause:    document.getElementById('sim-btn-pause'),
    btnReset:    document.getElementById('sim-btn-reset'),
    statusDot:   document.getElementById('sim-status-dot'),
    statusText:  document.getElementById('sim-status-text'),
    stepContent: document.getElementById('sim-step-content'),
    stepCounter: document.getElementById('sim-step-counter'),
    btnPrev:     document.getElementById('sim-nav-prev'),
    btnNext:     document.getElementById('sim-nav-next'),
    schematic:   document.getElementById('sim-schematic-view'),
    telemetry:   document.getElementById('sim-telemetry-view'),
    phaseDots:   document.querySelectorAll('.phase-dot-circle'),
    phaseLines:  document.querySelectorAll('.phase-dot-line'),
    phaseLabel:  document.getElementById('sim-phase-label'),
    alertBanner: document.getElementById('sim-alert-banner'),
    completion:  document.getElementById('sim-completion'),
    mobBtn:      document.getElementById('sim-mob-btn'),
    mobReset:    document.getElementById('sim-mob-reset'),
    telemMob:    document.getElementById('telem-mob-row'),
  };
}

// ── Schematic SVG elements ───────────────────────────────────
const STATION_SVG_IDS = ['FP', 'FS', 'MP', 'MS', 'AP', 'AS'];

function getSVGElements() {
  return {
    waterline:   document.getElementById('wl-line'),
    wlLabel:     document.getElementById('wl-label'),
    cargoFill:   document.getElementById('cargo-fill'),
    stations: Object.fromEntries(
      STATION_SVG_IDS.map(id => [id, {
        cross:   document.getElementById('cross-' + id),
        callout: document.getElementById('callout-' + id),
        reading: document.getElementById('reading-' + id),
      }])
    )
  };
}

// ── Compute draft value for a station given phase progress ───
function getDraft(station, phase, progress) {
  const base   = phase.draftBase || 3.2;
  const target = phase.draftTarget || base;
  const cur    = base + (target - base) * progress;
  return cur + STATION_OFFSETS[station] + (telemVariance[station] || 0);
}

// ── Get phase progress [0–1] ─────────────────────────────────
function getPhaseProgress() {
  const phase = PHASES[currentPhase];
  if (!phase) return 0;
  const dur = phase.baseDuration / speed;
  return Math.min(1, phaseElapsed / dur);
}

// ── Update schematic SVG waterline ──────────────────────────
function updateSchematic() {
  const svg   = getSVGElements();
  if (!svg.waterline) return;
  const phase = PHASES[currentPhase];
  if (!phase) return;
  const prog  = getPhaseProgress();
  const draft = getDraft('MP', phase, prog);

  // SVG viewBox is 0 0 600 200. Hull from y=20 to y=180.
  // Full load (9.84 ft) → waterline at y≈30; empty (3.2 ft) → waterline at y≈140.
  const minY = 32, maxY = 138;
  const maxDraft = 9.84, minDraft = 3.2;
  const wy = maxY - ((draft - minDraft) / (maxDraft - minDraft)) * (maxY - minY);

  svg.waterline.setAttribute('y1', wy);
  svg.waterline.setAttribute('y2', wy);

  if (svg.wlLabel) {
    svg.wlLabel.setAttribute('y', wy - 4);
    svg.wlLabel.textContent = `WL: ${draft.toFixed(2)} ft AVG`;
  }

  // Cargo fill height
  if (svg.cargoFill) {
    const fillH = Math.max(0, 168 - wy - 12);
    const fillY = wy + 12;
    svg.cargoFill.setAttribute('y', fillY);
    svg.cargoFill.setAttribute('height', fillH);
  }

  // Station callouts — show them progressively by phase
  const showCount = Math.min(6, Math.floor(prog * 6) + (currentPhase > 0 ? 6 : 0));
  STATION_SVG_IDS.forEach((id, idx) => {
    const s = svg.stations[id];
    if (!s) return;
    const shouldShow = (currentPhase > 0) || idx < Math.ceil(prog * 6);
    if (s.cross)   s.cross.style.opacity   = shouldShow ? '1' : '0.2';
    if (s.callout) s.callout.style.display  = shouldShow ? 'block' : 'none';
    if (s.reading) {
      const d = getDraft(id, phase, prog).toFixed(2);
      s.reading.textContent = `${id} │ ${d} ft │ NOM`;
    }
  });
}

// ── Update telemetry panel ───────────────────────────────────
function updateTelemetry() {
  const phase = PHASES[currentPhase];
  if (!phase) return;
  const prog = getPhaseProgress();

  STATION_SVG_IDS.forEach(id => {
    const el = document.getElementById('telem-' + id);
    if (el) el.textContent = getDraft(id, phase, prog).toFixed(2) + ' ft';
  });

  // Cargo mass and progress
  const massBase  = currentPhase >= 2 ? phase.cargoMass || 0 : 0;
  const massCur   = currentPhase === 2 ? massBase * prog : massBase;
  const loadProg  = currentPhase === 2 ? (prog * 100).toFixed(1) : (currentPhase < 2 ? '0.0' : '100.0');

  const elMass    = document.getElementById('telem-cargo-mass');
  const elProg    = document.getElementById('telem-load-prog');
  const elDisp    = document.getElementById('telem-displacement');
  const elEta     = document.getElementById('telem-eta');
  const elPhase   = document.getElementById('telem-phase');
  const elTime    = document.getElementById('telem-time');

  if (elMass) elMass.textContent = massCur.toFixed(1) + ' T';
  if (elProg) elProg.textContent = loadProg + '%';
  if (elDisp) elDisp.textContent = (1000 + massCur).toFixed(1) + ' T';
  if (elPhase) elPhase.textContent = (currentPhase + 1) + ' OF 6';
  if (elTime) {
    const s = Math.floor(totalElapsed / 1000);
    elTime = null; // handled below
  }

  const elTimeEl = document.getElementById('telem-time');
  if (elTimeEl) {
    const s = Math.floor(totalElapsed / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    elTimeEl.textContent = mm + ':' + ss + ' UTC';
  }

  // ETA countdown during phase 3
  if (elEta && currentPhase === 2) {
    const remaining = Math.max(0, (PHASES[2].baseDuration / speed) - phaseElapsed);
    const rs = Math.floor(remaining / 1000);
    const mm = String(Math.floor(rs / 60)).padStart(2, '0');
    const ss = String(rs % 60).padStart(2, '0');
    elEta.textContent = '00:' + mm + ':' + ss;
  } else if (elEta) {
    elEta.textContent = currentPhase < 2 ? '--:--:--' : '00:00:00';
  }

  // Trim
  const draftFP = getDraft('FP', phase, prog);
  const draftAP = getDraft('AP', phase, prog);
  const trim = Math.abs(draftAP - draftFP);
  const elTrim = document.getElementById('telem-trim');
  if (elTrim) elTrim.textContent = trim.toFixed(2) + ' ft';

  // Freeboard
  const deckHeight = 12.0; // ft
  const avgDraft = getDraft('MP', phase, prog);
  const freeboard = Math.max(0, deckHeight - avgDraft);
  const elFree = document.getElementById('telem-freeboard');
  if (elFree) elFree.textContent = freeboard.toFixed(2) + ' ft';

  // GM
  const gm = 4.82 - (avgDraft - 3.2) * 0.12;
  const elGM = document.getElementById('telem-gm');
  if (elGM) elGM.textContent = gm.toFixed(2) + ' ft';

  // Heel
  const draftMP = getDraft('MP', phase, prog);
  const draftMS = getDraft('MS', phase, prog);
  const heel = Math.abs(draftMP - draftMS) * 2.1;
  const elHeel = document.getElementById('telem-heel');
  if (elHeel) elHeel.textContent = heel.toFixed(2) + '°';
}

// ── Tick variance (telemetry jitter) ─────────────────────────
function tickVariance() {
  STATION_SVG_IDS.forEach(id => {
    telemVariance[id] = (Math.random() - 0.5) * 0.04;
  });
  updateSchematic();
  updateTelemetry();
}

// ── Render left panel step ───────────────────────────────────
function renderStep() {
  const step = MANUAL_STEPS[currentStep];
  if (!step || !dom.stepContent) return;

  dom.stepContent.innerHTML = `
    <div class="sim-step-number">STEP ${step.num} OF 7</div>
    <div class="sim-step-title">${step.title}</div>
    <div class="sim-step-body">${step.body}</div>
    <div class="sim-step-svg">${getStepSVG(currentStep)}</div>
    <span class="sim-step-note ${step.noteClass}">${step.noteClass === 'note-red' ? '⚠' : '⚠'} ${step.note}</span>
  `;

  if (dom.stepCounter) dom.stepCounter.textContent = `STEP ${step.num} OF 7`;
  if (dom.btnPrev) dom.btnPrev.disabled = currentStep === 0;
  if (dom.btnNext) dom.btnNext.disabled = currentStep === MANUAL_STEPS.length - 1;
}

// ── Step SVGs (inline, simplified engineering line drawings) ──
function getStepSVG(idx) {
  const svgs = [
    // Step 1: Crew Deployment — barge profile with human at fore
    `<svg viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="20" y="45" width="240" height="30" fill="none" stroke="#F1F5F9" stroke-width="1.5"/>
      <line x1="20" y1="30" x2="260" y2="30" stroke="#06B6D4" stroke-width="1" stroke-dasharray="4,3"/>
      <text x="265" y="33" font-family="JetBrains Mono" font-size="7" fill="#06B6D4">WL</text>
      <!-- human figure fore -->
      <circle cx="45" cy="40" r="5" fill="none" stroke="#EF4444" stroke-width="1.5"/>
      <line x1="45" y1="45" x2="45" y2="58" stroke="#EF4444" stroke-width="1.5"/>
      <line x1="45" y1="50" x2="38" y2="55" stroke="#EF4444" stroke-width="1.5"/>
      <line x1="45" y1="50" x2="52" y2="55" stroke="#EF4444" stroke-width="1.5"/>
      <line x1="45" y1="58" x2="39" y2="68" stroke="#EF4444" stroke-width="1.5"/>
      <line x1="45" y1="58" x2="51" y2="68" stroke="#EF4444" stroke-width="1.5"/>
      <text x="30" y="25" font-family="JetBrains Mono" font-size="7" fill="#64748B">FORE</text>
      <text x="120" y="25" font-family="JetBrains Mono" font-size="7" fill="#64748B">MID</text>
      <text x="225" y="25" font-family="JetBrains Mono" font-size="7" fill="#64748B">AFT</text>
      <text x="55" y="37" font-family="JetBrains Mono" font-size="6" fill="#EF4444">CREW DEPLOYED</text>
    </svg>`,
    // Step 2: Fore reading — zoom on fore gauge marks
    `<svg viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="20" y="30" width="60" height="50" fill="none" stroke="#F1F5F9" stroke-width="1.5"/>
      <line x1="20" y1="50" x2="80" y2="50" stroke="#06B6D4" stroke-width="1" stroke-dasharray="3,2"/>
      ${[0,1,2,3,4].map(i => `<line x1="25" y1="${35+i*9}" x2="${i%2===0?'35':'30'}" y2="${35+i*9}" stroke="#94A3B8" stroke-width="1"/><text x="38" y="${38+i*9}" font-family="JetBrains Mono" font-size="6" fill="#64748B">${(8-i).toString().padStart(2,' ')}ft</text>`).join('')}
      <line x1="70" y1="50" x2="90" y2="50" stroke="#F59E0B" stroke-width="1" stroke-dasharray="2,2"/>
      <circle cx="90" cy="50" r="3" fill="#F59E0B"/>
      <text x="95" y="46" font-family="JetBrains Mono" font-size="6" fill="#F59E0B">VISUAL READ</text>
      <text x="95" y="55" font-family="JetBrains Mono" font-size="6" fill="#F59E0B">~7.5 ft</text>
      <text x="90" y="25" font-family="JetBrains Mono" font-size="7" fill="#64748B">RADIO →</text>
      <line x1="130" y1="25" x2="180" y2="25" stroke="#64748B" stroke-width="1" stroke-dasharray="3,2"/>
      <text x="185" y="29" font-family="JetBrains Mono" font-size="7" fill="#64748B">SHORE</text>
    </svg>`,
    // Step 3: Midship — figure walking
    `<svg viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="20" y="45" width="240" height="30" fill="none" stroke="#F1F5F9" stroke-width="1.5"/>
      <line x1="20" y1="32" x2="260" y2="32" stroke="#06B6D4" stroke-width="1" stroke-dasharray="4,3"/>
      <!-- walking arrow -->
      <line x1="40" y1="42" x2="130" y2="42" stroke="#F59E0B" stroke-width="1" stroke-dasharray="3,2"/>
      <polygon points="130,38 140,42 130,46" fill="#F59E0B"/>
      <!-- figure at mid -->
      <circle cx="140" cy="36" r="5" fill="none" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="140" y1="41" x2="140" y2="54" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="140" y1="46" x2="133" y2="51" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="140" y1="46" x2="147" y2="51" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="140" y1="54" x2="134" y2="64" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="140" y1="54" x2="146" y2="64" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="148" y="30" font-family="JetBrains Mono" font-size="6" fill="#F59E0B">MIDSHIP READ</text>
      <text x="22" y="28" font-family="JetBrains Mono" font-size="7" fill="#64748B">FORE ✓</text>
      <text x="120" y="28" font-family="JetBrains Mono" font-size="7" fill="#F59E0B">MID →</text>
      <text x="225" y="28" font-family="JetBrains Mono" font-size="7" fill="#64748B">AFT</text>
    </svg>`,
    // Step 4: Aft reading
    `<svg viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="20" y="45" width="240" height="30" fill="none" stroke="#F1F5F9" stroke-width="1.5"/>
      <line x1="20" y1="32" x2="260" y2="32" stroke="#06B6D4" stroke-width="1" stroke-dasharray="4,3"/>
      <!-- walking arrow -->
      <line x1="140" y1="42" x2="225" y2="42" stroke="#F59E0B" stroke-width="1" stroke-dasharray="3,2"/>
      <polygon points="225,38 235,42 225,46" fill="#F59E0B"/>
      <!-- figure at aft -->
      <circle cx="238" cy="36" r="5" fill="none" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="238" y1="41" x2="238" y2="54" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="238" y1="46" x2="231" y2="51" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="238" y1="46" x2="245" y2="51" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="238" y1="54" x2="232" y2="64" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="238" y1="54" x2="244" y2="64" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="22" y="28" font-family="JetBrains Mono" font-size="7" fill="#64748B">FORE ✓</text>
      <text x="120" y="28" font-family="JetBrains Mono" font-size="7" fill="#64748B">MID ✓</text>
      <text x="218" y="28" font-family="JetBrains Mono" font-size="7" fill="#F59E0B">AFT →</text>
    </svg>`,
    // Step 5: Shore calc — paper form
    `<svg viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="60" y="10" width="80" height="70" fill="none" stroke="#94A3B8" stroke-width="1"/>
      <text x="65" y="22" font-family="JetBrains Mono" font-size="6" fill="#94A3B8">DRAFT SURVEY</text>
      <line x1="65" y1="25" x2="135" y2="25" stroke="#1E293B" stroke-width="1"/>
      ${[0,1,2,3,4].map(i => `<line x1="65" y1="${32+i*9}" x2="135" y2="${32+i*9}" stroke="#1E293B" stroke-width="0.75"/>`).join('')}
      <text x="65" y="31" font-family="JetBrains Mono" font-size="5.5" fill="#64748B">FORE  7.42 ft</text>
      <text x="65" y="40" font-family="JetBrains Mono" font-size="5.5" fill="#64748B">MID   7.51 ft</text>
      <text x="65" y="49" font-family="JetBrains Mono" font-size="5.5" fill="#64748B">AFT   7.63 ft</text>
      <text x="65" y="65" font-family="JetBrains Mono" font-size="5.5" fill="#F59E0B">CALC: 45-90 MIN</text>
      <text x="155" y="40" font-family="JetBrains Mono" font-size="7" fill="#F59E0B">MANUAL</text>
      <text x="155" y="50" font-family="JetBrains Mono" font-size="7" fill="#F59E0B">TABLES</text>
      <line x1="145" y1="40" x2="153" y2="40" stroke="#F59E0B" stroke-width="1"/>
    </svg>`,
    // Step 6: Unmonitored loading
    `<svg viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="20" y="50" width="200" height="25" fill="none" stroke="#F1F5F9" stroke-width="1.5"/>
      <line x1="20" y1="40" x2="220" y2="40" stroke="#06B6D4" stroke-width="1" stroke-dasharray="4,3"/>
      <!-- cargo blocks dropping in -->
      <rect x="80" y="10" width="20" height="15" fill="none" stroke="#94A3B8" stroke-width="1"/>
      <rect x="110" y="10" width="20" height="15" fill="none" stroke="#94A3B8" stroke-width="1"/>
      <line x1="90" y1="25" x2="90" y2="38" stroke="#64748B" stroke-width="1" stroke-dasharray="2,2"/>
      <line x1="120" y1="25" x2="120" y2="38" stroke="#64748B" stroke-width="1" stroke-dasharray="2,2"/>
      <!-- no monitoring indicator -->
      <text x="230" y="30" font-family="JetBrains Mono" font-size="6" fill="#EF4444">NO</text>
      <text x="228" y="39" font-family="JetBrains Mono" font-size="6" fill="#EF4444">MONITOR</text>
      <line x1="227" y1="25" x2="248" y2="43" stroke="#EF4444" stroke-width="1"/>
      <line x1="248" y1="25" x2="227" y2="43" stroke="#EF4444" stroke-width="1"/>
    </svg>`,
    // Step 7: Full 4-hour timeline
    `<svg viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <line x1="20" y1="45" x2="260" y2="45" stroke="#94A3B8" stroke-width="1.5"/>
      <polygon points="255,41 265,45 255,49" fill="#94A3B8"/>
      ${[0,1,2,3,4].map(i => `<line x1="${20+i*60}" y1="40" x2="${20+i*60}" y2="50" stroke="#94A3B8" stroke-width="1"/><text x="${14+i*60}" y="60" font-family="JetBrains Mono" font-size="6.5" fill="#64748B">${i}h</text>`).join('')}
      <rect x="20" y="30" width="220" height="10" fill="rgba(239,68,68,0.15)" stroke="#EF4444" stroke-width="1"/>
      <text x="90" y="39" font-family="JetBrains Mono" font-size="6" fill="#EF4444">MANUAL PROCESS — 4 HOURS</text>
      <rect x="20" y="68" width="220" height="8" fill="rgba(124,58,237,0.15)" stroke="#7C3AED" stroke-width="1"/>
      <text x="80" y="75" font-family="JetBrains Mono" font-size="6" fill="#7C3AED">FREQ AI — 14 MINUTES</text>
      <rect x="20" y="68" width="12" height="8" fill="rgba(124,58,237,0.4)"/>
    </svg>`
  ];
  return svgs[idx] || svgs[0];
}

// ── Phase dot update ─────────────────────────────────────────
function updatePhaseDots() {
  const dots  = document.querySelectorAll('.phase-dot-circle');
  const lines = document.querySelectorAll('.phase-dot-line');
  dots.forEach((dot, i) => {
    dot.classList.remove('active', 'complete');
    if (i < currentPhase) dot.classList.add('complete');
    if (i === currentPhase && state === SIM_STATES.RUNNING) dot.classList.add('active');
  });
  lines.forEach((line, i) => {
    line.classList.remove('complete');
    if (i < currentPhase) line.classList.add('complete');
  });
  const phLabel = document.getElementById('sim-phase-label');
  if (phLabel && PHASES[currentPhase]) {
    phLabel.textContent = `Phase ${currentPhase + 1}: ${PHASES[currentPhase].name} — ${PHASES[currentPhase].desc}`;
  }
}

// ── Step auto-sync with phase ────────────────────────────────
function syncStepToPhase() {
  // Map phases 0-5 to steps 0-6
  const mapping = [0, 1, 2, 3, 4, 5, 6];
  currentStep = mapping[currentPhase] || 0;
  renderStep();
}

// ── Status display ───────────────────────────────────────────
function setStatus(text, alert) {
  if (dom.statusText) dom.statusText.textContent = text;
  if (dom.statusDot) {
    dom.statusDot.className = 'sim-status-dot' + (alert ? ' alert' : '');
  }
}

// ── Start simulation ─────────────────────────────────────────
function startSim() {
  if (state === SIM_STATES.RUNNING) return;
  state = SIM_STATES.RUNNING;

  dom.btnStart.style.display = 'none';
  dom.btnPause.style.display = 'inline-flex';
  dom.btnReset.classList.add('active');

  setStatus('RUNNING — PHASE ' + (currentPhase + 1) + ' OF 6', false);
  runPhase();
}

// ── Run current phase ─────────────────────────────────────────
function runPhase() {
  clearInterval(phaseTimer);
  clearInterval(tickTimer);
  if (currentPhase >= PHASES.length) {
    completeSimulation();
    return;
  }

  const phase    = PHASES[currentPhase];
  const dur      = phase.baseDuration / speed;
  const interval = 100; // ms per tick

  syncStepToPhase();
  updatePhaseDots();
  setStatus('RUNNING — PHASE ' + (currentPhase + 1) + ' OF 6', false);

  tickTimer = setInterval(() => {
    if (state !== SIM_STATES.RUNNING) return;
    phaseElapsed += interval;
    totalElapsed += interval;
    tickVariance();
  }, interval);

  phaseTimer = setTimeout(() => {
    if (state !== SIM_STATES.RUNNING) return;
    phaseElapsed = 0;
    currentPhase++;
    if (currentPhase >= PHASES.length) {
      completeSimulation();
    } else {
      runPhase();
    }
  }, dur);
}

// ── Pause ─────────────────────────────────────────────────────
function pauseSim() {
  if (state !== SIM_STATES.RUNNING) return;
  state = SIM_STATES.PAUSED;
  clearInterval(phaseTimer);
  clearInterval(tickTimer);
  dom.btnPause.textContent = '▶ RESUME';
  dom.btnPause.style.borderColor = 'var(--green)';
  dom.btnPause.style.color = 'var(--green)';
  setStatus('PAUSED — PHASE ' + (currentPhase + 1) + ' OF 6', false);
}

// ── Resume ────────────────────────────────────────────────────
function resumeSim() {
  if (state !== SIM_STATES.PAUSED) return;
  state = SIM_STATES.RUNNING;
  dom.btnPause.textContent = '⏸ PAUSE';
  dom.btnPause.style.borderColor = 'var(--amber)';
  dom.btnPause.style.color = 'var(--amber)';
  setStatus('RUNNING — PHASE ' + (currentPhase + 1) + ' OF 6', false);

  const phase    = PHASES[currentPhase];
  const dur      = (phase.baseDuration / speed) - phaseElapsed;
  const interval = 100;

  tickTimer = setInterval(() => {
    if (state !== SIM_STATES.RUNNING) return;
    phaseElapsed += interval;
    totalElapsed += interval;
    tickVariance();
  }, interval);

  phaseTimer = setTimeout(() => {
    if (state !== SIM_STATES.RUNNING) return;
    phaseElapsed = 0;
    currentPhase++;
    if (currentPhase >= PHASES.length) {
      completeSimulation();
    } else {
      runPhase();
    }
  }, Math.max(0, dur));
}

// ── Reset ─────────────────────────────────────────────────────
function resetSim() {
  state        = SIM_STATES.IDLE;
  currentPhase = 0;
  currentStep  = 0;
  phaseElapsed = 0;
  totalElapsed = 0;
  mobActive    = false;

  clearInterval(phaseTimer);
  clearInterval(tickTimer);

  dom.btnStart.style.display  = 'inline-flex';
  dom.btnPause.style.display  = 'none';
  dom.btnPause.textContent    = '⏸ PAUSE';
  dom.btnPause.style.borderColor = 'var(--amber)';
  dom.btnPause.style.color       = 'var(--amber)';
  dom.btnReset.classList.remove('active');

  if (dom.alertBanner) { dom.alertBanner.classList.remove('visible'); dom.alertBanner.textContent = ''; }
  if (dom.completion)  dom.completion.classList.remove('visible');
  if (dom.mobReset)    dom.mobReset.style.display = 'none';
  if (dom.telemMob)    dom.telemMob.classList.remove('visible');

  // Reset SVG
  const wlLine = document.getElementById('wl-line');
  if (wlLine) { wlLine.setAttribute('y1', 138); wlLine.setAttribute('y2', 138); }
  const wlLabel = document.getElementById('wl-label');
  if (wlLabel) { wlLabel.setAttribute('y', 134); wlLabel.textContent = 'WL: 3.20 ft AVG'; }
  const cargoFill = document.getElementById('cargo-fill');
  if (cargoFill) { cargoFill.setAttribute('height', '0'); }
  const mobCircle = document.getElementById('mob-circle');
  if (mobCircle) mobCircle.style.display = 'none';

  STATION_SVG_IDS.forEach(id => {
    const s = getSVGElements().stations[id];
    if (!s) return;
    if (s.cross)   s.cross.style.opacity = '0.2';
    if (s.callout) s.callout.style.display = 'none';
  });

  telemVariance = { FP: 0, FS: 0, MP: 0, MS: 0, AP: 0, AS: 0 };
  updatePhaseDots();
  renderStep();
  setStatus('SYSTEM READY', false);
  updateSchematic();
  updateTelemetry();
}

// ── Complete ──────────────────────────────────────────────────
function completeSimulation() {
  state = SIM_STATES.COMPLETE;
  clearInterval(phaseTimer);
  clearInterval(tickTimer);

  currentPhase = PHASES.length - 1;
  updatePhaseDots();

  dom.btnStart.style.display = 'none';
  dom.btnPause.style.display = 'none';
  dom.btnReset.classList.add('active');

  setStatus('SURVEY COMPLETE', false);

  // Show phase dots as all complete
  document.querySelectorAll('.phase-dot-circle').forEach(d => d.classList.add('complete'));
  document.querySelectorAll('.phase-dot-line').forEach(l => l.classList.add('complete'));

  // Show completion panel
  if (dom.completion) {
    const ss = Math.floor(totalElapsed / 1000);
    const mm = Math.floor(ss / 60);
    const sec = ss % 60;
    document.getElementById('comp-time').textContent   = `${mm} min ${sec} sec`;
    document.getElementById('comp-cargo').textContent  = '1,482.6 T';
    document.getElementById('comp-draft').textContent  = '9.84 ft';
    document.getElementById('comp-trim').textContent   = '0.08 ft';
    document.getElementById('comp-heel').textContent   = '0.01°';
    document.getElementById('comp-acc').textContent    = '± 0.02 ft';
    document.getElementById('comp-crew').textContent   = 'ZERO';
    document.getElementById('comp-report').textContent = 'GENERATED AND LOGGED';
    dom.completion.classList.add('visible');
  }

  const phLabel = document.getElementById('sim-phase-label');
  if (phLabel) phLabel.textContent = 'Survey complete. All 6 phases verified and logged.';
}

// ── MOB safety event ──────────────────────────────────────────
function triggerMOB() {
  if (mobActive) return;
  mobActive = true;
  savedState = state;

  if (state === SIM_STATES.RUNNING) {
    state = SIM_STATES.ALERT;
    clearInterval(phaseTimer);
    clearInterval(tickTimer);
  }

  if (dom.alertBanner) {
    dom.alertBanner.textContent = 'EMERGENCY STOP — MAN OVERBOARD DETECTED — ALL OPERATIONS HALTED';
    dom.alertBanner.classList.add('visible');
  }
  setStatus('SAFETY ALERT — E-STOP ACTIVE', true);

  // Show MOB circle on schematic
  const mobCircle = document.getElementById('mob-circle');
  if (mobCircle) mobCircle.style.display = 'block';

  // Show MOB telemetry row
  if (dom.telemMob) dom.telemMob.classList.add('visible');

  // After 5s show reset button
  setTimeout(() => {
    if (dom.mobReset) dom.mobReset.style.display = 'inline-flex';
  }, 5000);
}

function resetMOBEvent() {
  mobActive = false;
  if (dom.alertBanner) dom.alertBanner.classList.remove('visible');
  if (dom.mobReset) dom.mobReset.style.display = 'none';
  if (dom.telemMob) dom.telemMob.classList.remove('visible');
  const mobCircle = document.getElementById('mob-circle');
  if (mobCircle) mobCircle.style.display = 'none';

  state = SIM_STATES.PAUSED;
  dom.btnPause.style.display = 'inline-flex';
  dom.btnPause.textContent = '▶ RESUME';
  dom.btnPause.style.borderColor = 'var(--green)';
  dom.btnPause.style.color = 'var(--green)';
  setStatus('PAUSED — SAFETY EVENT CLEARED', false);
}

// ── Speed control ─────────────────────────────────────────────
function setSpeed(s) {
  speed = s;
  document.querySelectorAll('.sim-speed-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.speed) === s);
  });
  // If running, restart phase with new speed
  if (state === SIM_STATES.RUNNING) {
    clearTimeout(phaseTimer);
    clearInterval(tickTimer);
    runPhase();
  }
}

// ── View toggle ───────────────────────────────────────────────
function setView(v) {
  view = v;
  const sch = document.getElementById('sim-schematic-view');
  const tel = document.getElementById('sim-telemetry-view');
  document.querySelectorAll('.sim-view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === v);
  });
  if (sch && tel) {
    sch.style.display = v === 'schematic' ? 'block' : 'none';
    tel.style.display = v === 'telemetry' ? 'block' : 'none';
    tel.classList.toggle('visible', v === 'telemetry');
  }
}

// ── Accordion (glossary) ──────────────────────────────────────
function initAccordion() {
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      item.classList.toggle('open');
    });
  });
}

// ── Nav hamburger ─────────────────────────────────────────────
function initNav() {
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('nav-mobile');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }
}

// ── Contact form ──────────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const FORMSPREE_ID = '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl  = document.getElementById('form-message');
    const btn    = form.querySelector('[type=submit]');
    const data   = new FormData(form);

    if (!FORMSPREE_ID) {
      // Fallback to mailto
      const to   = 'info@freqai.io';
      const sub  = encodeURIComponent('Inquiry from FREQ AI website');
      const body = encodeURIComponent(
        `Name: ${data.get('name')}\nCompany: ${data.get('company') || 'N/A'}\n\nMessage:\n${data.get('message')}`
      );
      window.location.href = `mailto:${to}?subject=${sub}&body=${body}`;
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        msgEl.className = 'form-message success';
        msgEl.textContent = "Message sent. We'll be in touch shortly.";
        form.reset();
      } else {
        throw new Error();
      }
    } catch {
      msgEl.className = 'form-message error';
      msgEl.innerHTML = 'Please email us directly at <a href="mailto:info@freqai.io">info@freqai.io</a>';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Message';
    }
  });
}

// ── Wire up simulation controls ───────────────────────────────
function initSimulation() {
  initDOM();
  if (!dom.btnStart) return; // not on platform page

  dom.btnStart.addEventListener('click', startSim);

  dom.btnPause.addEventListener('click', () => {
    if (state === SIM_STATES.RUNNING) pauseSim();
    else if (state === SIM_STATES.PAUSED) resumeSim();
  });

  dom.btnReset.addEventListener('click', () => {
    if (dom.btnReset.classList.contains('active')) resetSim();
  });

  document.querySelectorAll('.sim-speed-btn').forEach(btn => {
    btn.addEventListener('click', () => setSpeed(parseInt(btn.dataset.speed)));
  });

  document.querySelectorAll('.sim-view-btn').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  if (dom.btnPrev) dom.btnPrev.addEventListener('click', () => {
    if (currentStep > 0) { currentStep--; renderStep(); }
  });

  if (dom.btnNext) dom.btnNext.addEventListener('click', () => {
    if (currentStep < MANUAL_STEPS.length - 1) { currentStep++; renderStep(); }
  });

  if (dom.mobBtn) dom.mobBtn.addEventListener('click', triggerMOB);
  if (dom.mobReset) dom.mobReset.addEventListener('click', resetMOBEvent);

  // Initial render
  renderStep();
  updatePhaseDots();
  setStatus('SYSTEM READY', false);
  updateSchematic();
  updateTelemetry();
  setView('schematic');
  setSpeed(2);
}

// ── Bootstrap ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initAccordion();
  initSimulation();
  initContactForm();
});
