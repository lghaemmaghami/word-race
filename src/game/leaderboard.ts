import type { Difficulty, LeaderboardEntry } from './types'

const PLAYER_NAME_KEY = 'word-race-player-name'
const MAX_ENTRIES = 10
const MAX_SCORE = 1_000_000
const MAX_ID_LEN = 64
const MAX_DATE_LEN = 64
const MAX_NAME_LEN = 32

const REPO = 'lghaemmaghami/word-race'
const LEADERBOARD_URL = import.meta.env.BASE_URL + 'leaderboard.json'
const GH_TOKEN = import.meta.env.VITE_GH_TOKEN as string | undefined

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

  const playerName =
    typeof raw.playerName === 'string' && raw.playerName.length > 0 && raw.playerName.length <= MAX_NAME_LEN
      ? raw.playerName
      : 'Unknown'

  return {
    id: raw.id,
    date: raw.date,
    playerName,
    playerScore: Math.trunc(raw.playerScore),
    aiScore: Math.trunc(raw.aiScore),
    difference: Math.trunc(raw.difference),
    won: raw.won,
    difficulty: raw.difficulty,
  }
}

let cachedLeaderboard: LeaderboardEntry[] = []
let lastFetchMs = 0
const CACHE_TTL_MS = 30_000

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (Date.now() - lastFetchMs < CACHE_TTL_MS && cachedLeaderboard.length > 0) {
    return cachedLeaderboard
  }
  try {
    const res = await fetch(LEADERBOARD_URL, { cache: 'no-store' })
    if (!res.ok) return cachedLeaderboard
    const parsed: unknown = await res.json()
    if (!Array.isArray(parsed)) return cachedLeaderboard
    cachedLeaderboard = parsed
      .slice(0, MAX_ENTRIES * 2)
      .map(sanitizeEntry)
      .filter((e): e is LeaderboardEntry => e !== null)
      .slice(0, MAX_ENTRIES)
    lastFetchMs = Date.now()
    return cachedLeaderboard
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
}): Promise<void> {
  if (!GH_TOKEN) return
  try {
    await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'update-leaderboard',
        client_payload: entry,
      }),
    })
  } catch {
    // fire-and-forget
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
  localStorage.setItem(PLAYER_NAME_KEY, name.trim().slice(0, MAX_NAME_LEN))
}
