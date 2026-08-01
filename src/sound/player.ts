import type { SoundName } from './events'

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle'

interface WebkitWindow {
  webkitAudioContext?: typeof AudioContext
}

interface NoiseOptions {
  start: number
  duration: number
  peak: number
  filterType: BiquadFilterType
  /** Filter cutoff at the attack, swept towards `endFreq` over the tail. */
  startFreq: number
  endFreq?: number
  q?: number
  destination?: AudioNode
}

function resolveAudioContext(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ?? (window as WebkitWindow).webkitAudioContext ?? null
  )
}

/** Soft-clipping curve so heavy layers saturate instead of digitally clipping. */
function saturationCurve(): Float32Array<ArrayBuffer> {
  const samples = 1024
  const curve = new Float32Array(new ArrayBuffer(samples * 4))
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1
    curve[i] = Math.tanh(x * 2.2)
  }
  return curve
}

/**
 * Synthesises the game's sound effects with the Web Audio API so no audio
 * assets need to ship. Everything runs through a saturating, compressed master
 * bus with a canyon-like echo send, which is what gives the naval guns their
 * weight. The context is created lazily on first playback (a user gesture) to
 * satisfy browser autoplay policies.
 */
class SoundPlayer {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private echo: GainNode | null = null
  private muted = false

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  isMuted(): boolean {
    return this.muted
  }

