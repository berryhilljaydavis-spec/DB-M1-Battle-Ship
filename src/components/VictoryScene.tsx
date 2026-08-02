import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { drawSinkingScene } from '../ocean/sinking'
import { VictoryCannons } from './VictoryCannons'

const MAX_PIXEL_RATIO = 2

export interface VictorySceneProps {
  onPlayAgain: () => void
  onMenu: () => void
  onShowBoards: () => void
}

/** Full-screen cutscene: the enemy flagship burning and going under. */
export function VictoryScene({
  onPlayAgain,
  onMenu,
  onShowBoards,
}: VictorySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [shaking, setShaking] = useState(false)
  const reduceMotionRef = useRef(false)

  const shakeTimer = useRef<number | null>(null)
  const handleShot = useCallback((strength: number) => {
    if (reduceMotionRef.current) return
    setShaking(true)
    if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current)
    shakeTimer.current = window.setTimeout(
      () => setShaking(false),
      360 + strength * 160,
    )
  }, [])

  useEffect(() => {
    return () => {
      if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current)
    }
  }, [])

  useEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    reduceMotionRef.current = reduceMotion
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let size = { width: 0, height: 0 }
    let frame = 0
    let start = 0

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
      size = { width: window.innerWidth, height: window.innerHeight }
      canvas.width = Math.floor(size.width * ratio)
      canvas.height = Math.floor(size.height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      if (reduceMotion) drawSinkingScene(ctx, size, 6)
    }

    const render = (now: number) => {
      if (!start) start = now
      drawSinkingScene(ctx, size, (now - start) / 1000)
      frame = window.requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    if (!reduceMotion) frame = window.requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resize)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section
      className={`cutscene${shaking ? ' cutscene--shaking' : ''}`}
      aria-label="Victory"
    >
      <canvas ref={canvasRef} className="cutscene__canvas" aria-hidden="true" />
      <VictoryCannons onShot={handleShot} />
      <div className="cutscene__embers" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            style={{ '--ember-index': index } as CSSProperties}
          />
        ))}
      </div>

      <div className="cutscene__panel cutscene__panel--entrance">
        <p className="cutscene__kicker cutscene__winner">Your fleet wins</p>
        <h2 className="cutscene__title">Victory</h2>
        <p className="cutscene__text" role="status">
          The enemy fleet is destroyed.
        </p>

        <div className="cutscene__actions">
          <button type="button" className="menu__play" onClick={onPlayAgain}>
            New game
          </button>
          <button
            type="button"
            className="status__button status__button--ghost"
            onClick={onShowBoards}
          >
            Review boards
          </button>
          <button
            type="button"
            className="status__button status__button--ghost"
            onClick={onMenu}
          >
            Main menu
          </button>
        </div>
      </div>
    </section>
  )
}
