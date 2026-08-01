import { useCallback, useEffect, useState } from 'react'
import { isShotAllowed, placeFleetRandomly } from '../game/board'
import {
  aiFire,
  createGame,
  humanFire,
  startBattle as startBattleTurn,
} from '../game/engine'
import type { GameState } from '../game/engine'
import {
  cellIndexInShip,
  findShipAt,
  moveShip,
  rotateShip,
  shipOrientation,
} from '../game/placement'
import type { Coord } from '../game/types'
import { soundPlayer } from '../sound/player'

export const AI_TURN_DELAY_MS = 600

/** The ship being repositioned, plus which of its cells was grabbed. */
export interface Selection {
  name: string
  offset: number
}

export interface Battleship {
  state: GameState
  selection: Selection | null
  fireAt: (coord: Coord) => void
  /** Placement click: selects a ship, or drops the selected one at `coord`. */
  placeAt: (coord: Coord) => void
  grabAt: (coord: Coord) => void
  rotateSelection: () => void
  randomizeFleet: () => void
  startBattle: () => void
  restart: () => void
}

export function useBattleship(): Battleship {
  const [state, setState] = useState<GameState>(() => createGame())
  const [selection, setSelection] = useState<Selection | null>(null)

  const fireAt = useCallback((coord: Coord) => {
    setState((current) =>
      current.phase === 'human-turn' && isShotAllowed(current.aiBoard, coord)
        ? humanFire(current, coord)
        : current,
    )
  }, [])

  const isPlacing = state.phase === 'placement'
  const humanBoard = state.humanBoard

  const grabAt = useCallback(
    (coord: Coord) => {
      if (!isPlacing) return
      const ship = findShipAt(humanBoard, coord)
      setSelection(
        ship ? { name: ship.name, offset: cellIndexInShip(ship, coord) } : null,
      )
    },
    [isPlacing, humanBoard],
  )

  const placeAt = useCallback(
    (coord: Coord) => {
      if (!isPlacing) return

      const selected = selection
        ? humanBoard.ships.find((ship) => ship.name === selection.name)
        : null
      if (!selection || !selected) {
        grabAt(coord)
        return
      }

      const orientation = shipOrientation(selected)
      const start =
        orientation === 'horizontal'
          ? { row: coord.row, col: coord.col - selection.offset }
          : { row: coord.row - selection.offset, col: coord.col }
      const moved = moveShip(humanBoard, selected.name, start, orientation)

      if (moved) {
        soundPlayer.play('place')
        setState((current) => ({ ...current, humanBoard: moved }))
        return
      }

      const other = findShipAt(humanBoard, coord)
      if (other && other.name !== selected.name) grabAt(coord)
    },
    [isPlacing, humanBoard, selection, grabAt],
  )

  const rotateSelection = useCallback(() => {
    if (!isPlacing || !selection) return
    const rotated = rotateShip(humanBoard, selection.name)
    if (!rotated) return
    soundPlayer.play('rotate')
    setSelection({ name: selection.name, offset: 0 })
    setState((current) => ({ ...current, humanBoard: rotated }))
  }, [isPlacing, humanBoard, selection])

  const randomizeFleet = useCallback(() => {
    if (!isPlacing) return
    soundPlayer.play('place')
    setSelection(null)
    setState((current) => ({ ...current, humanBoard: placeFleetRandomly() }))
  }, [isPlacing])

  const startBattle = useCallback(() => {
    setState((current) => startBattleTurn(current))
    setSelection(null)
  }, [])

  const restart = useCallback(() => {
    setState(createGame())
    setSelection(null)
  }, [])

  useEffect(() => {
    if (state.phase !== 'ai-turn') return
    const timer = setTimeout(
      () => setState((current) => aiFire(current)),
      AI_TURN_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [state.phase])

  return {
    state,
    selection,
    fireAt,
    placeAt,
    grabAt,
    rotateSelection,
    randomizeFleet,
    startBattle,
    restart,
  }
}
