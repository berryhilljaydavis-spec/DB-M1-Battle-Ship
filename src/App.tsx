import { useCallback, useEffect, useMemo } from 'react'
import { Board } from './components/Board'
import type { BoardPlacement } from './components/Board'
import { FleetStatus } from './components/FleetStatus'
import { PlacementControls } from './components/PlacementControls'
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

  return (
    <main className="app">
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
        <Board
          title="Enemy waters"
          board={state.aiBoard}
          revealShips={state.phase === 'game-over'}
          interactive={state.phase === 'human-turn'}
          onFire={handleFire}
        />
        <Board
          title="Your fleet"
          board={state.humanBoard}
          revealShips
          interactive={isPlacing}
          onFire={isPlacing ? handlePlace : undefined}
          placement={placement}
        />
      </div>

      <div className="app__fleets">
        <FleetStatus title="Enemy fleet" board={state.aiBoard} />
        <FleetStatus title="Your fleet" board={state.humanBoard} />
      </div>
    </main>
  )
}

export default App
