import type { GameState } from '../game/engine'

export interface StatusPanelProps {
  state: GameState
  onRestart: () => void
}

function statusText({ phase, winner }: GameState): string {
  if (phase === 'game-over') {
    return winner === 'human' ? 'Victory! You win.' : 'Defeat. The AI wins.'
  }
  return phase === 'human-turn' ? 'Your turn — fire at will.' : 'AI is aiming…'
}

export function StatusPanel({ state, onRestart }: StatusPanelProps) {
  return (
    <div className="status">
      <p className="status__text" role="status">
        {statusText(state)}
      </p>
      <button type="button" className="status__button" onClick={onRestart}>
        New game
      </button>
      <ul className="status__log">
        {state.log.map((entry, index) => (
          <li key={`${index}-${entry}`}>{entry}</li>
        ))}
      </ul>
    </div>
  )
}
