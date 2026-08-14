import { BoardView, RackView } from './BoardView'
import type { useGame } from '../game/useGame'

type Game = ReturnType<typeof useGame>

export function GameScreen({ game }: { game: Game }) {
  const seconds = Math.ceil(game.timeLeftMs / 1000)
  const playerTurn = game.turn === 'player'

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

      <div className="turn-banner" data-turn={game.turn}>
        {playerTurn ? 'Your turn — rearrange freely, then submit' : 'AI turn (timer paused)'}
      </div>

      {game.message && <p className="status-line">{game.message}</p>}
      {game.aiSummary && (
        <p className="ai-summary" aria-live="polite">
          Last AI move: {game.aiSummary.detail}
        </p>
      )}

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

      <RackView
        rack={game.playerRack}
        selectedTileId={game.selectedTileId}
        onSelect={game.selectRackTile}
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
          Swap rack
        </button>
      </div>

      <p className="meta-line">Bag: {game.bagCount} · Mode: {game.difficulty}</p>
    </div>
  )
}
