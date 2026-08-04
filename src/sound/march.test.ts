import { describe, expect, it } from 'vitest'
import {
  MARCH_BPM,
  MARCH_LOOP_BEATS,
  MUSIC_TRACKS,
  marchNotes,
} from './march'
import { MUSIC_TRACK_IDS } from './settings'

describe('marchNotes', () => {
  const notes = marchNotes()
  const rollBars = MARCH_LOOP_BEATS / 8
  const ticksPerRoll = 8

  it('uses a restrained funeral-march percussion pulse', () => {
    const kicks = notes.filter((note) => note.voice === 'kick')
    expect(kicks).toHaveLength(MARCH_LOOP_BEATS / 2)
    expect(kicks.every((note) => note.beat % 2 === 0)).toBe(true)
    expect(notes.filter((note) => note.voice === 'snare')).toHaveLength(
      rollBars * ticksPerRoll,
    )
  })

  it('sets a slow tempo and sustains a drone through the loop', () => {
    expect(MARCH_BPM).toBeLessThanOrEqual(72)
    const drones = notes.filter((note) => note.voice === 'drone')
    expect(drones).toHaveLength(MARCH_LOOP_BEATS / 8)
    expect(drones.reduce((total, note) => total + note.length, 0)).toBe(
      MARCH_LOOP_BEATS,
    )
  })

  it('uses sustained melody phrases separated by real rests', () => {
    const melody = notes
      .filter((note) => note.voice === 'brass' && note.freq >= 250)
      .sort((a, b) => a.beat - b.beat)
    expect(melody.every((note) => note.length >= 1.5)).toBe(true)
    const gaps = melody.slice(0, -1).map((note, index) => {
      const next = melody[index + 1]
      return next.beat - (note.beat + note.length)
    })
    expect(gaps.some((gap) => gap >= 2)).toBe(true)
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

describe('MUSIC_TRACKS', () => {
  it('exposes every selectable track', () => {
    expect(Object.keys(MUSIC_TRACKS).sort()).toEqual([...MUSIC_TRACK_IDS].sort())
    for (const id of MUSIC_TRACK_IDS) {
      expect(MUSIC_TRACKS[id].id).toBe(id)
      expect(MUSIC_TRACKS[id].label).not.toBe('')
    }
  })

  it('keeps the original march as the solemn option', () => {
    const track = MUSIC_TRACKS['solemn-march']
    expect(track.bpm).toBe(MARCH_BPM)
    expect(track.loopBeats).toBe(MARCH_LOOP_BEATS)
    expect(track.notes()).toEqual(marchNotes())
  })

  it('keeps every note of every track inside its loop', () => {
    for (const id of MUSIC_TRACK_IDS) {
      const track = MUSIC_TRACKS[id]
      const notes = track.notes()
      expect(notes.length).toBeGreaterThan(0)
      for (const note of notes) {
        expect(note.beat).toBeGreaterThanOrEqual(0)
        expect(note.beat + note.length).toBeLessThanOrEqual(track.loopBeats)
      }
      const beats = notes.map((note) => note.beat)
      expect([...beats].sort((a, b) => a - b)).toEqual(beats)
    }
  })

  it('makes the anthem brisker and busier than the march', () => {
    const anthem = MUSIC_TRACKS['brass-anthem']
    expect(anthem.bpm).toBeGreaterThan(MARCH_BPM)
    const snares = anthem.notes().filter((note) => note.voice === 'snare')
    expect(snares).toHaveLength(anthem.loopBeats / 2)
    const melody = anthem.notes().filter((note) => note.voice === 'brass')
    expect(melody.length).toBeGreaterThan(0)
  })

  it('makes the ambient bed slow, pitched low and percussion-free', () => {
    const ambient = MUSIC_TRACKS['ambient-drone']
    const notes = ambient.notes()
    expect(ambient.bpm).toBeLessThan(MARCH_BPM)
    expect(notes.every((note) => note.voice === 'drone')).toBe(true)
    expect(notes.every((note) => note.freq < 250)).toBe(true)
    expect(notes.every((note) => note.length >= 5)).toBe(true)
  })

  it('gives each track a distinct arrangement', () => {
    const signatures = MUSIC_TRACK_IDS.map((id) =>
      JSON.stringify(MUSIC_TRACKS[id].notes()),
    )
    expect(new Set(signatures).size).toBe(MUSIC_TRACK_IDS.length)
  })
})
