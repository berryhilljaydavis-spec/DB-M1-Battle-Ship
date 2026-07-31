import { COLUMN_LABELS } from '../game/constants'
import type { Board as BoardModel } from '../game/types'
import { Cell } from './Cell'
import { isShotAllowed } from '../game/board'

export interface BoardProps {
  title: string
  board: BoardModel
  revealShips: boolean
  interactive: boolean
  onFire?: (row: number, col: number) => void
}

export function Board({
  title,
  board,
  revealShips,
  interactive,
  onFire,
}: BoardProps) {
  return (
    <section className="board" aria-label={title}>
      <h2 className="board__title">{title}</h2>
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
        />
      ))}
    </>
  )
}
