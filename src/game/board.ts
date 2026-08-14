import { BOARD_SIZE } from './constants'
import type { Board, BoardCell, Tile } from './types'

let tileSeq = 0

export function createTile(letter: string): Tile {
  tileSeq += 1
  return { id: `t${tileSeq}-${letter}`, letter: letter.toUpperCase() }
}

export function resetTileSeq(n = 0) {
  tileSeq = n
}

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null as BoardCell),
  )
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)))
}

export function boardTileIds(board: Board): Set<string> {
  const ids = new Set<string>()
  for (const row of board) {
    for (const cell of row) {
      if (cell) ids.add(cell.id)
    }
  }
  return ids
}

export function findTileOnBoard(
  board: Board,
  tileId: string,
): { row: number; col: number } | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c]?.id === tileId) return { row: r, col: c }
    }
  }
  return null
}

export function occupiedCount(board: Board): number {
  let n = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell) n++
    }
  }
  return n
}

export function getOccupiedPositions(board: Board): Array<{ row: number; col: number; tile: Tile }> {
  const out: Array<{ row: number; col: number; tile: Tile }> = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const tile = board[r][c]
      if (tile) out.push({ row: r, col: c, tile })
    }
  }
  return out
}
