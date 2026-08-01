import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { FleetDestruction } from './FleetDestruction'

describe('FleetDestruction', () => {
  it('renders a staggered chain of blasts and smoke plumes', () => {
    const { container } = render(<FleetDestruction />)

    const blasts = Array.from(
      container.querySelectorAll<HTMLElement>('.destruction__blast'),
    )
    expect(blasts.length).toBeGreaterThan(8)
    expect(container.querySelectorAll('.destruction__smoke').length).toBe(3)
    expect(container.querySelector('.destruction__fire')).not.toBeNull()

    const delays = blasts.map((blast) => blast.style.animationDelay)
    expect(new Set(delays).size).toBe(blasts.length)
  })

  it('is hidden from assistive technology', () => {
    const { container } = render(<FleetDestruction />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
