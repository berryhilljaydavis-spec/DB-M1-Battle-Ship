import { describe, expect, it } from 'vitest'
import { createEmptyBoard, placeShip } from '../game/board'
import { humanFire, startBattle } from '../game/engine'
import type { GameState } from '../game/engine'
import { soundsForTransition } from './events'

function battleState(): GameState {
  const spec = { name: 'Destroyer', size: 2 }
  return {
    humanBoard: placeShip(createEmptyBoard(), spec, { row: 0, col: 0 }, 'horizontal'),
    aiBoard: placeShip(createEmptyBoard(), spec, { row: 0, col: 0 }, 'horizontal'),
    phase: 'human-turn',
    winner: null,
    log: [],
  }
}

describe('soundsForTransition', () => {
  it('plays nothing when the state is unchanged', () => {
    const state = battleState()
    expect(soundsForTransition(state, state)).toEqual([])
  })

  it('plays a fire and miss for a shot into open water', () => {
    const state = battleState()
    const next = humanFire(state, { row: 5, col: 5 })
    expect(soundsForTransition(state, next)).toEqual(['fire', 'miss'])
  })

  it('plays a fire and hit when a ship is struck but not sunk', () => {
    const state = battleState()
    const next = humanFire(state, { row: 0, col: 0 })
    expect(soundsForTransition(state, next)).toEqual(['fire', 'hit'])
  })

  it('plays sunk then victory when the final enemy ship goes down', () => {
    let state = battleState()
    state = humanFire(state, { row: 0, col: 0 })
    const before = { ...state, phase: 'human-turn' as const }
    const after = humanFire(before, { row: 0, col: 1 })
    expect(soundsForTransition(before, after)).toEqual(['fire', 'sunk', 'victory'])
  })

  it('plays a start fanfare when the battle begins', () => {
    const placement: GameState = { ...battleState(), phase: 'placement' }
    expect(soundsForTransition(placement, startBattle(placement))).toEqual([
      'start',
    ])
  })

  it('plays defeat when the human fleet is wiped out', () => {
    const start = battleState()
    let human = start.humanBoard
    human = applyDirectHit(human, { row: 0, col: 0 })
    human = applyDirectHit(human, { row: 0, col: 1 })
    const lost: GameState = {
      ...start,
      humanBoard: human,
      phase: 'game-over',
      winner: 'ai',
    }
    const sounds = soundsForTransition({ ...start, phase: 'ai-turn' }, lost)
    expect(sounds).toContain('sunk')
    expect(sounds).toContain('defeat')
  })
})

function applyDirectHit(
  board: GameState['humanBoard'],
  coord: { row: number; col: number },
): GameState['humanBoard'] {
  const grid = board.grid.map((row) => [...row])
  grid[coord.row][coord.col] = 'hit'
  const ships = board.ships.map((ship) =>
    ship.cells.some((c) => c.row === coord.row && c.col === coord.col)
      ? { ...ship, hits: ship.hits + 1 }
      : ship,
  )
  return { grid, ships }
}
