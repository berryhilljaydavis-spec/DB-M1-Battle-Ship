import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlacementControls } from './PlacementControls'
import { createEmptyBoard, placeShip } from '../game/board'

function board() {
  const empty = createEmptyBoard()
  const withCruiser = placeShip(
    empty,
    { name: 'Cruiser', size: 3 },
    { row: 0, col: 0 },
    'horizontal',
  )
  return placeShip(
    withCruiser,
    { name: 'Destroyer', size: 2 },
    { row: 4, col: 4 },
    'vertical',
  )
}

function renderControls(selectedShip: string | null = null) {
  const props = {
    board: board(),
    selectedShip,
    onSelectShip: vi.fn(),
    onOrient: vi.fn(),
    onRandomize: vi.fn(),
    onStart: vi.fn(),
  }
  render(<PlacementControls {...props} />)
  return props
}

describe('PlacementControls', () => {
  it('lists every ship in the fleet', () => {
    renderControls()
    expect(screen.getByRole('button', { name: /Cruiser/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Destroyer/ })).toBeInTheDocument()
  })

  it('selects the ship that was clicked', async () => {
    const { onSelectShip } = renderControls()
    await userEvent.click(screen.getByRole('button', { name: /Destroyer/ }))
    expect(onSelectShip).toHaveBeenCalledWith('Destroyer')
  })

  it('marks the selected ship and shows its current orientation', () => {
    renderControls('Destroyer')
    expect(screen.getByRole('button', { name: /Destroyer/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Vertical' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Horizontal' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('requests the orientation that was clicked', async () => {
    const { onOrient } = renderControls('Destroyer')
    await userEvent.click(screen.getByRole('button', { name: 'Horizontal' }))
    expect(onOrient).toHaveBeenCalledWith('horizontal')
  })

  it('disables the orientation buttons until a ship is selected', () => {
    renderControls()
    expect(screen.getByRole('button', { name: 'Vertical' })).toBeDisabled()
  })
})
