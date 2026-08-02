import { describe, expect, it } from 'vitest'
import { TEAMS, opposingTeam } from './teams'

describe('teams', () => {
  it('offers four schools with unique ids', () => {
    expect(TEAMS).toHaveLength(4)
    expect(new Set(TEAMS.map((team) => team.id)).size).toBe(4)
  })

  it('never assigns the player their own school as the rival', () => {
    for (const team of TEAMS) {
      for (const roll of [0, 0.34, 0.67, 0.99]) {
        expect(opposingTeam(team, () => roll).id).not.toBe(team.id)
      }
    }
  })
})
