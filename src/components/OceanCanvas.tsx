import { useEffect, useRef } from 'react'
import { drawOcean } from '../ocean/scene'

const MAX_PIXEL_RATIO = 2

/** Full-viewport animated ocean painted on a canvas behind the game. */
export function OceanCanvas() {
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
      if (reduceMotion) drawOcean(ctx, size, 0)
    }

    const render = (now: number) => {
      if (!start) start = now
      drawOcean(ctx, size, (now - start) / 1000)
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

  return <canvas ref={canvasRef} className="ocean-canvas" aria-hidden="true" />
}
