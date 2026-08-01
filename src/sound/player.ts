import type { SoundName } from './events'

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle'

interface WebkitWindow {
  webkitAudioContext?: typeof AudioContext
}

function resolveAudioContext(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return window.AudioContext ?? (window as WebkitWindow).webkitAudioContext ?? null
}

/**
 * Synthesises the game's sound effects with the Web Audio API so no audio
 * assets need to ship. The context is created lazily on first playback (a user
 * gesture) to satisfy browser autoplay policies.
 */
class SoundPlayer {
  private context: AudioContext | null = null
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
        return this.fire(ctx, now)
      case 'hit':
        return this.explosion(ctx, now, 0.35, 0.28)
      case 'sunk':
        return this.explosion(ctx, now, 0.9, 0.4)
      case 'miss':
        return this.splash(ctx, now)
      case 'victory':
        return this.fanfare(ctx, now, [523.25, 659.25, 783.99, 1046.5])
      case 'defeat':
        return this.fanfare(ctx, now, [440, 349.23, 261.63, 196])
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
    this.context = new Ctor()
    return this.context
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
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  private noise(
    ctx: AudioContext,
    start: number,
    duration: number,
    peak: number,
    filterType: BiquadFilterType,
    filterFreq: number,
  ): void {
    const frames = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.setValueAtTime(filterFreq, start)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(peak, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    source.connect(filter).connect(gain).connect(ctx.destination)
    source.start(start)
    source.stop(start + duration)
  }

  private fire(ctx: AudioContext, now: number): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18)
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.22)
    this.noise(ctx, now, 0.12, 0.2, 'lowpass', 900)
  }

  private explosion(
    ctx: AudioContext,
    now: number,
    duration: number,
    peak: number,
  ): void {
    const impact = now + 0.1
    this.noise(ctx, impact, duration, peak, 'lowpass', 600)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(160, impact)
    osc.frequency.exponentialRampToValueAtTime(40, impact + duration)
    gain.gain.setValueAtTime(peak, impact)
    gain.gain.exponentialRampToValueAtTime(0.0001, impact + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(impact)
    osc.stop(impact + duration + 0.02)
  }

  private splash(ctx: AudioContext, now: number): void {
    const start = now + 0.1
    this.noise(ctx, start, 0.3, 0.18, 'bandpass', 1400)
    this.noise(ctx, start + 0.03, 0.25, 0.12, 'highpass', 2600)
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
