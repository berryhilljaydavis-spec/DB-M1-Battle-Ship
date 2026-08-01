import { describe, expect, it } from 'vitest'
import { availableTargets, chooseAiMove } from './ai'
import { applyShot, createEmptyBoard } from './board'
import { BOARD_SIZE } from './constants'
import { seededRandom } from '../test/random'
import type { Board, Coord } from './types'

function shootEverywhereExcept(board: Board, keep: Coord[]): Board {
  let current = board
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (keep.some((c) => c.row === row && c.col === col)) continue
      current = applyShot(current, { row, col }).board
    }
  }
  return current
}

describe('availableTargets', () => {
  it('starts with every cell on the board', () => {
    expect(availableTargets(createEmptyBoard())).toHaveLength(
      BOARD_SIZE * BOARD_SIZE,
    )
  })

  it('excludes cells that were already fired at', () => {
    const board = applyShot(createEmptyBoard(), { row: 3, col: 7 }).board
    const targets = availableTargets(board)
    expect(targets).toHaveLength(BOARD_SIZE * BOARD_SIZE - 1)
    expect(targets).not.toContainEqual({ row: 3, col: 7 })
  })
})

describe('chooseAiMove', () => {
  it('never repeats a shot when driving a full game', () => {
    const random = seededRandom(7)
    let board = createEmptyBoard()
    const seen = new Set<string>()

    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
      const move = chooseAiMove(board, random)
      expect(move).not.toBeNull()
      const key = `${move!.row},${move!.col}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
      board = applyShot(board, move!).board
    }

    expect(chooseAiMove(board, random)).toBeNull()
  })

  it('picks the only remaining cell when one is left', () => {
    const last = { row: 9, col: 2 }
    const board = shootEverywhereExcept(createEmptyBoard(), [last])
    expect(chooseAiMove(board, seededRandom(1))).toEqual(last)
  })

  it('produces a roughly uniform spread of first moves', () => {
    const random = seededRandom(99)
    const board = createEmptyBoard()
    const counts = new Map<string, number>()

    for (let i = 0; i < 2000; i++) {
      const move = chooseAiMove(board, random)!
      const key = `${move.row},${move.col}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    expect(counts.size).toBeGreaterThan(80)
    expect(Math.max(...counts.values())).toBeLessThan(100)
  })
})
