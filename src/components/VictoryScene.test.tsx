import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { soundPlayer } from '../sound/player'
import { VictoryScene } from './VictoryScene'

vi.mock('../sound/player', () => ({
  VICTORY_VOLLEY_OFFSETS: [0, 1.4, 2.9, 4.5, 6.2],
  soundPlayer: {
    playVictoryVolley: vi.fn(),
    stopVictory: vi.fn(),
  },
}))

describe('VictoryScene', () => {
  it('announces the win and exposes the follow-up actions', async () => {
    const onPlayAgain = vi.fn()
    const onMenu = vi.fn()
    const onShowBoards = vi.fn()

    const { unmount } = render(
      <VictoryScene
        onPlayAgain={onPlayAgain}
        onMenu={onMenu}
        onShowBoards={onShowBoards}
      />,
    )

    expect(screen.getByText('Your fleet wins')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'The enemy fleet is destroyed.',
    )

    await userEvent.click(screen.getByRole('button', { name: 'New game' }))
    await userEvent.click(screen.getByRole('button', { name: 'Review boards' }))
    await userEvent.click(screen.getByRole('button', { name: 'Main menu' }))

    expect(onPlayAgain).toHaveBeenCalledOnce()
    expect(onShowBoards).toHaveBeenCalledOnce()
    expect(onMenu).toHaveBeenCalledOnce()
    unmount()
    expect(soundPlayer.stopVictory).toHaveBeenCalledOnce()
  })
})
