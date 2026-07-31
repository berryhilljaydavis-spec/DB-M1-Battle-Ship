interface DistantShip {
  /** Horizontal start position, in percent of the viewport width. */
  from: number
  /** Vertical position on the horizon band, in percent. */
  top: number
  scale: number
  duration: number
  delay: number
  flipped: boolean
}

const DISTANT_SHIPS: readonly DistantShip[] = [
  { from: -12, top: 2, scale: 1, duration: 150, delay: 0, flipped: false },
  { from: 22, top: 9, scale: 0.68, duration: 210, delay: -60, flipped: false },
  { from: 58, top: 0, scale: 0.85, duration: 180, delay: -30, flipped: true },
  { from: 80, top: 13, scale: 0.5, duration: 240, delay: -120, flipped: true },
]

/** Purely decorative open-ocean scene rendered behind the game. */
export function OceanBackground() {
  return (
    <div className="ocean" aria-hidden="true">
      <div className="ocean__sky" />
      <div className="ocean__sun" />
      <div className="ocean__clouds ocean__clouds--far" />
      <div className="ocean__clouds ocean__clouds--near" />

      <div className="ocean__horizon">
        {DISTANT_SHIPS.map((ship) => (
          <div
            key={`${ship.from}-${ship.top}`}
            className={`horizon-ship${ship.flipped ? ' horizon-ship--flipped' : ''}`}
            style={{
              left: `${ship.from}%`,
              top: `${ship.top}%`,
              transform: `scale(${ship.scale})`,
              animationDuration: `${ship.duration}s`,
              animationDelay: `${ship.delay}s`,
            }}
          >
            <span className="horizon-ship__mast" />
            <span className="horizon-ship__tower" />
            <span className="horizon-ship__hull" />
            <span className="horizon-ship__wake" />
          </div>
        ))}
      </div>

      <div className="ocean__sea">
        <div className="ocean__glimmer" />
        <div className="ocean__wave ocean__wave--back" />
        <div className="ocean__wave ocean__wave--mid" />
        <div className="ocean__wave ocean__wave--front" />
      </div>
    </div>
  )
}
