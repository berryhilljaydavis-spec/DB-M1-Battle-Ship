# Bug Report — DB-M1-Battle-Ship

Every entry below is a defect that was actually hit while building, testing, or deploying this
project (React 19 + TypeScript + Vite Battleship, human vs AI). Nothing here is hypothetical.
Bugs are grouped into product/code defects and build/deploy defects; each one lists how it
surfaced, how to reproduce it, the root cause, the fix, and how the fix was verified.

Reference points used to compile this report: the commit history on
`devin/1785520844-battleship-game`, the `npm run lint` / `npm test` / `npm run build` output,
the end-to-end browser play-test of the app, and the Vercel deployment logs.

---

## 1. Product / code defects

### Bug 1 — Hit explosion was clipped to the 32 px cell

1. **Title:** Explosion effect rendered inside the cell `<button>` and was clipped to the cell box.
2. **Discovery:** Visual check in Chrome right after implementing the "small realistic explosion on
   every hit" feature — the burst looked like a coloured square filling one cell instead of an
   explosion.
3. **Steps to reproduce (pre-fix):** Start a game, fire at the enemy board until a shot returns
   `hit`. Watch the hit cell.
4. **Expected:** A short burst (flash → fireball → expanding shockwave → smoke, sparks and debris)
   that overflows the cell and reads as an explosion.
5. **Actual:** Flash and fireball were visible, but the shockwave ring, sparks and debris were cut
   off at the cell edge; the animation looked like a flashing tile.
6. **Root cause:** `<Explosion />` was mounted *inside* the `<button class="cell">`, which is a
   fixed 2rem × 2rem, `overflow`-constrained, `border`-boxed grid child. Anything drawn beyond the
   button's padding box was clipped, and the button also participated in the grid layout, so it
   could not grow.
7. **Fix:** Wrap each cell in a non-clipping `.cell-slot` span, keep the button as the interactive
   element, and render the blast as a sibling of the button inside the wrapper. The wrapper owns
   the stacking context and the shake animation; blast geometry (flash/fireball/shockwave radius,
   spark travel distance) was enlarged now that it can overflow.

   ```tsx
   // src/components/Cell.tsx
   <span className={`cell-slot${blastId === null ? '' : ' cell-slot--blasting'}`}>
     <button type="button" className={`cell cell--${modifier}`} …>…</button>
     {blastId !== null && <Explosion key={blastId} onFinished={() => setBlastId(null)} />}
   </span>
   ```

   ```css
   /* src/App.css */
   .cell-slot { position: relative; display: block; width: 2rem; height: 2rem; }
   .cell      { display: block; width: 100%; height: 100%; }
   .blast     { position: absolute; inset: 0; pointer-events: none; }
   .cell-slot--blasting { z-index: 2; }   /* blast layers overflow the slot, nothing clips them */
   ```
8. **Verification:** Re-ran the game in Chrome and confirmed the burst now extends past the cell in
   all directions on both boards, with no change to grid geometry (10 × 10 cells stay aligned; the
   `.cell-slot` keeps the same footprint the button had). `npm test` and `npm run build` re-run
   green.

---

### Bug 2 — Explosion fired on mount / on ship reveal instead of on a fresh hit

1. **Title:** Blast triggered whenever a `Cell` rendered with `state="hit"`, not only when a cell
   *became* hit.
2. **Discovery:** Component test written alongside the feature (`src/components/Cell.test.tsx`) plus
   the observation that clicking "New game" or reaching game-over (which reveals ships) replayed
   bursts on already-resolved cells.
3. **Steps to reproduce (pre-fix):** Render `<Cell state="hit" … />` directly (or reach game over so
   the board re-renders with existing hits).
4. **Expected:** An explosion only on the transition `ship → hit`; no explosion for a cell that is
   already hit when it mounts or re-renders, and never for a `miss`.
5. **Actual:** Every mount/re-render with `state="hit"` started a new burst.
6. **Root cause:** The trigger was derived from the current render's `state` prop instead of from a
   change in that prop, so it had no notion of "previous state".
7. **Fix:** Track the previous state in a ref and bump a blast id only on a real transition into
   `hit`; the id doubles as the React `key` so consecutive hits restart the animation cleanly.

   ```tsx
   const [blastId, setBlastId] = useState<number | null>(null)
   const previousState = useRef(state)

   useEffect(() => {
     if (state === 'hit' && previousState.current !== 'hit') {
       setBlastId((id) => (id ?? 0) + 1)
     }
     previousState.current = state
   }, [state])
   ```
