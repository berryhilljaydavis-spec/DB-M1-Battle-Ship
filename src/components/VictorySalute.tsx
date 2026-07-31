interface Gunship {
  top: number
  scale: number
  duration: number
  delay: number
}

interface Tracer {
  left: number
  delay: number
  drift: number
}

const GUNSHIPS: readonly Gunship[] = [
  { top: 14, scale: 1, duration: 9, delay: 0 },
  { top: 24, scale: 0.72, duration: 12, delay: 1.6 },
  { top: 6, scale: 0.55, duration: 15, delay: 3.4 },
]

const TRACERS: readonly Tracer[] = [
  { left: 12, delay: 0.4, drift: -18 },
  { left: 27, delay: 1.1, drift: 10 },
  { left: 44, delay: 0.7, drift: -6 },
  { left: 58, delay: 1.7, drift: 22 },
  { left: 73, delay: 0.2, drift: -14 },
  { left: 88, delay: 1.3, drift: 8 },
]

/** Celebratory flyover: gunships firing salute rounds into the sky on a win. */
export function VictorySalute() {
  return (
    <div className="salute" aria-hidden="true">
      {GUNSHIPS.map((ship) => (
        <div
          key={ship.top}
          className="gunship"
          style={{
            top: `${ship.top}%`,
            animationDuration: `${ship.duration}s`,
            animationDelay: `${ship.delay}s`,
          }}
        >
          <div
            className="gunship__body"
            style={{ transform: `scale(${ship.scale})` }}
          >
            <span className="gunship__hull" />
            <span className="gunship__deck" />
            <span className="gunship__bridge" />
            <span className="gunship__barrel" />
            <span className="gunship__muzzle" />
          </div>
        </div>
      ))}

      {TRACERS.map((tracer) => (
        <div
          key={`${tracer.left}-${tracer.delay}`}
          className="salute__shot"
          style={
            {
              left: `${tracer.left}%`,
              animationDelay: `${tracer.delay}s`,
              '--drift': `${tracer.drift}vw`,
            } as React.CSSProperties
          }
        >
          <span className="salute__tracer" />
          <span className="salute__burst" />
        </div>
      ))}
    </div>
  )
}
