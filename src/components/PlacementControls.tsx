export interface PlacementControlsProps {
  selectedShip: string | null
  onRotate: () => void
  onRandomize: () => void
  onStart: () => void
}

export function PlacementControls({
  selectedShip,
  onRotate,
  onRandomize,
  onStart,
}: PlacementControlsProps) {
  return (
    <div className="placement">
      <p className="placement__hint">
        {selectedShip
          ? `${selectedShip} selected — click a square to move it, or rotate it.`
          : 'Drag a ship, or click one to pick it up. Press R to rotate.'}
      </p>
      <div className="placement__actions">
        <button
          type="button"
          className="status__button"
          onClick={onRotate}
          disabled={!selectedShip}
        >
          Rotate (R)
        </button>
        <button type="button" className="status__button" onClick={onRandomize}>
          Randomize
        </button>
        <button
          type="button"
          className="status__button status__button--primary"
          onClick={onStart}
        >
          Start battle
        </button>
      </div>
    </div>
  )
}
