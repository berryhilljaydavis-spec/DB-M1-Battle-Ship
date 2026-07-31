import { BOARD_SIZE, FLEET } from './constants'
import type {
  Board,
  Coord,
  Orientation,
  RandomFn,
  Ship,
  ShipSpec,
  ShotOutcome,
  ShotResult,
} from './types'

export function createEmptyBoard(size: number = BOARD_SIZE): Board {
  return {
    grid: Array.from({ length: size }, () =>
      Array.from({ length: size }, () => 'empty' as const),
    ),
    ships: [],
  }
}

export function inBounds(coord: Coord, size: number = BOARD_SIZE): boolean {
  return (
    coord.row >= 0 && coord.row < size && coord.col >= 0 && coord.col < size
  )
}

export function shipCells(
  start: Coord,
  size: number,
  orientation: Orientation,
): Coord[] {
  return Array.from({ length: size }, (_, i) =>
    orientation === 'horizontal'
      ? { row: start.row, col: start.col + i }
      : { row: start.row + i, col: start.col },
  )
}

export function canPlaceShip(
  board: Board,
  start: Coord,
  size: number,
  orientation: Orientation,
): boolean {
  const boardSize = board.grid.length
  return shipCells(start, size, orientation).every(
    (cell) =>
      inBounds(cell, boardSize) && board.grid[cell.row][cell.col] === 'empty',
  )
}

/** Returns a new board with the ship placed. Throws if the placement is invalid. */
export function placeShip(
  board: Board,
  spec: ShipSpec,
  start: Coord,
  orientation: Orientation,
): Board {
  if (!canPlaceShip(board, start, spec.size, orientation)) {
    throw new Error(`Cannot place ${spec.name} at ${start.row},${start.col}`)
  }
  const cells = shipCells(start, spec.size, orientation)
  const grid = board.grid.map((row) => [...row])
  for (const cell of cells) {
    grid[cell.row][cell.col] = 'ship'
  }
  const ship: Ship = { ...spec, cells, hits: 0 }
  return { grid, ships: [...board.ships, ship] }
}

export function placeFleetRandomly(
  fleet: readonly ShipSpec[] = FLEET,
  size: number = BOARD_SIZE,
  random: RandomFn = Math.random,
): Board {
  let board = createEmptyBoard(size)
  for (const spec of fleet) {
    const options: { start: Coord; orientation: Orientation }[] = []
    for (const orientation of ['horizontal', 'vertical'] as const) {
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const start = { row, col }
          if (canPlaceShip(board, start, spec.size, orientation)) {
            options.push({ start, orientation })
          }
        }
      }
    }
    if (options.length === 0) {
      throw new Error(`No valid placement left for ${spec.name}`)
    }
    const pick = options[Math.floor(random() * options.length)]
    board = placeShip(board, spec, pick.start, pick.orientation)
  }
  return board
}

export function isShotAllowed(board: Board, coord: Coord): boolean {
  if (!inBounds(coord, board.grid.length)) return false
  const state = board.grid[coord.row][coord.col]
  return state === 'empty' || state === 'ship'
}

/** Applies a shot to a board, returning a new board plus the outcome. */
export function applyShot(board: Board, coord: Coord): ShotOutcome {
  if (!isShotAllowed(board, coord)) {
    throw new Error(`Invalid shot at ${coord.row},${coord.col}`)
  }
  const grid = board.grid.map((row) => [...row])
  const isHit = grid[coord.row][coord.col] === 'ship'
  grid[coord.row][coord.col] = isHit ? 'hit' : 'miss'

  const targetIndex = board.ships.findIndex((ship) =>
    ship.cells.some((c) => c.row === coord.row && c.col === coord.col),
  )
  const ships = board.ships.map((ship, index) =>
    index === targetIndex ? { ...ship, hits: ship.hits + 1 } : ship,
  )
  const hitShip = targetIndex === -1 ? null : ships[targetIndex]

  const result: ShotResult = !isHit
    ? 'miss'
    : hitShip && hitShip.hits >= hitShip.size
      ? 'sunk'
      : 'hit'

  return { board: { grid, ships }, result, ship: hitShip }
}

export function isShipSunk(ship: Ship): boolean {
  return ship.hits >= ship.size
}

export function isFleetDestroyed(board: Board): boolean {
  return board.ships.length > 0 && board.ships.every(isShipSunk)
}

export function remainingShips(board: Board): Ship[] {
  return board.ships.filter((ship) => !isShipSunk(ship))
}
