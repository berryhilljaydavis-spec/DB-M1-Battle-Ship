export interface StartMenuProps {
  onStart: () => void
}

/** Title screen shown before the first game. */
export function StartMenu({ onStart }: StartMenuProps) {
  return (
    <section className="menu" aria-label="Main menu">
      <h1 className="menu__title">Battleship</h1>
      <p className="menu__tagline">Command your fleet. Sink theirs first.</p>

      <button type="button" className="menu__play" onClick={onStart}>
        Deploy fleet
      </button>

      <ol className="menu__rules">
        <li>Position your five ships — drag them, or click and press R to rotate.</li>
        <li>Start the battle and fire at a square in enemy waters.</li>
        <li>Trade shots with the AI until one fleet is destroyed.</li>
      </ol>
    </section>
  )
}
