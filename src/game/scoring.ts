import { BOARD_SIZE, BINGO_BONUS, CENTER, MULTIPLIERS, letterValue } from './constants'
import { getOccupiedPositions, boardTileIds } from './board'
import type { Board, Multiplier } from './types'
import type { Dictionary } from './dictionary'

export interface ExtractedWord {
  word: string
  cells: Array<{ row: number; col: number }>
}

export type WordBonus = Exclude<Multiplier, 'none'>

export interface ScoredWord {
  word: string
  score: number
  bonuses: WordBonus[]
}

export interface PlayScoreResult {
  moveScore: number
  words: ScoredWord[]
  usedPremiumSquares: Set<string>
  bingo: boolean
}

function premiumSquareKey(row: number, col: number): string {
  return `${row},${col}`
}

export function newTileIdsBetweenBoards(previousBoard: Board, board: Board): Set<string> {
  const prevIds = boardTileIds(previousBoard)
  const newIds = new Set<string>()
  for (const row of board) {
    for (const cell of row) {
      if (cell && !prevIds.has(cell.id)) newIds.add(cell.id)
    }
  }
  return newIds
}

export function extractWords(board: Board): ExtractedWord[] {
  const words: ExtractedWord[] = []

  for (let r = 0; r < BOARD_SIZE; r++) {
    let c = 0
    while (c < BOARD_SIZE) {
      if (!board[r][c]) {
        c++
        continue
      }
      let word = ''
      const cells: Array<{ row: number; col: number }> = []
      while (c < BOARD_SIZE && board[r][c]) {
        word += board[r][c]!.letter
        cells.push({ row: r, col: c })
        c++
      }
      if (word.length >= 2) words.push({ word, cells })
    }
  }

  for (let c = 0; c < BOARD_SIZE; c++) {
    let r = 0
    while (r < BOARD_SIZE) {
      if (!board[r][c]) {
        r++
        continue
      }
      let word = ''
      const cells: Array<{ row: number; col: number }> = []
      while (r < BOARD_SIZE && board[r][c]) {
        word += board[r][c]!.letter
        cells.push({ row: r, col: c })
        r++
      }
      if (word.length >= 2) words.push({ word, cells })
    }
  }

  return words
}

/** Score one word for a single play using official Scrabble rules. */
export function scoreWordForPlay(
  board: Board,
  cells: Array<{ row: number; col: number }>,
  newTileIds: Set<string>,
  usedPremiumSquares: Set<string>,
): { score: number; appliedBonuses: WordBonus[] } {
  let letterSum = 0
  let wordMult = 1
  const appliedBonuses: WordBonus[] = []

  for (const { row, col } of cells) {
    const tile = board[row][col]
    if (!tile) continue

    const squareKey = premiumSquareKey(row, col)
    const multiplier = MULTIPLIERS[row][col]
    const isNewTile = newTileIds.has(tile.id)
    const premiumAvailable = multiplier !== 'none' && !usedPremiumSquares.has(squareKey)

    let value = letterValue(tile.letter)
    if (isNewTile && premiumAvailable) {
      if (multiplier === 'DL') value *= 2
      else if (multiplier === 'TL') value *= 3
      else if (multiplier === 'DW') wordMult *= 2
      else if (multiplier === 'TW') wordMult *= 3
      appliedBonuses.push(multiplier)
    }
    letterSum += value
  }

  return { score: letterSum * wordMult, appliedBonuses }
}

export function bonusesOnWord(cells: Array<{ row: number; col: number }>): WordBonus[] {
  const bonuses: WordBonus[] = []
  for (const { row, col } of cells) {
    const m = MULTIPLIERS[row][col]
    if (m !== 'none') bonuses.push(m)
  }
  return bonuses
}

/** Words that include at least one newly placed tile this turn. */
export function listWordsCompletedByTiles(board: Board, tileIds: Set<string>): ExtractedWord[] {
  if (tileIds.size === 0) return []
  return extractWords(board).filter((w) =>
    w.cells.some(({ row, col }) => {
      const tile = board[row][col]
      return tile != null && tileIds.has(tile.id)
    }),
  )
}

/**
 * Official Scrabble turn score:
 * - Sum every word formed or modified by tiles played this turn
 * - Letter premiums (DL/TL) and word premiums (DW/TW) apply only to newly played tiles
 *   on premium squares not yet used
 * - Letter premiums are applied before word premiums
 * - Cross words each score the shared letter with any premiums it earns
 * - Playing all 7 rack tiles in one turn adds 50 (bingo)
 */
