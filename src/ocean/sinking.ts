/**
 * Canvas painter for the victory cutscene: the enemy flagship burning,
 * listing and going down by the stern while smoke rolls off the deck.
 * Pure drawing code so it can be unit tested without a real canvas.
 */

import { drawOcean, waveHeight } from './scene'
import type { SceneSize } from './scene'

/** Seconds the ship takes to settle into its final, half-sunk pose. */
export const SINK_DURATION = 16

const SMOKE_PUFFS = 34
const FLAMES = 7
const DEBRIS = 14

function hash(n: number): number {
  const x = Math.sin(n * 91.7) * 24634.6345
  return x - Math.floor(x)
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Eased 0..1 progress of the sinking at time `t` seconds. */
export function sinkProgress(t: number): number {
  const linear = Math.min(Math.max(t / SINK_DURATION, 0), 1)
  return 1 - Math.pow(1 - linear, 2.2)
}

function drawHull(ctx: CanvasRenderingContext2D, scale: number): void {
  const steel = ctx.createLinearGradient(0, -80, 0, 40)
  steel.addColorStop(0, '#2a343d')
  steel.addColorStop(0.55, '#151f28')
  steel.addColorStop(1, '#070d13')

  // Hull: raked bow to the right, transom stern to the left.
  ctx.fillStyle = steel
  ctx.beginPath()
  ctx.moveTo(-260, -26)
  ctx.lineTo(250, -30)
  ctx.quadraticCurveTo(305, -26, 318, 2)
  ctx.quadraticCurveTo(250, 34, -220, 30)
  ctx.quadraticCurveTo(-262, 22, -260, -26)
  ctx.closePath()
  ctx.fill()

  // Deck line and boot-topping stripe.
  ctx.strokeStyle = 'rgba(255, 186, 110, 0.4)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-256, -24)
  ctx.lineTo(300, -24)
  ctx.stroke()

  ctx.fillStyle = 'rgba(86, 22, 14, 0.9)'
  ctx.fillRect(-250, 16, 540, 8)

  // Superstructure: deckhouse, bridge, funnel, masts, turrets.
  const upper = '#26313b'
  ctx.fillStyle = upper
  ctx.fillRect(-90, -70, 150, 46)
  ctx.fillRect(-40, -104, 74, 36)
  ctx.fillRect(84, -92, 34, 68)
  ctx.fillStyle = '#171f27'
  ctx.fillRect(84, -98, 34, 10)

  ctx.fillStyle = '#1d262f'
  ctx.fillRect(-210, -46, 76, 22)
  ctx.fillRect(150, -44, 68, 20)
  ctx.fillRect(-186, -58, 30, 14)
  ctx.fillRect(176, -56, 28, 14)

  // Gun barrels.
  ctx.strokeStyle = '#131b22'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-176, -52)
  ctx.lineTo(-256, -64)
  ctx.moveTo(186, -50)
  ctx.lineTo(268, -60)
  ctx.stroke()

  // Masts, radar, aerials.
  ctx.strokeStyle = '#3a4753'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, -104)
  ctx.lineTo(0, -168)
  ctx.moveTo(-24, -146)
  ctx.lineTo(24, -146)
  ctx.moveTo(-14, -126)
  ctx.lineTo(14, -126)
  ctx.moveTo(101, -98)
  ctx.lineTo(101, -140)
  ctx.stroke()

  // Lit portholes along the hull.
  ctx.fillStyle = 'rgba(255, 206, 120, 0.75)'
  for (let i = 0; i < 16; i++) {
    ctx.beginPath()
    ctx.arc(-230 + i * 33, -6, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  void scale
}

function drawFlames(
  ctx: CanvasRenderingContext2D,
  t: number,
  intensity: number,
): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < FLAMES; i++) {
    const x = mix(-170, 200, hash(i))
    const base = -24 - hash(i * 2.7) * 60
    const flicker = 0.6 + 0.4 * Math.sin(t * (5 + hash(i) * 6) + i)
    const r = (42 + hash(i * 5.1) * 52) * flicker * intensity
    const fire = ctx.createRadialGradient(x, base, 0, x, base, r)
    fire.addColorStop(0, `rgba(255, 250, 224, ${0.95 * intensity})`)
    fire.addColorStop(0.35, `rgba(255, 176, 60, ${0.75 * intensity})`)
    fire.addColorStop(0.7, `rgba(226, 78, 22, ${0.35 * intensity})`)
    fire.addColorStop(1, 'rgba(150, 30, 0, 0)')
    ctx.fillStyle = fire
    ctx.beginPath()
    ctx.ellipse(x, base - r * 0.35, r * 0.8, r * 1.25, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawSmoke(
  ctx: CanvasRenderingContext2D,
  { width, height }: SceneSize,
  originX: number,
  originY: number,
  t: number,
): void {
  ctx.save()
  for (let i = 0; i < SMOKE_PUFFS; i++) {
    const seed = hash(i * 3.3)
    const age = (t * 0.09 + seed) % 1
    const rise = age * height * 0.6
    const drift = (seed - 0.35) * width * 0.34 * age + Math.sin(t * 0.4 + i) * 8
    const radius = 14 + age * 140 + seed * 22
    const alpha = Math.max(0, 0.42 * (1 - age)) * (0.45 + seed * 0.55)
    const tone = 26 + seed * 34 - age * 8
    const puff = ctx.createRadialGradient(
      originX + drift,
      originY - rise,
      0,
      originX + drift,
      originY - rise,
      radius,
    )
    puff.addColorStop(0, `rgba(${tone}, ${tone - 4}, ${tone - 8}, ${alpha})`)
    puff.addColorStop(1, `rgba(${tone}, ${tone - 4}, ${tone - 8}, 0)`)
    ctx.fillStyle = puff
    ctx.beginPath()
    ctx.arc(originX + drift, originY - rise, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Wavy band of near water painted over the hull so it reads as submerged. */
function drawForegroundWater(
  ctx: CanvasRenderingContext2D,
  { width, height }: SceneSize,
  waterline: number,
  t: number,
): void {
  const step = Math.max(6, Math.round(width / 200))
  for (let band = 0; band < 7; band++) {
    const p = 0.55 + band * 0.075
    const y = waterline + band * ((height - waterline) / 7)
    const water = ctx.createLinearGradient(0, y - 20, 0, height)
    water.addColorStop(0, `rgba(12, 46, 74, ${0.72 + band * 0.04})`)
    water.addColorStop(1, `rgba(4, 20, 38, ${0.85 + band * 0.02})`)
    ctx.fillStyle = water
    ctx.beginPath()
    ctx.moveTo(0, y + waveHeight(0, p, t, band))
    for (let x = step; x <= width; x += step) {
      ctx.lineTo(x, y + waveHeight(x, p, t, band))
    }
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = `rgba(180, 214, 236, ${0.1 + band * 0.015})`
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(0, y + waveHeight(0, p, t, band))
    for (let x = step; x <= width; x += step) {
      ctx.lineTo(x, y + waveHeight(x, p, t, band))
    }
    ctx.stroke()
  }
}

/** Floating wreckage bobbing around the sinking hull. */
function drawDebris(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  waterline: number,
  scale: number,
  t: number,
): void {
  ctx.fillStyle = 'rgba(18, 26, 34, 0.9)'
  for (let i = 0; i < DEBRIS; i++) {
    const seed = hash(i * 7.9)
    const x = centerX + (seed - 0.5) * 900 * scale
    const bob = Math.sin(t * 1.6 + i) * 3
    const w = (6 + seed * 16) * scale
    ctx.fillRect(x, waterline + 6 + seed * 40 + bob, w, 3 * scale)
  }
}

/** Paints one frame of the victory cutscene at time `t` (seconds). */
export function drawSinkingScene(
  ctx: CanvasRenderingContext2D,
  size: SceneSize,
  t: number,
): void {
  drawOcean(ctx, size, t)

  const progress = sinkProgress(t)
  const scale = Math.max(0.6, Math.min(size.width / 1000, 1.7))
  const centerX = size.width * 0.5
  const waterline = size.height * 0.68

  ctx.save()
  ctx.translate(centerX, waterline)
  ctx.scale(scale, scale)
  // Goes down by the stern: the whole hull settles while the bow lifts.
  ctx.translate(0, -120 + progress * 240)
  ctx.rotate((-16 * Math.PI) / 180 * progress)
  drawHull(ctx, scale)
  drawFlames(ctx, t, 1 - progress * 0.35)
  ctx.restore()

  drawForegroundWater(ctx, size, waterline + 8, t)
  drawDebris(ctx, centerX, waterline, scale, t)

  // Steam where the burning hull meets the sea.
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const glow = ctx.createRadialGradient(
    centerX,
    waterline,
    0,
    centerX,
    waterline,
    420 * scale,
  )
  glow.addColorStop(0, `rgba(255, 140, 50, ${0.22 * (1 - progress * 0.4)})`)
  glow.addColorStop(1, 'rgba(255, 120, 40, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size.width, size.height)
  ctx.restore()

  // Fire reflected on the swell in front of the wreck.
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 16; i++) {
    const seed = hash(i * 2.3)
    const x = centerX + (seed - 0.5) * 620 * scale
    const y = waterline + 14 + seed * 130
    const flicker = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i))
    ctx.fillStyle = `rgba(226, 116, 34, ${0.07 * flicker * (1 - progress * 0.3)})`
    ctx.beginPath()
    ctx.ellipse(x, y, (34 + seed * 46) * scale, 2.5 * scale, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  drawSmoke(ctx, size, centerX - 60 * scale, waterline - 150 * scale, t)
  drawSmoke(ctx, size, centerX + 110 * scale, waterline - 110 * scale, t + 7)
}
