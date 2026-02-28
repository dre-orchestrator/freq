'use client'

import type { CameraViewId } from '@/components/cameraController'
import { STATION_IDS } from '@/components/cameraController'

interface CameraToolbarProps {
  activeView: string
  activeStationIndex: number
  onViewChange: (view: string) => void
  onCycleStation: () => void
  onResetCamera: () => void
}

const VIEW_BUTTONS: { id: string; label: string; shortcut: string; icon: React.ReactNode }[] = [
  {
    id: 'orbit',
    label: 'ORBIT',
    shortcut: 'Key 1',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'overhead',
    label: 'OVERHEAD',
    shortcut: 'Key 2',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <line x1="7" y1="0" x2="7" y2="4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'side',
    label: 'SIDE VIEW',
    shortcut: 'Key 3',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="5" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'fore',
    label: 'FORE',
    shortcut: 'Key 4',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <polygon points="7,1 13,13 1,13" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  {
    id: 'aft',
    label: 'AFT',
    shortcut: 'Key 5',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <polygon points="7,13 1,1 13,1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  {
    id: 'fp',
    label: 'FIRST PERSON',
    shortcut: 'Key 6',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 13c0-3 2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  {
    id: 'station',
    label: 'STATION',
    shortcut: 'Key 7',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="1" fill="currentColor" />
        <line x1="7" y1="1" x2="7" y2="3" stroke="currentColor" strokeWidth="1.5" />
        <line x1="7" y1="11" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
]

const VIEW_LABELS: Record<string, string> = {
  orbit: 'ORBIT VIEW',
  overhead: 'OVERHEAD VIEW',
  side: 'SIDE VIEW',
  fore: 'FORE VIEW',
  aft: 'AFT VIEW',
  fp: 'FIRST PERSON',
  station: 'STATION VIEW',
}

export default function CameraToolbar({
  activeView,
  activeStationIndex,
  onViewChange,
  onCycleStation,
  onResetCamera,
}: CameraToolbarProps) {
  const activeLabel = activeView === 'station' && activeStationIndex >= 0
    ? `STATION: ${STATION_IDS[activeStationIndex]}`
    : VIEW_LABELS[activeView] || activeView.toUpperCase()

  return (
    <div className="camera-toolbar">
      <span className="camera-toolbar-label">CAMERA</span>

      {VIEW_BUTTONS.map((btn) => {
        const isActive = activeView === btn.id
        const isFP = btn.id === 'fp'
        const isStation = btn.id === 'station'

        return (
          <button
            key={btn.id}
            className={`cam-btn${isActive ? ' active' : ''}${isFP ? ' cam-btn-fp' : ''}`}
            onClick={() => isStation ? onCycleStation() : onViewChange(btn.id)}
            title={`${btn.label} (${btn.shortcut})`}
          >
            {btn.icon}
            {btn.label}
          </button>
        )
      })}

      <button
        className="cam-btn cam-btn-reset"
        onClick={onResetCamera}
        title="Reset to default view"
      >
        &#8634; RESET CAM
      </button>

      <span className="active-cam-label" id="activeCameraLabel">
        Active: {activeLabel}
      </span>
    </div>
  )
}
