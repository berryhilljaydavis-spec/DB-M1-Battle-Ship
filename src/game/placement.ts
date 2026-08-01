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

/**
 * Flips a ship's orientation around its first cell, sliding it back along its
 * own length when the pivot would run off the board or into another ship.
 */
export function rotateShip(board: Board, name: string): Board | null {
  const ship = board.ships.find((candidate) => candidate.name === name)
  if (!ship) return null

  const next: Orientation =
    shipOrientation(ship) === 'horizontal' ? 'vertical' : 'horizontal'
  const head = ship.cells[0]

  for (let shift = 0; shift < ship.size; shift++) {
    const start =
      next === 'vertical'
        ? { row: head.row - shift, col: head.col }
        : { row: head.row, col: head.col - shift }
    const moved = moveShip(board, name, start, next)
    if (moved) return moved
  }
  return null
}
