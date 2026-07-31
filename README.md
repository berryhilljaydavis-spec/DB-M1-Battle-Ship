# DB-M1-Battle-Ship

A browser-only Battleship game built with React 19, TypeScript and Vite. You play a
10x10 board against an AI opponent; both fleets are placed randomly at the start of
every game and the AI fires at uniformly random cells it has not tried yet.

## Playing

Each game opens in a placement phase: your fleet starts at random positions and you
can drag a ship onto another square, or click it and click its new position. `Rotate
(R)` flips the selected ship, `Randomize` re-rolls the whole fleet, and `Start battle`
locks the layout in. Overlapping or off-board positions are rejected. Every hit plays
a short explosion on the struck cell (skipped when `prefers-reduced-motion` is set).

## Getting started

Requires Node 22 (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Lint with ESLint |

## Architecture

Game rules live in pure, side-effect-free modules so they can be unit tested without
rendering anything. React only owns presentation and turn scheduling.

```
src/
  game/
    types.ts       Domain types (Coord, Ship, Board, ShotOutcome…)
    constants.ts   Board size, fleet definition, coordinate labels
    board.ts       Board creation, ship placement, shot resolution
    ai.ts          Opponent move selection
    placement.ts   Manual fleet editing (move / rotate / remove a ship)
    engine.ts      Turn state machine (createGame / startBattle / humanFire / aiFire)
  hooks/
    useBattleship.ts  React binding: state, placement actions, fireAt, AI turn timer
  components/
    Board.tsx      Grid of cells with row/column labels
    Cell.tsx       Single memoised, accessible cell button
    Explosion.tsx  CSS burst rendered on a fresh hit
    FleetStatus.tsx  Per-ship hit counters
    PlacementControls.tsx  Rotate / randomize / start battle
    StatusPanel.tsx  Turn status, restart button, shot log
  App.tsx          Layout composition
```

Every board operation returns a new board rather than mutating the existing one, so
game state transitions are pure functions and easy to assert on. Randomness is
injected as a `RandomFn` parameter, which lets tests drive placement and AI choices
with a seeded PRNG.

## Deploying to Vercel

The repo ships with `vercel.json` configured for the Vite preset. Import the repo in
Vercel (or run `vercel`) and it builds with `npm run build`, serving `dist/`.
