import { useEffect } from 'react'
import { soundPlayer } from './player'

/**
 * Plays the looping march while the main menu is open. Browsers block audio
 * until the page has been interacted with, so the first pointer or key event
 * retries the start.
 */
export function useMenuMusic(active: boolean): void {
  useEffect(() => {
    if (!active) return

    soundPlayer.startMusic()
    const retry = () => soundPlayer.startMusic()
    window.addEventListener('pointerdown', retry)
    window.addEventListener('keydown', retry)

    return () => {
      window.removeEventListener('pointerdown', retry)
      window.removeEventListener('keydown', retry)
      soundPlayer.stopMusic()
    }
  }, [active])
}
