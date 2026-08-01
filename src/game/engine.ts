import { chooseAiMove } from './ai'
import { applyShot, isFleetDestroyed, placeFleetRandomly } from './board'
import { coordLabel } from './constants'
import type { Board, Coord, PlayerId, RandomFn, ShotResult } from './types'

export type Phase = 'placement' | 'human-turn' | 'ai-turn' | 'game-over'

export interface GameState {
  humanBoard: Board
  aiBoard: Board
  phase: Phase
  winner: PlayerId | null
  log: string[]
}

const MAX_LOG_ENTRIES = 30

export function createGame(random: RandomFn = Math.random): GameState {
  return {
    humanBoard: placeFleetRandomly(undefined, undefined, random),
    aiBoard: placeFleetRandomly(undefined, undefined, random),
    phase: 'placement',
    winner: null,
    log: ['Fleet at anchor. Drag your ships into position.'],
  }
}

/** Locks in the human fleet layout and begins the duel. */
export function startBattle(state: GameState): GameState {
  if (state.phase !== 'placement') return state
  return {
    ...state,
    phase: 'human-turn',
    log: appendLog(state.log, 'Fleets deployed. Take your shot!'),
  }
}

function describe(
  shooter: PlayerId,
  coord: Coord,
  result: ShotResult,
  shipName?: string,
): string {
  const who = shooter === 'human' ? 'You' : 'The AI'
  const cell = coordLabel(coord.row, coord.col)
  if (result === 'sunk') return `${who} sank the ${shipName} at ${cell}!`
  if (result === 'hit') return `${who} hit a ship at ${cell}.`
  return `${who} missed at ${cell}.`
}

function appendLog(log: string[], entry: string): string[] {
  return [entry, ...log].slice(0, MAX_LOG_ENTRIES)
}

/** Resolves the human's shot at the AI board. */
export function humanFire(state: GameState, coord: Coord): GameState {
  if (state.phase !== 'human-turn') return state

  const outcome = applyShot(state.aiBoard, coord)
  const log = appendLog(
    state.log,
    describe('human', coord, outcome.result, outcome.ship?.name),
  )
  const won = isFleetDestroyed(outcome.board)

  return {
    ...state,
    aiBoard: outcome.board,
    log: won ? appendLog(log, 'You win! The enemy fleet is destroyed.') : log,
    phase: won ? 'game-over' : 'ai-turn',
    winner: won ? 'human' : null,
  }
}

/** Resolves the AI's shot at the human board. */
export function aiFire(state: GameState, random: RandomFn = Math.random): GameState {
  if (state.phase !== 'ai-turn') return state

  const coord = chooseAiMove(state.humanBoard, random)
  if (!coord) return { ...state, phase: 'human-turn' }

  const outcome = applyShot(state.humanBoard, coord)
  const log = appendLog(
    state.log,
    describe('ai', coord, outcome.result, outcome.ship?.name),
  )
  const lost = isFleetDestroyed(outcome.board)

  return {
    ...state,
    humanBoard: outcome.board,
    log: lost ? appendLog(log, 'The AI destroyed your fleet. You lose.') : log,
    phase: lost ? 'game-over' : 'human-turn',
    winner: lost ? 'ai' : null,
  }
}
