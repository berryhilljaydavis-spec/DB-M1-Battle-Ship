import { useCallback, useEffect, useMemo, useState } from 'react'
import { Board } from './components/Board'
import type { BoardPlacement } from './components/Board'
import { FleetDestruction } from './components/FleetDestruction'
import { FleetStatus } from './components/FleetStatus'
import { OceanCanvas } from './components/OceanCanvas'
import { PlacementControls } from './components/PlacementControls'
import { GameEmblem } from './components/Insignia'
import { AudioControls } from './components/AudioControls'
import { StartMenu } from './components/StartMenu'
import { TeamSelect } from './components/TeamSelect'
import { VictoryScene } from './components/VictoryScene'
import { StatusPanel } from './components/StatusPanel'
import { useBattleship } from './hooks/useBattleship'
import { findShipAt } from './game/placement'
import { opposingTeam } from './game/teams'
import type { Team } from './game/teams'
import { useAudioSettings } from './sound/useAudioSettings'
import { useGameSounds } from './sound/useGameSounds'
import { useMenuMusic } from './sound/useMenuMusic'
import { useSoundPreference } from './sound/useSoundPreference'
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

  const [inMenu, setInMenu] = useState(true)
  const [matchup, setMatchup] = useState<{ player: Team; enemy: Team } | null>(
    null,
  )
  const [showBoards, setShowBoards] = useState(false)
  const [soundEnabled, toggleSound] = useSoundPreference()
  const { settings: audio, update: updateAudio } = useAudioSettings()
  const isPlacing = state.phase === 'placement'

  const audioControls = (
    <AudioControls
      enabled={soundEnabled}
      onToggle={toggleSound}
      settings={audio}
      onChange={updateAudio}
    />
  )

  useGameSounds(state)
  useMenuMusic(
    (inMenu || !matchup) && soundEnabled && audio.musicTrack !== 'off',
  )

  const openMenu = useCallback(() => {
    restart()
    setShowBoards(false)
    setMatchup(null)
    setInMenu(true)
  }, [restart])

  const leaveMenu = useCallback(() => {
    restart()
    setShowBoards(false)
    setMatchup(null)
    setInMenu(false)
  }, [restart])

  const chooseTeam = useCallback((player: Team) => {
    setMatchup({ player, enemy: opposingTeam(player) })
  }, [])

  const playAgain = useCallback(() => {
    restart()
    setShowBoards(false)
  }, [restart])

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

  const isOver = state.phase === 'game-over'
  const humanWon = isOver && state.winner === 'human'
  const loser = isOver ? (humanWon ? 'enemy' : 'friendly') : null

  if (inMenu) {
    return (
      <main className="app app--menu">
        <OceanCanvas />
        {audioControls}
        <StartMenu onStart={leaveMenu} />
      </main>
    )
  }

  if (!matchup) {
    return (
      <main className="app app--menu">
        <OceanCanvas />
        {audioControls}
        <TeamSelect onConfirm={chooseTeam} onBack={openMenu} />
      </main>
    )
  }

  if (humanWon && !showBoards) {
    return (
      <main className="app app--cutscene">
        {audioControls}
        <VictoryScene
          onPlayAgain={playAgain}
          onMenu={openMenu}
          onShowBoards={() => setShowBoards(true)}
        />
      </main>
    )
  }

  return (
    <main className="app">
      <OceanCanvas />

      <header className="app__header">
        <GameEmblem />
        <div>
          <h1>Battleship</h1>
          <p>Sink the enemy fleet before it sinks yours.</p>
        </div>
        {audioControls}
      </header>

      <StatusPanel state={state} onRestart={playAgain} onMenu={openMenu} />

      {isPlacing && (
        <PlacementControls
          selectedShip={selection?.name ?? null}
          onRotate={rotateSelection}
          onRandomize={randomizeFleet}
          onStart={startBattle}
        />
      )}

      <div className="app__boards">
        <section
          className={`side side--friendly${
            loser === 'friendly' ? ' side--destroyed' : ''
          }`}
          style={teamStyle(matchup.player)}
        >
          {loser === 'friendly' && <FleetDestruction />}
          <Board
            title="Your fleet"
            side="friendly"
            subtitle={
              isPlacing
                ? 'Defend — drag your ships, then start the battle'
                : 'Defend — the AI fires here'
            }
            board={state.humanBoard}
            team={matchup.player}
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

        <section
          className={`side side--enemy${
            loser === 'enemy' ? ' side--destroyed' : ''
          }`}
          style={teamStyle(matchup.enemy)}
        >
          {loser === 'enemy' && <FleetDestruction />}
          <Board
            title="Enemy waters"
            side="enemy"
            subtitle="Attack — click a square to fire"
            board={state.aiBoard}
            team={matchup.enemy}
            revealShips={state.phase === 'game-over'}
            interactive={state.phase === 'human-turn'}
            onFire={handleFire}
          />
          <FleetStatus title="Enemy fleet" side="enemy" board={state.aiBoard} />
        </section>
      </div>
    </main>
  )
}

function teamStyle(team: Team): React.CSSProperties {
  return {
    '--side-accent': team.accent,
    '--side-line': team.line,
    '--side-tint': team.tint,
  } as React.CSSProperties
}

export default App
