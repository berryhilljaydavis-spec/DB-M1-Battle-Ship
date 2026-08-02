import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VICTORY_VOLLEY_OFFSETS, soundPlayer } from '../sound/player'
import { VictoryCannons } from './VictoryCannons'

vi.mock('../sound/player', () => ({
  VICTORY_VOLLEY_OFFSETS: [0, 0.36, 0.73, 1.13, 1.56],
  soundPlayer: {
    playVictoryVolley: vi.fn(),
  },
}))

function setReducedMotion(reduced: boolean) {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: reduced,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
}

describe('VictoryCannons', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders four turrets and fires the first volley on the audio timeline', () => {
    vi.useFakeTimers()
    setReducedMotion(false)
    const onShot = vi.fn()
    const { container, unmount } = render(<VictoryCannons onShot={onShot} />)

    expect(container.querySelectorAll('.cannons__turret')).toHaveLength(4)
    act(() => vi.advanceTimersByTime(VICTORY_VOLLEY_OFFSETS[1] * 1000))
    expect(onShot).toHaveBeenCalledTimes(2)
    expect(soundPlayer.playVictoryVolley).not.toHaveBeenCalled()

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('skips animated shots when reduced motion is requested', () => {
    vi.useFakeTimers()
    setReducedMotion(true)
    const onShot = vi.fn()
    const { container, unmount } = render(<VictoryCannons onShot={onShot} />)

    act(() => vi.advanceTimersByTime(10000))
    expect(container.querySelectorAll('.cannons__turret')).toHaveLength(4)
    expect(onShot).not.toHaveBeenCalled()
    expect(soundPlayer.playVictoryVolley).not.toHaveBeenCalled()

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
