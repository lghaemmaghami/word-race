import { BOARD_SIZE, CENTER, MULTIPLIERS, letterValue } from './constants'
import { getOccupiedPositions } from './board'
import type { Board } from './types'
import type { Dictionary } from './dictionary'

export interface ExtractedWord {
  word: string
  cells: Array<{ row: number; col: number }>
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

export function scoreWord(board: Board, cells: Array<{ row: number; col: number }>): number {
  let letterSum = 0
  let wordMult = 1
  for (const { row, col } of cells) {
    const tile = board[row][col]
    if (!tile) continue
    let v = letterValue(tile.letter)
    const m = MULTIPLIERS[row][col]
    if (m === 'DL') v *= 2
    else if (m === 'TL') v *= 3
    else if (m === 'DW') wordMult *= 2
    else if (m === 'TW') wordMult *= 3
    letterSum += v
  }
  return letterSum * wordMult
}

export interface ScoredWord {
  word: string
  score: number
}

function sortScoredWords<T extends ScoredWord>(words: T[]): T[] {
  return words.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))
}

/** Every 2+ letter word on the board with its current multiplier score, highest first. */
export function listScoredWords(board: Board): ScoredWord[] {
  return sortScoredWords(
    extractWords(board).map((w) => ({ word: w.word, score: scoreWord(board, w.cells) })),
  )
}

/** Words that include at least one of the given tiles, with scores at the current positions. */
export function listWordsCompletedByTiles(board: Board, tileIds: Set<string>): ScoredWord[] {
  if (tileIds.size === 0) return []
  return extractWords(board)
    .filter((w) =>
      w.cells.some(({ row, col }) => {
        const tile = board[row][col]
        return tile != null && tileIds.has(tile.id)
      }),
    )
    .map((w) => ({ word: w.word, score: scoreWord(board, w.cells) }))
    .sort((a, b) => b.word.length - a.word.length || b.score - a.score || a.word.localeCompare(b.word))
}

/** Total score of every 2+ letter word on the board (multipliers always applied by position). */
export function scoreFullBoard(board: Board): number {
  const words = extractWords(board)
  return words.reduce((sum, w) => sum + scoreWord(board, w.cells), 0)
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
  boardScore: number
}

export function validateBoard(board: Board, dict: Dictionary): BoardValidation {
  if (!dict.loaded || dict.size === 0) {
    return {
      ok: false,
      reason: 'Dictionary is still loading. Wait a moment and submit again.',
      words: [],
      boardScore: 0,
    }
  }

  const occupied = getOccupiedPositions(board)
  if (occupied.length === 0) {
    return { ok: false, reason: 'Board is empty.', words: [], boardScore: 0 }
  }

  if (!coversCenter(board)) {
    return {
      ok: false,
      reason: 'The centre square must be covered.',
      words: [],
      boardScore: 0,
    }
  }

  if (!isConnected(board)) {
    return {
      ok: false,
      reason: 'All tiles must form one connected crossword.',
      words: [],
      boardScore: 0,
    }
  }

  // Isolated single letters (not part of any 2+ word) are allowed only if the whole board is one letter covering center on first play — but first play needs a word typically.
  // Spec: every horizontal or vertical word of 2+ letters must be valid.
  // Single-letter islands that are connected orthogonally to the crossword as dangling letters: in Scrabble, single letters aren't "words" of 2+, so they're OK as long as connected.
  // But a board of only one letter: no 2+ words, covers center, connected — is that valid?
  // Spec says first valid board must cover centre. Player must add at least one tile. A single letter isn't a word of 2+.
  // I'll require at least one word of 2+ letters for a valid board.
  const extracted = extractWords(board)
  if (extracted.length === 0) {
    return {
      ok: false,
      reason: 'Place at least one word of 2 or more letters.',
      words: [],
      boardScore: 0,
    }
  }

  const invalid = extracted.filter((w) => !dict.has(w.word))
  if (invalid.length) {
    return {
      ok: false,
      reason: `Invalid word${invalid.length > 1 ? 's' : ''}: ${invalid.map((w) => w.word).join(', ')}`,
      words: extracted.map((w) => w.word),
      boardScore: 0,
    }
  }

  // Every occupied tile must belong to at least one 2+ word (no stranded single letters hanging off)
  // Actually in crossword/Scrabble, a single letter extension that's only length-1 in both directions would be an invalid "dangling" tile in some rules.
  // Standard Scrabble: every tile played must be part of a valid word. For full-board validation with free rearrange:
  // Require every occupied cell participates in at least one extracted 2+ word.
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
        boardScore: 0,
      }
    }
  }

  const boardScore = extracted.reduce((sum, w) => sum + scoreWord(board, w.cells), 0)
  return {
    ok: true,
    words: extracted.map((w) => w.word),
    boardScore,
  }
}

export function moveScore(newBoardScore: number, previousBoardScore: number): number {
  return Math.max(0, newBoardScore - previousBoardScore)
}
