import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DefeatScene } from './DefeatScene'

describe('DefeatScene', () => {
  it('announces the loss and exposes the follow-up actions', async () => {
    const onPlayAgain = vi.fn()
    const onMenu = vi.fn()
    const onShowBoards = vi.fn()

    render(
      <DefeatScene
        onPlayAgain={onPlayAgain}
        onMenu={onMenu}
        onShowBoards={onShowBoards}
      />,
    )

    expect(screen.getByLabelText('Defeat')).toBeInTheDocument()
    expect(screen.getByText('You lose')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Your fleet is lost.')

    await userEvent.click(screen.getByRole('button', { name: 'New game' }))
    await userEvent.click(screen.getByRole('button', { name: 'Review boards' }))
    await userEvent.click(screen.getByRole('button', { name: 'Main menu' }))

    expect(onPlayAgain).toHaveBeenCalledOnce()
    expect(onShowBoards).toHaveBeenCalledOnce()
    expect(onMenu).toHaveBeenCalledOnce()
  })
})
