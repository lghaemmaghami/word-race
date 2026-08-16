interface InstructionsScreenProps {
  onBack: () => void
}

export function InstructionsScreen({ onBack }: InstructionsScreenProps) {
  return (
    <div className="screen instructions-screen">
      <header className="brand-block compact instructions-header">
        <p className="eyebrow">How to play</p>
        <h1 className="brand instructions-title">Word Race</h1>
        <p className="tagline">Beat the AI on one shared board before your clock hits zero.</p>
      </header>

      <section className="instructions-panel" aria-label="Game instructions">
        <ol className="instructions-list">
          <li>
            <strong>Your clock</strong>
            <span>Choose 90 or 180 seconds of active time on the home screen. The clock pauses while the AI thinks.</span>
          </li>
          <li>
            <strong>Place tiles</strong>
            <span>Tap a rack tile, then a board square. Cover the centre star on your first submit.</span>
          </li>
          <li>
            <strong>Submit a turn</strong>
            <span>Build valid crossword words, then hit Submit. Recall, Shuffle, or Swap if you need a reset.</span>
          </li>
          <li>
            <strong>Scoring</strong>
            <span>You score only the points your play adds to the board total: max(0, new − previous).</span>
          </li>
          <li>
            <strong>AI turn</strong>
            <span>The AI must move within 5 seconds or it swaps/passes. Hard mode plays stronger.</span>
          </li>
          <li>
            <strong>Win</strong>
            <span>When time runs out, the higher score wins. Tap a word later to see its definition.</span>
          </li>
        </ol>
      </section>

      <div className="difficulty-actions">
        <button type="button" className="btn btn-primary" onClick={onBack}>
          Got it
        </button>
      </div>
    </div>
  )
}
