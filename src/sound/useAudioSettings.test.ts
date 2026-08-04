import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAudioSettings } from './useAudioSettings'
import {
  AUDIO_SETTINGS_STORAGE_KEY,
  DEFAULT_AUDIO_SETTINGS,
  parseAudioSettings,
} from './settings'

describe('useAudioSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts from the defaults and persists them', () => {
    const { result } = renderHook(() => useAudioSettings())
    expect(result.current.settings).toEqual(DEFAULT_AUDIO_SETTINGS)
    expect(
      parseAudioSettings(localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY)),
    ).toEqual(DEFAULT_AUDIO_SETTINGS)
  })

  it('persists a patched selection and restores it on the next mount', () => {
    const first = renderHook(() => useAudioSettings())
    act(() => first.result.current.update({ effectPack: 'minimal' }))
    act(() => first.result.current.update({ musicVolume: 0.2 }))
    first.unmount()

    const { result } = renderHook(() => useAudioSettings())
    expect(result.current.settings).toEqual({
      ...DEFAULT_AUDIO_SETTINGS,
      effectPack: 'minimal',
      musicVolume: 0.2,
    })
  })

  it('ignores a corrupt stored payload', () => {
    localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, 'not json')
    const { result } = renderHook(() => useAudioSettings())
    expect(result.current.settings).toEqual(DEFAULT_AUDIO_SETTINGS)
  })
})
