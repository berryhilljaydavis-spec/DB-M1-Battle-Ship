import type { BoardSide } from './Board'

/** Naval roundel used as the game's title-screen logo. */
export function GameEmblem() {
  return (
    <svg
      className="emblem"
      viewBox="0 0 96 96"
      role="img"
      aria-label="Battleship emblem"
    >
      <defs>
        <linearGradient id="emblem-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b6f9c" />
          <stop offset="100%" stopColor="#0a2740" />
        </linearGradient>
        <linearGradient id="emblem-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe6a3" />
          <stop offset="100%" stopColor="#e0a32d" />
        </linearGradient>
      </defs>

      <circle cx="48" cy="48" r="45" fill="url(#emblem-sea)" />
      <circle
        cx="48"
        cy="48"
        r="45"
        fill="none"
        stroke="url(#emblem-gold)"
        strokeWidth="4"
      />
      <circle
        cx="48"
        cy="48"
        r="37"
        fill="none"
        stroke="rgba(255, 230, 163, 0.45)"
        strokeWidth="1.5"
      />

      {/* Crossed gun barrels behind the ship. */}
      <g stroke="url(#emblem-gold)" strokeWidth="4" strokeLinecap="round">
        <line x1="24" y1="66" x2="70" y2="26" />
        <line x1="72" y1="66" x2="26" y2="26" />
      </g>

      {/* Warship silhouette on the waterline. */}
      <g fill="#0c1f31">
        <path d="M20 58h50l6 6H26z" />
        <rect x="38" y="46" width="18" height="6" rx="1" />
        <rect x="44" y="39" width="8" height="7" rx="1" />
        <rect x="58" y="42" width="6" height="10" rx="1" />
        <rect x="28" y="50" width="8" height="4" rx="1" />
      </g>
      <path
        d="M48 39V26M42 31h12"
        stroke="#0c1f31"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Wave line under the hull. */}
      <path
        d="M18 70q7-5 14 0t14 0 14 0 14 0"
        fill="none"
        stroke="rgba(255, 255, 255, 0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export interface FleetCrestProps {
  side: BoardSide
}

/** Shield worn by each fleet: an anchor for yours, a torpedo for the enemy. */
export function FleetCrest({ side }: FleetCrestProps) {
  return (
    <svg className="crest" viewBox="0 0 40 44" aria-hidden="true">
      <path
        d="M20 1 38 7v16c0 10-7.7 16.6-18 20C9.7 39.6 2 33 2 23V7z"
        fill="rgba(4, 16, 30, 0.75)"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {side === 'friendly' ? (
        <g
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        >
          <circle cx="20" cy="12" r="3" />
          <path d="M20 15v16M13 21h14M9 26c0 6 5 9 11 9s11-3 11-9" />
        </g>
      ) : (
        <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M10 22h18" />
          <path d="M28 22l5-4v8z" fill="currentColor" strokeLinejoin="round" />
          <path d="M13 14l-4-4M13 30l-4 4M20 13v-4M20 31v4" />
        </g>
      )}
    </svg>
  )
}
