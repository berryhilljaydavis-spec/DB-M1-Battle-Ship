import { useEffect, useRef, useState } from 'react'
import {
  VICTORY_VOLLEY_OFFSETS,
  soundPlayer,
} from '../sound/player'

const VOLLEY_INTERVAL = 5600

interface Shot {
  id: number
  index: number
}

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
    <div className="cannons" aria-hidden="true">
      <div className="cannons__grading" />
      <div className="cannons__turret cannons__turret--left cannons__turret--upper">
        <span className="cannons__barrel" />
        <span className="cannons__housing" />
      </div>
      <div className="cannons__turret cannons__turret--left cannons__turret--lower">
        <span className="cannons__barrel" />
        <span className="cannons__housing" />
      </div>
      <div className="cannons__turret cannons__turret--right cannons__turret--upper">
        <span className="cannons__barrel" />
        <span className="cannons__housing" />
      </div>
      <div className="cannons__turret cannons__turret--right cannons__turret--lower">
        <span className="cannons__barrel" />
        <span className="cannons__housing" />
      </div>
      {shot && (
        <div
          key={shot.id}
          className={`cannons__shot cannons__shot--${shot.index % 2 ? 'right' : 'left'}`}
        >
          <span className="cannons__tracer" />
          <span className="cannons__flash" />
          <span className="cannons__smoke" />
          <span className="cannons__burst" />
        </div>
      )}
    </div>
  )
}