8. **Verification:** Three unit tests in `src/components/Cell.test.tsx` — burst appears when a cell
   goes `ship → hit`, no burst for a `miss`, and no burst for a cell mounted already in `hit`.
   All pass; confirmed visually that "New game" and game-over reveal no longer produce bursts.

---

### Bug 3 — Selected ship lost its highlight on hover during placement

1. **Title:** Hovering a selected ship turned its cells from the yellow "selected" colour back to
   the plain ship colour.
2. **Discovery:** Manual placement-phase testing in Chrome: moving the mouse over the ship you had
   just selected made the selection appear to disappear.
3. **Steps to reproduce (pre-fix):** Start a game (placement phase), click one of your ships, then
   hover the mouse over that same ship.
4. **Expected:** Selected cells stay yellow (only slightly lighter on hover).
5. **Actual:** Selected cells reverted to grey/blue while hovered, making it look as if the
   selection had been dropped.
6. **Root cause:** CSS specificity/order — the generic cell hover rule matched selected cells too
   and was declared after `.cell--selected`, so it overrode the selected background.
7. **Fix:** Exclude selected cells from the generic hover rule and give them their own hover state.

   ```css
   .cell:not(:disabled):not(.cell--ship):not(.cell--selected):hover { background: #1f4b8e; }
   .cell--selected                                                 { background: #ffd25a; }
   .cell--selected:not(:disabled):hover                            { background: #ffe08a; }
   ```
8. **Verification:** Hovered the selected ship in Chrome — highlight persists; also confirmed
   `aria-pressed="true"` stays on the selected cells so the state is not just visual.

---

### Bug 4 — A ship could not be moved onto a square overlapping its own current position

1. **Title:** `moveShip` rejected legal slides because the ship collided with itself.
2. **Discovery:** Placement unit tests (`src/game/placement.test.ts`) plus manual clicking — nudging
   a 5-cell Carrier one square along its own axis was silently refused.
3. **Steps to reproduce (pre-fix):** Placement phase, select the Carrier at A1–A5 (horizontal), click
   B1 to slide it one cell right.
4. **Expected:** The ship moves; the destination overlapping its *own* old cells is fine.
5. **Actual:** Nothing happened — the move was treated as an overlap with an existing ship.
6. **Root cause:** The overlap check ran `canPlaceShip` against the board that still contained the
   ship being moved, so the ship's own occupied cells counted as blockers.
7. **Fix:** Remove the ship first, validate against the reduced board, and only then place it;
   return `null` (a no-op for the caller) when the target is genuinely illegal.

   ```ts
   export function moveShip(board, name, start, orientation): Board | null {
     const ship = board.ships.find((s) => s.name === name)
     if (!ship) return null
     const without = boardWithoutShip(board, name)          // ship no longer blocks itself
     if (!canPlaceShip(without, start, ship.size, orientation)) return null
     return placeShip(without, { name, size: ship.size }, start, orientation)
   }
   ```
8. **Verification:** `src/game/placement.test.ts` covers "moves a ship over its own old cells",
   off-board rejection, overlap rejection with a *different* ship, and rotation at the board edge —
   10 placement tests, all passing. Confirmed in the browser that click-to-move and drag both allow
   one-cell slides while still refusing overlaps and off-board positions.

---

### Bug 5 — `setState` called from inside a state updater in the placement hook

1. **Title:** Selection updates were performed inside `setState`'s updater function.
2. **Discovery:** Code review of the first `useBattleship` placement implementation while chasing an
   inconsistent selection highlight after invalid drops.
3. **Steps to reproduce (pre-fix):** Placement phase; click a ship, then click an illegal square
   (off-board extension or another ship). Selection state could end up out of sync with the board.
4. **Expected:** Selection and board are updated deterministically; state updaters stay pure.
5. **Actual:** The updater had a side effect (setting the selection), which React may call more than
   once and is not guaranteed to be safe.
6. **Root cause:** Board mutation and selection bookkeeping were conflated in a single functional
   update instead of being computed from already-rendered state.
7. **Fix:** Derive `isPlacing` and `humanBoard` from the current render, compute the candidate move
   purely, then perform *at most one* board `setState` and set the selection outside the updater.

   ```ts
   const isPlacing = state.phase === 'placement'
   const humanBoard = state.humanBoard
   // …
   const moved = moveShip(humanBoard, selected.name, start, orientation)
   if (moved) { setState((current) => ({ ...current, humanBoard: moved })); return }
   const other = findShipAt(humanBoard, coord)
   if (other && other.name !== selected.name) grabAt(coord)   // click-through to another ship
   ```
