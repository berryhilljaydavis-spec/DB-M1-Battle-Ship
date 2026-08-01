import { describe, expect, it } from 'vitest'
import { SINK_DURATION, sinkProgress } from './sinking'

describe('sinkProgress', () => {
  it('starts afloat and settles once the sink completes', () => {
    expect(sinkProgress(0)).toBe(0)
    expect(sinkProgress(SINK_DURATION)).toBe(1)
    expect(sinkProgress(SINK_DURATION * 3)).toBe(1)
  })

  it('never reverses and stays within bounds', () => {
    let previous = -1
    for (let t = 0; t <= SINK_DURATION; t += 0.5) {
      const p = sinkProgress(t)
      expect(p).toBeGreaterThanOrEqual(previous)
      expect(p).toBeLessThanOrEqual(1)
      previous = p
    }
  })
})
