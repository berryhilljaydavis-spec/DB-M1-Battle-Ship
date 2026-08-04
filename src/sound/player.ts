import type { SoundName } from './events'
import { MUSIC_TRACKS } from './march'
import type {
  EffectChoice,
  EffectPackParams,
  MusicChoice,
} from './settings'
import { DEFAULT_AUDIO_SETTINGS, effectPackParams } from './settings'

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle'

/** Which part of an effect a noise layer plays, for per-pack scaling. */
type NoiseRole = 'transient' | 'body'

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
  role?: NoiseRole
}

function resolveAudioContext(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ?? (window as WebkitWindow).webkitAudioContext ?? null
  )
}

/** Decaying noise burst used as a reverb impulse: open air, no repeats. */
function impulseResponse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const frames = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, frames, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < frames; i++) {
      const decay = Math.pow(1 - i / frames, 2.4)
      data[i] = (Math.random() * 2 - 1) * decay
    }
  }
  return buffer
}

/** Shortest gap between two plays of the same effect, in seconds. */
const RETRIGGER_GAP = 0.07
/** Effects allowed to overlap before new ones are dropped. */
const MAX_VOICES = 4
export const VICTORY_VOLLEY_OFFSETS = [0, 1.4, 2.9, 4.5, 6.2] as const
/** Level the music bus swells to while a track plays. */
const MUSIC_BUS_GAIN = 0.4
/** Floor on how far a pack may shorten a sub thump, so it stays audible. */
const MIN_SUB_SCALE = 0.25

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
  private effects: GainNode | null = null
  private reverb: GainNode | null = null
  private victory: GainNode | null = null
  private music: GainNode | null = null
  private effectsVolume: GainNode | null = null
  private musicVolume: GainNode | null = null
  private trackGain: GainNode | null = null
  private muted = false
  private lastPlayed = new Map<SoundName, number>()
  private activeUntil: number[] = []
  private musicTimer: ReturnType<typeof setTimeout> | null = null
  private packChoice: EffectChoice = DEFAULT_AUDIO_SETTINGS.effectPack
  private pack: EffectPackParams = effectPackParams(
    DEFAULT_AUDIO_SETTINGS.effectPack === 'off'
      ? 'heavy-naval'
      : DEFAULT_AUDIO_SETTINGS.effectPack,
  )
  private trackChoice: MusicChoice = DEFAULT_AUDIO_SETTINGS.musicTrack
  private levels = {
    music: DEFAULT_AUDIO_SETTINGS.musicVolume,
    effects: DEFAULT_AUDIO_SETTINGS.effectsVolume,
  }

  /** Selects the effect-pack parameter set used by every future effect. */
  setEffectPack(choice: EffectChoice): void {
    this.packChoice = choice
    if (choice !== 'off') this.pack = effectPackParams(choice)
    this.applyReverbSend()
  }

  /**
   * Selects the music arrangement. If a track is already playing it crosses
   * over to the new one immediately instead of waiting for the loop to end.
   */
  setMusicTrack(choice: MusicChoice): void {
    if (choice === this.trackChoice) return
    const wasPlaying = this.musicTimer !== null || this.trackGain !== null
    this.trackChoice = choice
    if (!wasPlaying) return

    this.clearMusicTimer()
    this.fadeOutTrack(0.35)
    if (choice === 'off') {
      this.stopMusic()
      return
    }
    this.startMusic()
  }

  /** Applies the 0-1 music and effects volumes to their gain buses. */
  setVolumes(music: number, effects: number): void {
    this.levels = { music, effects }
    const ctx = this.context
    if (!ctx) return
    const now = ctx.currentTime
    this.musicVolume?.gain.setTargetAtTime(music, now, 0.05)
    this.effectsVolume?.gain.setTargetAtTime(effects, now, 0.05)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (muted) {
      this.stopMusic()
      this.stopVictory()
    } else {
      this.resumeVictory()
    }
  }

  isMuted(): boolean {
    return this.muted
  }

  play(name: SoundName): void {
    if (this.muted || this.packChoice === 'off') return
    const ctx = this.ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()

    const now = ctx.currentTime
    if (!this.claimVoice(name, now)) return
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
        return this.victorySalute(ctx, now)
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

  private clearMusicTimer(): void {
    if (this.musicTimer === null) return
    clearTimeout(this.musicTimer)
    this.musicTimer = null
  }

  private applyReverbSend(): void {
    const ctx = this.context
    if (!ctx || !this.reverb) return
    this.reverb.gain.setTargetAtTime(
      0.5 * this.pack.reverbSend,
      ctx.currentTime,
      0.02,
    )
  }

  playVictoryVolley(scale = 0.8): void {
    if (this.muted || this.packChoice === 'off') return
    const ctx = this.ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    if (!this.claimVoice('victory', now)) return
    this.prepareVictory(now)
    this.scheduleVictoryVolley(ctx, now, scale, this.victory ?? undefined)
  }

  stopVictory(): void {
    const ctx = this.context
    const victory = this.victory
    if (!ctx || !victory) return

    const now = ctx.currentTime
    victory.gain.cancelScheduledValues(now)
    victory.gain.setValueAtTime(Math.max(victory.gain.value, 0.0001), now)
    victory.gain.linearRampToValueAtTime(0.0001, now + 0.08)
  }

  resumeVictory(): void {
    const ctx = this.context
    if (!ctx) return
    this.prepareVictory(ctx.currentTime)
  }

  private prepareVictory(now: number): void {
    if (!this.victory) return
    this.victory.gain.cancelScheduledValues(now)
    this.victory.gain.setValueAtTime(1, now)
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

    // Player-controlled volume buses, kept separate from the ducking gains.
    const effectsVolume = ctx.createGain()
    effectsVolume.gain.value = this.levels.effects
    effectsVolume.connect(master)

    const musicVolume = ctx.createGain()
    musicVolume.gain.value = this.levels.music
    musicVolume.connect(master)

    // Effects bus, ducked while several blasts overlap.
    const effects = ctx.createGain()
    effects.gain.value = 1
    effects.connect(effectsVolume)

    const victory = ctx.createGain()
    victory.gain.value = 1
    victory.connect(effectsVolume)

    // Open-air tail. A convolved noise burst decays smoothly, unlike a
    // feedback delay, which repeats the blast and sounds like a bouncing ball.
    const reverb = ctx.createGain()
    reverb.gain.value = 0.5 * this.pack.reverbSend
    const convolver = ctx.createConvolver()
    convolver.buffer = impulseResponse(ctx, 1.9)
    reverb.connect(convolver).connect(effectsVolume)
    victory.connect(reverb)

    const music = ctx.createGain()
    music.gain.value = 0
    music.connect(musicVolume)
    // The music tail has its own convolver so the effects volume and the
    // effect pack's reverb setting cannot alter it.
    const musicReverb = ctx.createConvolver()
    musicReverb.buffer = impulseResponse(ctx, 1.9)
    const musicReverbSend = ctx.createGain()
    // 0.22 into what used to be a 0.5 shared reverb bus, so the wet/dry ratio
    // of the march is unchanged by the split.
    musicReverbSend.gain.value = 0.22 * 0.5
    music.connect(musicReverbSend).connect(musicReverb).connect(musicVolume)

    this.context = ctx
    this.master = master
    this.effects = effects
    this.effectsVolume = effectsVolume
    this.musicVolume = musicVolume
    this.reverb = reverb
    this.victory = victory
    this.music = music
    return ctx
  }

  /**
   * Rate-limits effects so rapid fire cannot stack into a wall of noise:
   * identical sounds retrigger at most every `RETRIGGER_GAP`, no more than
   * `MAX_VOICES` overlap, and the effects bus ducks as the count rises.
   */
  private claimVoice(name: SoundName, now: number): boolean {
    const last = this.lastPlayed.get(name)
    if (last !== undefined && now - last < RETRIGGER_GAP) return false
    this.lastPlayed.set(name, now)

    this.activeUntil = this.activeUntil.filter((end) => end > now)
    if (this.activeUntil.length >= MAX_VOICES) return false
    this.activeUntil.push(now + 1.2)

    if (this.effects) {
      const duck = 1 / Math.sqrt(this.activeUntil.length)
      this.effects.gain.cancelScheduledValues(now)
      this.effects.gain.setTargetAtTime(duck, now, 0.05)
      this.effects.gain.setTargetAtTime(1, now + 0.9, 0.35)
    }
    return true
  }

  private out(): AudioNode {
    return (
      this.effects ?? this.master ?? (this.context as AudioContext).destination
    )
  }

  /**
   * Whether a layer belongs to the effects side of the mixer, and so should be
   * reshaped by the selected pack. Music voices pass their own destination.
   */
  private isEffectBus(destination?: AudioNode): boolean {
    return destination === undefined || destination === this.victory
  }

  private tone(
    ctx: AudioContext,
    start: number,
    freq: number,
    duration: number,
    type: OscillatorType,
    peak: number,
    destination?: AudioNode,
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const level = this.isEffectBus(destination)
      ? peak * this.pack.gainScale
      : peak
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(level, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain).connect(destination ?? this.out())
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  /** Filtered noise burst — the body of every blast, splash and crackle. */
  private noise(ctx: AudioContext, options: NoiseOptions): void {
    const { start, filterType, startFreq } = options
    const scaled = this.isEffectBus(options.destination)
    const duration =
      scaled && options.role !== 'transient'
        ? Math.max(0.02, options.duration * this.pack.tailScale)
        : options.duration
    const peak = scaled
      ? options.peak *
        this.pack.gainScale *
        (options.role === 'transient' ? this.pack.transientScale : 1)
      : options.peak
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
    if (this.reverb && options.destination === undefined) {
      gain.connect(this.reverb)
    }
    source.start(start)
    source.stop(start + duration)
  }

  /** Sub-bass thump: the chest-punch under an explosion. */
  private sub(
    ctx: AudioContext,
    start: number,
    from: number,
    to: number,
    length: number,
    level: number,
    destination?: AudioNode,
  ): void {
    const scaled = this.isEffectBus(destination)
    const duration = scaled
      ? length * Math.max(this.pack.tailScale, MIN_SUB_SCALE)
      : length
    const peak = scaled ? level * this.pack.gainScale : level
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(from, start)
    // Drop to the resting pitch quickly, then hold: a slow glide over the whole
    // tail whistles downwards and reads as a bouncing ball, not a gun.
    osc.frequency.exponentialRampToValueAtTime(
      to,
      start + Math.min(0.1, duration * 0.3),
    )
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(peak, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain).connect(destination ?? this.out())
    if (this.reverb && destination === undefined) gain.connect(this.reverb)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  /** Main gun firing: crack, muzzle blast, sub thump, rolling tail. */
  private cannon(
    ctx: AudioContext,
    now: number,
    scale = 1,
    destination?: AudioNode,
  ): void {
    this.noise(ctx, {
      start: now,
      duration: 0.05,
      peak: 0.85 * scale,
      filterType: 'highpass',
      startFreq: 2200,
      destination,
      role: 'transient',
    })
    this.noise(ctx, {
      start: now,
      duration: 0.55,
      peak: 0.7 * scale,
      filterType: 'lowpass',
      startFreq: 1600,
      endFreq: 180,
      destination,
    })
    this.sub(ctx, now, 120, 48, 0.5, 0.85 * scale, destination)
    if (!this.pack.extraLayers) return
    // Rumble rolling away over the water.
    this.noise(ctx, {
      start: now + 0.12,
      duration: 1.2,
      peak: 0.26 * scale,
      filterType: 'lowpass',
      startFreq: 320,
      endFreq: 70,
      destination,
    })
  }

  /** Shell impact: flash crack, fireball roar, sub boom, debris crackle. */
  private detonation(
    ctx: AudioContext,
    now: number,
    scale: number,
    destination?: AudioNode,
  ): void {
    const start = now + 0.09
    this.noise(ctx, {
      start,
      duration: 0.06,
      peak: 0.8 * scale,
      filterType: 'highpass',
      startFreq: 3000,
      destination,
      role: 'transient',
    })
    this.noise(ctx, {
      start,
      duration: 0.9 * scale,
      peak: 0.9 * scale,
      filterType: 'lowpass',
      startFreq: 1800,
      endFreq: 140,
      destination,
    })
    this.sub(ctx, start, 130, 42, 0.8 * scale, 1, destination)
    if (!this.pack.extraLayers) return
    this.noise(ctx, {
      start,
      duration: 1.5 * scale,
      peak: 0.3 * scale,
      filterType: 'lowpass',
      startFreq: 260,
      endFreq: 60,
      destination,
    })
    this.noise(ctx, {
      start: start + 0.18,
      duration: 1.4 * scale,
      peak: 0.28 * scale,
      filterType: 'bandpass',
      startFreq: 900,
      endFreq: 160,
      q: 0.7,
      destination,
    })
    // Debris crackle raining down.
    for (let i = 0; i < 5; i++) {
      this.noise(ctx, {
        start: start + 0.25 + i * 0.11 + Math.random() * 0.05,
        duration: 0.09,
        peak: 0.12 * scale,
        filterType: 'highpass',
        startFreq: 2500,
        destination,
      })
    }
  }

  /** A ship going down: chained detonations plus tearing metal. */
  private sinking(ctx: AudioContext, now: number): void {
    this.detonation(ctx, now, 1.3)
    this.detonation(ctx, now + 0.34, 0.9)
    this.detonation(ctx, now + 0.72, 1.1)
    if (!this.pack.extraLayers) return

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
    if (this.reverb) gain.connect(this.reverb)
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
    if (!this.pack.extraLayers) return
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
    destination?: AudioNode,
  ): void {
    notes.forEach((freq, index) => {
      this.tone(
        ctx,
        now + index * step,
        freq,
        step + 0.18,
        this.pack.toneType,
        0.22,
        destination,
      )
    })
  }

  /** Game-over sting: a salute of guns underneath the melody. */
  private finale(ctx: AudioContext, now: number, notes: number[]): void {
    this.detonation(ctx, now, 1.4)
    this.cannon(ctx, now + 0.45)
    this.detonation(ctx, now + 0.9, 1.1)
    this.fanfare(ctx, now + 0.25, notes, 0.16)
  }

  /** Victory: a staggered salute of heavy guns, then the winning motif. */
  private victorySalute(ctx: AudioContext, now: number): void {
    this.prepareVictory(now)
    this.scheduleVictoryVolley(ctx, now, 1, this.victory ?? undefined)
    this.fanfare(
      ctx,
      now + VICTORY_VOLLEY_OFFSETS[VICTORY_VOLLEY_OFFSETS.length - 1] + 1.2,
      [523.25, 659.25, 783.99, 1046.5],
      0.16,
      this.victory ?? undefined,
    )
  }

  private scheduleVictoryVolley(
    ctx: AudioContext,
    now: number,
    scale: number,
    destination?: AudioNode,
  ): void {
    VICTORY_VOLLEY_OFFSETS.forEach((offset, index) => {
      const shotScale = [0.72, 0.62, 0.7, 0.58, 0.66][index] * scale
      if (index % 2 === 0) {
        this.cannon(ctx, now + offset, shotScale, destination)
      } else {
        this.detonation(ctx, now + offset, shotScale, destination)
      }
    })
  }

  private blip(
    ctx: AudioContext,
    now: number,
    freq: number,
    duration: number,
  ): void {
    const length = duration * Math.max(this.pack.tailScale, 0.5)
    this.tone(ctx, now, freq, length, 'square', 0.12)
  }

  /** Starts the selected looping track. Safe to call repeatedly. */
  startMusic(): void {
    if (this.muted || this.trackChoice === 'off') return
    if (this.musicTimer !== null) return
    const ctx = this.ensureContext()
    if (!ctx || !this.music) return
    if (ctx.state !== 'running') {
      // Autoplay policy: wait for the context to be unlocked by a gesture,
      // otherwise the loop would be scheduled against a frozen clock.
      void ctx.resume().then(() => this.startMusic())
      return
    }

    const now = ctx.currentTime
    const level = Math.max(this.music.gain.value, 0.0001)
    this.music.gain.cancelScheduledValues(now)
    this.music.gain.setValueAtTime(level, now)
    this.music.gain.linearRampToValueAtTime(MUSIC_BUS_GAIN, now + 1.2)

    // Each pass of a track runs through its own gain node so switching tracks
    // can fade the outgoing arrangement out while the new one fades in.
    const trackGain = ctx.createGain()
    trackGain.gain.value = 1
    trackGain.connect(this.music)
    this.trackGain = trackGain
    this.scheduleMusicLoop(now + 0.15)
  }

  /** Fades the outgoing arrangement out and releases its nodes. */
  private fadeOutTrack(seconds: number): void {
    const ctx = this.context
    const gain = this.trackGain
    if (!ctx || !gain) return
    this.trackGain = null

    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now)
    gain.gain.linearRampToValueAtTime(0.0001, now + seconds)
    // Long sustained notes may still be scheduled behind the fade.
    setTimeout(() => gain.disconnect(), (seconds + 12) * 1000)
  }

  /** Fades the current track out and cancels further scheduling. */
  stopMusic(): void {
    this.clearMusicTimer()
    this.fadeOutTrack(0.6)
    const ctx = this.context
    if (!ctx || !this.music) return
    const level = this.music.gain.value
    this.music.gain.cancelScheduledValues(ctx.currentTime)
    this.music.gain.setValueAtTime(level, ctx.currentTime)
    this.music.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
  }

  /** Schedules one pass of the loop, then queues the next before it ends. */
  private scheduleMusicLoop(startTime: number): void {
    const ctx = this.context
    const bus = this.trackGain
    if (!ctx || !bus || this.trackChoice === 'off') return
    const track = MUSIC_TRACKS[this.trackChoice]

    const beat = 60 / track.bpm
    for (const note of track.notes()) {
      const at = startTime + note.beat * beat
      switch (note.voice) {
        case 'brass':
          this.brass(ctx, at, note.freq, note.length * beat, bus)
          break
        case 'bass':
          this.brass(ctx, at, note.freq, note.length * beat, bus, 0.6)
          break
        case 'drone':
          this.drone(ctx, at, note.freq, note.length * beat, bus)
          break
        case 'kick':
          this.sub(ctx, at, 95, 38, 0.56, 0.65, bus)
          break
        case 'snare':
          this.noise(ctx, {
            start: at,
            duration: 0.09,
            peak: 0.055,
            filterType: 'lowpass',
            startFreq: 650,
            endFreq: 180,
            destination: bus,
          })
          break
      }
    }

    const nextStart = startTime + track.loopBeats * beat
    const delayMs = Math.max(0, (nextStart - ctx.currentTime - 0.25) * 1000)
    this.musicTimer = setTimeout(() => {
      this.musicTimer = null
      this.scheduleMusicLoop(nextStart)
    }, delayMs)
  }

  /** Horn-section voice: stacked detuned saws behind a swept lowpass. */
  private brass(
    ctx: AudioContext,
    start: number,
    freq: number,
    duration: number,
    destination: AudioNode,
    level = 1,
  ): void {
    const attack = 0.24
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(0.11 * level, start + attack)
    gain.gain.setValueAtTime(0.095 * level, start + duration * 0.6)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    const timbre = ctx.createBiquadFilter()
    timbre.type = 'lowpass'
    timbre.frequency.setValueAtTime(Math.max(freq * 1.2, 180), start)
    timbre.frequency.linearRampToValueAtTime(freq * 2.4, start + attack)
    timbre.frequency.exponentialRampToValueAtTime(
      Math.max(freq * 2, 200),
      start + duration,
    )
    timbre.Q.value = 0.8

    for (const detune of [-7, 0, 7]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, start)
      osc.detune.setValueAtTime(detune, start)
      osc.connect(timbre)
      osc.start(start)
      osc.stop(start + duration + 0.05)
    }

    timbre.connect(gain).connect(destination)
  }

  /** Low pedal tone holding under the march: slow swell, no attack. */
  private drone(
    ctx: AudioContext,
    start: number,
    freq: number,
    duration: number,
    destination: AudioNode,
  ): void {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(260, start)
    filter.Q.value = 0.55
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(0.075, start + 0.65)
    gain.gain.setValueAtTime(0.065, start + Math.max(0.66, duration - 0.7))
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    for (const detune of [-6, 6]) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      osc.detune.setValueAtTime(detune, start)
      osc.connect(filter)
      osc.start(start)
      osc.stop(start + duration + 0.05)
    }
    filter.connect(gain).connect(destination)
  }
}

export const soundPlayer = new SoundPlayer()
