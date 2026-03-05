# CLAUDE.md — Project Handoff for Claude Code

## Project Overview

**FREQ AI v4.0** is an autonomous barge drafting system that reduces traditional 4-hour manual drafting
operations to 15 minutes using RGB-D computer vision and automated crane control. The system uses a
"Lattice Core" agent-based architecture to orchestrate a pipeline from sensor input through validation,
vector computation, and G-Code generation for crane operations.

The repository contains **three distinct applications**:

| Application | Location | Stack | Purpose |
|---|---|---|---|
| Marketing Website | `/` (root) | Next.js 15 + TypeScript + Tailwind v4 | Public-facing product site |
| Operational Dashboard | `frontend/` | React 18 + Vite + CesiumJS | Real-time 3D barge visualization |
| Python Backend | `src/` | Python 3.11 + Flask (scaffold) | Lattice Core pipeline engine |

---

## Repository Structure

```
freq/
├── app/                              # Next.js 15 marketing site (App Router)
│   ├── about/page.tsx                    # Company about page
│   ├── contact/page.tsx                  # Contact form page
│   ├── platform/page.tsx                 # Platform overview page
│   ├── solutions/barge-drafting/         # Product solution page
│   ├── team/page.tsx                     # Team page
│   ├── layout.tsx                        # Root layout (Nav + Footer)
│   ├── page.tsx                          # Homepage (hero, stats, solutions, CTA)
│   └── globals.css                       # Global CSS (custom properties, blueprint-grid)
├── components/                       # Next.js shared components
│   ├── Nav.tsx                           # Top navigation bar
│   ├── Footer.tsx                        # Site footer
│   ├── Simulation.tsx                    # Interactive 6-phase drafting simulation (~59KB)
│   └── SimulationWrapper.tsx             # Client-side dynamic import wrapper for Simulation
├── public/                           # Static assets
│   ├── favicon.svg
│   └── og-image.svg
├── src/                              # Python backend
│   ├── agents/                       # Specialized processing agents
│   │   ├── validator_agent.py            # Data quality + safety validation
│   │   ├── vector_computer_agent.py      # Crane movement vector computation
│   │   └── gcode_translator_agent.py     # Vector-to-G-Code translation
│   ├── core/                         # Core processing modules
│   │   ├── lattice_core.py               # Central orchestration system
│   │   ├── point_cloud_processor.py      # RGB-D → 3D point cloud conversion
│   │   └── gcode_generator.py            # ISO 6983 G-Code generation
│   └── interface/                    # API and communication layer
│       ├── api.py                        # REST API (FreqAPI class, full pipeline)
│       └── websocket_handler.py          # Real-time WebSocket updates (scaffold)
├── frontend/                         # React + CesiumJS operational dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx             # Control panel with metrics and logs
│   │   │   └── CesiumViewer.jsx          # 3D point cloud visualization
│   │   ├── services/
│   │   │   └── FreqAPIService.js         # Axios-based backend communication
│   │   ├── main.jsx                      # React entry point
│   │   └── App.jsx                       # Main React application
│   ├── vite.config.js                    # Vite config (port 3000, API/WS proxy)
│   ├── nginx.conf                        # Nginx for production container
│   ├── Dockerfile                        # Multi-stage: node:18-alpine → nginx:alpine
│   └── package.json                      # React 18, CesiumJS, Recharts, socket.io-client
├── tests/                            # pytest test suite (25 tests, ~58% coverage)
│   ├── test_lattice_core.py
│   ├── test_validator_agent.py
│   ├── test_vector_computer_agent.py
│   └── test_gcode_translator_agent.py
├── docs/                             # Extended documentation
│   ├── LATTICE_CORE_ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── QUICKSTART.md
├── main.py                           # Python application entry point
├── pyproject.toml                    # Python project config (pytest, black, flake8, mypy)
├── requirements.txt                  # Python dependencies
├── package.json                      # Root package.json (Next.js 15 website)
├── tsconfig.json                     # TypeScript config (Next.js)
├── next.config.ts                    # Next.js config (output: standalone)
├── postcss.config.mjs                # PostCSS for Tailwind v4
├── Dockerfile                        # Backend container (python:3.11-slim, port 5000)
├── docker-compose.yml                # Orchestrates backend + frontend services
├── .env.example                      # All configurable environment variables
└── .github/workflows/ci-cd.yml      # CI/CD: lint + test + docker build + deploy
```

