import { readFileSync } from 'node:fs'
import { createTile, emptyBoard } from '../src/game/board.ts'
import { Dictionary } from '../src/game/dictionary.ts'
import { validateBoard } from '../src/game/scoring.ts'

const dict = new Dictionary()
dict.loadFromText(readFileSync(new URL('../public/dictionary.txt', import.meta.url), 'utf8'))

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(!dict.has('IR'), 'IR must not be a dictionary word')
assert(!dict.has('CS'), 'CS must not be a dictionary word')
assert(!dict.has('CLI'), 'CLI must not be a dictionary word')
assert(dict.has('IT'), 'IT must be valid')
assert(dict.has('IS'), 'IS must be valid')
assert(dict.has('TRUE'), 'TRUE must be valid')
assert(dict.has('ITS'), 'ITS must be valid')

const board = emptyBoard()
board[7][7] = createTile('T')
board[7][8] = createTile('R')
board[7][9] = createTile('U')
board[7][10] = createTile('E')
board[6][8] = createTile('I')
board[6][9] = createTile('T')
board[6][10] = createTile('S')
const result = validateBoard(board, dict)
assert(!result.ok, `parallel ITS over TRUE should be invalid, got: ${JSON.stringify(result)}`)
assert(result.reason?.includes('IR') || result.reason?.includes('TU') || result.reason?.includes('SE'), result.reason ?? 'missing reason')

console.log('dictionary + cross-word validation ok')
