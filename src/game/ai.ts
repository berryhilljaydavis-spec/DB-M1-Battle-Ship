import { isShotAllowed } from './board'
import type { Board, Coord, RandomFn } from './types'

export function availableTargets(board: Board): Coord[] {
  const targets: Coord[] = []
  for (let row = 0; row < board.grid.length; row++) {
    for (let col = 0; col < board.grid[row].length; col++) {
      const coord = { row, col }
      if (isShotAllowed(board, coord)) targets.push(coord)
    }
  }
  return targets
}

/** Picks a uniformly random cell that has not been fired at yet. */
export function chooseAiMove(
  board: Board,
  random: RandomFn = Math.random,
): Coord | null {
  const targets = availableTargets(board)
  if (targets.length === 0) return null
  return targets[Math.floor(random() * targets.length)]
}
