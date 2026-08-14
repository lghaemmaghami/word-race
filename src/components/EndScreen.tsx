import { formatDifficulty, loadLeaderboard } from '../game/leaderboard'
import type { Difficulty } from '../game/types'

interface EndScreenProps {
  won: boolean
  playerScore: number
  aiScore: number
  difficulty: Difficulty
  onPlayAgain: () => void
  onHome: () => void
}

export function EndScreen({
  won,
  playerScore,
  aiScore,
  difficulty,
  onPlayAgain,
  onHome,
}: EndScreenProps) {
  const diff = playerScore - aiScore
  const leaders = loadLeaderboard()

  return (
    <div className="screen end-screen">
      <header className="brand-block compact">
        <h1 className="brand">Word Race</h1>
        <p className={`result ${won ? 'win' : 'loss'}`}>{won ? 'You win!' : 'AI wins'}</p>
      </header>

      <div className="final-scores">
        <div>
          <span>You</span>
          <strong>{playerScore}</strong>
        </div>
        <div>
          <span>AI</span>
          <strong>{aiScore}</strong>
        </div>
        <div>
          <span>Difference</span>
          <strong>
            {diff > 0 ? '+' : ''}
            {diff}
          </strong>
        </div>
        <div>
          <span>Difficulty</span>
          <strong>{formatDifficulty(difficulty)}</strong>
        </div>
      </div>

      <div className="difficulty-actions">
        <button type="button" className="btn btn-primary" onClick={onPlayAgain}>
          Play again
        </button>
        <button type="button" className="btn btn-secondary" onClick={onHome}>
          Home
        </button>
      </div>

      <section className="leaderboard">
        <h2>Leaderboard</h2>
        <p className="leaderboard-note">Ranked by highest player score</p>
        {leaders.length === 0 ? (
          <p className="status-line">No games yet.</p>
        ) : (
          <ol>
            {leaders.map((e, i) => (
              <li key={e.id} className={i === 0 ? 'is-top' : ''}>
                <span className="rank">{i + 1}</span>
                <span className="pts">{e.playerScore}</span>
                <span className="detail">
                  vs {e.aiScore} · {formatDifficulty(e.difficulty)} · {e.won ? 'Win' : 'Loss'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
