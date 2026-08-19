import type { Difficulty, LeaderboardEntry, TimeLimitSeconds } from './types'

const PLAYER_NAME_KEY = 'word-race-player-name'
const MAX_ENTRIES = 10
const MAX_SCORE = 1_000_000
const MAX_NAME_LEN = 20
const VALID_NAME_RE = /^[A-Za-z0-9 _-]+$/

const DB_URL = import.meta.env.VITE_FIREBASE_DB_URL as string | undefined

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'hard'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function sanitizeEntry(value: unknown): LeaderboardEntry | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>

  if (typeof raw.id !== 'string' || raw.id.length === 0) return null
  if (typeof raw.date !== 'string' || raw.date.length === 0) return null
  if (!isFiniteNumber(raw.playerScore) || raw.playerScore < 0 || raw.playerScore > MAX_SCORE) return null
  if (!isFiniteNumber(raw.aiScore) || raw.aiScore < 0 || raw.aiScore > MAX_SCORE) return null
  if (!isFiniteNumber(raw.difference) || Math.abs(raw.difference) > MAX_SCORE) return null
  if (typeof raw.won !== 'boolean') return null
  if (!isDifficulty(raw.difficulty)) return null

  const playerName =
    typeof raw.playerName === 'string' && raw.playerName.length > 0 && raw.playerName.length <= MAX_NAME_LEN && VALID_NAME_RE.test(raw.playerName)
      ? raw.playerName
      : 'Unknown'

  const timeLimitSeconds: TimeLimitSeconds =
    raw.timeLimitSeconds === 90 || raw.timeLimitSeconds === 180 || raw.timeLimitSeconds === 0
      ? raw.timeLimitSeconds
      : 90

  return {
    id: raw.id,
    date: raw.date,
    playerName,
    playerScore: Math.trunc(raw.playerScore),
    aiScore: Math.trunc(raw.aiScore),
    difference: Math.trunc(raw.difference),
    won: raw.won,
    difficulty: raw.difficulty,
    timeLimitSeconds,
  }
}

let cachedLeaderboard: LeaderboardEntry[] = []

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!DB_URL) return cachedLeaderboard
  try {
    const res = await fetch(
      `${DB_URL}/leaderboard.json?orderBy="playerScore"&limitToLast=${MAX_ENTRIES}`,
    )
    if (!res.ok) return cachedLeaderboard
    const data: unknown = await res.json()
    if (!data || typeof data !== 'object') return []
    const entries = Object.values(data as Record<string, unknown>)
      .map(sanitizeEntry)
      .filter((e): e is LeaderboardEntry => e !== null)
      .sort((a, b) => b.playerScore - a.playerScore)
      .slice(0, MAX_ENTRIES)
    cachedLeaderboard = entries
    return entries
  } catch {
    return cachedLeaderboard
  }
}

export function getCachedLeaderboard(): LeaderboardEntry[] {
  return cachedLeaderboard
}

export async function submitScore(entry: {
  playerName: string
  playerScore: number
  aiScore: number
  difference: number
  won: boolean
  difficulty: Difficulty
  timeLimitSeconds: TimeLimitSeconds
}): Promise<void> {
  if (!DB_URL) return
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const full: LeaderboardEntry = {
    id,
    date: new Date().toISOString(),
    ...entry,
  }
  try {
    await fetch(`${DB_URL}/leaderboard/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full),
    })
  } catch {
    // best-effort
  }
}

export function formatDifficulty(d: Difficulty): string {
  return d === 'easy' ? 'Easy' : 'Hard'
}

export function getPlayerName(): string | null {
  try {
    const name = localStorage.getItem(PLAYER_NAME_KEY)
    if (name && name.trim().length > 0 && name.length <= MAX_NAME_LEN) return name.trim()
    return null
  } catch {
    return null
  }
}

export function setPlayerName(name: string): void {
  const sanitized = name.trim().replace(/[^A-Za-z0-9 _-]/g, '').slice(0, MAX_NAME_LEN)
  localStorage.setItem(PLAYER_NAME_KEY, sanitized)
}
