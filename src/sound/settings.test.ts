import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AUDIO_SETTINGS,
  EFFECT_OPTIONS,
  EFFECT_PACK_IDS,
  MUSIC_OPTIONS,
  MUSIC_TRACK_IDS,
  clampVolume,
  effectPackParams,
  parseAudioSettings,
  serializeAudioSettings,
} from './settings'

describe('audio options', () => {
  it('offers at least three music tracks plus off', () => {
    expect(MUSIC_TRACK_IDS.length).toBeGreaterThanOrEqual(3)
    expect(MUSIC_OPTIONS).toHaveLength(MUSIC_TRACK_IDS.length + 1)
    expect(MUSIC_OPTIONS.at(-1)?.id).toBe('off')
  })

  it('offers at least three effect packs plus off', () => {
    expect(EFFECT_PACK_IDS.length).toBeGreaterThanOrEqual(3)
    expect(EFFECT_OPTIONS).toHaveLength(EFFECT_PACK_IDS.length + 1)
    expect(EFFECT_OPTIONS.at(-1)?.id).toBe('off')
  })

  it('defaults to the original march and heavy naval guns', () => {
    expect(DEFAULT_AUDIO_SETTINGS.musicTrack).toBe('solemn-march')
    expect(DEFAULT_AUDIO_SETTINGS.effectPack).toBe('heavy-naval')
  })
})

describe('effectPackParams', () => {
  it('leaves the default heavy pack unscaled', () => {
    expect(effectPackParams('heavy-naval')).toEqual({
      gainScale: 1,
      tailScale: 1,
      transientScale: 1,
      reverbSend: 1,
      extraLayers: true,
      toneType: 'triangle',
    })
  })

  it('shortens tails and drops layers for the lighter packs', () => {
    const heavy = effectPackParams('heavy-naval')
    const classic = effectPackParams('classic')
    const minimal = effectPackParams('minimal')

    expect(classic.tailScale).toBeLessThan(heavy.tailScale)
    expect(minimal.tailScale).toBeLessThan(classic.tailScale)
    expect(classic.reverbSend).toBeLessThan(heavy.reverbSend)
    expect(minimal.reverbSend).toBe(0)
    expect(classic.extraLayers).toBe(false)
    expect(minimal.extraLayers).toBe(false)
  })

  it('describes every pack', () => {
    for (const id of EFFECT_PACK_IDS) {
      expect(effectPackParams(id).tailScale).toBeGreaterThan(0)
    }
  })
})

describe('clampVolume', () => {
  it('keeps values inside 0-1', () => {
    expect(clampVolume(0.5)).toBe(0.5)
    expect(clampVolume(-3)).toBe(0)
    expect(clampVolume(42)).toBe(1)
  })

  it('falls back to full volume for junk', () => {
    expect(clampVolume('loud')).toBe(1)
    expect(clampVolume(undefined)).toBe(1)
    expect(clampVolume(Number.NaN)).toBe(1)
  })
})

describe('parseAudioSettings', () => {
  it('returns the defaults when nothing is stored', () => {
    expect(parseAudioSettings(null)).toEqual(DEFAULT_AUDIO_SETTINGS)
  })

  it('returns the defaults for unparseable payloads', () => {
    expect(parseAudioSettings('{oops')).toEqual(DEFAULT_AUDIO_SETTINGS)
    expect(parseAudioSettings('"a string"')).toEqual(DEFAULT_AUDIO_SETTINGS)
    expect(parseAudioSettings('null')).toEqual(DEFAULT_AUDIO_SETTINGS)
  })

  it('round-trips a full selection', () => {
    const settings = {
      musicTrack: 'ambient-drone' as const,
      effectPack: 'minimal' as const,
      musicVolume: 0.25,
      effectsVolume: 0,
    }
    expect(parseAudioSettings(serializeAudioSettings(settings))).toEqual(
      settings,
    )
  })

  it('keeps off selections', () => {
    const parsed = parseAudioSettings(
      JSON.stringify({ musicTrack: 'off', effectPack: 'off' }),
    )
    expect(parsed.musicTrack).toBe('off')
    expect(parsed.effectPack).toBe('off')
  })

  it('replaces unknown selections field by field', () => {
    const parsed = parseAudioSettings(
      JSON.stringify({
        musicTrack: 'polka',
        effectPack: 'classic',
        musicVolume: 0.1,
      }),
    )
    expect(parsed).toEqual({
      musicTrack: DEFAULT_AUDIO_SETTINGS.musicTrack,
      effectPack: 'classic',
      musicVolume: 0.1,
      effectsVolume: DEFAULT_AUDIO_SETTINGS.effectsVolume,
    })
  })

  it('clamps out-of-range volumes', () => {
    const parsed = parseAudioSettings(
      JSON.stringify({ musicVolume: 5, effectsVolume: -1 }),
    )
    expect(parsed.musicVolume).toBe(1)
    expect(parsed.effectsVolume).toBe(0)
  })
})
