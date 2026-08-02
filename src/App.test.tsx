import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { BOARD_SIZE, FLEET } from './game/constants'
import { createGame } from './game/engine'
import type { GameState } from './game/engine'
import * as battleshipHook from './hooks/useBattleship'

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

/** Leaves the title screen and picks a team so the fleet is placeable. */
async function enterGame() {
  await userEvent.click(screen.getByRole('button', { name: 'Deploy fleet' }))
  await userEvent.click(screen.getByRole('button', { name: 'Take command' }))
}

/** Renders the app and leaves the title screen so the fleet is placeable. */
async function renderGame() {
  render(<App />)
  await enterGame()
}

async function startBattle() {
  await userEvent.click(screen.getByRole('button', { name: 'Start battle' }))
}

describe('start menu', () => {
  it('shows the menu first and enters placement on deploy', async () => {
    render(<App />)
    expect(screen.queryByLabelText('Enemy waters')).not.toBeInTheDocument()

    await enterGame()
    expect(screen.getByLabelText('Enemy waters')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Start battle' }),
    ).toBeInTheDocument()
  })

  it('asks for a team before the boards appear', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Deploy fleet' }))

    expect(screen.getByLabelText('Team selection')).toBeInTheDocument()
    expect(screen.queryByLabelText('Enemy waters')).not.toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: /University of Kentucky/ }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Take command' }))

    expect(screen.getByText(/University of Kentucky Wildcats/)).toBeInTheDocument()
  })

  it('returns to the menu from the game', async () => {
    await renderGame()
    await userEvent.click(screen.getByRole('button', { name: 'Main menu' }))

    expect(screen.getByRole('button', { name: 'Deploy fleet' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Enemy waters')).not.toBeInTheDocument()
  })
})

describe('App', () => {
  it('renders both boards and reveals only the human fleet', async () => {
    await renderGame()
    await startBattle()
    const enemy = within(screen.getByLabelText('Enemy waters'))

    expect(enemy.getAllByRole('button')).toHaveLength(BOARD_SIZE * BOARD_SIZE)
    expect(shipCells('Your fleet')).toHaveLength(SHIP_CELLS)
    expect(shipCells('Enemy waters')).toHaveLength(0)
  })

  it('resolves a human shot and then an AI shot', async () => {
    await renderGame()
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
    await renderGame()
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

  it('returns to the victory scene after starting again from reviewed boards', async () => {
    const game = createGame(() => 0.1)
    const victory: GameState = {
      ...game,
      aiBoard: {
        ...game.aiBoard,
        grid: game.aiBoard.grid.map((row) =>
          row.map((cell) => (cell === 'ship' ? 'hit' : cell)),
        ),
        ships: game.aiBoard.ships.map((ship) => ({
          ...ship,
          hits: ship.size,
        })),
      },
      phase: 'game-over',
      winner: 'human',
    }
    const hookSpy = vi
      .spyOn(battleshipHook, 'useBattleship')
      .mockImplementation(() => {
        return {
          state: victory,
          selection: null,
          fireAt: () => undefined,
          placeAt: () => undefined,
          grabAt: () => undefined,
          rotateSelection: () => undefined,
          randomizeFleet: () => undefined,
          startBattle: () => undefined,
          restart: () => undefined,
        }
      })

    try {
      render(<App />)
      await enterGame()
      await userEvent.click(
        screen.getByRole('button', { name: 'Review boards' }),
      )
      await userEvent.click(screen.getByRole('button', { name: 'New game' }))

      expect(screen.getByText('Your fleet wins')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Victory' })).toBeInTheDocument()
    } finally {
      hookSpy.mockRestore()
    }
  })
})

describe('placement phase', () => {
  it('blocks firing until the battle starts', async () => {
    await renderGame()
    const enemy = within(screen.getByLabelText('Enemy waters'))
    await userEvent.click(enemy.getAllByRole('button')[0])
    expect(markedCells('Enemy waters')).toHaveLength(0)
  })

  it('moves the selected ship to a free square', async () => {
    await renderGame()
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
    await renderGame()
    await userEvent.click(screen.getByRole('button', { name: 'Randomize' }))
    expect(shipCells('Your fleet')).toHaveLength(SHIP_CELLS)

    await userEvent.click(shipCells('Your fleet')[0])
    await userEvent.keyboard('r')
    expect(shipCells('Your fleet')).toHaveLength(SHIP_CELLS)
  })
})
