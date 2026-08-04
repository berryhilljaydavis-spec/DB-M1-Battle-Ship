import { Cutscene } from './Cutscene'

export interface DefeatSceneProps {
  onPlayAgain: () => void
  onMenu: () => void
  onShowBoards: () => void
}

/** Full-screen cutscene for a loss: your own flagship going down. */
export function DefeatScene(props: DefeatSceneProps) {
  return (
    <Cutscene
      tone="defeat"
      label="Defeat"
      kicker="You lose"
      title="Defeat"
      text="Your fleet is lost. The enemy holds these waters."
      {...props}
    />
  )
}
