import { useEffect, useState } from 'react'
import type { Difficulty, LeaderboardEntry, TimeLimitSeconds } from '../game/types'
import { formatDifficulty, fetchLeaderboard } from '../game/leaderboard'
import { InstructionsScreen } from './InstructionsScreen'

interface StartScreenProps {
  dictReady: boolean
  dictError: string | null
  onStart: (d: Difficulty, timeLimitSeconds: TimeLimitSeconds) => void
  playerName: string
}

export function StartScreen({ dictReady, dictError, onStart, playerName }: StartScreenProps) {
  const [showInstructions, setShowInstructions] = useState(false)
  const [timeLimit, setTimeLimit] = useState<TimeLimitSeconds>(90)
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    void fetchLeaderboard().then((entries) => setLeaders(entries.slice(0, 5)))
  }, [])

  useEffect(() => {
    if (!showInstructions) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowInstructions(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showInstructions])

  if (showInstructions) {
    return <InstructionsScreen onBack={() => setShowInstructions(false)} />
  }

  return (
    <div className="screen start-screen">
      <button
        type="button"
        className="help-btn"
        aria-label="How to play"
        title="How to play"
        onClick={() => setShowInstructions(true)}
      >
        ?
      </button>
      <div className="hero-glow" aria-hidden />
      <header className="brand-block">
        <p className="eyebrow">Single-player crossword duel</p>
        <h1 className="brand">Word Race</h1>
        <p className="tagline">
          Welcome, <strong>{playerName}</strong>! Outscore the AI before your clock runs out.
        </p>
      </header>

      <div className="time-limit-picker" role="group" aria-label="Game length">
        <button
          type="button"
          className={`time-limit-option ${timeLimit === 90 ? 'is-selected' : ''}`}
          aria-pressed={timeLimit === 90}
          onClick={() => setTimeLimit(90)}
        >
          90s
        </button>
        <button
          type="button"
          className={`time-limit-option ${timeLimit === 180 ? 'is-selected' : ''}`}
          aria-pressed={timeLimit === 180}
          onClick={() => setTimeLimit(180)}
        >
          180s
        </button>
      </div>

      <div className="difficulty-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!dictReady}
          onClick={() => onStart('easy', timeLimit)}
        >
          Play Easy
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!dictReady}
          onClick={() => onStart('hard', timeLimit)}
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
            {leaders.map((e, i) => (
              <li key={e.id} className={e.difficulty === 'hard' ? 'lb-hard' : ''}>
                <div className="lb-row">
                  <span className="rank">{i + 1}</span>
                  <span className="leader-name">{e.playerName}</span>
                  <span className="pts">{e.playerScore}</span>
                </div>
                <div className="lb-sub">{formatDifficulty(e.difficulty)} · {e.timeLimitSeconds}s</div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
