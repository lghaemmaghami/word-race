import { MULTIPLIERS, CENTER } from '../game/constants'
import { boardTileIds } from '../game/board'
import type { Board, Tile } from '../game/types'

interface BoardViewProps {
  board: Board
  committedBoard: Board
  selectedTileId: string | null
  onCellClick: (row: number, col: number) => void
  letterValue: (letter: string) => number
  disabled?: boolean
}

export function BoardView({
  board,
  committedBoard,
  selectedTileId,
  onCellClick,
  letterValue,
  disabled,
}: BoardViewProps) {
  const committedIds = boardTileIds(committedBoard)

  return (
    <div className={`board ${disabled ? 'is-disabled' : ''}`} role="grid" aria-label="Word Race board">
      {board.map((row, r) =>
        row.map((cell, c) => {
          const mult = MULTIPLIERS[r][c]
          const isCenter = r === CENTER && c === CENTER
          const isNew = cell && !committedIds.has(cell.id)
          const isSelected = cell && cell.id === selectedTileId
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              className={[
                'cell',
                mult !== 'none' ? `mult-${mult.toLowerCase()}` : '',
                isCenter ? 'is-center' : '',
                cell ? 'has-tile' : '',
                isNew ? 'is-new' : '',
                isSelected ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onCellClick(r, c)}
              disabled={disabled}
              aria-label={
                cell
                  ? `Tile ${cell.letter} at row ${r + 1} column ${c + 1}`
                  : `Empty ${mult !== 'none' ? mult : 'square'} at row ${r + 1} column ${c + 1}`
              }
            >
              {cell ? (
                <span className="tile">
                  <span className="tile-letter">{cell.letter}</span>
                  <span className="tile-value">{letterValue(cell.letter)}</span>
                </span>
              ) : (
                <span className="mult-label">
                  {isCenter && mult === 'DW' ? '★' : mult === 'none' ? '' : mult}
                </span>
              )}
            </button>
          )
        }),
      )}
    </div>
  )
}

interface RackViewProps {
  rack: Tile[]
  selectedTileId: string | null
  onSelect: (id: string) => void
  onEmptySlotClick?: () => void
  letterValue: (letter: string) => number
  disabled?: boolean
}

export function RackView({
  rack,
  selectedTileId,
  onSelect,
  onEmptySlotClick,
  letterValue,
  disabled,
}: RackViewProps) {
  return (
    <div className="rack" aria-label="Your rack">
      {rack.map((tile) => (
        <button
          key={tile.id}
          type="button"
          className={`rack-tile ${selectedTileId === tile.id ? 'is-selected' : ''}`}
          onClick={() => onSelect(tile.id)}
          disabled={disabled}
        >
          <span className="tile-letter">{tile.letter}</span>
          <span className="tile-value">{letterValue(tile.letter)}</span>
        </button>
      ))}
      {Array.from({ length: Math.max(0, 7 - rack.length) }).map((_, i) => (
        <button
          key={`empty-${i}`}
          type="button"
          className="rack-slot"
          aria-label="Return tile to rack"
          onClick={onEmptySlotClick}
          disabled={disabled || !onEmptySlotClick}
        />
      ))}
    </div>
  )
}
