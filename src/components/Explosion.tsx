const SPARK_COUNT = 9
const DEBRIS_COUNT = 4

const SPARKS = Array.from({ length: SPARK_COUNT }, (_, i) => {
  const angle = (i / SPARK_COUNT) * Math.PI * 2 + i * 0.37
  const distance = 20 + (i % 3) * 7
  return {
    dx: `${(Math.cos(angle) * distance).toFixed(1)}px`,
    dy: `${(Math.sin(angle) * distance).toFixed(1)}px`,
    delay: `${(i % 4) * 18}ms`,
  }
})

const DEBRIS = Array.from({ length: DEBRIS_COUNT }, (_, i) => {
  const angle = Math.PI + (i / (DEBRIS_COUNT - 1)) * Math.PI
  return {
    dx: `${(Math.cos(angle) * 17).toFixed(1)}px`,
    dy: `${(Math.sin(angle) * 15 - 8).toFixed(1)}px`,
    spin: `${(i % 2 ? 1 : -1) * (180 + i * 60)}deg`,
  }
})

export interface ExplosionProps {
  /** Fires when the outermost blast animation finishes, so the burst can unmount. */
  onFinished: () => void
}

export function Explosion({ onFinished }: ExplosionProps) {
  return (
    <span
      className="blast"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onFinished()
      }}
    >
      <span className="blast__flash" />
      <span className="blast__fireball" />
      <span className="blast__shockwave" />
      <span className="blast__smoke" />
      {SPARKS.map((spark, i) => (
        <span
          key={i}
          className="blast__spark"
          style={
            {
              '--dx': spark.dx,
              '--dy': spark.dy,
              '--delay': spark.delay,
            } as React.CSSProperties
          }
        />
      ))}
      {DEBRIS.map((piece, i) => (
        <span
          key={i}
          className="blast__debris"
          style={
            {
              '--dx': piece.dx,
              '--dy': piece.dy,
              '--spin': piece.spin,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  )
}
