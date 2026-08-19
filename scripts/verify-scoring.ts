import { emptyBoard } from '../src/game/board'
import { createTile } from '../src/game/board'
import { scorePlay, scoreWordForPlay } from '../src/game/scoring'
import type { Board } from '../src/game/types'

function assert(name: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${expected}, got ${actual}`)
  }
  console.log(`ok ${name}`)
}

// J on TL (5,5), O at (5,6) — J=8*3 + O=1 = 25
{
  const board = emptyBoard()
  const j = createTile('J')
  const o = createTile('O')
  board[5][5] = j
  board[5][6] = o
  const newIds = new Set([j.id, o.id])
  const result = scorePlay(board, newIds, new Set())
  assert('opening JO on TL', result.moveScore, 25)
}

// CAT on centre row through DW at (7,7): C=3 A=1 T=1 = 5*2 = 10
{
  const board = emptyBoard()
  const c = createTile('C')
  const a = createTile('A')
  const t = createTile('T')
  board[7][5] = c
  board[7][6] = a
  board[7][7] = t
  const newIds = new Set([c.id, a.id, t.id])
  const result = scorePlay(board, newIds, new Set())
  assert('CAT through centre DW', result.moveScore, 10)
}

// Existing tile keeps face value; new tile gets premium
{
  const board = emptyBoard()
  const a = createTile('A')
  const t = createTile('T')
  board[7][7] = a
  board[7][8] = t
  const existing = new Set(['7,7'])
  const newIds = new Set([t.id])
  const { score } = scoreWordForPlay(board, [
    { row: 7, col: 7 },
    { row: 7, col: 8 },
  ], newIds, existing)
  assert('AT with used centre DW', score, 2)
}

// Used premium square gives face value only
{
  const board = emptyBoard()
  const j = createTile('J')
  const o = createTile('O')
  board[5][5] = j
  board[5][6] = o
  const used = new Set(['5,5'])
  const newIds = new Set([o.id])
  const { score } = scoreWordForPlay(board, [
    { row: 5, col: 5 },
    { row: 5, col: 6 },
  ], newIds, used)
  assert('extend JO after TL consumed', score, 9)
}

// Bingo bonus
{
  const board = emptyBoard()
  const tiles = 'EARINGS'.split('').map((letter) => createTile(letter))
  tiles.forEach((tile, i) => {
    board[7][4 + i] = tile
  })
  const newIds = new Set(tiles.map((t) => t.id))
  const result = scorePlay(board, newIds, new Set())
  const base = result.moveScore - 50
  assert('bingo adds 50', result.bingo ? 1 : 0, 1)
  assert('bingo base > 0', base > 0 ? 1 : 0, 1)
}

console.log('All scoring checks passed')
