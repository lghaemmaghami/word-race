import { BOARD_SIZE, CENTER, AI_TIME_MS } from './constants'
import { cloneBoard, getOccupiedPositions } from './board'
import { validateBoard, moveScore } from './scoring'
import type { Dictionary } from './dictionary'
import type { Board, CandidateMove, Difficulty, Tile } from './types'

function permutationsOfLength(letters: string[], len: number, limit: number): string[][] {
  if (len === 0) return [[]]
  const results: string[][] = []
  const used = new Array(letters.length).fill(false)

  const dfs = (path: string[]) => {
    if (results.length >= limit) return
    if (path.length === len) {
      results.push([...path])
      return
    }
    const seen = new Set<string>()
    for (let i = 0; i < letters.length; i++) {
      if (used[i] || seen.has(letters[i])) continue
      seen.add(letters[i])
      used[i] = true
      path.push(letters[i])
      dfs(path)
      path.pop()
      used[i] = false
      if (results.length >= limit) return
    }
  }
  dfs([])
  return results
}

function applyPlacement(
  board: Board,
  rack: Tile[],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
): { board: Board; rack: Tile[] } | null {
  const next = cloneBoard(board)
  const remaining = rack.map((t) => ({ ...t }))
  let r = row
  let c = col

  for (let i = 0; i < word.length; i++) {
    const ch = word[i]
    const existing = next[r][c]
    if (existing) {
      if (existing.letter !== ch) return null
    } else {
      const idx = remaining.findIndex((t) => t.letter === ch)
      if (idx < 0) return null
      const [tile] = remaining.splice(idx, 1)
      next[r][c] = tile
    }
    if (direction === 'across') c++
    else r++
  }

  return { board: next, rack: remaining }
}

function touchesOrFirst(
  board: Board,
  row: number,
  col: number,
  len: number,
  dir: 'across' | 'down',
): boolean {
  const occupied = getOccupiedPositions(board)
  if (occupied.length === 0) {
    if (dir === 'across') {
      return row === CENTER && col <= CENTER && col + len - 1 >= CENTER
    }
    return col === CENTER && row <= CENTER && row + len - 1 >= CENTER
  }

  for (let i = 0; i < len; i++) {
    const r = dir === 'across' ? row : row + i
    const c = dir === 'across' ? col + i : col
    if (board[r][c]) return true
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc]) {
        return true
      }
    }
  }
  return false
}

function buildPattern(
  board: Board,
  row: number,
  col: number,
  len: number,
  dir: 'across' | 'down',
): Array<string | null> | null {
  const pattern: Array<string | null> = []
  let r = row
  let c = col
  for (let i = 0; i < len; i++) {
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null
    pattern.push(board[r][c]?.letter ?? null)
    if (dir === 'across') c++
    else r++
  }
  const beforeR = dir === 'across' ? row : row - 1
  const beforeC = dir === 'across' ? col - 1 : col
  const afterR = dir === 'across' ? row : row + len
  const afterC = dir === 'across' ? col + len : col
  if (
    beforeR >= 0 &&
    beforeR < BOARD_SIZE &&
    beforeC >= 0 &&
    beforeC < BOARD_SIZE &&
    board[beforeR][beforeC]
  ) {
    return null
  }
  if (
    afterR >= 0 &&
    afterR < BOARD_SIZE &&
    afterC >= 0 &&
    afterC < BOARD_SIZE &&
    board[afterR][afterC]
  ) {
    return null
  }
  return pattern
}

function patternToRegex(pattern: Array<string | null>): RegExp {
  const body = pattern.map((p) => (p === null ? '.' : p)).join('')
  return new RegExp(`^${body}$`)
}

