import { boardTileIds, cloneBoard, occupiedCount } from './board'
import { newTileIdsBetweenBoards, scorePlay, validateBoard } from './scoring'
import type { Dictionary } from './dictionary'
import type { Board, Tile, ValidationResult } from './types'

/**
 * Validate a player submission.
 * - Must add ≥1 tile whose id was not on the last committed board
 * - Those new tiles must come from the pre-turn rack (tracked by caller via newTileIds)
 * - Full board must be valid
 */
export function validateSubmission(params: {
  workingBoard: Board
  committedBoard: Board
  usedPremiumSquares: Set<string>
  dict: Dictionary
  /** Tile ids that started this turn on the player rack (or were placed from rack this turn) */
  rackTileIdsThisTurn: Set<string>
}): ValidationResult {
  const { workingBoard, committedBoard, usedPremiumSquares, dict, rackTileIdsThisTurn } = params

  const committedIds = boardTileIds(committedBoard)
  const workingIds = boardTileIds(workingBoard)

  for (const id of committedIds) {
    if (!workingIds.has(id)) {
      return {
        ok: false,
        reason: 'All previously played tiles must remain on the board (use Recall to reset).',
      }
    }
  }

  const newlyAdded: string[] = []
  for (const id of workingIds) {
    if (!committedIds.has(id)) newlyAdded.push(id)
  }

  if (newlyAdded.length === 0) {
    return {
      ok: false,
      reason: 'Add at least one tile from your rack before submitting.',
    }
  }

  for (const id of newlyAdded) {
    if (!rackTileIdsThisTurn.has(id)) {
      return { ok: false, reason: 'Only tiles from your rack can be newly added.' }
    }
  }

  if (occupiedCount(committedBoard) === 0 && !workingBoard[7][7]) {
    return { ok: false, reason: 'The first play must cover the centre square.' }
  }

  const boardCheck = validateBoard(workingBoard, dict)
  if (!boardCheck.ok) {
    return { ok: false, reason: boardCheck.reason, words: boardCheck.words }
  }

  const newTileIds = newTileIdsBetweenBoards(committedBoard, workingBoard)
  const playScore = scorePlay(workingBoard, newTileIds, usedPremiumSquares)

  return {
    ok: true,
    words: boardCheck.words,
    moveScore: playScore.moveScore,
    usedPremiumSquares: playScore.usedPremiumSquares,
    scoredWords: playScore.words,
    bingo: playScore.bingo,
  }
}

export function placeWordOnBoard(
  base: Board,
  row: number,
  col: number,
  direction: 'across' | 'down',
  tiles: Tile[],
): Board | null {
  const board = cloneBoard(base)
  let r = row
  let c = col
  for (const tile of tiles) {
    if (r < 0 || r >= 15 || c < 0 || c >= 15) return null
    const existing = board[r][c]
    if (existing) {
      if (existing.letter !== tile.letter) return null
    } else {
      board[r][c] = tile
    }
    if (direction === 'across') c++
    else r++
  }
  return board
}
