import { useEffect, useRef, useState } from 'react'
import {
  VICTORY_VOLLEY_OFFSETS,
  soundPlayer,
} from '../sound/player'

const VOLLEY_INTERVAL = 13000

interface Shot {
  id: number
  index: number
}

type TurretSide = 'left' | 'right'

export interface VictoryCannonsProps {
  onShot?: (strength: number) => void
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function NavalTurret({
  side,
  position,
  firing,
  shotId,
}: {
  side: TurretSide
  position: 'upper' | 'lower'
  firing: boolean
  shotId: number
}) {
  return (
    <svg
      className={`cannons__turret cannons__turret--${side} cannons__turret--${position}`}
      viewBox="0 0 220 150"
      role="presentation"
    >
      <defs>
        <linearGradient id={`turret-metal-${side}-${position}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#aeb9bc" />
          <stop offset="0.28" stopColor="#5e6b70" />
          <stop offset="0.62" stopColor="#27343c" />
          <stop offset="1" stopColor="#111a22" />
        </linearGradient>
        <linearGradient id={`turret-deck-${side}-${position}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#68777a" />
          <stop offset="0.45" stopColor="#27353b" />
          <stop offset="1" stopColor="#0d151c" />
        </linearGradient>
        <linearGradient id={`turret-barrel-${side}-${position}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b8c4c3" />
          <stop offset="0.35" stopColor="#5a686d" />
          <stop offset="0.7" stopColor="#202d35" />
          <stop offset="1" stopColor="#0b1219" />
        </linearGradient>
        <filter id={`turret-glow-${side}-${position}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <g className="cannons__deck">
        <ellipse cx="111" cy="132" rx="94" ry="13" fill="#0b141b" opacity="0.9" />
        <path d="M20 128 31 105h157l13 23Z" fill={`url(#turret-deck-${side}-${position})`} stroke="#9eaaab" strokeOpacity="0.5" strokeWidth="2" />
        <path d="M34 107h151M45 118h132" stroke="#a9b4b2" strokeOpacity="0.25" strokeWidth="2" />
        <path d="M56 106v20M78 106v20M101 106v20M125 106v20M148 106v20" stroke="#080f15" strokeOpacity="0.7" strokeWidth="2" />
      </g>

      <g
        key={firing ? shotId : 0}
        className={`cannons__gun-group${firing ? ' cannons__gun-group--firing' : ''}`}
      >
        <path
          d="M47 105 61 70l31-25h43l43 25 14 35-19 13H65Z"
          fill={`url(#turret-metal-${side}-${position})`}
          stroke="#bac4c2"
          strokeOpacity="0.55"
          strokeWidth="2"
        />
        <path d="m61 70 25 10h80l12-10M75 57l14 20h76l13-20" fill="none" stroke="#d4dcda" strokeOpacity="0.25" strokeWidth="2" />
        <path d="m58 91 32-10m-23 23 28-17m80 4 13 8m-27-6 25 17" fill="none" stroke="#101a21" strokeOpacity="0.8" strokeWidth="3" />
        <path d="M79 69 75 47h24l12 20M136 67l12-20h24l-4 22" fill="#1a252c" stroke="#9aa8a8" strokeOpacity="0.4" strokeWidth="2" />

        <g className="cannons__barrel-pair">
          <path d="M89 54 214 48l1 13-126 9Z" fill={`url(#turret-barrel-${side}-${position})`} stroke="#c1ccca" strokeOpacity="0.55" strokeWidth="2" />
          <path d="M90 77 214 70l1 13-126 8Z" fill={`url(#turret-barrel-${side}-${position})`} stroke="#c1ccca" strokeOpacity="0.55" strokeWidth="2" />
          <path d="m100 56 1 13m-1 9 1 13" stroke="#0a1218" strokeOpacity="0.55" strokeWidth="3" />
          <ellipse cx="214" cy="54.5" rx="7" ry="7" fill="#111a21" stroke="#b5c1bf" strokeOpacity="0.65" strokeWidth="2" />
          <ellipse cx="214" cy="76.5" rx="7" ry="7" fill="#111a21" stroke="#b5c1bf" strokeOpacity="0.65" strokeWidth="2" />
          <ellipse cx="214" cy="54.5" rx="3" ry="4" fill="#02070b" />
          <ellipse cx="214" cy="76.5" rx="3" ry="4" fill="#02070b" />
        </g>

        <path d="M83 54c-8 2-10 14 0 17l8 2 2-19Z M83 77c-8 2-10 14 0 17l8 2 2-19Z" fill="#111b22" stroke="#c0c9c5" strokeOpacity="0.45" strokeWidth="2" />
        <path d="M55 83h17m-20 9h18m113-10h12m-14 10h16" stroke="#d8dfd9" strokeOpacity="0.3" strokeWidth="2" />
        <g fill="#d7dfd8" opacity="0.7">
          <circle cx="61" cy="101" r="2" /><circle cx="73" cy="97" r="2" />
          <circle cx="171" cy="97" r="2" /><circle cx="183" cy="101" r="2" />
          <circle cx="84" cy="54" r="2" /><circle cx="84" cy="91" r="2" />
          <circle cx="142" cy="55" r="2" /><circle cx="142" cy="84" r="2" />
        </g>

        <g className="cannons__muzzle">
          <circle cx="218" cy="54.5" r="16" fill="#fff4a3" opacity="0.8" filter={`url(#turret-glow-${side}-${position})`} />
          <path d="m218 33 5 14 13-9-8 13 15 4-15 4 8 14-13-9-5 15-5-15-13 9 8-14-15-4 15-4-8-13 13 9Z" fill="#fff8c4" stroke="#ff9f35" strokeWidth="2" />
          <circle cx="218" cy="54.5" r="8" fill="#fffbe0" />
        </g>
        <g className="cannons__muzzle cannons__muzzle--lower">
          <circle cx="218" cy="76.5" r="16" fill="#fff4a3" opacity="0.8" filter={`url(#turret-glow-${side}-${position})`} />
          <path d="m218 55 5 14 13-9-8 13 15 4-15 4 8 14-13-9-5 15-5-15-13 9 8-14-15-4 15-4-8-13 13 9Z" fill="#fff8c4" stroke="#ff9f35" strokeWidth="2" />
          <circle cx="218" cy="76.5" r="8" fill="#fffbe0" />
        </g>
        <g className="cannons__smoke-cloud">
          <circle cx="204" cy="48" r="13" />
          <circle cx="214" cy="59" r="15" />
          <circle cx="201" cy="69" r="12" />
          <circle cx="214" cy="81" r="14" />
        </g>
      </g>
    </svg>
  )
}

export function VictoryCannons({ onShot }: VictoryCannonsProps) {
  const [shot, setShot] = useState<Shot | null>(null)
  const shotId = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const timers: ReturnType<typeof setTimeout>[] = []
    let volley = 0
    const fire = (index: number) => {
      const strength = Math.max(0.42, 1 - volley * 0.16)
      shotId.current += 1
      setShot({ id: shotId.current, index })
      onShot?.(strength)
    }
    const schedule = () => {
      timers.splice(0).forEach(clearTimeout)
      const currentVolley = volley
      VICTORY_VOLLEY_OFFSETS.forEach((offset, index) => {
        timers.push(
          setTimeout(() => {
            volley = currentVolley
            fire(index)
          }, offset * 1000),
        )
      })
    }

    schedule()
    const interval = setInterval(() => {
      volley += 1
      soundPlayer.playVictoryVolley(Math.max(0.42, 0.8 - volley * 0.12))
      schedule()
    }, VOLLEY_INTERVAL)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(interval)
    }
  }, [onShot])

  return (
    <div
      className={`cannons${
        shot
          ? ` cannons--firing-${shot.index % 2 ? 'right' : 'left'}`
          : ''
      }`}
      aria-hidden="true"
    >
      <div className="cannons__grading" />
      <NavalTurret
        side="left"
        position="upper"
        firing={shot !== null && shot.index % 2 === 0}
        shotId={shot?.id ?? 0}
      />
      <NavalTurret
        side="left"
        position="lower"
        firing={shot !== null && shot.index % 2 === 0}
        shotId={shot?.id ?? 0}
      />
      <NavalTurret
        side="right"
        position="upper"
        firing={shot !== null && shot.index % 2 === 1}
        shotId={shot?.id ?? 0}
      />
      <NavalTurret
        side="right"
        position="lower"
        firing={shot !== null && shot.index % 2 === 1}
        shotId={shot?.id ?? 0}
      />
      {shot && (
        <div
          key={shot.id}
          className={`cannons__shot cannons__shot--${shot.index % 2 ? 'right' : 'left'}`}
        >
          <span className="cannons__tracer" />
          <span className="cannons__burst" />
        </div>
      )}
    </div>
  )
}
