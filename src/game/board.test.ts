import { describe, expect, it } from 'vitest'
import {
  applyShot,
  canPlaceShip,
  createEmptyBoard,
  isFleetDestroyed,
  isShotAllowed,
  placeFleetRandomly,
  placeShip,
  remainingShips,
  shipCells,
} from './board'
import { BOARD_SIZE, FLEET } from './constants'
import { seededRandom } from '../test/random'

describe('createEmptyBoard', () => {
  it('creates a 10x10 grid of empty cells with no ships', () => {
    const board = createEmptyBoard()
    expect(board.grid).toHaveLength(BOARD_SIZE)
    expect(board.grid.every((row) => row.length === BOARD_SIZE)).toBe(true)
    expect(board.grid.flat().every((cell) => cell === 'empty')).toBe(true)
    expect(board.ships).toEqual([])
  })
})

describe('shipCells', () => {
  it('lays cells out along the chosen orientation', () => {
    expect(shipCells({ row: 2, col: 3 }, 3, 'horizontal')).toEqual([
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ])
    expect(shipCells({ row: 2, col: 3 }, 2, 'vertical')).toEqual([
      { row: 2, col: 3 },
      { row: 3, col: 3 },
    ])
  })
})

describe('canPlaceShip', () => {
  const board = placeShip(
    createEmptyBoard(),
    { name: 'Destroyer', size: 2 },
    { row: 0, col: 0 },
    'horizontal',
  )

  it('rejects placements that run off the board', () => {
    expect(canPlaceShip(board, { row: 0, col: 8 }, 3, 'horizontal')).toBe(false)
    expect(canPlaceShip(board, { row: 8, col: 0 }, 3, 'vertical')).toBe(false)
  })

  it('rejects placements that overlap an existing ship', () => {
    expect(canPlaceShip(board, { row: 0, col: 1 }, 3, 'horizontal')).toBe(false)
  })

  it('accepts placements on free water', () => {
    expect(canPlaceShip(board, { row: 5, col: 5 }, 4, 'horizontal')).toBe(true)
  })
})

describe('placeShip', () => {
  it('does not mutate the source board', () => {
    const board = createEmptyBoard()
    placeShip(board, { name: 'Destroyer', size: 2 }, { row: 0, col: 0 }, 'horizontal')
    expect(board.ships).toHaveLength(0)
    expect(board.grid[0][0]).toBe('empty')
  })

  it('throws on an invalid placement', () => {
    expect(() =>
      placeShip(
        createEmptyBoard(),
        { name: 'Carrier', size: 5 },
        { row: 0, col: 7 },
        'horizontal',
      ),
    ).toThrow()
  })
})

describe('placeFleetRandomly', () => {
  it('places every ship without overlap, for many seeds', () => {
    for (let seed = 0; seed < 100; seed++) {
      const board = placeFleetRandomly(FLEET, BOARD_SIZE, seededRandom(seed))
      const occupied = board.grid.flat().filter((cell) => cell === 'ship').length
      const expected = FLEET.reduce((sum, ship) => sum + ship.size, 0)

      expect(board.ships).toHaveLength(FLEET.length)
      expect(occupied).toBe(expected)
      for (const ship of board.ships) {
        expect(ship.cells).toHaveLength(ship.size)
        expect(ship.hits).toBe(0)
        for (const cell of ship.cells) {
          expect(board.grid[cell.row][cell.col]).toBe('ship')
        }
      }
    }
  })

  it('is deterministic for a given seed', () => {
    const a = placeFleetRandomly(FLEET, BOARD_SIZE, seededRandom(42))
    const b = placeFleetRandomly(FLEET, BOARD_SIZE, seededRandom(42))
    expect(a.ships).toEqual(b.ships)
  })
})

describe('applyShot', () => {
  const base = placeShip(
    createEmptyBoard(),
    { name: 'Destroyer', size: 2 },
    { row: 4, col: 4 },
    'horizontal',
  )

  it('marks a miss on open water', () => {
    const outcome = applyShot(base, { row: 0, col: 0 })
    expect(outcome.result).toBe('miss')
    expect(outcome.board.grid[0][0]).toBe('miss')
    expect(outcome.ship).toBeNull()
  })

  it('marks a hit and increments the ship hit count', () => {
    const outcome = applyShot(base, { row: 4, col: 4 })
    expect(outcome.result).toBe('hit')
    expect(outcome.board.grid[4][4]).toBe('hit')
    expect(outcome.ship?.hits).toBe(1)
  })

  it('reports a sunk ship once every cell is hit', () => {
    const first = applyShot(base, { row: 4, col: 4 })
    const second = applyShot(first.board, { row: 4, col: 5 })
    expect(second.result).toBe('sunk')
    expect(second.ship?.name).toBe('Destroyer')
    expect(isFleetDestroyed(second.board)).toBe(true)
    expect(remainingShips(second.board)).toEqual([])
  })

  it('rejects repeat shots on the same cell', () => {
    const first = applyShot(base, { row: 0, col: 0 })
    expect(isShotAllowed(first.board, { row: 0, col: 0 })).toBe(false)
    expect(() => applyShot(first.board, { row: 0, col: 0 })).toThrow()
  })

  it('rejects out-of-bounds shots', () => {
    expect(() => applyShot(base, { row: -1, col: 0 })).toThrow()
    expect(() => applyShot(base, { row: 0, col: BOARD_SIZE })).toThrow()
  })

  it('does not mutate the source board', () => {
    applyShot(base, { row: 4, col: 4 })
    expect(base.grid[4][4]).toBe('ship')
    expect(base.ships[0].hits).toBe(0)
  })
})

describe('isFleetDestroyed', () => {
  it('is false for a board with no ships', () => {
    expect(isFleetDestroyed(createEmptyBoard())).toBe(false)
  })
})
