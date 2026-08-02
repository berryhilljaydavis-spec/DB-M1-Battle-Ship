import { useState } from 'react'
import { TEAMS } from '../game/teams'
import type { Team } from '../game/teams'

export interface TeamSelectProps {
  onConfirm: (team: Team) => void
  onBack: () => void
}

/** Roster screen shown between the title screen and the placement phase. */
export function TeamSelect({ onConfirm, onBack }: TeamSelectProps) {
  const [picked, setPicked] = useState<Team>(TEAMS[0])

  return (
    <section className="teams" aria-label="Team selection">
      <h1 className="teams__title">Choose your team</h1>
      <p className="teams__tagline">
        Your colors fly over your fleet — a rival school takes the enemy waters.
      </p>

      <ul className="teams__grid">
        {TEAMS.map((team) => {
          const selected = team.id === picked.id
          return (
            <li key={team.id}>
              <button
                type="button"
                className={`team${selected ? ' team--selected' : ''}`}
                style={{
                  '--team-accent': team.accent,
                  '--team-primary': team.primary,
                } as React.CSSProperties}
                aria-pressed={selected}
                onClick={() => setPicked(team)}
              >
                <span className="team__abbr">{team.abbr}</span>
                <span className="team__school">{team.school}</span>
                <span className="team__nickname">{team.nickname}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="teams__actions">
        <button
          type="button"
          className="menu__play"
          onClick={() => onConfirm(picked)}
        >
          Take command
        </button>
        <button type="button" className="teams__back" onClick={onBack}>
          Back to menu
        </button>
      </div>
    </section>
  )
}
