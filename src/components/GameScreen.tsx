import { BoardView, RackView } from './BoardView'
import type { useGame } from '../game/useGame'

type Game = ReturnType<typeof useGame>

export function GameScreen({ game }: { game: Game }) {
  const seconds = Math.ceil(game.timeLeftMs / 1000)
  const playerTurn = game.turn === 'player'
  const status = game.message ?? (game.aiSummary ? game.aiSummary.detail : null)

  return (
    <div className="screen game-screen">
      <header className="game-hud">
        <div className="hud-brand">Word Race</div>
        <div className={`timer ${seconds <= 15 ? 'is-low' : ''}`} aria-live="polite">
          <span className="timer-label">Time</span>
          <span className="timer-value">{seconds}s</span>
        </div>
        <div className="scores">
          <div className="score player">
            <span>You</span>
            <strong>{game.playerScore}</strong>
          </div>
          <div className="score ai">
            <span>AI</span>
            <strong>{game.aiScore}</strong>
          </div>
        </div>
      </header>

      <div className="turn-row">
        <div className="turn-banner" data-turn={game.turn}>
          {playerTurn ? 'Your turn' : 'AI thinking'}
        </div>
        {playerTurn && game.playPreview ? (
          <div className="play-preview" aria-live="polite" aria-label={`This play scores ${game.playPreview.moveScore} points`}>
            <span className="play-preview-label">This play</span>
            <strong className="play-preview-value">+{game.playPreview.moveScore}</strong>
            {game.playPreview.bingo ? <span className="play-preview-bingo">bingo</span> : null}
          </div>
        ) : (
          <p className="meta-line">
            Bag {game.bagCount} · {game.difficulty}
          </p>
        )}
      </div>

      {playerTurn && game.playPreview && game.playPreview.words.length > 0 ? (
        <p className="play-preview-words" aria-hidden="true">
          {game.playPreview.words.map((w) => `${w.word} ${w.score}`).join(' · ')}
        </p>
      ) : null}

      {playerTurn && game.playPreview ? (
        <p className="meta-line meta-line-below">
          Bag {game.bagCount} · {game.difficulty}
        </p>
      ) : null}

      <p className={`status-line ${status ? 'has-status' : ''}`} aria-live="polite">
        {status ?? '\u00a0'}
      </p>

      <div className="board-wrap">
        <BoardView
          board={game.board}
          committedBoard={game.committedBoard}
          selectedTileId={game.selectedTileId}
          onCellClick={game.selectCell}
          letterValue={game.letterValue}
          disabled={!playerTurn}
        />
      </div>

      <div className="game-footer">
        <RackView
          rack={game.playerRack}
          selectedTileId={game.selectedTileId}
          onSelect={game.selectRackTile}
          onEmptySlotClick={game.returnSelectedToRack}
          letterValue={game.letterValue}
          disabled={!playerTurn}
        />

        <div className="action-bar">
          <button type="button" className="btn btn-primary" onClick={game.submit} disabled={!playerTurn}>
            Submit
          </button>
          <button type="button" className="btn btn-ghost" onClick={game.recall} disabled={!playerTurn}>
            Recall
          </button>
          <button type="button" className="btn btn-ghost" onClick={game.shuffleRack} disabled={!playerTurn}>
            Shuffle
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={game.swapRack}
            disabled={!playerTurn || game.bagCount < 7}
            title={game.bagCount < 7 ? 'Need 7+ tiles in bag' : 'Swap full rack (forfeits turn)'}
          >
            Swap
          </button>
        </div>
      </div>
    </div>
  )
}
