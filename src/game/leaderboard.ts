import type { Difficulty, LeaderboardEntry } from './types'

const KEY = 'word-race-leaderboard'

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LeaderboardEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id'>): LeaderboardEntry[] {
  const list = loadLeaderboard()
  const full: LeaderboardEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }
  list.push(full)
  list.sort((a, b) => b.playerScore - a.playerScore)
  const trimmed = list.slice(0, 20)
  localStorage.setItem(KEY, JSON.stringify(trimmed))
  return trimmed
}

export function formatDifficulty(d: Difficulty): string {
  return d === 'easy' ? 'Easy' : 'Hard'
}
