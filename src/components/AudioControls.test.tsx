import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AudioControls } from './AudioControls'
import { DEFAULT_AUDIO_SETTINGS } from '../sound/settings'

function setup(overrides: Partial<Parameters<typeof AudioControls>[0]> = {}) {
  const onChange = vi.fn()
  const onToggle = vi.fn()
  render(
    <AudioControls
      enabled
      onToggle={onToggle}
      settings={DEFAULT_AUDIO_SETTINGS}
      onChange={onChange}
      {...overrides}
    />,
  )
  return { onChange, onToggle, user: userEvent.setup() }
}

const openPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Audio settings' }))
}

describe('AudioControls', () => {
  it('keeps the mute toggle alongside the settings gear', async () => {
    const { onToggle, user } = setup()
    expect(
      screen.queryByRole('dialog', { name: 'Audio settings' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mute sound effects' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('opens and closes the panel', async () => {
    const { user } = setup()
    await openPanel(user)
    expect(
      screen.getByRole('dialog', { name: 'Audio settings' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Close audio settings' }),
    )
    expect(
      screen.queryByRole('dialog', { name: 'Audio settings' }),
    ).not.toBeInTheDocument()
  })

  it('closes the panel on Escape', async () => {
    const { user } = setup()
    await openPanel(user)
    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('dialog', { name: 'Audio settings' }),
    ).not.toBeInTheDocument()
  })

  it('lists every music track and effect pack with an off switch', async () => {
    const { user } = setup()
    await openPanel(user)

    for (const label of ['Solemn march', 'Brass anthem', 'Ambient drone']) {
      expect(screen.getByRole('radio', { name: new RegExp(label) })).toBeInTheDocument()
    }
    for (const label of ['Heavy naval', 'Classic', 'Minimal']) {
      expect(screen.getByRole('radio', { name: new RegExp(label) })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('radio', { name: /^Off/ })).toHaveLength(2)
  })

  it('checks the current selections', async () => {
    const { user } = setup({
      settings: {
        ...DEFAULT_AUDIO_SETTINGS,
        musicTrack: 'ambient-drone',
        effectPack: 'minimal',
      },
    })
    await openPanel(user)
    expect(screen.getByRole('radio', { name: /Ambient drone/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Minimal/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Solemn march/ })).not.toBeChecked()
  })

  it('reports a music track selection', async () => {
    const { onChange, user } = setup()
    await openPanel(user)
    await user.click(screen.getByRole('radio', { name: /Brass anthem/ }))
    expect(onChange).toHaveBeenCalledWith({ musicTrack: 'brass-anthem' })
  })

  it('reports an effect pack selection', async () => {
    const { onChange, user } = setup()
    await openPanel(user)
    await user.click(screen.getByRole('radio', { name: /Classic/ }))
    expect(onChange).toHaveBeenCalledWith({ effectPack: 'classic' })
  })

  it('shows volumes as percentages and reports slider changes', async () => {
    const { onChange, user } = setup({
      settings: { ...DEFAULT_AUDIO_SETTINGS, musicVolume: 0.6 },
    })
    await openPanel(user)

    const music = screen.getByRole('slider', { name: /Music volume/ })
    expect(music).toHaveValue('60')
    expect(screen.getByText('60%')).toBeInTheDocument()

    const effects = screen.getByRole('slider', { name: /Effects volume/ })
    expect(effects).toHaveValue('90')
    fireEvent.change(effects, { target: { value: '40' } })
    expect(onChange).toHaveBeenCalledWith({ effectsVolume: 0.4 })
  })

  it('explains that selections still apply while muted', async () => {
    const { user } = setup({ enabled: false })
    await openPanel(user)
    expect(screen.getByText(/Sound is muted/)).toBeInTheDocument()
  })
})
