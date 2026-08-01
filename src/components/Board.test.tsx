import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Board } from './Board'
import { applyShot, createEmptyBoard, placeShip } from '../game/board'
import { BOARD_SIZE } from '../game/constants'

function boardWithShip() {
  return placeShip(
    createEmptyBoard(),
    { name: 'Destroyer', size: 2 },
    { row: 0, col: 0 },
    'horizontal',
  )
}

describe('Board', () => {
  it('renders one button per cell', () => {
    render(
      <Board
        title="Enemy waters"
        board={createEmptyBoard()}
        revealShips={false}
        interactive
      />,
    )
    expect(screen.getAllByRole('button')).toHaveLength(BOARD_SIZE * BOARD_SIZE)
  })

  it('hides enemy ships but shows them when revealed', () => {
    const { rerender } = render(
      <Board
        title="Enemy waters"
        board={boardWithShip()}
        revealShips={false}
        interactive
      />,
    )
    expect(screen.getByLabelText('A1 empty')).toBeInTheDocument()

    rerender(
      <Board
        title="Your fleet"
        board={boardWithShip()}
        revealShips
        interactive={false}
      />,
    )
    expect(screen.getByLabelText('A1 ship')).toBeInTheDocument()
  })

  it('reports the clicked coordinates', async () => {
    const onFire = vi.fn()
    render(
      <Board
        title="Enemy waters"
        board={createEmptyBoard()}
        revealShips={false}
        interactive
        onFire={onFire}
      />,
    )
    await userEvent.click(screen.getByLabelText('C4 empty'))
    expect(onFire).toHaveBeenCalledWith(3, 2)
  })

  it('disables cells that were already fired at', async () => {
    const onFire = vi.fn()
    const board = applyShot(createEmptyBoard(), { row: 0, col: 0 }).board
    render(
      <Board
        title="Enemy waters"
        board={board}
        revealShips={false}
        interactive
        onFire={onFire}
      />,
    )
    const cell = screen.getByLabelText('A1 miss')
    expect(cell).toBeDisabled()
    await userEvent.click(cell)
    expect(onFire).not.toHaveBeenCalled()
  })
})
