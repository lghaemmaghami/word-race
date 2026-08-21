interface InstructionsScreenProps {
  onBack: () => void
}

export function InstructionsScreen({ onBack }: InstructionsScreenProps) {
  return (
    <div className="screen instructions-screen">
      <header className="brand-block compact instructions-header">
        <p className="eyebrow">How to play</p>
        <h1 className="brand instructions-title">Word Race</h1>
        <p className="tagline">Beat the AI on one shared board — with or without a clock.</p>
      </header>

      <section className="instructions-panel" aria-label="Game instructions">
        <ol className="instructions-list">
          <li>
            <strong>Your clock</strong>
            <span>
              Choose 90s, 180s, or No timer on the home screen. Timed games count only your active turns — the clock
              pauses while the AI thinks. Untimed games end when the tiles run out.
            </span>
          </li>
          <li>
            <strong>Place tiles</strong>
            <span>Tap a rack tile, then a board square. Cover the centre star on your first submit.</span>
          </li>
          <li>
            <strong>Submit a turn</strong>
            <span>
              Build valid crossword words, then hit Submit. Recall or Shuffle to adjust tiles. Swap exchanges your
              whole rack (needs 7+ in the bag). Pass skips your turn if you have no play.
            </span>
          </li>
          <li>
            <strong>Scoring</strong>
            <span>
              Each turn scores every word you form or extend. Double/Triple Letter and Word bonuses apply only to
              tiles you play this turn on unused premium squares. Cross words each score separately. Play all 7 rack
              tiles in one turn for a 50-point bingo. At game end, unplayed rack tiles are subtracted; if you go out
              first, you also add the AI&apos;s leftover tiles to your score.
            </span>
          </li>
          <li>
            <strong>AI turn</strong>
            <span>The AI must move within 5 seconds or it swaps/passes. Hard mode plays stronger.</span>
          </li>
          <li>
            <strong>Win</strong>
            <span>
              Timed games end when your clock hits zero or the tiles run out. If time expires with a valid play on the
              board, that play is submitted automatically before the game ends. Untimed games end only when the bag and
              a player&apos;s rack are both empty. Highest score wins.
            </span>
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
