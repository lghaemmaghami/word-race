import { useEffect, useState } from 'react'
import { formatDifficulty, fetchLeaderboard } from '../game/leaderboard'
import { letterValue } from '../game/constants'
import type { Board, Difficulty, LeaderboardEntry, PlayedWord } from '../game/types'
import { BoardView } from './BoardView'
import { DefinitionSheet } from './DefinitionSheet'

interface EndScreenProps {
  won: boolean
  playerScore: number
  aiScore: number
  difficulty: Difficulty
  board: Board
  playedWords: PlayedWord[]
  currentEntryId: string | null
  onPlayAgain: () => void
  onHome: () => void
}

function WordColumn({
  title,
  words,
  tone,
  onSelectWord,
}: {
  title: string
  words: PlayedWord[]
  tone: 'player' | 'ai'
  onSelectWord: (word: string) => void
}) {
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
              <button
                type="button"
                className="word-row"
                onClick={() => onSelectWord(w.word)}
                aria-label={`Define ${w.word}${w.bonuses.length ? `, bonuses ${w.bonuses.join(' ')}` : ''}`}
              >
                <span className="word-main">
                  <span className="word">{w.word}</span>
                  {w.bonuses.length > 0 ? (
                    <span className="bonus-row" aria-hidden="true">
                      {w.bonuses.map((bonus, bi) => (
                        <span key={`${bonus}-${bi}`} className={`bonus bonus-${bonus.toLowerCase()}`}>
                          {bonus}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                <span className="pts">{w.score}</span>
              </button>
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
  playedWords,
  currentEntryId,
  onPlayAgain,
  onHome,
}: EndScreenProps) {
  const diff = playerScore - aiScore
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    void fetchLeaderboard().then(setLeaders)
  }, [])
  const yours = playedWords
    .filter((w) => w.by === 'player')
    .slice()
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))
  const theirs = playedWords
    .filter((w) => w.by === 'ai')
    .slice()
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))
  const [selectedWord, setSelectedWord] = useState<string | null>(null)

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
          <p className="leaderboard-note">Tap a word for its definition</p>
          {playedWords.length === 0 ? (
            <p className="status-line">No words were played.</p>
          ) : (
            <div className="word-columns">
              <WordColumn title="You" words={yours} tone="player" onSelectWord={setSelectedWord} />
              <WordColumn title="AI" words={theirs} tone="ai" onSelectWord={setSelectedWord} />
            </div>
          )}
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
        <p className="leaderboard-note">Top 10 scores</p>
        {leaders.length === 0 ? (
          <p className="status-line">No scores yet.</p>
        ) : (
          <ol>
            {leaders.map((e, i) => (
              <li key={e.id} className={e.id === currentEntryId ? 'is-current' : ''}>
                <div className="lb-row">
                  <span className="rank">{i + 1}</span>
                  <span className="leader-name">{e.playerName}</span>
                  <span className="pts">{e.playerScore}</span>
                </div>
                <div className="lb-sub">
                  vs {e.aiScore} · {formatDifficulty(e.difficulty)}{e.won ? ' · Win' : ''}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {selectedWord ? <DefinitionSheet word={selectedWord} onClose={() => setSelectedWord(null)} /> : null}
    </div>
  )
}