8. **Verification:** `npm run lint` (ESLint 9 + `eslint-plugin-react-hooks`) clean, no React
   warnings in the browser console during a full placement + battle session, and `src/App.test.tsx`
   asserts the fleet still has exactly 17 ship cells after moves, rotations and randomize.

---

### Bug 6 — Existing tests broke when the placement phase was introduced

1. **Title:** `src/App.test.tsx` and `src/game/engine.test.ts` failed after the game started in a
   new `placement` phase.
2. **Discovery:** `npm test` immediately after adding the placement phase.
3. **Steps to reproduce (pre-fix):** Run `npm test` on the commit that adds `Phase = 'placement' | …`
   without touching the tests.
4. **Expected:** Tests either pass or fail for a real product reason.
5. **Actual:** Firing assertions failed because the enemy board is intentionally inert until
   "Start battle", and engine tests expected the initial phase to be `human-turn`.
6. **Root cause:** Legitimate behaviour change (a new pre-combat phase) that the pre-existing tests
   did not know about — a stale-test failure, not a product regression.
7. **Fix:** Updated the tests to reflect the new flow rather than weakening the product: component
   tests click **Start battle** first, engine tests assert the initial phase is `placement`, exercise
   `startBattle()`, and assert it is a no-op once combat has begun.

   ```ts
   // src/game/engine.test.ts
   expect(createGame(...).phase).toBe('placement')
   const battle = startBattle(createGame(...))
   expect(battle.phase).toBe('human-turn')
   expect(startBattle(battle)).toBe(battle)      // idempotent after combat starts
   ```
8. **Verification:** `npm test` → 7 test files, 54 tests, all passing.

---

### Bug 7 — Blast marker CSS class rename left a test asserting the old class

1. **Title:** `Cell.test.tsx` asserted `.cell--blasting` after the class moved to the wrapper.
2. **Discovery:** `npm test` failure right after the Bug 1 fix.
3. **Steps to reproduce (pre-fix):** Apply the `.cell-slot` wrapper refactor and run `npm test`.
4. **Expected:** Explosion tests pass against the current DOM structure.
5. **Actual:** Query for the old class returned nothing, so the "burst appears on a fresh hit" test
   failed even though the feature worked.
6. **Root cause:** The shake/stacking class moved from the button (`.cell--blasting`) to the new
   wrapper (`.cell-slot--blasting`); the test still queried the button.
7. **Fix:** Point the assertions at the wrapper class produced by the new structure.
8. **Verification:** `npm test` green; the three explosion tests now fail correctly if the wrapper is
   removed (checked by temporarily reverting the wrapper).

---

## 2. Build, tooling and deployment defects

### Bug 8 — Vitest could not start: missing native Rolldown binding

1. **Title:** `npm test` crashed with a missing `@rolldown/binding-wasm32-wasi` native binding.
2. **Discovery:** First `npm test` run after scaffolding the project.
3. **Steps to reproduce (pre-fix):** Scaffold with the then-current Vite 8 / Vitest 4 pre-release
   line and run `npm test`.
4. **Expected:** Vitest boots and runs the suite.
5. **Actual:** Startup aborted before collecting any test file, complaining about the platform
   binding for Rolldown.
6. **Root cause:** The pre-release Vite 8 / Vitest 4 toolchain pulled a Rolldown-based bundler whose
   optional native binary did not resolve on this Linux/Node combination (`@vitest/coverage-v8`
   dragged in the same graph).
7. **Fix:** Pin the stable toolchain and drop the coverage plugin, then reinstall from a clean
   `node_modules` on Node 22:
   `vite@^7.3.6`, `vitest@^3.2.7`, removed `@vitest/coverage-v8` (see `package.json`).
8. **Verification:** `npm test` runs the whole suite (currently 54 tests) and `npm run build`
   produces `dist/` without touching any native binding.

---

### Bug 9 — jsdom tests failed on Node 20 (`@csstools/css-calc` ESM error)

