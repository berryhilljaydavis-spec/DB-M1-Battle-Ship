import { useEffect, useRef } from 'react'
import type { GameState } from '../game/engine'
import { soundsForTransition } from './events'
import { soundPlayer } from './player'

/** Plays combat sound effects in response to game-state transitions. */
export function useGameSounds(state: GameState): void {
  const previous = useRef(state)

  useEffect(() => {
    const prev = previous.current
    previous.current = state
    if (prev === state) return
    for (const sound of soundsForTransition(prev, state)) {
      soundPlayer.play(sound)
    }
  }, [state])
}
