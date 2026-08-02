import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamSelect } from './TeamSelect'
import { TEAMS } from '../game/teams'

describe('TeamSelect', () => {
  it('lists every school and confirms the picked one', async () => {
    const onConfirm = vi.fn()
    render(<TeamSelect onConfirm={onConfirm} onBack={() => undefined} />)

    for (const team of TEAMS) {
      expect(screen.getByText(team.school)).toBeInTheDocument()
    }

    await userEvent.click(
      screen.getByRole('button', { name: /University of Texas/ }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Take command' }))

    expect(onConfirm).toHaveBeenCalledWith(
      TEAMS.find((team) => team.id === 'texas'),
    )
  })

  it('marks the selected team as pressed', async () => {
    render(<TeamSelect onConfirm={() => undefined} onBack={() => undefined} />)
    const wesleyan = screen.getByRole('button', {
      name: /Wesleyan University/,
    })

    expect(wesleyan).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(wesleyan)
    expect(wesleyan).toHaveAttribute('aria-pressed', 'true')
  })

  it('goes back to the menu', async () => {
    const onBack = vi.fn()
    render(<TeamSelect onConfirm={() => undefined} onBack={onBack} />)

    await userEvent.click(screen.getByRole('button', { name: 'Back to menu' }))
    expect(onBack).toHaveBeenCalled()
  })
})
