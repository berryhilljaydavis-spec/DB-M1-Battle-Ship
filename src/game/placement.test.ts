import { describe, expect, it } from 'vitest'
import { createEmptyBoard, placeShip } from './board'
import {
  boardWithoutShip,
  cellIndexInShip,
  findShipAt,
  moveShip,
  orientShip,
  rotateShip,
  shipOrientation,
} from './placement'
import type { Board } from './types'

const destroyer = { name: 'Destroyer', size: 2 }
const cruiser = { name: 'Cruiser', size: 3 }

function boardWithCruiser(): Board {
  return placeShip(createEmptyBoard(), cruiser, { row: 4, col: 4 }, 'horizontal')
}

describe('shipOrientation', () => {
  it('reads the orientation from the ship cells', () => {
    const horizontal = boardWithCruiser().ships[0]
    const vertical = placeShip(
      createEmptyBoard(),
      cruiser,
      { row: 0, col: 0 },
      'vertical',
    ).ships[0]

    expect(shipOrientation(horizontal)).toBe('horizontal')
    expect(shipOrientation(vertical)).toBe('vertical')
  })
})

describe('findShipAt / cellIndexInShip', () => {
  it('locates a ship and the grabbed segment', () => {
    const board = boardWithCruiser()
    const ship = findShipAt(board, { row: 4, col: 5 })
    expect(ship?.name).toBe('Cruiser')
    expect(cellIndexInShip(ship!, { row: 4, col: 5 })).toBe(1)
    expect(findShipAt(board, { row: 0, col: 0 })).toBeNull()
  })
})

describe('boardWithoutShip', () => {
  it('clears the ship cells from the grid', () => {
    const board = boardWithoutShip(boardWithCruiser(), 'Cruiser')
    expect(board.ships).toHaveLength(0)
    expect(board.grid.flat().every((cell) => cell === 'empty')).toBe(true)
  })
})

describe('moveShip', () => {
  it('repositions a ship and keeps the fleet size', () => {
    const moved = moveShip(
      boardWithCruiser(),
      'Cruiser',
      { row: 0, col: 0 },
      'vertical',
    )
    expect(moved).not.toBeNull()
    expect(moved!.ships).toHaveLength(1)
    expect(moved!.grid[0][0]).toBe('ship')
    expect(moved!.grid[2][0]).toBe('ship')
    expect(moved!.grid[4][4]).toBe('empty')
  })

  it('refuses moves that leave the board', () => {
    expect(
      moveShip(boardWithCruiser(), 'Cruiser', { row: 4, col: 9 }, 'horizontal'),
    ).toBeNull()
  })

  it('refuses moves that overlap another ship', () => {
    const board = placeShip(
      boardWithCruiser(),
      destroyer,
      { row: 0, col: 0 },
      'horizontal',
    )
    expect(
      moveShip(board, 'Cruiser', { row: 0, col: 0 }, 'horizontal'),
    ).toBeNull()
  })

  it('allows a ship to overlap its own previous cells', () => {
    const moved = moveShip(
      boardWithCruiser(),
      'Cruiser',
      { row: 4, col: 5 },
      'horizontal',
    )
    expect(moved).not.toBeNull()
    expect(moved!.grid[4][4]).toBe('empty')
    expect(moved!.grid[4][7]).toBe('ship')
  })
})

describe('rotateShip', () => {
  it('flips the orientation around the ship centre', () => {
    const rotated = rotateShip(boardWithCruiser(), 'Cruiser')
    expect(rotated).not.toBeNull()
    expect(shipOrientation(rotated!.ships[0])).toBe('vertical')
    expect(rotated!.ships[0].cells).toEqual([
      { row: 3, col: 5 },
      { row: 4, col: 5 },
      { row: 5, col: 5 },
    ])
  })

  it('steps aside when the centred turn is blocked', () => {
    let board = boardWithCruiser()
    board = placeShip(board, destroyer, { row: 2, col: 5 }, 'vertical')
    const rotated = rotateShip(board, 'Cruiser')
    expect(rotated).not.toBeNull()

    const turned = rotated!.ships.find((ship) => ship.name === 'Cruiser')!
    expect(shipOrientation(turned)).toBe('vertical')
    expect(turned.cells).not.toContainEqual({ row: 3, col: 5 })
    expect(
      rotated!.ships.find((ship) => ship.name === 'Destroyer')!.cells,
    ).toEqual([
      { row: 2, col: 5 },
      { row: 3, col: 5 },
    ])
  })

  it('slides back into bounds when the pivot would overflow', () => {
    const board = placeShip(
      createEmptyBoard(),
      cruiser,
      { row: 9, col: 0 },
      'horizontal',
    )
    const rotated = rotateShip(board, 'Cruiser')
    expect(rotated).not.toBeNull()
    expect(shipOrientation(rotated!.ships[0])).toBe('vertical')
    expect(rotated!.ships[0].cells.map((c) => c.row)).toEqual([7, 8, 9])
  })

  it('returns null when no nearby square can hold the turned ship', () => {
    let board = placeShip(
      createEmptyBoard(3),
      cruiser,
      { row: 0, col: 0 },
      'horizontal',
    )
    board = placeShip(
      board,
      { name: 'Submarine', size: 3 },
      { row: 1, col: 0 },
      'horizontal',
    )
    board = placeShip(
      board,
      { name: 'Battleship', size: 3 },
      { row: 2, col: 0 },
      'horizontal',
    )
    expect(rotateShip(board, 'Cruiser')).toBeNull()
  })
})

describe('orientShip', () => {
  it('turns a ship to the requested orientation', () => {
    const board = placeShip(
      createEmptyBoard(),
      cruiser,
      { row: 4, col: 4 },
      'horizontal',
    )
    const turned = orientShip(board, 'Cruiser', 'vertical')
    expect(shipOrientation(turned!.ships[0])).toBe('vertical')
  })

  it('leaves a ship untouched when it already faces that way', () => {
    const board = placeShip(
      createEmptyBoard(),
      cruiser,
      { row: 4, col: 4 },
      'horizontal',
    )
    expect(orientShip(board, 'Cruiser', 'horizontal')).toBe(board)
  })

  it('returns null for an unknown ship', () => {
    expect(orientShip(createEmptyBoard(), 'Cruiser', 'vertical')).toBeNull()
  })
})