export function scorePlay(
  board: Board,
  newTileIds: Set<string>,
  usedPremiumSquares: Set<string>,
): PlayScoreResult {
  const extracted = listWordsCompletedByTiles(board, newTileIds)
  const scoredWords: ScoredWord[] = []
  let moveScore = 0
  const newlyUsedSquares = new Set<string>()

  for (const extractedWord of extracted) {
    const { score, appliedBonuses } = scoreWordForPlay(
      board,
      extractedWord.cells,
      newTileIds,
      usedPremiumSquares,
    )
    moveScore += score
    scoredWords.push({
      word: extractedWord.word,
      score,
      bonuses: appliedBonuses,
    })

    for (const { row, col } of extractedWord.cells) {
      const tile = board[row][col]
      if (!tile || !newTileIds.has(tile.id)) continue
      const squareKey = premiumSquareKey(row, col)
      const multiplier = MULTIPLIERS[row][col]
      if (multiplier !== 'none' && !usedPremiumSquares.has(squareKey)) {
        newlyUsedSquares.add(squareKey)
      }
    }
  }

  scoredWords.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))

  const bingo = newTileIds.size === 7
  if (bingo) moveScore += BINGO_BONUS

  return {
    moveScore,
    words: scoredWords,
    usedPremiumSquares: new Set([...usedPremiumSquares, ...newlyUsedSquares]),
    bingo,
  }
}

export function rackTileScore(tiles: Array<{ letter: string }>): number {
  return tiles.reduce((sum, tile) => sum + letterValue(tile.letter), 0)
}

export function isConnected(board: Board): boolean {
  const occupied = getOccupiedPositions(board)
  if (occupied.length === 0) return false
  if (occupied.length === 1) return true

  const key = (r: number, c: number) => `${r},${c}`
  const set = new Set(occupied.map((o) => key(o.row, o.col)))
  const start = occupied[0]
  const seen = new Set<string>()
  const stack = [start]
  seen.add(key(start.row, start.col))

  while (stack.length) {
    const cur = stack.pop()!
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nr = cur.row + dr
      const nc = cur.col + dc
      const k = key(nr, nc)
      if (set.has(k) && !seen.has(k)) {
        seen.add(k)
        stack.push({ row: nr, col: nc, tile: board[nr][nc]! })
      }
    }
  }

  return seen.size === occupied.length
}

export function coversCenter(board: Board): boolean {
  return board[CENTER][CENTER] !== null
}

export interface BoardValidation {
  ok: boolean
  reason?: string
  words: string[]
}

export function validateBoard(board: Board, dict: Dictionary): BoardValidation {
  if (!dict.loaded || dict.size === 0) {
    return {
      ok: false,
      reason: 'Dictionary is still loading. Wait a moment and submit again.',
      words: [],
    }
  }

  const occupied = getOccupiedPositions(board)
  if (occupied.length === 0) {
    return { ok: false, reason: 'Board is empty.', words: [] }
  }

  if (!coversCenter(board)) {
    return {
      ok: false,
      reason: 'The centre square must be covered.',
      words: [],
    }
  }

  if (!isConnected(board)) {
    return {
      ok: false,
      reason: 'All tiles must form one connected crossword.',
      words: [],
    }
  }

  const extracted = extractWords(board)
  if (extracted.length === 0) {
    return {
      ok: false,
      reason: 'Place at least one word of 2 or more letters.',
      words: [],
    }
  }

  const invalid = extracted.filter((w) => !dict.has(w.word))
  if (invalid.length) {
    return {
      ok: false,
      reason: `Invalid word${invalid.length > 1 ? 's' : ''}: ${invalid.map((w) => w.word).join(', ')}`,
      words: extracted.map((w) => w.word),
    }
  }

  const inWord = new Set<string>()
  for (const w of extracted) {
    for (const cell of w.cells) inWord.add(`${cell.row},${cell.col}`)
  }
  for (const o of occupied) {
    if (!inWord.has(`${o.row},${o.col}`)) {
      return {
        ok: false,
        reason: 'Every tile must be part of a word of 2+ letters.',
        words: extracted.map((w) => w.word),
      }
    }
  }

  return {
    ok: true,
    words: extracted.map((w) => w.word),
  }
}
