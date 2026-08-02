export interface Team {
  id: string
  school: string
  nickname: string
  abbr: string
  /** Light shade used for text, crests and outlines. */
  accent: string
  /** Deep shade used for card and panel fills. */
  primary: string
  line: string
  tint: string
}

export const TEAMS: Team[] = [
  {
    id: 'michigan',
    school: 'University of Michigan',
    nickname: 'Wolverines',
    abbr: 'MICH',
    accent: '#ffcb05',
    primary: '#00274c',
    line: 'rgba(255, 203, 5, 0.55)',
    tint: 'rgba(0, 39, 76, 0.55)',
  },
  {
    id: 'wesleyan',
    school: 'Wesleyan University',
    nickname: 'Cardinals',
    abbr: 'WES',
    accent: '#ff8a8a',
    primary: '#8b1a1a',
    line: 'rgba(255, 138, 138, 0.5)',
    tint: 'rgba(107, 18, 18, 0.5)',
  },
  {
    id: 'kentucky',
    school: 'University of Kentucky',
    nickname: 'Wildcats',
    abbr: 'UK',
    accent: '#8fbaff',
    primary: '#0033a0',
    line: 'rgba(143, 186, 255, 0.5)',
    tint: 'rgba(0, 40, 120, 0.5)',
  },
  {
    id: 'texas',
    school: 'University of Texas',
    nickname: 'Longhorns',
    abbr: 'TEX',
    accent: '#ff9a4d',
    primary: '#bf5700',
    line: 'rgba(255, 154, 77, 0.5)',
    tint: 'rgba(122, 56, 0, 0.5)',
  },
]

/** Picks an opponent for `team` — any other school in the league. */
export function opposingTeam(team: Team, random: () => number = Math.random) {
  const rivals = TEAMS.filter((candidate) => candidate.id !== team.id)
  return rivals[Math.floor(random() * rivals.length)]
}
