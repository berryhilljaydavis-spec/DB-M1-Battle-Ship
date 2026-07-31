import { memo } from 'react'
import { coordLabel } from '../game/constants'
import type { CellState } from '../game/types'

export interface CellProps {
  row: number
  col: number
  state: CellState
  revealShips: boolean
  interactive: boolean
  onFire?: (row: number, col: number) => void
}

function cellModifier(state: CellState, revealShips: boolean): string {
  if (state === 'ship') return revealShips ? 'ship' : 'empty'
  return state
}

function CellComponent({
  row,
  col,
  state,
  revealShips,
  interactive,
  onFire,
}: CellProps) {
  const modifier = cellModifier(state, revealShips)
  const label = coordLabel(row, col)

  return (
    <button
      type="button"
      className={`cell cell--${modifier}`}
      aria-label={`${label} ${modifier}`}
      disabled={!interactive}
      onClick={() => onFire?.(row, col)}
    >
      <span className="cell__marker" aria-hidden="true" />
    </button>
  )
}

export const Cell = memo(CellComponent)