1. **Title:** Test run aborted under Node 20 with an ESM resolution error inside jsdom's CSS stack.
2. **Discovery:** Running `npm test` on the default Node 20 runtime.
3. **Steps to reproduce (pre-fix):** `nvm use 20 && npm test`.
4. **Expected:** jsdom environment initialises and component tests run.
5. **Actual:** Import failure from `@csstools/css-calc` while jsdom loaded, before any test ran.
6. **Root cause:** jsdom 27's dependency graph requires a newer Node ESM resolver than Node 20
   provides for those packages.
7. **Fix:** Standardise on Node 22 and record it in the repo so future runs (and Vercel) match:
   `.nvmrc` → `22`; all local commands run on `v22.12.0`.
8. **Verification:** `nvm use 22` (v22.12.0) → `npm test`, `npm run lint`, `npm run build` all pass;
   the Vercel build uses Node 22 as well.

---

### Bug 10 — `npm run lint` pointed at a linter the project was not configured for

1. **Title:** Lint script invoked `oxlint` (Vite template default) with no working configuration.
2. **Discovery:** First `npm run lint` after scaffolding.
3. **Steps to reproduce (pre-fix):** `npm run lint` on the scaffolded project.
4. **Expected:** Lint runs across `src/` with React/TypeScript rules.
5. **Actual:** Nothing useful was linted — no React-hooks rules and no TypeScript-aware rules were
   applied to the code that needed them.
6. **Root cause:** The template's default lint tooling did not match the ESLint-based setup the
   project needed (`typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`).
7. **Fix:** Added a flat `eslint.config.js` (ESLint 9) with the TypeScript and React-hooks configs
   and changed the script to `"lint": "eslint ."`.
8. **Verification:** `npm run lint` exits 0 with zero warnings across the codebase, and it did catch
   real hook-dependency issues while the placement hook was being written (see Bug 5).

---

### Bug 11 — First Vercel deployment rejected: uppercase project name

1. **Title:** `vercel deploy` failed with "Project names … must be lowercase".
2. **Discovery:** First production deploy attempt from the CLI.
3. **Steps to reproduce (pre-fix):** Run `vercel --prod` in a directory named `DB-M1-Battle-Ship`
   with no linked project.
4. **Expected:** Vercel creates the project and deploys.
5. **Actual:**
   ```text
   Error: Project names can be up to 100 characters long and must be lowercase.
   ```
6. **Root cause:** Vercel infers the project name from the directory name; the repository name
   contains uppercase letters, which Vercel does not allow.
7. **Fix:** Link explicitly to a lowercase project name before deploying:
   ```bash
   vercel link --yes --project db-m1-battle-ship --token "$VERCEL_TOKEN"
   vercel deploy --prod --token "$VERCEL_TOKEN"
   ```
8. **Verification:** Deployment succeeded and the app is live at
   <https://db-m1-battle-ship.vercel.app> (HTTP 200, correct Vite asset references in the served
   HTML, playable in the browser).

---

### Bug 12 — Push to the repository rejected with HTTP 403

1. **Title:** `git push` returned 403 even though `git fetch` worked.
2. **Discovery:** Attempting to push the first feature branch.
3. **Steps to reproduce (pre-fix):** Clone `DB-M1-Battle-Ship`, commit, `git push` with read-only
   app permissions.
4. **Expected:** Branch pushes and a PR can be opened.
5. **Actual:** Read succeeded, write returned 403.
6. **Root cause:** The GitHub App integration had read-only permission on the repository.
7. **Fix:** Repository owner granted write access to the integration (no code change).
8. **Verification:** `git push` succeeded; branch `devin/1785520844-battleship-game` and PR #1 exist.

---

### Bug 13 — Deployment metadata / env files were not ignored

1. **Title:** `.vercel/` and `.env*` were untracked-but-committable after the CLI deploy.
2. **Discovery:** `git status` review before committing the placement/explosion work — the CLI had
   created a `.vercel` directory containing project/org identifiers.
3. **Steps to reproduce (pre-fix):** Run `vercel link` / `vercel deploy` in the repo and inspect
   `git status`.
4. **Expected:** Local deployment metadata and any env files stay out of version control.
5. **Actual:** They showed up as untracked files, one careless `git add .` away from being committed.
6. **Root cause:** `.gitignore` predated the deployment work.
7. **Fix:**
   ```gitignore
   .vercel
   .env*
   ```
8. **Verification:** `git status` is clean after a deploy, and the committed tree contains no
   `.vercel` directory and no env files.

---

## 3. Testing performed

