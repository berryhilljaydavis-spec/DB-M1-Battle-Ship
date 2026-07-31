import { useCallback, useEffect, useState } from 'react'
import { isShotAllowed } from '../game/board'
import { aiFire, createGame, humanFire } from '../game/engine'
import type { GameState } from '../game/engine'
import type { Coord } from '../game/types'

export const AI_TURN_DELAY_MS = 600

export interface Battleship {
  state: GameState
  fireAt: (coord: Coord) => void
  restart: () => void
}

export function useBattleship(): Battleship {
  const [state, setState] = useState<GameState>(() => createGame())

  const fireAt = useCallback((coord: Coord) => {
    setState((current) =>
      current.phase === 'human-turn' && isShotAllowed(current.aiBoard, coord)
        ? humanFire(current, coord)
        : current,
    )
  }, [])

  const restart = useCallback(() => setState(createGame()), [])

  useEffect(() => {
    if (state.phase !== 'ai-turn') return
    const timer = setTimeout(
      () => setState((current) => aiFire(current)),
      AI_TURN_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [state.phase])

  return { state, fireAt, restart }
}
