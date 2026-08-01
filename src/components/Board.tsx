import { COLUMN_LABELS } from '../game/constants'
import type { Board as BoardModel, Coord } from '../game/types'
import { Cell } from './Cell'
import { FleetCrest } from './Insignia'
import { isShotAllowed } from '../game/board'

export interface BoardPlacement {
  /** Cells of the ship currently picked up. */
  isSelected: (coord: Coord) => boolean
  isShip: (coord: Coord) => boolean
  onGrab: (row: number, col: number) => void
  onDrop: (row: number, col: number) => void
}

export type BoardSide = 'friendly' | 'enemy'

export interface BoardProps {
  title: string
  board: BoardModel
  revealShips: boolean
  interactive: boolean
  onFire?: (row: number, col: number) => void
  placement?: BoardPlacement
  side?: BoardSide
  subtitle?: string
}

export function Board({
  title,
  board,
  revealShips,
  interactive,
  onFire,
  placement,
  side = 'enemy',
  subtitle,
}: BoardProps) {
  return (
    <section className={`board board--${side}`} aria-label={title}>
      <header className="board__header">
        <FleetCrest side={side} />
        <span className="board__badge">
          {side === 'enemy' ? 'Enemy' : 'You'}
        </span>
        <h2 className="board__title">{title}</h2>
        {subtitle && <p className="board__subtitle">{subtitle}</p>}
      </header>
      <div className="board__grid">
        <span className="board__corner" />
        {COLUMN_LABELS.slice(0, board.grid.length).map((label) => (
          <span key={label} className="board__label">
            {label}
          </span>
        ))}
        {board.grid.map((cells, row) => (
          <FragmentRow
            key={row}
            row={row}
            cells={cells}
            board={board}
            revealShips={revealShips}
            interactive={interactive}
            onFire={onFire}
            placement={placement}
          />
        ))}
      </div>
    </section>
  )
}

interface FragmentRowProps extends Omit<BoardProps, 'title'> {
  row: number
  cells: BoardModel['grid'][number]
}

function FragmentRow({
  row,
  cells,
  board,
  revealShips,
  interactive,
  onFire,
  placement,
}: FragmentRowProps) {
  return (
    <>
      <span className="board__label">{row + 1}</span>
      {cells.map((state, col) => (
        <Cell
          key={col}
          row={row}
          col={col}
          state={state}
          revealShips={revealShips}
          interactive={interactive && isShotAllowed(board, { row, col })}
          onFire={onFire}
          selected={placement?.isSelected({ row, col })}
          draggable={placement?.isShip({ row, col })}
          onDragStart={placement?.onGrab}
          onDrop={placement?.onDrop}
        />
      ))}
    </>
  )
}
