/** Instrument a note in the menu march is played on. */
export type MarchVoice = 'brass' | 'bass' | 'snare' | 'kick'

export interface MarchNote {
  /** Offset from the start of the loop, in beats. */
  beat: number
  /** Length in beats. Percussion ignores this. */
  length: number
  /** Pitch in Hz. Percussion voices use 0. */
  freq: number
  voice: MarchVoice
}

export const MARCH_BPM = 108
/** Beats in one pass of the loop (four 4/4 bars). */
export const MARCH_LOOP_BEATS = 16

const G3 = 196
const C4 = 261.63
const D4 = 293.66
const E4 = 329.63
const F4 = 349.23
const G4 = 392
const A4 = 440
const B4 = 493.88
const C5 = 523.25

/** Bugle-style fanfare over a marching bass line. */
const MELODY: [number, number, number][] = [
  // [beat, length, freq]
  [0, 0.75, G4],
  [0.75, 0.25, G4],
  [1, 1, C5],
  [2, 0.5, B4],
  [2.5, 0.5, G4],
  [3, 1, E4],
  [4, 0.75, F4],
  [4.75, 0.25, F4],
  [5, 1, A4],
  [6, 0.5, G4],
  [6.5, 0.5, E4],
  [7, 1, C4],
  [8, 0.75, G4],
  [8.75, 0.25, G4],
  [9, 1, C5],
  [10, 0.5, E4],
  [10.5, 0.5, G4],
  [11, 1, C5],
  [12, 1, B4],
  [13, 1, D4],
  [14, 2, G4],
]

const BASS_ROOTS = [C4 / 2, G3 / 2, F4 / 2, G3 / 2]

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
    const root = BASS_ROOTS[bar % BASS_ROOTS.length]
    for (let beat = 0; beat < 4; beat++) {
      notes.push({
        beat: bar * 4 + beat,
        length: 0.45,
        freq: beat % 2 === 0 ? root : root * 1.5,
        voice: 'bass',
      })
    }
  }

  for (let beat = 0; beat < MARCH_LOOP_BEATS; beat++) {
    notes.push({ beat, length: 0.2, freq: 0, voice: 'kick' })
    notes.push({ beat: beat + 0.5, length: 0.12, freq: 0, voice: 'snare' })
    if (beat % 4 === 3) {
      notes.push({ beat: beat + 0.75, length: 0.1, freq: 0, voice: 'snare' })
    }
  }

  return notes.sort((a, b) => a.beat - b.beat)
}
