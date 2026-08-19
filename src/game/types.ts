export type Difficulty = 'easy' | 'hard'

/** Active player clock options (seconds). */
export type TimeLimitSeconds = 90 | 180

export type TileOwner = 'player' | 'ai'

export type Multiplier = 'none' | 'DL' | 'TL' | 'DW' | 'TW'

export interface Tile {
  id: string
  letter: string
}

export type BoardCell = Tile | null

export type Board = BoardCell[][]

export interface GameScores {
  player: number
  ai: number
}

export interface PlayedWord {
  word: string
  score: number
  by: TileOwner
  bonuses: Array<Exclude<Multiplier, 'none'>>
}

export interface AiMoveSummary {
  type: 'play' | 'swap' | 'pass'
  word?: string
  score?: number
  detail: string
}

export interface LeaderboardEntry {
  id: string
  date: string
  playerName: string
  playerScore: number
  aiScore: number
  difference: number
  won: boolean
  difficulty: Difficulty
}

export interface ValidationResult {
  ok: boolean
  reason?: string
  words?: string[]
  boardScore?: number
  moveScore?: number
}

export interface CandidateMove {
  board: Board
  rack: Tile[]
  word: string
  moveScore: number
  boardScore: number
}
