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
  { top: 32, scale: 0.88, duration: 10.5, delay: 5.1 },
  { top: 19, scale: 0.44, duration: 17, delay: 7.2 },
]

const TRACERS: readonly Tracer[] = [
  { left: 6, delay: 0.1, drift: -10 },
  { left: 12, delay: 0.4, drift: -18 },
  { left: 20, delay: 1.9, drift: 6 },
  { left: 27, delay: 1.1, drift: 10 },
  { left: 36, delay: 2.3, drift: -12 },
  { left: 44, delay: 0.7, drift: -6 },
  { left: 51, delay: 2.7, drift: 16 },
  { left: 58, delay: 1.7, drift: 22 },
  { left: 66, delay: 0.9, drift: -20 },
  { left: 73, delay: 0.2, drift: -14 },
  { left: 81, delay: 2.1, drift: 12 },
  { left: 88, delay: 1.3, drift: 8 },
  { left: 95, delay: 2.5, drift: -8 },
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
