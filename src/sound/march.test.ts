import { describe, expect, it } from 'vitest'
import { MARCH_LOOP_BEATS, marchNotes } from './march'

describe('marchNotes', () => {
  const notes = marchNotes()

  it('fills every beat of the loop with percussion', () => {
    const kicks = notes.filter((note) => note.voice === 'kick')
    expect(kicks).toHaveLength(MARCH_LOOP_BEATS)
    expect(new Set(kicks.map((note) => note.beat)).size).toBe(MARCH_LOOP_BEATS)
  })

  it('keeps every note inside the loop', () => {
    for (const note of notes) {
      expect(note.beat).toBeGreaterThanOrEqual(0)
      expect(note.beat + note.length).toBeLessThanOrEqual(MARCH_LOOP_BEATS)
    }
  })

  it('doubles each melody note with a harmony a fifth below', () => {
    const brass = notes.filter((note) => note.voice === 'brass')
    expect(brass.length % 2).toBe(0)
    for (let i = 0; i < brass.length; i += 2) {
      const pair = [brass[i], brass[i + 1]].sort((a, b) => b.freq - a.freq)
      expect(pair[0].beat).toBe(pair[1].beat)
      expect(pair[0].freq / pair[1].freq).toBeCloseTo(1.5, 5)
    }
  })

  it('returns notes in playback order', () => {
    const beats = notes.map((note) => note.beat)
    expect([...beats].sort((a, b) => a - b)).toEqual(beats)
  })
})