- **Unit / component tests (Vitest 3 + Testing Library, jsdom):** 7 files, **54 tests, all passing**
  on Node 22.12.0.
  - `src/game/board.test.ts` — empty board, bounds, ship cell math, overlap/off-board rejection,
    immutability of `placeShip`/`applyShot`, random fleet always places 17 cells, sink detection,
    fleet-destroyed detection.
  - `src/game/ai.test.ts` — the AI only ever targets `empty`/`ship` cells (never re-fires), returns
    `null` when the board is exhausted, and is deterministic with an injected RNG.
  - `src/game/engine.test.ts` — 10 tests: initial phase is `placement`, `startBattle()` transitions
    to `human-turn` and is idempotent afterwards, phase guards on `humanFire`/`aiFire`, hit/miss/sunk
    logging, win/lose termination.
  - `src/game/placement.test.ts` — 10 tests: orientation detection, ship lookup by coord, cell index,
    ship removal, valid move, off-board rejection, overlap rejection, sliding over its own old cells,
    rotation, edge rotation with start-slide, rotation blocked by a neighbour.
  - `src/components/Board.test.tsx`, `src/components/Cell.test.tsx` — grid rendering/labels; blast on
    a fresh hit, no blast for a miss, no blast when mounted already hit.
  - `src/App.test.tsx` — enemy board inert before "Start battle", click-to-move keeps 17 ship cells,
    randomize keeps the full fleet, `R` rotation keeps the fleet, shots and AI reply after battle
    starts, "New game" returns to placement.
- **Static checks:** `npm run lint` (ESLint 9, flat config) clean; `npm run build`
  (`tsc -b && vite build`) clean.
- **End-to-end browser play-test (Chrome, real mouse clicks, screen-recorded):** three complete
  games in one page load — one human win, one AI win — covering initial render (two 10×10 boards,
  A–J/1–10 labels, 17 own ship cells, 0 enemy ships visible), hit/miss marking and logging,
  duplicate-shot prevention, input lock during the AI's 600 ms turn, per-ship hit counters and
  strike-through exactly on the sinking shot, victory/defeat states, post-game click blocking,
  enemy-fleet reveal on defeat, and "New game" reset with a freshly randomised layout.
  **Result: no functional defects; browser console clean (no React warnings, no exceptions).**
- **Placement/explosion verification (scripted Chrome via CDP against the deployed build):**
  click-to-move, drag-and-drop move, rotate (button and `R`), randomize, and battle start.
  Instrumented output: `rotate changed: true`, `drag changed: true`,
  `enemy marked before start: 0`, `own cells enabled after start: 0`, `page errors: 0`.

## 4. Final build and deployment verification

- Toolchain: Node **v22.12.0** (`.nvmrc` → `22`), Vite 7, TypeScript 5.9.
- `npm run lint` → pass. `npm test` → 7 files / 54 tests pass. `npm run build` → pass
  (`tsc -b` type check + production bundle in `dist/`).
- Deployed to Vercel using the repo's `vercel.json` (`framework: vite`, `buildCommand: npm run build`,
  `outputDirectory: dist`, `installCommand: npm ci`).
- Production URL: **<https://db-m1-battle-ship.vercel.app>** — returns HTTP 200, the served HTML
  references the expected hashed Vite assets, and the deployed app was played in a real browser
  (placement phase, ship move/rotate, start battle, a shot, an AI reply, hit explosion) with
  **0 page errors**.

## 5. Known limitations

- **Cosmetic layout shift:** the shot log is newest-first inside a fixed-height scroll box, so the
  boards drift down a few pixels per new entry until the log fills its box (first ~6 shots).
  Cosmetic only; not fixed.
- **No keyboard focus aid:** the app renders 200 cell `<button>`s, so tabbing works but there is no
  visible focus-order guidance or arrow-key grid navigation.
- **Automatic redeploys are not wired up:** production was deployed through the Vercel CLI, so the
  project is not yet connected to the GitHub repository. Until it is connected under
  *Project → Settings → Git*, pushes do not redeploy and PRs get no preview URLs.
- **AI has no targeting strategy:** by design it fires uniformly at random among un-shot cells — it
  does not follow up around a hit.
- **No persistence or multiplayer:** state lives in React memory only; reloading the page starts a
  new game. There is no backend, no saved games, and no human-vs-human mode.
- **Explosion effect is suppressed** for users with `prefers-reduced-motion: reduce` (intentional),
  so hits are conveyed by colour/log only in that mode.
