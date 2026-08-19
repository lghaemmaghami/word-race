import { SCRABBLE_TWO_LETTER_WORDS } from './twoLetterWords'
import { SYMBOL_WORD_BLOCKLIST } from './symbolWordBlocklist'

const MIN_DICTIONARY_SIZE = 10_000

export class Dictionary {
  private words = new Set<string>()
  private byLength = new Map<number, string[]>()
  loaded = false

  async load(url = '/dictionary.txt'): Promise<void> {
    if (this.loaded && this.words.size >= MIN_DICTIONARY_SIZE) return

    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}v=enable1`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load dictionary')
    const text = await res.text()
    if (/^\s*</.test(text)) {
      throw new Error('Dictionary download failed. Refresh and try again.')
    }
    this.loadFromText(text)
    if (!this.loaded) throw new Error('Dictionary was empty. Refresh and try again.')
  }

  loadFromText(text: string): void {
    const byLength = new Map<number, string[]>()
    const words = new Set<string>()

    for (const raw of text.split(/\r?\n/)) {
      const w = raw.trim().toUpperCase()
      if (w.length < 2 || w.length > 15) continue
      if (!/^[A-Z]+$/.test(w)) continue
      if (w.length === 2 && !SCRABBLE_TWO_LETTER_WORDS.has(w)) continue
      if (SYMBOL_WORD_BLOCKLIST.has(w)) continue
      words.add(w)
      const list = byLength.get(w.length)
      if (list) list.push(w)
      else byLength.set(w.length, [w])
    }

    if (words.size < MIN_DICTIONARY_SIZE) {
      this.loaded = false
      return
    }

    this.words = words
    this.byLength = byLength
    this.loaded = true
  }

  has(word: string): boolean {
    return this.words.has(word.toUpperCase())
  }

  get size(): number {
    return this.words.size
  }

  wordsOfLength(len: number): string[] {
    return this.byLength.get(len) ?? []
  }

  canFormFromRack(word: string, rackLetters: string[]): boolean {
    const avail = new Map<string, number>()
    for (const ch of rackLetters) {
      avail.set(ch, (avail.get(ch) ?? 0) + 1)
    }
    for (const ch of word) {
      const n = avail.get(ch) ?? 0
      if (n <= 0) return false
      avail.set(ch, n - 1)
    }
    return true
  }
}

const globalDict = globalThis as typeof globalThis & { __wordRaceDictionary?: Dictionary }

export const dictionary = globalDict.__wordRaceDictionary ?? new Dictionary()
globalDict.__wordRaceDictionary = dictionary
