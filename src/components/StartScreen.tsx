import type { Difficulty } from '../game/types'
import { formatDifficulty, loadLeaderboard } from '../game/leaderboard'

interface StartScreenProps {
  dictReady: boolean
  dictError: string | null
  onStart: (d: Difficulty) => void
}

export function StartScreen({ dictReady, dictError, onStart }: StartScreenProps) {
  const leaders = loadLeaderboard().slice(0, 5)

  return (
    <div className="screen start-screen">
      <div className="hero-glow" aria-hidden />
      <header className="brand-block">
        <p className="eyebrow">Single-player crossword duel</p>
        <h1 className="brand">Word Race</h1>
        <p className="tagline">
          Outscore the AI on a shared Scrabble-style board before your 90 seconds run out.
        </p>
      </header>

      <div className="difficulty-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!dictReady}
          onClick={() => onStart('easy')}
        >
          Play Easy
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!dictReady}
          onClick={() => onStart('hard')}
        >
          Play Hard
        </button>
      </div>

      {!dictReady && !dictError && <p className="status-line">Loading dictionary…</p>}
      {dictError && <p className="status-line error">{dictError}</p>}

      {leaders.length > 0 && (
        <section className="leaderboard preview">
          <h2>Top scores</h2>
          <ol>
            {leaders.map((e) => (
              <li key={e.id}>
                <span>{e.playerScore} pts</span>
                <span>
                  {formatDifficulty(e.difficulty)} · {e.won ? 'Win' : 'Loss'}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
