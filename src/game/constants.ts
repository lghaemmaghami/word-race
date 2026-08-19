import type { Multiplier, TimeLimitSeconds } from './types'

export const BOARD_SIZE = 15
export const CENTER = 7
export const RACK_SIZE = 7
export const PLAYER_TIME_OPTIONS_MS = {
  90: 90_000,
  180: 180_000,
} as const
export const DEFAULT_PLAYER_TIME_SECONDS = 90 as const
export const PLAYER_TIME_MS = PLAYER_TIME_OPTIONS_MS[DEFAULT_PLAYER_TIME_SECONDS]
export const AI_TIME_MS = 5_000

export function isTimedMode(limit: TimeLimitSeconds): boolean {
  return limit !== 0
}

export function formatTimeLimit(limit: TimeLimitSeconds): string {
  return limit === 0 ? 'No timer' : `${limit}s`
}
export const BINGO_BONUS = 50

export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
}

/** Standard Scrabble distribution without blank tiles (98 tiles). */
export const TILE_DISTRIBUTION: Record<string, number> = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1,
  K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6,
  U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1,
}

export function createMultiplierGrid(): Multiplier[][] {
  const grid: Multiplier[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 'none' as Multiplier),
  )

  const set = (r: number, c: number, m: Multiplier) => {
    grid[r][c] = m
  }

  ;(
    [
      [0, 0], [0, 7], [0, 14], [7, 0], [7, 14], [14, 0], [14, 7], [14, 14],
    ] as Array<[number, number]>
  ).forEach(([r, c]) => set(r, c, 'TW'))

  ;(
    [
      [1, 1], [2, 2], [3, 3], [4, 4],
      [1, 13], [2, 12], [3, 11], [4, 10],
      [13, 1], [12, 2], [11, 3], [10, 4],
      [13, 13], [12, 12], [11, 11], [10, 10],
      [7, 7],
    ] as Array<[number, number]>
  ).forEach(([r, c]) => set(r, c, 'DW'))

  ;(
    [
      [1, 5], [1, 9],
      [5, 1], [5, 5], [5, 9], [5, 13],
      [9, 1], [9, 5], [9, 9], [9, 13],
      [13, 5], [13, 9],
    ] as Array<[number, number]>
  ).forEach(([r, c]) => set(r, c, 'TL'))

  ;(
    [
      [0, 3], [0, 11],
      [2, 6], [2, 8],
      [3, 0], [3, 7], [3, 14],
      [6, 2], [6, 6], [6, 8], [6, 12],
      [7, 3], [7, 11],
      [8, 2], [8, 6], [8, 8], [8, 12],
      [11, 0], [11, 7], [11, 14],
      [12, 6], [12, 8],
      [14, 3], [14, 11],
    ] as Array<[number, number]>
  ).forEach(([r, c]) => set(r, c, 'DL'))

  return grid
}

export const MULTIPLIERS = createMultiplierGrid()

export function letterValue(letter: string): number {
  return LETTER_VALUES[letter.toUpperCase()] ?? 0
}
