import type { MusicTrackId } from './settings'

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

/** A selectable looping arrangement, described as plain data. */
export interface MusicTrack {
  id: MusicTrackId
  label: string
  bpm: number
  /** Beats in one pass of the loop. */
  loopBeats: number
  notes: () => MarchNote[]
}

const D3 = 146.83
const E4 = 329.63
const G4 = 392
const B4 = 493.88
const Fs4 = 369.99
const A3 = 220

const ANTHEM_BPM = 108
const ANTHEM_LOOP_BEATS = 32

/** Confident major-key call over a marching backbeat. */
const ANTHEM_MELODY: [number, number, number][] = [
  [0, 1, D4],
  [1, 1, Fs4],
  [2, 2, A4],
  [4, 1, A4],
  [5, 1, B4],
  [6, 2, D5],
  [8, 1, C5],
  [9, 1, A4],
  [10, 2, Fs4],
  [12, 4, G4],
  [16, 1, D4],
  [17, 1, G4],
  [18, 2, B4],
  [20, 1, B4],
  [21, 1, C5],
  [22, 2, D5],
  [24, 2, E4],
  [26, 2, Fs4],
  [28, 4, A4],
]

const ANTHEM_ROOTS = [D2, A2, G2, D2, G2, D2, A2, D2]

/** Brisker brass anthem: fanfare melody, walking bass, marching drums. */
function anthemNotes(): MarchNote[] {
  const notes: MarchNote[] = []

  for (const [beat, length, freq] of ANTHEM_MELODY) {
    notes.push({ beat, length, freq, voice: 'brass' })
    // Third below for a bright, major harmony.
    notes.push({ beat, length, freq: freq / 1.25, voice: 'brass' })
  }

  for (let bar = 0; bar < ANTHEM_LOOP_BEATS / 4; bar++) {
    const root = ANTHEM_ROOTS[bar % ANTHEM_ROOTS.length]
    notes.push({ beat: bar * 4, length: 2, freq: root, voice: 'bass' })
    notes.push({ beat: bar * 4 + 2, length: 2, freq: root * 1.5, voice: 'bass' })

    for (const beat of [0, 2]) {
      notes.push({ beat: bar * 4 + beat, length: 0.2, freq: 0, voice: 'kick' })
    }
    for (const beat of [1, 3]) {
      notes.push({ beat: bar * 4 + beat, length: 0.05, freq: 0, voice: 'snare' })
    }
  }

  return notes.sort((a, b) => a.beat - b.beat)
}

const DRONE_BPM = 48
const DRONE_LOOP_BEATS = 32

const DRONE_ROOTS = [D2, D2, Bb1, D2]
/** Slow pads floating over the pedal tones. */
const DRONE_PADS: [number, number, number][] = [
  [2, 6, D3],
  [10, 6, F4 / 2],
  [18, 6, A3],
  [26, 5, D3],
]

/** Low ambient bed: sustained pedal tones and soft pads, no percussion. */
function droneNotes(): MarchNote[] {
  const notes: MarchNote[] = []

  for (let block = 0; block < DRONE_LOOP_BEATS / 8; block++) {
    notes.push({
      beat: block * 8,
      length: 8,
      freq: DRONE_ROOTS[block % DRONE_ROOTS.length],
      voice: 'drone',
    })
  }

  for (const [beat, length, freq] of DRONE_PADS) {
    notes.push({ beat, length, freq, voice: 'drone' })
  }

  return notes.sort((a, b) => a.beat - b.beat)
}

export const MUSIC_TRACKS: Record<MusicTrackId, MusicTrack> = {
  'solemn-march': {
    id: 'solemn-march',
    label: 'Solemn march',
    bpm: MARCH_BPM,
    loopBeats: MARCH_LOOP_BEATS,
    notes: marchNotes,
  },
  'brass-anthem': {
    id: 'brass-anthem',
    label: 'Brass anthem',
    bpm: ANTHEM_BPM,
    loopBeats: ANTHEM_LOOP_BEATS,
    notes: anthemNotes,
  },
  'ambient-drone': {
    id: 'ambient-drone',
    label: 'Ambient drone',
    bpm: DRONE_BPM,
    loopBeats: DRONE_LOOP_BEATS,
    notes: droneNotes,
  },
}
