import { isShipSunk } from '../game/board'
import type { GameState } from '../game/engine'
import type { Board, CellState } from '../game/types'

/** Every distinct sound the game can play. */
export type SoundName =
  | 'fire'
  | 'hit'
  | 'miss'
  | 'sunk'
  | 'victory'
  | 'defeat'
  | 'start'
  | 'place'
  | 'rotate'

function countCells(board: Board, state: CellState): number {
  let total = 0
  for (const row of board.grid) {
    for (const cell of row) {
      if (cell === state) total += 1
    }
  }
  return total
}

function sunkShips(board: Board): number {
  return board.ships.filter(isShipSunk).length
}

/** Sounds triggered by a single shot landing on one of the boards. */
function shotSounds(before: Board, after: Board): SoundName[] {
  const hitDelta = countCells(after, 'hit') - countCells(before, 'hit')
  const missDelta = countCells(after, 'miss') - countCells(before, 'miss')
  if (hitDelta <= 0 && missDelta <= 0) return []

  const impact: SoundName =
    sunkShips(after) > sunkShips(before) ? 'sunk' : hitDelta > 0 ? 'hit' : 'miss'
  return ['fire', impact]
}

/**
 * Derives the sound effects to play for a game-state transition. Pure so the
 * mapping from gameplay events to audio can be unit-tested without an
 * AudioContext.
 */
export function soundsForTransition(
  prev: GameState,
  next: GameState,
): SoundName[] {
  const sounds: SoundName[] = []

  if (prev.phase === 'placement' && next.phase !== 'placement') {
    sounds.push('start')
  }

  sounds.push(...shotSounds(prev.aiBoard, next.aiBoard))
  sounds.push(...shotSounds(prev.humanBoard, next.humanBoard))

  if (prev.phase !== 'game-over' && next.phase === 'game-over') {
    sounds.push(next.winner === 'human' ? 'victory' : 'defeat')
  }

  return sounds
}
