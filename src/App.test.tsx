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

function shipCells(boardName: string) {
  const board = screen.getByLabelText(boardName)
  return within(board)
    .getAllByRole('button')
    .filter((cell) => cell.getAttribute('aria-label')?.endsWith('ship'))
}

async function startBattle() {
  await userEvent.click(screen.getByRole('button', { name: 'Start battle' }))
}

describe('App', () => {
  it('renders both boards and reveals only the human fleet', async () => {
    render(<App />)
    await startBattle()
    const enemy = within(screen.getByLabelText('Enemy waters'))

    expect(enemy.getAllByRole('button')).toHaveLength(BOARD_SIZE * BOARD_SIZE)
    expect(shipCells('Your fleet')).toHaveLength(SHIP_CELLS)
    expect(shipCells('Enemy waters')).toHaveLength(0)
  })

  it('resolves a human shot and then an AI shot', async () => {
    render(<App />)
    await startBattle()
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
    await startBattle()
    const enemy = within(screen.getByLabelText('Enemy waters'))
    await userEvent.click(enemy.getAllByRole('button')[0])
    expect(markedCells('Enemy waters')).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'New game' }))
    expect(markedCells('Enemy waters')).toHaveLength(0)
    expect(markedCells('Your fleet')).toHaveLength(0)
    expect(
      screen.getByRole('button', { name: 'Start battle' }),
    ).toBeInTheDocument()
  })
})

describe('placement phase', () => {
  it('blocks firing until the battle starts', async () => {
    render(<App />)
    const enemy = within(screen.getByLabelText('Enemy waters'))
    await userEvent.click(enemy.getAllByRole('button')[0])
    expect(markedCells('Enemy waters')).toHaveLength(0)
  })

  it('moves the selected ship to a free square', async () => {
    render(<App />)
    const own = within(screen.getByLabelText('Your fleet'))
    const layout = () =>
      shipCells('Your fleet')
        .map((cell) => cell.getAttribute('aria-label'))
        .join(',')

    const before = layout()
    await userEvent.click(shipCells('Your fleet')[0])
    expect(shipCells('Your fleet')[0]).toHaveAttribute('aria-pressed', 'true')

    const empties = own
      .getAllByRole('button')
      .filter((cell) => cell.getAttribute('aria-label')?.endsWith('empty'))
    for (const target of empties) {
      await userEvent.click(target)
      if (layout() !== before) break
    }

    expect(layout()).not.toBe(before)
    expect(shipCells('Your fleet')).toHaveLength(SHIP_CELLS)
  })

  it('keeps the fleet intact when randomizing and rotating', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Randomize' }))
    expect(shipCells('Your fleet')).toHaveLength(SHIP_CELLS)

    await userEvent.click(shipCells('Your fleet')[0])
    await userEvent.keyboard('r')
    expect(shipCells('Your fleet')).toHaveLength(SHIP_CELLS)
  })
})