---

## Build, Test, and Lint Commands

### Next.js Marketing Website (root)

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

### Operational Dashboard (React + Vite)

```bash
cd frontend
npm install
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build → dist/
npm run lint     # ESLint
```

### Python Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run all tests with coverage
pytest

# Run a specific test file
pytest tests/test_lattice_core.py

# Format code
black src/ tests/

# Lint code
flake8 src/ tests/ --max-line-length=100

# Type checking
mypy src/

# Run the application
python main.py
```

### Docker (Backend + Operational Dashboard)

```bash
docker-compose up -d        # Start backend (port 5000) + frontend (port 80)
docker-compose logs -f      # Stream logs
docker-compose down         # Stop services
```

---

## Architecture: Lattice Core Pipeline

The Python backend processes data through a sequential agent pipeline:

```
RGB-D Camera → Point Cloud Processor → Validator Agent → Vector Computer Agent → G-Code Translator Agent → Crane
```

Each component's responsibility:

- **Lattice Core** (`src/core/lattice_core.py`): Central orchestrator — agent registration, system
  state management (`{status, cycles_completed, timestamps}`), and cycle coordination
- **Point Cloud Processor** (`src/core/point_cloud_processor.py`): Converts RGB-D frames into 3D
  point clouds; extracts barge geometry (`draft`, `trim`, `heel`, `dimensions`)
- **Validator Agent** (`src/agents/validator_agent.py`): Enforces min point counts (1000),
  confidence threshold (0.85), draft limits (0–15m), trim/heel angle constraints (±10°)
- **Vector Computer Agent** (`src/agents/vector_computer_agent.py`): Computes crane movement
  vectors (home → approach → draft → safe), applies 0.2m safety margins, calculates compensation
  offsets for trim/heel
- **G-Code Translator Agent** (`src/agents/gcode_translator_agent.py`): Produces ISO
  6983-compliant G-Code with header comments, G21/G90/G94 initialization, scaled movement commands
  (m → mm), and M2 end-of-program footer
- **G-Code Generator** (`src/core/gcode_generator.py`): Lower-level G-Code builder used by the
  translator; validates required commands (G21, G90, M2)
- **REST API** (`src/interface/api.py`): `FreqAPI` class that runs the complete 8-step pipeline
  and exposes `process_drafting_cycle()`, `get_system_state()`, `health_check()`
- **WebSocket Handler** (`src/interface/websocket_handler.py`): Scaffold for real-time push of
  point cloud updates, state changes, alerts, and cycle progress (0–100%)

Agents communicate through the Lattice Core's shared JSON state — they never talk directly to hardware.

### Full API Cycle (8 Steps in `api.py`)

1. Process RGB-D → `point_cloud`
2. Validate `point_cloud`
3. Extract geometry (draft, trim, heel, dimensions)
4. Validate geometry
5. Compute movement vectors
6. Optimize path + apply safety margins
7. Translate vectors → G-Code
8. Validate G-Code safety constraints, update core state

Returns: `{success, cycle_id, geometry, gcode, timestamp}` or `{success: false, error, timestamp}`

---

## Next.js Marketing Website

The root-level Next.js 15 app is the public product website (freqai.io). Key details:

- **Router**: App Router (Next.js 13+), pages in `app/`
- **Styling**: Tailwind v4 + custom CSS variables in `globals.css` (dark blue/teal color scheme,
  `blueprint-grid` background, `btn-primary`/`btn-outline`/`card` utility classes)
- **TypeScript**: Strict mode, `@types/react` 19
- **Output**: `standalone` (suitable for containerized deployment)
- **Company info**: Slidell, LA; info@freqai.io; founded 2024

### Key Pages

| Route | File | Content |
|---|---|---|
| `/` | `app/page.tsx` | Hero, problem stats, solutions grid, how-it-works steps, market data, CTA |
| `/platform` | `app/platform/page.tsx` | Technical platform overview |
| `/solutions/barge-drafting` | `app/solutions/barge-drafting/page.tsx` | Solution detail |
| `/about` | `app/about/page.tsx` | Company overview |
| `/team` | `app/team/page.tsx` | Team profiles |
| `/contact` | `app/contact/page.tsx` | Contact form |

### Simulation Component

`components/Simulation.tsx` is the largest and most complex file (~59KB). It is a client-side
interactive simulation of the full 6-phase barge drafting process:

- **Phases**: Initial Survey → Pre-Load Assessment → Active Loading → Cargo Verification →
  Post-Load Assessment → Final Survey & Report
- **State machine**: `idle | running | paused | complete | alert`
- **Features**: Playback speed control, phase progress bars, real-time metric updates (draft, trim,
  heel, confidence), side-by-side comparison of manual vs. FREQ AI process steps
- **Rendering**: Canvas-based 3D barge visualization via inline script tags (loads CesiumJS or a
  custom WebGL canvas)
- Wrapped by `SimulationWrapper.tsx` using Next.js `dynamic()` import with `ssr: false`

---

## Operational Dashboard (`frontend/`)

Separate React 18 + Vite application for operators to monitor live system state:

- **`App.jsx`**: Polls `FreqAPIService.getSystemState()` every 5 seconds; renders header with
  connection status badge + cycle counter
- **`CesiumViewer.jsx`**: CesiumJS viewer centered on Philadelphia (−75.0°, 40.0°), pitch −0.5rad,
  displays barge position entity as a cyan point; all UI chrome disabled
- **`Dashboard.jsx`**: 4-metric grid (Draft/Trim/Heel/Cycle Time), "Start Drafting Cycle" button,
  3-agent status panel (Validator/Vector Computer/G-Code Translator), scrollable system log
- **`FreqAPIService.js`**: Axios client targeting `/api/v1`; `getSystemState()` falls back to mock
  data on error; `startDraftingCycle(rgbdData)` POSTs to `/cycle/start`

---

## Coding Conventions

### Python

- **Style**: PEP 8, formatted with Black (line length 100), linted with Flake8
- **Type checking**: mypy with `python_version = "3.9"`, `disallow_untyped_defs = false`
- **Test pattern**: pytest classes `TestXxx`, methods `test_xxx`, Arrange/Act/Assert
- **Imports**: stdlib → third-party → local, one blank line between groups
- **Python version**: 3.9+ syntax, 3.11 target for production

### TypeScript / Next.js

- **Framework conventions**: Next.js App Router, `'use client'` directive for interactive
  components, `export const metadata` for SEO
- **Styling**: Tailwind utility classes + inline `style` props for one-off values; no CSS modules
- **No ESLint config at root** — relies on `next lint` defaults

### JavaScript (Vite Dashboard)

- **Style**: React 18 JSX, Airbnb-style conventions
- **No TypeScript** in `frontend/` — plain `.jsx` / `.js`

### Commit Messages

Conventional Commits: `feat(scope): description`, `fix(scope): description`, `docs(scope): description`

### Branch Naming

`feature/description`, `fix/description`, `docs/description`

---

## Key Configuration

### Environment Variables (`.env.example`)

| Variable | Default | Description |
|---|---|---|
| `LOG_LEVEL` | `INFO` | Python logging level |
| `MAX_DEPTH` | `10.0` | Point cloud max depth (meters) |
| `MIN_DEPTH` | `0.1` | Point cloud min depth (meters) |
| `VOXEL_SIZE` | `0.01` | Downsampling voxel size (meters) |
| `MAX_DRAFT` | `15.0` | Safety limit for draft (meters) |
| `MIN_POINTS` | `1000` | Minimum point cloud density |
| `CONFIDENCE_THRESHOLD` | `0.85` | Minimum validation confidence |
| `STEP_SIZE` | `0.1` | Crane path step size (meters) |
| `SAFETY_MARGIN` | `0.2` | Vertical safety clearance (meters) |
| `SMOOTHING_FACTOR` | `0.5` | Path smoothing coefficient |
| `SAFE_HEIGHT` | `2.0` | G-Code safe travel height (meters) |
| `FEED_RATE` | `100.0` | G-Code feed rate (mm/min) |
| `CRANE_TYPE` | `generic` | Target crane hardware profile |
| `API_HOST` | `0.0.0.0` | Backend bind address |
| `API_PORT` | `5000` | Backend port |
| `VITE_API_URL` | `http://localhost:5000/api/v1` | Dashboard API base URL |
| `VITE_WS_URL` | `ws://localhost:5000/ws` | Dashboard WebSocket URL |
| `CESIUM_ION_TOKEN` | *(empty)* | Optional Cesium Ion token |

