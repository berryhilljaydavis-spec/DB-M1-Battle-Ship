import { useCallback } from 'react'
import { Board } from './components/Board'
import { FleetStatus } from './components/FleetStatus'
import { StatusPanel } from './components/StatusPanel'
import { useBattleship } from './hooks/useBattleship'
import './App.css'

export function App() {
  const { state, fireAt, restart } = useBattleship()

  const handleFire = useCallback(
    (row: number, col: number) => fireAt({ row, col }),
    [fireAt],
  )

  return (
    <main className="app">
      <header className="app__header">
        <h1>Battleship</h1>
        <p>Sink the enemy fleet before it sinks yours.</p>
      </header>

      <StatusPanel state={state} onRestart={restart} />

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
          interactive={false}
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
