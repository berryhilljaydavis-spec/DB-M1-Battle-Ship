export interface Coord {
  row: number
  col: number
}

export type Orientation = 'horizontal' | 'vertical'

export interface ShipSpec {
  name: string
  size: number
}

export interface Ship extends ShipSpec {
  cells: Coord[]
  hits: number
}

export type CellState = 'empty' | 'ship' | 'hit' | 'miss'

export interface Board {
  grid: CellState[][]
  ships: Ship[]
}

export type ShotResult = 'miss' | 'hit' | 'sunk'

export interface ShotOutcome {
  board: Board
  result: ShotResult
  ship: Ship | null
}

export type PlayerId = 'human' | 'ai'

export type RandomFn = () => number
