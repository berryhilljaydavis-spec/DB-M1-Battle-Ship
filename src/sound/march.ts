/** Instrument a note in the menu march is played on. */
export type MarchVoice = 'brass' | 'bass' | 'drone' | 'snare' | 'kick'

export interface MarchNote {
  /** Offset from the start of the loop, in beats. */
  beat: number
  /** Length in beats. Percussion ignores this. */
  length: number
  /** Pitch in Hz. Percussion voices use 0. */
  freq: number
  voice: MarchVoice
}

export const MARCH_BPM = 66
/** Beats in one pass of the loop (eight 4/4 bars). */
export const MARCH_LOOP_BEATS = 32

const D2 = 73.42
const Bb1 = 58.27
const G2 = 98
const A2 = 110
const D4 = 293.66
const F4 = 349.23
const A4 = 440
const Bb4 = 466.16
const C5 = 523.25
const D5 = 587.33

/** Sustained bugle phrases over a minor, funeral-march progression. */
const MELODY: [number, number, number][] = [
  // [beat, length, freq]
  [0, 3, D4],
  [3, 2, F4],
  [5, 3, A4],
  [10, 2, A4],
  [12, 4, D5],
  [19, 2, C5],
  [21, 3, Bb4],
  [24, 4, A4],
]

const BASS_ROOTS = [D2, Bb1, G2, A2]

/**
 * The menu march as plain data so the arrangement can be unit-tested without
 * an AudioContext. Beats are relative to the loop start.
 */
export function marchNotes(): MarchNote[] {
  const notes: MarchNote[] = []

  for (const [beat, length, freq] of MELODY) {
    notes.push({ beat, length, freq, voice: 'brass' })
    // Harmony a fifth below thickens the horn section.
    notes.push({ beat, length, freq: freq / 1.5, voice: 'brass' })
  }

  for (let bar = 0; bar < MARCH_LOOP_BEATS / 4; bar++) {
    notes.push({
      beat: bar * 4,
      length: 4,
      freq: BASS_ROOTS[bar % BASS_ROOTS.length],
      voice: 'bass',
    })
    if (bar % 2 === 0) {
      notes.push({
        beat: bar * 4,
        length: 8,
        freq: D2,
        voice: 'drone',
      })
    }
  }

  for (let bar = 0; bar < MARCH_LOOP_BEATS / 4; bar++) {
    for (const beat of [0, 2]) {
      notes.push({ beat: bar * 4 + beat, length: 0.2, freq: 0, voice: 'kick' })
    }
    if (bar % 2 === 1) {
      for (let tick = 0; tick < 8; tick++) {
        notes.push({
          beat: bar * 4 + 2.5 + tick * 0.1875,
          length: 0.05,
          freq: 0,
          voice: 'snare',
        })
      }
    }
  }

  return notes.sort((a, b) => a.beat - b.beat)
}
