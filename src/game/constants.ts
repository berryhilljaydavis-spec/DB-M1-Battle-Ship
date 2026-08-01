import type { ShipSpec } from './types'

export const BOARD_SIZE = 10

export const FLEET: readonly ShipSpec[] = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
] as const

export const COLUMN_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

export function coordLabel(row: number, col: number): string {
  return `${COLUMN_LABELS[col]}${row + 1}`
}