  play(name: SoundName): void {
    if (this.muted) return
    const ctx = this.ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()

    const now = ctx.currentTime
    switch (name) {
      case 'fire':
        return this.cannon(ctx, now)
      case 'hit':
        return this.detonation(ctx, now, 1)
      case 'sunk':
        return this.sinking(ctx, now)
      case 'miss':
        return this.splash(ctx, now)
      case 'victory':
        return this.finale(ctx, now, [523.25, 659.25, 783.99, 1046.5])
      case 'defeat':
        return this.finale(ctx, now, [440, 349.23, 261.63, 196])
      case 'start':
        return this.fanfare(ctx, now, [392, 587.33], 0.18)
      case 'place':
        return this.blip(ctx, now, 220, 0.08)
      case 'rotate':
        return this.blip(ctx, now, 440, 0.06)
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context
    const Ctor = resolveAudioContext()
    if (!Ctor) return null
    const ctx = new Ctor()

    const master = ctx.createGain()
    master.gain.value = 0.9

    const shaper = ctx.createWaveShaper()
    shaper.curve = saturationCurve()
    shaper.oversample = '2x'

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -18
    compressor.knee.value = 24
    compressor.ratio.value = 6
    compressor.attack.value = 0.004
    compressor.release.value = 0.28

    master.connect(shaper).connect(compressor).connect(ctx.destination)

    // Echo send: distant reflections that make blasts roll across open water.
    const echo = ctx.createGain()
    echo.gain.value = 0.45
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.23
    const feedback = ctx.createGain()
    feedback.gain.value = 0.45
    const damp = ctx.createBiquadFilter()
    damp.type = 'lowpass'
    damp.frequency.value = 900
    echo.connect(delay)
    delay.connect(damp).connect(feedback).connect(delay)
    damp.connect(master)

    this.context = ctx
    this.master = master
    this.echo = echo
    return ctx
  }

  private out(): AudioNode {
    return this.master ?? (this.context as AudioContext).destination
  }

  private tone(
    ctx: AudioContext,
    start: number,
    freq: number,
    duration: number,
    type: OscillatorType,
    peak: number,
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain).connect(this.out())
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  /** Filtered noise burst — the body of every blast, splash and crackle. */
  private noise(ctx: AudioContext, options: NoiseOptions): void {
    const { start, duration, peak, filterType, startFreq } = options
    const frames = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.setValueAtTime(startFreq, start)
    if (options.endFreq !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(
        options.endFreq,
        start + duration,
      )
    }
    if (options.q !== undefined) filter.Q.value = options.q

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(peak, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    source.connect(filter).connect(gain)
    gain.connect(options.destination ?? this.out())
    if (this.echo && options.destination === undefined) gain.connect(this.echo)
    source.start(start)
    source.stop(start + duration)
  }

  /** Sub-bass thump: the chest-punch under an explosion. */
  private sub(
    ctx: AudioContext,
    start: number,
    from: number,
    to: number,
    duration: number,
    peak: number,
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(from, start)
    osc.frequency.exponentialRampToValueAtTime(to, start + duration)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(peak, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain).connect(this.out())
    if (this.echo) gain.connect(this.echo)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  /** Main gun firing: crack, muzzle blast, sub thump, rolling tail. */
  private cannon(ctx: AudioContext, now: number): void {
    this.noise(ctx, {
      start: now,
      duration: 0.05,
      peak: 0.85,
      filterType: 'highpass',
      startFreq: 2200,
    })
    this.noise(ctx, {
      start: now,
      duration: 0.55,
      peak: 0.7,
      filterType: 'lowpass',
      startFreq: 1600,
      endFreq: 180,
    })
    this.sub(ctx, now, 110, 34, 0.75, 0.9)
    this.noise(ctx, {
      start: now + 0.12,
      duration: 1.1,
      peak: 0.22,
      filterType: 'lowpass',
      startFreq: 400,
      endFreq: 90,
    })
  }

  /** Shell impact: flash crack, fireball roar, sub boom, debris crackle. */
  private detonation(ctx: AudioContext, now: number, scale: number): void {
    const start = now + 0.09
    this.noise(ctx, {
      start,
      duration: 0.06,
      peak: 0.8 * scale,
      filterType: 'highpass',
      startFreq: 3000,
    })
    this.noise(ctx, {
      start,
      duration: 0.9 * scale,
      peak: 0.9 * scale,
      filterType: 'lowpass',
      startFreq: 1800,
      endFreq: 140,
    })
    this.sub(ctx, start, 120, 26, 1.3 * scale, 1)
    this.noise(ctx, {
      start: start + 0.18,
      duration: 1.4 * scale,
      peak: 0.28 * scale,
      filterType: 'bandpass',
      startFreq: 900,
      endFreq: 160,
      q: 0.7,
    })
    // Debris crackle raining down.
    for (let i = 0; i < 5; i++) {
      this.noise(ctx, {
        start: start + 0.25 + i * 0.11 + Math.random() * 0.05,
        duration: 0.09,
        peak: 0.12 * scale,
        filterType: 'highpass',
        startFreq: 2500,
      })
    }
  }

  /** A ship going down: chained detonations plus tearing metal. */
  private sinking(ctx: AudioContext, now: number): void {
    this.detonation(ctx, now, 1.3)
    this.detonation(ctx, now + 0.34, 0.9)
    this.detonation(ctx, now + 0.72, 1.1)

    const groan = ctx.createOscillator()
    const gain = ctx.createGain()
    groan.type = 'sawtooth'
    groan.frequency.setValueAtTime(150, now + 0.5)
    groan.frequency.exponentialRampToValueAtTime(48, now + 2.4)
    gain.gain.setValueAtTime(0.0001, now + 0.5)
    gain.gain.linearRampToValueAtTime(0.16, now + 0.8)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4)

    const growl = ctx.createBiquadFilter()
    growl.type = 'lowpass'
    growl.frequency.value = 700
    groan.connect(growl).connect(gain).connect(this.out())
    if (this.echo) gain.connect(this.echo)
    groan.start(now + 0.5)
    groan.stop(now + 2.45)
  }

  /** Shell hitting open water: heavy plume, then falling spray. */
  private splash(ctx: AudioContext, now: number): void {
    const start = now + 0.09
    this.sub(ctx, start, 90, 45, 0.25, 0.3)
    this.noise(ctx, {
      start,
      duration: 0.5,
      peak: 0.5,
      filterType: 'bandpass',
      startFreq: 2200,
      endFreq: 500,
      q: 0.8,
    })
    this.noise(ctx, {
      start: start + 0.06,
      duration: 0.7,
      peak: 0.22,
      filterType: 'highpass',
      startFreq: 3200,
    })
  }

  private fanfare(
    ctx: AudioContext,
    now: number,
    notes: number[],
    step = 0.13,
  ): void {
    notes.forEach((freq, index) => {
      this.tone(ctx, now + index * step, freq, step + 0.18, 'triangle', 0.22)
    })
  }

  /** Game-over sting: a salute of guns underneath the melody. */
  private finale(ctx: AudioContext, now: number, notes: number[]): void {
    this.detonation(ctx, now, 1.4)
    this.cannon(ctx, now + 0.45)
    this.detonation(ctx, now + 0.9, 1.1)
    this.fanfare(ctx, now + 0.25, notes, 0.16)
  }

  private blip(
    ctx: AudioContext,
    now: number,
    freq: number,
    duration: number,
  ): void {
    this.tone(ctx, now, freq, duration, 'square', 0.12)
  }
}

export const soundPlayer = new SoundPlayer()
