import { useCallback, useEffect, useState } from 'react'
import { soundPlayer } from './player'
import type { AudioSettings } from './settings'
import {
  AUDIO_SETTINGS_STORAGE_KEY,
  parseAudioSettings,
  serializeAudioSettings,
} from './settings'

function readInitial(): AudioSettings {
  if (typeof localStorage === 'undefined') return parseAudioSettings(null)
  return parseAudioSettings(localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY))
}

export interface AudioSettingsController {
  settings: AudioSettings
  update: (patch: Partial<AudioSettings>) => void
}

/**
 * Holds the player's audio selections, pushing them into the sound player and
 * persisting them so they survive a reload. Independent of the mute toggle:
 * muting silences the player without discarding these choices.
 */
export function useAudioSettings(): AudioSettingsController {
  const [settings, setSettings] = useState<AudioSettings>(readInitial)

  useEffect(() => {
    soundPlayer.setEffectPack(settings.effectPack)
    soundPlayer.setVolumes(settings.musicVolume, settings.effectsVolume)
    soundPlayer.setMusicTrack(settings.musicTrack)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        AUDIO_SETTINGS_STORAGE_KEY,
        serializeAudioSettings(settings),
      )
    }
  }, [settings])

  const update = useCallback((patch: Partial<AudioSettings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  return { settings, update }
}
