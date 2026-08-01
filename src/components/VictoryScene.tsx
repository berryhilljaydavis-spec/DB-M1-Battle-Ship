import { useEffect, useRef } from 'react'
import { drawSinkingScene } from '../ocean/sinking'

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

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
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
    <section className="cutscene" aria-label="Victory">
      <canvas ref={canvasRef} className="cutscene__canvas" aria-hidden="true" />

      <div className="cutscene__panel">
        <p className="cutscene__kicker">Enemy flagship going down</p>
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
