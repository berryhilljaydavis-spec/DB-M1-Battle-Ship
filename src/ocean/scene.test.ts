import { describe, expect, it, vi } from 'vitest'
import { drawOcean, waveHeight } from './scene'

function stubContext() {
  const gradient = { addColorStop: vi.fn() }
  return {
    calls: { fill: 0, stroke: 0, fillRect: 0 },
    clearRect: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  }
}

describe('waveHeight', () => {
  it('is deterministic for the same inputs', () => {
    expect(waveHeight(120, 0.5, 3)).toBe(waveHeight(120, 0.5, 3))
  })

  it('stays flat at the horizon and swells in the foreground', () => {
    const far = Math.max(
      ...Array.from({ length: 60 }, (_, i) => Math.abs(waveHeight(i * 12, 0, 2))),
    )
    const near = Math.max(
      ...Array.from({ length: 60 }, (_, i) => Math.abs(waveHeight(i * 12, 1, 2))),
    )
    expect(far).toBeLessThan(1)
    expect(near).toBeGreaterThan(far * 5)
  })

  it('animates over time', () => {
    expect(waveHeight(80, 0.6, 0)).not.toBe(waveHeight(80, 0.6, 1.3))
  })
})

describe('drawOcean', () => {
  it('paints sky, water and vessels without touching the DOM', () => {
    const ctx = stubContext()
    drawOcean(ctx as unknown as CanvasRenderingContext2D, {
      width: 800,
      height: 600,
    }, 4.2)

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    expect(ctx.createLinearGradient).toHaveBeenCalled()
    expect(ctx.fill.mock.calls.length).toBeGreaterThan(50)
    expect(ctx.stroke).toHaveBeenCalled()
  })

  it('produces different geometry as time advances', () => {
    const first = stubContext()
    const second = stubContext()
    const size = { width: 800, height: 600 }
    drawOcean(first as unknown as CanvasRenderingContext2D, size, 0)
    drawOcean(second as unknown as CanvasRenderingContext2D, size, 2.5)

    expect(second.lineTo.mock.calls).not.toEqual(first.lineTo.mock.calls)
  })
})
