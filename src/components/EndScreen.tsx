import { useMemo } from 'react'
import { formatDifficulty, loadLeaderboard } from '../game/leaderboard'
import { letterValue } from '../game/constants'
import { listAttributedWords, type AttributedWord } from '../game/scoring'
import type { Board, Difficulty, TileOwner } from '../game/types'
import { BoardView } from './BoardView'

interface EndScreenProps {
  won: boolean
  playerScore: number
  aiScore: number
  difficulty: Difficulty
  board: Board
  tileOwners: Record<string, TileOwner>
  onPlayAgain: () => void
  onHome: () => void
}

function WordColumn({ title, words, tone }: { title: string; words: AttributedWord[]; tone: 'player' | 'ai' }) {
  const total = words.reduce((sum, w) => sum + w.score, 0)
  return (
    <div className={`word-column ${tone}`}>
      <h3>{title}</h3>
      {words.length === 0 ? (
        <p className="status-line">None</p>
      ) : (
        <ol>
          {words.map((w, i) => (
            <li key={`${w.word}-${i}`}>
              <span className="word">{w.word}</span>
              <span className="pts">{w.score}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="word-column-total">
        <span>Total</span>
        <strong>{total}</strong>
      </p>
    </div>
  )
}

export function EndScreen({
  won,
  playerScore,
  aiScore,
  difficulty,
  board,
  tileOwners,
  onPlayAgain,
  onHome,
}: EndScreenProps) {
  const diff = playerScore - aiScore
  const leaders = loadLeaderboard()
  const words = useMemo(() => listAttributedWords(board, tileOwners), [board, tileOwners])
  const yours = words.filter((w) => w.by === 'player')
  const theirs = words.filter((w) => w.by === 'ai')
  const boardTotal = words.reduce((sum, w) => sum + w.score, 0)

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

      <section className="end-recap" aria-label="Final board and words">
        <div className="board-wrap recap-board">
          <BoardView board={board} letterValue={letterValue} readOnly />
        </div>

        <div className="word-list">
          <h2>Words played</h2>
          <p className="leaderboard-note">Credited to whoever placed more tiles in the word</p>
          {words.length === 0 ? (
            <p className="status-line">No words were played.</p>
          ) : (
            <div className="word-columns">
              <WordColumn title="You" words={yours} tone="player" />
              <WordColumn title="AI" words={theirs} tone="ai" />
            </div>
          )}
          {words.length > 0 ? (
            <p className="word-list-total">
              <span>Board total</span>
              <strong>{boardTotal}</strong>
            </p>
          ) : null}
        </div>
      </section>

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
