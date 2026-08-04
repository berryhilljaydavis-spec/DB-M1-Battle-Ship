import { shipOrientation } from '../game/placement'
import type { Ship } from '../game/types'

export interface ShipHullProps {
  ship: Ship
  /** Highlights the hull while it is picked up during placement. */
  selected?: boolean
  sunk?: boolean
}

const UNIT = 100

/** Silhouette of a warship: pointed bow, rounded stern, deck and turrets. */
export function ShipHull({ ship, selected, sunk }: ShipHullProps) {
  const orientation = shipOrientation(ship)
  const vertical = orientation === 'vertical'
  const length = ship.size * UNIT
  const head = ship.cells[0]

  return (
    <svg
      className={`hull${selected ? ' hull--selected' : ''}${
        sunk ? ' hull--sunk' : ''
      }`}
      viewBox={vertical ? `0 0 ${UNIT} ${length}` : `0 0 ${length} ${UNIT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        gridColumn: `${head.col + 2} / span ${vertical ? 1 : ship.size}`,
        gridRow: `${head.row + 2} / span ${vertical ? ship.size : 1}`,
      }}
    >
      <g transform={vertical ? `translate(${UNIT} 0) rotate(90)` : undefined}>
        <path
          className="hull__body"
          d={`M 12 16 L ${length - 42} 16 Q ${length - 2} 50 ${
            length - 42
          } 84 L 12 84 Q 0 50 12 16 Z`}
        />
        <path
          className="hull__deck"
          d={`M 20 30 L ${length - 50} 30 Q ${length - 22} 50 ${
            length - 50
          } 70 L 20 70 Q 12 50 20 30 Z`}
        />
        <rect
          className="hull__bridge"
          x={length * 0.36}
          y={24}
          width={length * 0.18}
          height={52}
          rx={9}
        />
        <rect
          className="hull__funnel"
          x={length * 0.55}
          y={30}
          width={length * 0.07}
          height={40}
          rx={6}
        />
        <circle className="hull__turret" cx={length * 0.2} cy={50} r={14} />
        <circle
          className="hull__turret"
          cx={length * 0.78}
          cy={50}
          r={ship.size > 2 ? 14 : 11}
        />
        <path
          className="hull__gun"
          d={`M ${length * 0.2} 50 L ${length * 0.33} 50`}
        />
        <path
          className="hull__gun"
          d={`M ${length * 0.78} 50 L ${length * 0.93} 50`}
        />
      </g>
    </svg>
  )
}