function rackCanFill(word: string, pattern: Array<string | null>, rackLetters: string[]): boolean {
  const avail = new Map<string, number>()
  for (const ch of rackLetters) avail.set(ch, (avail.get(ch) ?? 0) + 1)
  for (let i = 0; i < word.length; i++) {
    if (pattern[i] !== null) {
      if (pattern[i] !== word[i]) return false
      continue
    }
    const n = avail.get(word[i]) ?? 0
    if (n <= 0) return false
    avail.set(word[i], n - 1)
  }
  return pattern.some((p) => p === null)
}

export function findAiMoves(
  board: Board,
  rack: Tile[],
  dict: Dictionary,
  previousBoardScore: number,
  difficulty: Difficulty,
  timeLimitMs = AI_TIME_MS,
): CandidateMove[] {
  const deadline = Date.now() + timeLimitMs - 80
  const candidates: CandidateMove[] = []
  const seen = new Set<string>()
  const rackLetters = rack.map((t) => t.letter)
  const isEmpty = getOccupiedPositions(board).length === 0
  const maxCandidates = difficulty === 'hard' ? 180 : 70
  const permLimit = difficulty === 'hard' ? 400 : 120

  const dirs: Array<'across' | 'down'> = ['across', 'down']
  const maxLen = Math.min(8, rack.length + (isEmpty ? 0 : 4))

  // Fast path for opening move: only rack-formable words covering centre
  if (isEmpty) {
    const openingWords: string[] = []
    for (let len = Math.min(7, rack.length); len >= 2; len--) {
      if (Date.now() > deadline) break
      for (const word of dict.wordsOfLength(len)) {
        if (dict.canFormFromRack(word, rackLetters)) {
          openingWords.push(word)
          if (openingWords.length > (difficulty === 'hard' ? 300 : 120)) break
        }
      }
      if (openingWords.length > (difficulty === 'hard' ? 300 : 120)) break
    }

    for (const word of openingWords) {
      if (Date.now() > deadline || candidates.length >= maxCandidates) break
      const len = word.length
      for (const dir of dirs) {
        let rowMin = 0
        let rowMax = 0
        let colMin = 0
        let colMax = 0
        if (dir === 'across') {
          rowMin = rowMax = CENTER
          colMin = Math.max(0, CENTER - len + 1)
          colMax = Math.min(BOARD_SIZE - len, CENTER)
        } else {
          colMin = colMax = CENTER
          rowMin = Math.max(0, CENTER - len + 1)
          rowMax = Math.min(BOARD_SIZE - len, CENTER)
        }
        for (let row = rowMin; row <= rowMax; row++) {
          for (let col = colMin; col <= colMax; col++) {
            const applied = applyPlacement(board, rack, word, row, col, dir)
            if (!applied) continue
            const key = `${dir}:${row}:${col}:${word}`
            if (seen.has(key)) continue
            seen.add(key)
            const check = validateBoard(applied.board, dict)
            if (!check.ok) continue
            candidates.push({
              board: applied.board,
              rack: applied.rack,
              word,
              moveScore: moveScore(check.boardScore, previousBoardScore),
              boardScore: check.boardScore,
            })
            if (candidates.length >= maxCandidates) break
          }
        }
      }
    }
    return candidates
  }

  for (let len = Math.min(maxLen, 7); len >= 2; len--) {
    if (Date.now() > deadline || candidates.length >= maxCandidates) break

    for (const dir of dirs) {
      if (Date.now() > deadline || candidates.length >= maxCandidates) break

      let rowMin = 0
      let rowMax = dir === 'across' ? BOARD_SIZE - 1 : BOARD_SIZE - len
      let colMin = 0
      let colMax = dir === 'across' ? BOARD_SIZE - len : BOARD_SIZE - 1

      if (isEmpty) {
        if (dir === 'across') {
          rowMin = rowMax = CENTER
          colMin = Math.max(0, CENTER - len + 1)
          colMax = Math.min(BOARD_SIZE - len, CENTER)
        } else {
          colMin = colMax = CENTER
          rowMin = Math.max(0, CENTER - len + 1)
          rowMax = Math.min(BOARD_SIZE - len, CENTER)
        }
      }

      for (let row = rowMin; row <= rowMax; row++) {
        for (let col = colMin; col <= colMax; col++) {
          if (Date.now() > deadline || candidates.length >= maxCandidates) break
          if (!touchesOrFirst(board, row, col, len, dir)) continue

          const pattern = buildPattern(board, row, col, len, dir)
          if (!pattern) continue
          const empties = pattern.filter((p) => p === null).length
          if (empties === 0 || empties > rack.length) continue
          // Prefer some interaction with board when not first move
          if (!isEmpty && pattern.every((p) => p === null)) {
            // pure adjacent parallel placement — still allowed if touching
          }

          // Try dictionary words matching pattern
          const re = patternToRegex(pattern)
          const words = dict.wordsOfLength(len)
          // Sample / scan with early exit
          const step = difficulty === 'easy' ? Math.max(1, Math.floor(words.length / 800)) : 1
          for (let wi = 0; wi < words.length; wi += step) {
            if (Date.now() > deadline || candidates.length >= maxCandidates) break
            const word = words[wi]
            if (!re.test(word)) continue
            if (!rackCanFill(word, pattern, rackLetters)) continue

            const applied = applyPlacement(board, rack, word, row, col, dir)
            if (!applied) continue

            const key = `${dir}:${row}:${col}:${word}`
            if (seen.has(key)) continue
            seen.add(key)

            const check = validateBoard(applied.board, dict)
            if (!check.ok) continue

            candidates.push({
              board: applied.board,
              rack: applied.rack,
              word,
              moveScore: moveScore(check.boardScore, previousBoardScore),
              boardScore: check.boardScore,
            })
          }

          // Also try generating fills from rack for mostly-empty patterns
          if (empties <= 5 && candidates.length < maxCandidates) {
            const fills = permutationsOfLength(rackLetters, empties, permLimit)
            for (const fill of fills) {
              if (Date.now() > deadline || candidates.length >= maxCandidates) break
              let fi = 0
              let word = ''
              let ok = true
              for (let i = 0; i < len; i++) {
                if (pattern[i] === null) {
                  word += fill[fi++]
                } else {
                  word += pattern[i]
                }
              }
              if (!ok || !dict.has(word)) continue
              const applied = applyPlacement(board, rack, word, row, col, dir)
              if (!applied) continue
              const key = `${dir}:${row}:${col}:${word}`
              if (seen.has(key)) continue
              seen.add(key)
              const check = validateBoard(applied.board, dict)
              if (!check.ok) continue
              candidates.push({
                board: applied.board,
                rack: applied.rack,
                word,
                moveScore: moveScore(check.boardScore, previousBoardScore),
                boardScore: check.boardScore,
              })
            }
          }
        }
      }
    }
  }

  return candidates
}

export function chooseAiMove(
  candidates: CandidateMove[],
  difficulty: Difficulty,
): CandidateMove | null {
  if (candidates.length === 0) return null
  const sorted = [...candidates].sort((a, b) => b.moveScore - a.moveScore)

  if (difficulty === 'hard') return sorted[0]

  const cut = Math.floor(sorted.length * 0.25)
  const pool = sorted.length === 1 ? sorted : sorted.slice(Math.max(cut, 0))
  const usable = pool.length > 0 ? pool : sorted
  return usable[Math.floor(Math.random() * usable.length)]
}

export function runAiTurn(params: {
  board: Board
  rack: Tile[]
  dict: Dictionary
  previousBoardScore: number
  difficulty: Difficulty
}): { type: 'play'; move: CandidateMove } | { type: 'none' } {
  const { board, rack, dict, previousBoardScore, difficulty } = params
  const candidates = findAiMoves(board, rack, dict, previousBoardScore, difficulty, AI_TIME_MS)
  const move = chooseAiMove(candidates, difficulty)
  if (move) return { type: 'play', move }
  return { type: 'none' }
}
