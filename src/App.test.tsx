import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { BOARD_SIZE, FLEET } from './game/constants'

const SHIP_CELLS = FLEET.reduce((sum, ship) => sum + ship.size, 0)

function markedCells(boardName: string) {
  const board = screen.getByLabelText(boardName)
  return within(board)
    .getAllByRole('button')
    .filter((cell) => /hit|miss/.test(cell.getAttribute('aria-label') ?? ''))
}

describe('App', () => {
  it('renders both boards and reveals only the human fleet', () => {
    render(<App />)
    const enemy = within(screen.getByLabelText('Enemy waters'))
    const own = within(screen.getByLabelText('Your fleet'))

    expect(enemy.getAllByRole('button')).toHaveLength(BOARD_SIZE * BOARD_SIZE)
    expect(
      own
        .getAllByRole('button')
        .filter((cell) => cell.getAttribute('aria-label')?.endsWith('ship')),
    ).toHaveLength(SHIP_CELLS)
    expect(
      enemy
        .getAllByRole('button')
        .filter((cell) => cell.getAttribute('aria-label')?.endsWith('ship')),
    ).toHaveLength(0)
  })

  it('resolves a human shot and then an AI shot', async () => {
    render(<App />)
    const enemy = within(screen.getByLabelText('Enemy waters'))

    await userEvent.click(enemy.getAllByRole('button')[0])
    expect(markedCells('Enemy waters')).toHaveLength(1)

    await waitFor(() => expect(markedCells('Your fleet')).toHaveLength(1), {
      timeout: 3000,
    })
    expect(screen.getByRole('status')).toHaveTextContent(/Your turn/)
  })

  it('starts a fresh game when restarting', async () => {
    render(<App />)
    const enemy = within(screen.getByLabelText('Enemy waters'))
    await userEvent.click(enemy.getAllByRole('button')[0])
    expect(markedCells('Enemy waters')).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'New game' }))
    expect(markedCells('Enemy waters')).toHaveLength(0)
    expect(markedCells('Your fleet')).toHaveLength(0)
  })
})
