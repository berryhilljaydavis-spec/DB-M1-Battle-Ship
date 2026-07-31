import { isShipSunk } from '../game/board'
import type { Board } from '../game/types'

export interface FleetStatusProps {
  title: string
  board: Board
}

export function FleetStatus({ title, board }: FleetStatusProps) {
  return (
    <div className="fleet">
      <h3 className="fleet__title">{title}</h3>
      <ul className="fleet__list">
        {board.ships.map((ship) => {
          const sunk = isShipSunk(ship)
          return (
            <li
              key={ship.name}
              className={`fleet__ship${sunk ? ' fleet__ship--sunk' : ''}`}
            >
              <span>{ship.name}</span>
              <span className="fleet__hits">
                {ship.hits}/{ship.size}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
