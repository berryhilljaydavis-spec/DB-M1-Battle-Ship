import type { GameState } from '../game/engine'

export interface StatusPanelProps {
  state: GameState
  onRestart: () => void
  onMenu?: () => void
}

function statusText({ phase, winner }: GameState): string {
  if (phase === 'game-over') {
    return winner === 'human' ? 'Victory! You win.' : 'Defeat. The AI wins.'
  }
  if (phase === 'placement') return 'Position your fleet, then start the battle.'
  return phase === 'human-turn' ? 'Your turn — fire at will.' : 'AI is aiming…'
}

export function StatusPanel({ state, onRestart, onMenu }: StatusPanelProps) {
  return (
    <div className="status">
      <p className="status__text" role="status">
        {statusText(state)}
      </p>
      <div className="status__actions">
        <button type="button" className="status__button" onClick={onRestart}>
          New game
        </button>
        {onMenu && (
          <button
            type="button"
            className="status__button status__button--ghost"
            onClick={onMenu}
          >
            Main menu
          </button>
        )}
      </div>
      <ul className="status__log">
        {state.log.map((entry, index) => (
          <li key={`${index}-${entry}`}>{entry}</li>
        ))}
      </ul>
    </div>
  )
}
