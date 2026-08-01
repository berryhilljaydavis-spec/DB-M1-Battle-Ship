/**
 * Canvas painter for the animated open-ocean backdrop: sky, sun, drifting
 * clouds, perspective swell bands with sun glitter, and distant warships.
 * Pure drawing code — no React, no DOM state — so it is easy to unit test.
 */

export interface SceneSize {
  width: number
  height: number
}

interface Vessel {
  /** Position along the horizon in [0, 1), wraps as it sails. */
  offset: number
  /** Screen-widths travelled per second. */
  speed: number
  /** Distance factor: 0 = far/small/hazy, 1 = closer/larger. */
  depth: number
  flipped: boolean
}

const HORIZON_RATIO = 0.46
const BAND_COUNT = 54
const VESSELS: readonly Vessel[] = [
  { offset: 0.08, speed: 0.006, depth: 0.85, flipped: false },
  { offset: 0.34, speed: 0.004, depth: 0.45, flipped: false },
  { offset: 0.62, speed: -0.005, depth: 0.65, flipped: true },
  { offset: 0.86, speed: -0.003, depth: 0.25, flipped: true },
]

/** Deterministic pseudo-random in [0, 1) so glitter does not flicker randomly. */
function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function rgb(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

/**
 * Vertical offset of the water surface at (x, band depth p) and time t.
 * `phase` de-syncs neighbouring bands so the swell never looks like
 * evenly spaced parallel lines.
 */
export function waveHeight(
  x: number,
  p: number,
  t: number,
  phase = 0,
): number {
  const amp = 0.6 + 24 * p * p
  const len = 70 + 620 * p
  const primary = Math.sin((x / len) * Math.PI * 2 + t * (0.35 + 1.1 * p) + phase)
  const secondary = Math.sin(
    (x / (len * 0.43)) * Math.PI * 2 - t * (0.8 + p) + phase * 1.7,
  )
  const chop = Math.sin((x / (len * 0.17)) * Math.PI * 2 + t * 2.1 + phase * 3.1)
  const swell = Math.sin((x / (len * 3.4)) * Math.PI * 2 - t * 0.22 + phase * 0.4)
  return (
    amp * (primary * 0.5 + secondary * 0.24 + chop * 0.1 * p + swell * 0.34)
  )
}

function drawSky(
  ctx: CanvasRenderingContext2D,
  { width, height }: SceneSize,
  horizon: number,
  t: number,
): void {
  const sky = ctx.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, '#071426')
  sky.addColorStop(0.4, '#123c66')
  sky.addColorStop(0.78, '#2f7196')
  sky.addColorStop(1, '#9dc4d2')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, horizon)

  const sunX = width * 0.72
  const sunY = horizon * 0.42
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, height * 0.4)
  glow.addColorStop(0, 'rgba(255, 236, 190, 0.85)')
  glow.addColorStop(0.12, 'rgba(255, 214, 150, 0.42)')
  glow.addColorStop(0.45, 'rgba(255, 196, 128, 0.12)')
  glow.addColorStop(1, 'rgba(255, 196, 128, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, horizon)

  ctx.save()
  ctx.globalAlpha = 0.5
  for (let i = 0; i < 7; i++) {
    const drift = ((t * (4 + i) + i * 640) % (width + 900)) - 450
    const cy = horizon * (0.12 + hash(i) * 0.55)
    const cw = 140 + hash(i + 9) * 260
    const ch = 14 + hash(i + 3) * 22
    const cloud = ctx.createRadialGradient(drift, cy, 0, drift, cy, cw)
    const tone = 210 + hash(i + 5) * 40
    cloud.addColorStop(0, `rgba(${tone}, ${tone}, ${tone}, 0.5)`)
    cloud.addColorStop(1, `rgba(${tone}, ${tone}, ${tone}, 0)`)
    ctx.fillStyle = cloud
    ctx.save()
    ctx.translate(drift, cy)
    ctx.scale(1, ch / cw)
    ctx.beginPath()
    ctx.arc(0, 0, cw, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()

  // Haze band so the horizon line is soft rather than a hard edge.
  const haze = ctx.createLinearGradient(0, horizon - height * 0.05, 0, horizon)
  haze.addColorStop(0, 'rgba(197, 219, 226, 0)')
  haze.addColorStop(1, 'rgba(197, 219, 226, 0.55)')
  ctx.fillStyle = haze
  ctx.fillRect(0, horizon - height * 0.05, width, height * 0.05)
}

function drawVessel(
  ctx: CanvasRenderingContext2D,
  x: number,
  waterline: number,
  scale: number,
  flipped: boolean,
  haze: number,
): void {
  ctx.save()
  ctx.translate(x, waterline)
  ctx.scale(flipped ? -scale : scale, scale)
  ctx.globalAlpha = mix(0.28, 0.92, 1 - haze)

  const hull = '#0d2033'
  const upper = '#16324a'

  // Wake trailing behind the stern.
  ctx.fillStyle = 'rgba(233, 245, 250, 0.5)'
  ctx.beginPath()
  ctx.moveTo(-46, 0)
  ctx.lineTo(-150, 3.5)
  ctx.lineTo(-150, 0.4)
  ctx.lineTo(-46, -1.2)
  ctx.closePath()
  ctx.fill()

  // Hull: flat waterline, raked bow, slight sheer.
  ctx.fillStyle = hull
  ctx.beginPath()
  ctx.moveTo(-48, 0)
  ctx.lineTo(52, 0)
  ctx.lineTo(60, -6)
  ctx.quadraticCurveTo(20, -9.5, -44, -8)
  ctx.closePath()
  ctx.fill()

  // Main deckhouse, bridge, funnel and turrets.
  ctx.fillStyle = upper
  ctx.fillRect(-18, -16, 30, 8)
  ctx.fillRect(-6, -23, 13, 8)
  ctx.fillRect(14, -20, 8, 12)
  ctx.fillRect(-34, -12, 12, 4)
  ctx.fillRect(26, -12, 10, 4)

  // Masts and radar.
  ctx.strokeStyle = upper
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(0, -23)
  ctx.lineTo(0, -36)
  ctx.moveTo(-6, -30)
  ctx.lineTo(6, -30)
  ctx.moveTo(20, -20)
  ctx.lineTo(20, -29)
  ctx.stroke()

  // Reflection: squashed, faded copy under the waterline.
  ctx.globalAlpha *= 0.22
  ctx.scale(1, -0.45)
  ctx.fillStyle = hull
  ctx.beginPath()
  ctx.moveTo(-48, 0)
  ctx.lineTo(52, 0)
  ctx.lineTo(60, -6)
  ctx.quadraticCurveTo(20, -9.5, -44, -8)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = upper
  ctx.fillRect(-18, -16, 30, 8)
  ctx.fillRect(-6, -23, 13, 8)

  ctx.restore()
}

function drawSea(
  ctx: CanvasRenderingContext2D,
  { width, height }: SceneSize,
  horizon: number,
  t: number,
): void {
  const seaDepth = height - horizon
  const sunX = width * 0.72
  const step = Math.max(6, Math.round(width / 220))

  for (let i = 0; i < BAND_COUNT; i++) {
    const p = i / (BAND_COUNT - 1)
    const eased = Math.pow(p, 2.1)
    const y = horizon + seaDepth * eased
    const nextY = horizon + seaDepth * Math.pow((i + 1) / (BAND_COUNT - 1), 2.1)
    const phase = hash(i * 2.3) * Math.PI * 2
    const shade = 0.9 + hash(i * 7.7) * 0.2

    // Far water borrows the sky's tone; near water is deep and saturated.
    const r = mix(150, 8, p) * shade
    const g = mix(186, 44, p) * shade
    const b = mix(196, 80, p) * shade

    ctx.fillStyle = rgb(r, g, b)
    ctx.beginPath()
    ctx.moveTo(0, y + waveHeight(0, p, t, phase))
    for (let x = step; x <= width; x += step) {
      ctx.lineTo(x, y + waveHeight(x, p, t, phase))
    }
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()

    if (i < 3 || nextY - y < 1.4) continue

    // Foam-lit crest on the nearer swells only.
    ctx.strokeStyle = `rgba(${mix(210, 168, p)}, ${mix(235, 205, p)}, 255, ${mix(
      0.05,
      0.14,
      p,
    ).toFixed(3)})`
    ctx.lineWidth = mix(0.8, 2.2, p)
    ctx.beginPath()
    ctx.moveTo(0, y + waveHeight(0, p, t, phase))
    for (let x = step; x <= width; x += step) {
      ctx.lineTo(x, y + waveHeight(x, p, t, phase))
    }
    ctx.stroke()
  }

  // Sun glitter: a widening path of bright dashes below the sun.
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const sparkles = 520
  for (let i = 0; i < sparkles; i++) {
    const p = Math.pow(hash(i * 1.7), 0.75)
    const y = horizon + seaDepth * Math.pow(p, 2.1)
    const spread = width * (0.02 + 0.36 * p)
    const x = sunX + (hash(i * 3.1) - 0.5) * 2 * spread
    if (x < -20 || x > width + 20) continue

    const twinkle = Math.sin(t * (1.4 + hash(i) * 3) + i * 1.7)
    if (twinkle < 0.2) continue

    const len = mix(2, 16, p) * (0.5 + hash(i * 5.3))
    const alpha = (twinkle - 0.2) * mix(0.5, 0.22, p)
    ctx.fillStyle = `rgba(255, 244, 214, ${alpha.toFixed(3)})`
    ctx.fillRect(
      x - len / 2,
      y + waveHeight(x, p, t) - mix(0.6, 1.6, p) / 2,
      len,
      mix(0.8, 2.2, p),
    )
  }
  ctx.restore()

  // Vignette so UI panels stay readable over the water.
  const vignette = ctx.createLinearGradient(0, horizon, 0, height)
  vignette.addColorStop(0, 'rgba(2, 10, 22, 0)')
  vignette.addColorStop(1, 'rgba(2, 10, 22, 0.55)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, horizon, width, seaDepth)
}

/** Paints one frame of the scene at time `t` (seconds). */
export function drawOcean(
  ctx: CanvasRenderingContext2D,
  size: SceneSize,
  t: number,
): void {
  const horizon = Math.round(size.height * HORIZON_RATIO)
  ctx.clearRect(0, 0, size.width, size.height)
  drawSky(ctx, size, horizon, t)
  drawSea(ctx, size, horizon, t)

  for (const vessel of VESSELS) {
    const travel = (vessel.offset + t * vessel.speed) % 1
    const wrapped = travel < 0 ? travel + 1 : travel
    const x = wrapped * (size.width + 400) - 200
    const scale = mix(0.26, 0.62, vessel.depth)
    const waterline = horizon + mix(1, 14, vessel.depth)
    drawVessel(ctx, x, waterline, scale, vessel.flipped, 1 - vessel.depth)
  }
}
