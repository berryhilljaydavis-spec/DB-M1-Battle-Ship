import { useEffect } from 'react'
import { soundPlayer } from '../sound/player'
import { Cutscene } from './Cutscene'
import { VictoryCannons } from './VictoryCannons'

export interface VictorySceneProps {
  onPlayAgain: () => void
  onMenu: () => void
  onShowBoards: () => void
}

/** Full-screen cutscene: the enemy flagship burning and going under. */
export function VictoryScene(props: VictorySceneProps) {
  useEffect(() => {
    soundPlayer.resumeVictory()
    return () => soundPlayer.stopVictory()
  }, [])

  return (
    <Cutscene
      tone="victory"
      label="Victory"
      kicker="Your fleet wins"
      title="Victory"
      text="The enemy fleet is destroyed."
      effects={(onShot) => <VictoryCannons onShot={onShot} />}
      {...props}
    />
  )
}
