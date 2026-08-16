import type { Difficulty, LeaderboardEntry } from './types'

const KEY = 'word-race-leaderboard'
const MAX_ENTRIES = 20
const MAX_SCORE = 1_000_000
const MAX_ID_LEN = 64
const MAX_DATE_LEN = 64

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'hard'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function sanitizeEntry(value: unknown): LeaderboardEntry | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>

  if (typeof raw.id !== 'string' || raw.id.length === 0 || raw.id.length > MAX_ID_LEN) return null
  if (typeof raw.date !== 'string' || raw.date.length === 0 || raw.date.length > MAX_DATE_LEN) return null
  if (!isFiniteNumber(raw.playerScore) || raw.playerScore < 0 || raw.playerScore > MAX_SCORE) return null
  if (!isFiniteNumber(raw.aiScore) || raw.aiScore < 0 || raw.aiScore > MAX_SCORE) return null
  if (!isFiniteNumber(raw.difference) || Math.abs(raw.difference) > MAX_SCORE) return null
  if (typeof raw.won !== 'boolean') return null
  if (!isDifficulty(raw.difficulty)) return null

  // Rebuild a plain object so unexpected keys / prototypes cannot linger.
  return {
    id: raw.id,
    date: raw.date,
    playerScore: Math.trunc(raw.playerScore),
    aiScore: Math.trunc(raw.aiScore),
    difference: Math.trunc(raw.difference),
    won: raw.won,
    difficulty: raw.difficulty,
  }
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw || raw.length > 50_000) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .slice(0, MAX_ENTRIES * 2)
      .map(sanitizeEntry)
      .filter((entry): entry is LeaderboardEntry => entry !== null)
      .slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

export function saveLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id'>): LeaderboardEntry[] {
  const list = loadLeaderboard()
  const full: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: entry.date,
    playerScore: Math.trunc(entry.playerScore),
    aiScore: Math.trunc(entry.aiScore),
    difference: Math.trunc(entry.difference),
    won: Boolean(entry.won),
    difficulty: entry.difficulty === 'easy' ? 'easy' : 'hard',
  }
  list.push(full)
  list.sort((a, b) => b.playerScore - a.playerScore)
  const trimmed = list.slice(0, MAX_ENTRIES)
  localStorage.setItem(KEY, JSON.stringify(trimmed))
  return trimmed
}

export function formatDifficulty(d: Difficulty): string {
  return d === 'easy' ? 'Easy' : 'Hard'
}
