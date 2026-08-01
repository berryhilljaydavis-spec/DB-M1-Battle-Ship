import { useCallback, useEffect, useState } from 'react'
import { soundPlayer } from './player'

const STORAGE_KEY = 'battleship:sound-enabled'

function readInitial(): boolean {
  if (typeof localStorage === 'undefined') return true
  return localStorage.getItem(STORAGE_KEY) !== 'off'
}

/** Tracks whether sound is enabled, syncing the player and localStorage. */
export function useSoundPreference(): [boolean, () => void] {
  const [enabled, setEnabled] = useState(readInitial)

  useEffect(() => {
    soundPlayer.setMuted(!enabled)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
    }
  }, [enabled])

  const toggle = useCallback(() => setEnabled((value) => !value), [])

  return [enabled, toggle]
}
