export interface SoundToggleProps {
  enabled: boolean
  onToggle: () => void
}

/** Small speaker button that mutes or unmutes the game's sound effects. */
export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Mute sound effects' : 'Unmute sound effects'}
      title={enabled ? 'Sound on' : 'Sound off'}
    >
      <span aria-hidden="true">{enabled ? '🔊' : '🔇'}</span>
    </button>
  )
}
