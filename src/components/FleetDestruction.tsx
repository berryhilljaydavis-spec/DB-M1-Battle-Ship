interface Blast {
  left: number
  top: number
  scale: number
  delay: number
}

interface Plume {
  left: number
  delay: number
  scale: number
}

/** Hand-tuned so blasts walk across the whole grid instead of clustering. */
const BLASTS: readonly Blast[] = [
  { left: 22, top: 64, scale: 1.35, delay: 0 },
  { left: 68, top: 38, scale: 1.1, delay: 0.28 },
  { left: 44, top: 78, scale: 0.85, delay: 0.52 },
  { left: 81, top: 66, scale: 1.25, delay: 0.74 },
  { left: 13, top: 34, scale: 0.9, delay: 0.96 },
  { left: 57, top: 52, scale: 1.5, delay: 1.18 },
  { left: 34, top: 44, scale: 0.8, delay: 1.44 },
  { left: 74, top: 84, scale: 1.05, delay: 1.66 },
  { left: 50, top: 28, scale: 0.95, delay: 1.92 },
  { left: 27, top: 88, scale: 1.2, delay: 2.16 },
  { left: 88, top: 48, scale: 0.75, delay: 2.4 },
  { left: 62, top: 70, scale: 1.4, delay: 2.68 },
]

const PLUMES: readonly Plume[] = [
  { left: 24, delay: 0.3, scale: 1 },
  { left: 52, delay: 1.1, scale: 1.3 },
  { left: 78, delay: 1.9, scale: 0.85 },
]

/** Chain of explosions that tears apart the losing fleet's board. */
export function FleetDestruction() {
  return (
    <div className="destruction" aria-hidden="true">
      <span className="destruction__fire" />

      {BLASTS.map((blast) => (
        <span
          key={`${blast.left}-${blast.top}`}
          className="destruction__blast"
          style={{
            left: `${blast.left}%`,
            top: `${blast.top}%`,
            animationDelay: `${blast.delay}s`,
            scale: `${blast.scale}`,
          }}
        />
      ))}

      {PLUMES.map((plume) => (
        <span
          key={plume.left}
          className="destruction__smoke"
          style={{
            left: `${plume.left}%`,
            animationDelay: `${plume.delay}s`,
            scale: `${plume.scale}`,
          }}
        />
      ))}
    </div>
  )
}