### pytest (`pyproject.toml`)

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=src --cov-report=term-missing"
```

### Black (`pyproject.toml`)

```toml
[tool.black]
line-length = 100
target-version = ['py39']
```

---

## CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

Four jobs run on pushes to `main` and `develop`:

1. **`backend-test`**: Python 3.11 — runs black/flake8 checks then pytest with coverage; uploads
   coverage to Codecov
2. **`frontend-test`**: Node.js 18 — `npm ci`, `npm run lint`, `npm run build` in `frontend/`
3. **`docker-build`**: Builds both `Dockerfile` (backend) and `frontend/Dockerfile`
4. **`deploy`**: Production deployment scaffold (currently a placeholder)

---

## Current Implementation Status

### Fully Implemented

- Lattice Core orchestration and agent registration
- All 3 agents (Validator, Vector Computer, G-Code Translator)
- Point cloud processor framework and geometry extraction
- G-Code generator (ISO 6983 compliant, validated output)
- REST API (`FreqAPI` class with complete 8-step pipeline)
- React operational dashboard (CesiumJS 3D visualization + metrics)
- Next.js marketing website (all pages, interactive simulation)
- Docker + docker-compose setup
- CI/CD pipeline
- 25 passing tests at ~58% coverage
- Comprehensive documentation in `docs/`

### Scaffold / Needs Integration

- WebSocket handler (interface defined, no server runtime wired up)
- Actual RGB-D sensor driver (currently accepts mock dict data)
- Physical crane communication (G-Code delivery to hardware)
- Open3D point cloud filtering (`filter_outliers`, `downsample`)
- Flask/FastAPI server runtime (API class exists but no HTTP server starts)
- ML-based confidence scoring (currently hardcoded to 0.95)
- Advanced path planning (B-spline, minimum-jerk, collision avoidance are stubs)
- Authentication and authorization
- Database persistence
- Human-detection watchdog (safety requirement, not yet implemented)

---

## Critical Safety Directives

1. **Vision-First**: Use RGB-D / optical sensors only — no LiDAR
2. **State-First**: Agents update shared JSON state; they never talk directly to hardware drivers
3. **Safety validation must occur before any crane G-Code execution** — the `ValidatorAgent` must
   pass before `VectorComputerAgent` runs, and G-Code safety constraints must be checked before
   delivery to crane hardware
4. **Watchdog**: Must stop crane if humans are detected via computer vision (not yet implemented —
   this is a hard requirement before any physical hardware integration)
5. **Safety margins**: Never remove the 0.2m vertical clearance applied in `VectorComputerAgent`
6. **Constraint limits**: draft 0–15m, trim ±10°, heel ±10° — changes to these require review
