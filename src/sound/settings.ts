/**
 * Pure audio-settings model: the selectable options, their defaults, the
 * synthesis parameters behind each effect pack, and parsing of the persisted
 * `localStorage` payload. Kept free of Web Audio so it can be unit-tested.
 */

export const MUSIC_TRACK_IDS = [
  'solemn-march',
  'brass-anthem',
  'ambient-drone',
] as const

export type MusicTrackId = (typeof MUSIC_TRACK_IDS)[number]
/** A music selection, including turning music off without losing the pack. */
export type MusicChoice = MusicTrackId | 'off'

export const EFFECT_PACK_IDS = ['heavy-naval', 'classic', 'minimal'] as const

export type EffectPackId = (typeof EFFECT_PACK_IDS)[number]
export type EffectChoice = EffectPackId | 'off'

export interface AudioSettings {
  musicTrack: MusicChoice
  effectPack: EffectChoice
  /** 0-1 multiplier on the music bus. */
  musicVolume: number
  /** 0-1 multiplier on the effects bus. */
  effectsVolume: number
}

export interface AudioOption<Id> {
  id: Id
  label: string
  description: string
}

export const MUSIC_OPTIONS: AudioOption<MusicChoice>[] = [
  {
    id: 'solemn-march',
    label: 'Solemn march',
    description: 'The original slow funeral dirge for the fleet.',
  },
  {
    id: 'brass-anthem',
    label: 'Brass anthem',
    description: 'A brisker major-key fanfare with a marching backbeat.',
  },
  {
    id: 'ambient-drone',
    label: 'Ambient drone',
    description: 'A low pedal bed with no percussion, for quiet planning.',
  },
  { id: 'off', label: 'Off', description: 'No menu music.' },
]

export const EFFECT_OPTIONS: AudioOption<EffectChoice>[] = [
  {
    id: 'heavy-naval',
    label: 'Heavy naval',
    description: 'Layered artillery with long open-air reverb tails.',
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Lighter, shorter arcade-style blips and booms.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Short clicks and thuds with no reverb tail.',
  },
  { id: 'off', label: 'Off', description: 'No combat sound effects.' },
]

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicTrack: 'solemn-march',
  effectPack: 'heavy-naval',
  musicVolume: 0.6,
  effectsVolume: 0.9,
}

export const AUDIO_SETTINGS_STORAGE_KEY = 'battleship:audio-settings'

/** How an effect pack reshapes the shared synthesis in `player.ts`. */
export interface EffectPackParams {
  /** Overall level multiplier applied to every layer. */
  gainScale: number
  /** Multiplier on the length of body and tail layers. */
  tailScale: number
  /** Multiplier on the level of the initial transient crack. */
  transientScale: number
  /** Send level into the convolution reverb (0 disables the tail). */
  reverbSend: number
  /** Whether the decorative rumble, debris and groan layers play. */
  extraLayers: boolean
  /** Waveform used by the melodic blips and fanfares. */
  toneType: 'sine' | 'square' | 'sawtooth' | 'triangle'
}

const EFFECT_PACK_PARAMS: Record<EffectPackId, EffectPackParams> = {
  // Today's sound, unchanged: every multiplier is neutral.
  'heavy-naval': {
    gainScale: 1,
    tailScale: 1,
    transientScale: 1,
    reverbSend: 1,
    extraLayers: true,
    toneType: 'triangle',
  },
  classic: {
    gainScale: 0.85,
    tailScale: 0.4,
    transientScale: 1.15,
    reverbSend: 0.3,
    extraLayers: false,
    toneType: 'square',
  },
  minimal: {
    gainScale: 0.7,
    tailScale: 0.16,
    transientScale: 1.3,
    reverbSend: 0,
    extraLayers: false,
    toneType: 'square',
  },
}

export function effectPackParams(id: EffectPackId): EffectPackParams {
  return EFFECT_PACK_PARAMS[id]
}

export function clampVolume(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return 1
  return Math.min(1, Math.max(0, numeric))
}

function isMusicChoice(value: unknown): value is MusicChoice {
  return (
    value === 'off' || MUSIC_TRACK_IDS.includes(value as MusicTrackId)
  )
}

function isEffectChoice(value: unknown): value is EffectChoice {
  return value === 'off' || EFFECT_PACK_IDS.includes(value as EffectPackId)
}

/**
 * Reads persisted settings, falling back to the defaults field by field so a
 * partial, stale or corrupt payload never breaks audio.
 */
export function parseAudioSettings(raw: string | null): AudioSettings {
  if (!raw) return { ...DEFAULT_AUDIO_SETTINGS }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ...DEFAULT_AUDIO_SETTINGS }
  }
  const record = parsed as Record<string, unknown>
  return {
    musicTrack: isMusicChoice(record.musicTrack)
      ? record.musicTrack
      : DEFAULT_AUDIO_SETTINGS.musicTrack,
    effectPack: isEffectChoice(record.effectPack)
      ? record.effectPack
      : DEFAULT_AUDIO_SETTINGS.effectPack,
    musicVolume:
      record.musicVolume === undefined
        ? DEFAULT_AUDIO_SETTINGS.musicVolume
        : clampVolume(record.musicVolume),
    effectsVolume:
      record.effectsVolume === undefined
        ? DEFAULT_AUDIO_SETTINGS.effectsVolume
        : clampVolume(record.effectsVolume),
  }
}

export function serializeAudioSettings(settings: AudioSettings): string {
  return JSON.stringify(settings)
}
