import { memo, useEffect, useRef, useState } from 'react'
import { coordLabel } from '../game/constants'
import type { CellState } from '../game/types'
import { Explosion } from './Explosion'

export interface CellProps {
  row: number
  col: number
  state: CellState
  revealShips: boolean
  interactive: boolean
  onFire?: (row: number, col: number) => void
  /** Placement mode: part of the ship currently being moved. */
  selected?: boolean
  draggable?: boolean
  onDragStart?: (row: number, col: number) => void
  onDrop?: (row: number, col: number) => void
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
  selected = false,
  draggable = false,
  onDragStart,
  onDrop,
}: CellProps) {
  const [blastId, setBlastId] = useState<number | null>(null)
  const previousState = useRef(state)

  useEffect(() => {
    if (state === 'hit' && previousState.current !== 'hit') {
      setBlastId((id) => (id ?? 0) + 1)
    }
    previousState.current = state
  }, [state])

  const modifier = cellModifier(state, revealShips)
  const label = coordLabel(row, col)

  return (
    <span
      className={`cell-slot${blastId === null ? '' : ' cell-slot--blasting'}`}
    >
      <button
        type="button"
        className={`cell cell--${modifier}${selected ? ' cell--selected' : ''}${
          draggable ? ' cell--grabbable' : ''
        }`}
        aria-label={`${label} ${modifier}`}
        aria-pressed={selected || undefined}
        disabled={!interactive}
        draggable={draggable || undefined}
        onClick={() => onFire?.(row, col)}
        onDragStart={
          onDragStart &&
          ((event) => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', `${row},${col}`)
            onDragStart(row, col)
          })
        }
        onDragOver={
          onDrop &&
          ((event) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
          })
        }
        onDrop={
          onDrop &&
          ((event) => {
            event.preventDefault()
            onDrop(row, col)
          })
        }
      />
      {blastId !== null && (
        <Explosion key={blastId} onFinished={() => setBlastId(null)} />
      )}
    </span>
  )
}

export const Cell = memo(CellComponent)
