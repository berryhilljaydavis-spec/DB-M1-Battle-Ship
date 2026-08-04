import { shipOrientation } from '../game/placement'
import type { Board, Orientation } from '../game/types'

export interface PlacementControlsProps {
  board: Board
  selectedShip: string | null
  onSelectShip: (name: string) => void
  onOrient: (orientation: Orientation) => void
  onRandomize: () => void
  onStart: () => void
}

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
]

export function PlacementControls({
  board,
  selectedShip,
  onSelectShip,
  onOrient,
  onRandomize,
  onStart,
}: PlacementControlsProps) {
  const selected = board.ships.find((ship) => ship.name === selectedShip)
  const orientation = selected ? shipOrientation(selected) : null

  return (
    <section className="placement" aria-label="Fleet placement">
      <div className="placement__roster">
        <h2 className="placement__heading">Your ships</h2>
        <ul className="placement__ships">
          {board.ships.map((ship) => {
            const isSelected = ship.name === selectedShip
            return (
              <li key={ship.name}>
                <button
                  type="button"
                  className={`ship-pick${isSelected ? ' ship-pick--active' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelectShip(ship.name)}
                >
                  <span className="ship-pick__name">{ship.name}</span>
                  <span className="ship-pick__hull" aria-hidden="true">
                    {Array.from({ length: ship.size }, (_, index) => (
                      <span key={index} className="ship-pick__cell" />
                    ))}
                  </span>
                  <span className="ship-pick__size">{ship.size}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="placement__controls">
        <h2 className="placement__heading">Orientation</h2>
        <div className="placement__group" role="group" aria-label="Orientation">
          {ORIENTATIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip${
                orientation === option.value ? ' chip--active' : ''
              }`}
              aria-pressed={orientation === option.value}
              disabled={!selected}
              onClick={() => onOrient(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="placement__hint">
          {selected
            ? `${selected.name} selected — click a square to drop it. Press R to flip.`
            : 'Pick a ship, then click a square on your board to place it.'}
        </p>

        <div className="placement__actions">
          <button type="button" className="btn" onClick={onRandomize}>
            Randomize
          </button>
          <button type="button" className="btn btn--primary" onClick={onStart}>
            Start battle
          </button>
        </div>
      </div>
    </section>
  )
}
