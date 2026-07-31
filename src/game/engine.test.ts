import { describe, expect, it } from 'vitest'
import { aiFire, createGame, humanFire } from './engine'
import type { GameState } from './engine'
import { createEmptyBoard, placeShip } from './board'
import { BOARD_SIZE, FLEET } from './constants'
import { seededRandom } from '../test/random'
import type { Coord } from './types'

function stateWithSingleShips(): GameState {
  const spec = { name: 'Destroyer', size: 2 }
  return {
    humanBoard: placeShip(createEmptyBoard(), spec, { row: 0, col: 0 }, 'horizontal'),
    aiBoard: placeShip(createEmptyBoard(), spec, { row: 0, col: 0 }, 'horizontal'),
    phase: 'human-turn',
    winner: null,
    log: [],
  }
}

describe('createGame', () => {
  it('deploys both fleets and gives the human the first turn', () => {
    const game = createGame(seededRandom(3))
    expect(game.humanBoard.ships).toHaveLength(FLEET.length)
    expect(game.aiBoard.ships).toHaveLength(FLEET.length)
    expect(game.phase).toBe('human-turn')
    expect(game.winner).toBeNull()
  })
})

describe('humanFire', () => {
  it('passes the turn to the AI after a shot', () => {
    const next = humanFire(stateWithSingleShips(), { row: 5, col: 5 })
    expect(next.phase).toBe('ai-turn')
    expect(next.aiBoard.grid[5][5]).toBe('miss')
    expect(next.log[0]).toContain('missed')
  })

  it('ignores shots taken out of turn', () => {
    const state: GameState = { ...stateWithSingleShips(), phase: 'ai-turn' }
    expect(humanFire(state, { row: 5, col: 5 })).toBe(state)
  })

  it('ends the game when the last enemy ship is sunk', () => {
    let state = stateWithSingleShips()
    state = humanFire(state, { row: 0, col: 0 })
    state = { ...state, phase: 'human-turn' }
    state = humanFire(state, { row: 0, col: 1 })

    expect(state.phase).toBe('game-over')
    expect(state.winner).toBe('human')
    expect(state.log[0]).toContain('You win')
  })
})

describe('aiFire', () => {
  it('only fires on its own turn', () => {
    const state = stateWithSingleShips()
    expect(aiFire(state, seededRandom(1))).toBe(state)
  })

  it('marks exactly one new cell on the human board', () => {
    const state: GameState = { ...stateWithSingleShips(), phase: 'ai-turn' }
    const next = aiFire(state, seededRandom(11))
    const marked = next.humanBoard.grid
      .flat()
      .filter((cell) => cell === 'hit' || cell === 'miss')
    expect(marked).toHaveLength(1)
    expect(next.phase).toBe('human-turn')
  })

  it('ends the game when the human fleet is destroyed', () => {
    let state: GameState = { ...stateWithSingleShips(), phase: 'ai-turn' }
    const random = seededRandom(5)
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE && state.phase !== 'game-over'; i++) {
      state = aiFire({ ...state, phase: 'ai-turn' }, random)
    }
    expect(state.phase).toBe('game-over')
    expect(state.winner).toBe('ai')
    expect(state.log[0]).toContain('You lose')
  })
})

describe('full game', () => {
  it('always terminates with exactly one winner', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const random = seededRandom(seed)
      let state = createGame(random)
      const shots: Coord[] = []
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) shots.push({ row, col })
      }

      for (const shot of shots) {
        if (state.phase === 'game-over') break
        if (state.phase === 'human-turn') state = humanFire(state, shot)
        if (state.phase === 'ai-turn') state = aiFire(state, random)
      }

      expect(state.phase).toBe('game-over')
      expect(state.winner).not.toBeNull()
    }
  })
})
