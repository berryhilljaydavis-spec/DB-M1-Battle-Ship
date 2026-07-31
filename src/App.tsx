import { useCallback, useEffect, useMemo } from 'react'
import { Board } from './components/Board'
import type { BoardPlacement } from './components/Board'
import { FleetStatus } from './components/FleetStatus'
import { OceanBackground } from './components/OceanBackground'
import { PlacementControls } from './components/PlacementControls'
import { VictorySalute } from './components/VictorySalute'
import { StatusPanel } from './components/StatusPanel'
import { useBattleship } from './hooks/useBattleship'
import { findShipAt } from './game/placement'
import './App.css'

export function App() {
  const {
    state,
    selection,
    fireAt,
    placeAt,
    grabAt,
    rotateSelection,
    randomizeFleet,
    startBattle,
    restart,
  } = useBattleship()

  const isPlacing = state.phase === 'placement'

  const handleFire = useCallback(
    (row: number, col: number) => fireAt({ row, col }),
    [fireAt],
  )

  const handlePlace = useCallback(
    (row: number, col: number) => placeAt({ row, col }),
    [placeAt],
  )

  const handleGrab = useCallback(
    (row: number, col: number) => grabAt({ row, col }),
    [grabAt],
  )

  const placement = useMemo<BoardPlacement | undefined>(() => {
    if (!isPlacing) return undefined
    const selectedShip = selection
      ? state.humanBoard.ships.find((ship) => ship.name === selection.name)
      : null
    return {
      isSelected: (coord) =>
        !!selectedShip &&
        selectedShip.cells.some(
          (cell) => cell.row === coord.row && cell.col === coord.col,
        ),
      isShip: (coord) => !!findShipAt(state.humanBoard, coord),
      onGrab: handleGrab,
      onDrop: handlePlace,
    }
  }, [isPlacing, selection, state.humanBoard, handleGrab, handlePlace])

  useEffect(() => {
    if (!isPlacing) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'r' || event.key === 'R') rotateSelection()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPlacing, rotateSelection])

  const humanWon = state.phase === 'game-over' && state.winner === 'human'

  return (
    <main className="app">
      <OceanBackground />
      {humanWon && <VictorySalute />}

      <header className="app__header">
        <h1>Battleship</h1>
        <p>Sink the enemy fleet before it sinks yours.</p>
      </header>

      <StatusPanel state={state} onRestart={restart} />

      {isPlacing && (
        <PlacementControls
          selectedShip={selection?.name ?? null}
          onRotate={rotateSelection}
          onRandomize={randomizeFleet}
          onStart={startBattle}
        />
      )}

      <div className="app__boards">
        <section className="side side--enemy">
          <Board
            title="Enemy waters"
            side="enemy"
            subtitle="Attack — click a square to fire"
            board={state.aiBoard}
            revealShips={state.phase === 'game-over'}
            interactive={state.phase === 'human-turn'}
            onFire={handleFire}
          />
          <FleetStatus title="Enemy fleet" side="enemy" board={state.aiBoard} />
        </section>

        <section className="side side--friendly">
          <Board
            title="Your fleet"
            side="friendly"
            subtitle={
              isPlacing
                ? 'Defend — drag your ships, then start the battle'
                : 'Defend — the AI fires here'
            }
            board={state.humanBoard}
            revealShips
            interactive={isPlacing}
            onFire={isPlacing ? handlePlace : undefined}
            placement={placement}
          />
          <FleetStatus
            title="Your fleet"
            side="friendly"
            board={state.humanBoard}
          />
        </section>
      </div>
    </main>
  )
}

export default App
