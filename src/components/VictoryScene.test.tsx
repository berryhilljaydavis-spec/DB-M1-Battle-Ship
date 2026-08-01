import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VictoryScene } from './VictoryScene'

describe('VictoryScene', () => {
  it('announces the win and exposes the follow-up actions', async () => {
    const onPlayAgain = vi.fn()
    const onMenu = vi.fn()
    const onShowBoards = vi.fn()

    render(
      <VictoryScene
        onPlayAgain={onPlayAgain}
        onMenu={onMenu}
        onShowBoards={onShowBoards}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'The enemy fleet is destroyed.',
    )

    await userEvent.click(screen.getByRole('button', { name: 'New game' }))
    await userEvent.click(screen.getByRole('button', { name: 'Review boards' }))
    await userEvent.click(screen.getByRole('button', { name: 'Main menu' }))

    expect(onPlayAgain).toHaveBeenCalledOnce()
    expect(onShowBoards).toHaveBeenCalledOnce()
    expect(onMenu).toHaveBeenCalledOnce()
  })
})
