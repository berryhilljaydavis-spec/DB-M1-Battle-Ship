import { canPlaceShip, createEmptyBoard, placeShip } from './board'
import { FLEET } from './constants'
import type { Board, Coord, Orientation, Ship } from './types'

export function shipOrientation(ship: Ship): Orientation {
  if (ship.cells.length < 2) return 'horizontal'
  return ship.cells[0].row === ship.cells[1].row ? 'horizontal' : 'vertical'
}

export function findShipAt(board: Board, coord: Coord): Ship | null {
  return (
    board.ships.find((ship) =>
      ship.cells.some((c) => c.row === coord.row && c.col === coord.col),
    ) ?? null
  )
}

/** Index of a coord inside a ship, or -1 when the coord is not part of it. */
export function cellIndexInShip(ship: Ship, coord: Coord): number {
  return ship.cells.findIndex(
    (c) => c.row === coord.row && c.col === coord.col,
  )
}

function fleetOrder(name: string): number {
  const index = FLEET.findIndex((spec) => spec.name === name)
  return index === -1 ? FLEET.length : index
}

function rebuild(ships: Ship[], size: number): Board {
  const board = createEmptyBoard(size)
  const ordered = [...ships].sort(
    (a, b) => fleetOrder(a.name) - fleetOrder(b.name),
  )
  for (const ship of ordered) {
    for (const cell of ship.cells) {
      board.grid[cell.row][cell.col] = 'ship'
    }
  }
  return { grid: board.grid, ships: ordered }
}

export function boardWithoutShip(board: Board, name: string): Board {
  return rebuild(
    board.ships.filter((ship) => ship.name !== name),
    board.grid.length,
  )
}

/** Moves a ship so its first cell sits at `start`. Returns null if blocked. */
export function moveShip(
  board: Board,
  name: string,
  start: Coord,
  orientation: Orientation,
): Board | null {
  const ship = board.ships.find((candidate) => candidate.name === name)
  if (!ship) return null

  const without = boardWithoutShip(board, name)
  if (!canPlaceShip(without, start, ship.size, orientation)) return null

  const placed = placeShip(
    without,
    { name: ship.name, size: ship.size },
    start,
    orientation,
  )
  return rebuild(placed.ships, board.grid.length)
}

/** Turns a ship to face `orientation`, leaving it alone if it already does. */
export function orientShip(
  board: Board,
  name: string,
  orientation: Orientation,
): Board | null {
  const ship = board.ships.find((candidate) => candidate.name === name)
  if (!ship) return null
  if (shipOrientation(ship) === orientation) return board
  return rotateShip(board, name)
}

function center(cells: Coord[]): { row: number; col: number } {
  const last = cells[cells.length - 1]
  return {
    row: (cells[0].row + last.row) / 2,
    col: (cells[0].col + last.col) / 2,
  }
}

function startCells(
  start: Coord,
  size: number,
  orientation: Orientation,
): Coord[] {
  return Array.from({ length: size }, (_, index) =>
    orientation === 'horizontal'
      ? { row: start.row, col: start.col + index }
      : { row: start.row + index, col: start.col },
  )
}

/**
 * Turns a ship to its other facing, pivoting around its centre and falling
 * back to the nearest square that fits, so a ship by an edge or wedged
 * against a neighbour still turns instead of refusing to move.
 */
export function rotateShip(board: Board, name: string): Board | null {
  const ship = board.ships.find((candidate) => candidate.name === name)
  if (!ship) return null

  const next: Orientation =
    shipOrientation(ship) === 'horizontal' ? 'vertical' : 'horizontal'
  const size = board.grid.length
  const from = center(ship.cells)

  const drift = (start: Coord) => {
    const to = center(startCells(start, ship.size, next))
    return (to.row - from.row) ** 2 + (to.col - from.col) ** 2
  }

  const candidates: Coord[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const start = { row, col }
      if (drift(start) <= ship.size ** 2) candidates.push(start)
    }
  }
  candidates.sort((a, b) => drift(a) - drift(b))

  for (const start of candidates) {
    const moved = moveShip(board, name, start, next)
    if (moved) return moved
  }
  return null
}
