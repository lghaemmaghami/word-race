export class Dictionary {
  private words = new Set<string>()
  private byLength = new Map<number, string[]>()
  loaded = false

  async load(url = '/dictionary.txt'): Promise<void> {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to load dictionary')
    const text = await res.text()
    const lines = text.split(/\r?\n/)
    const byLength = new Map<number, string[]>()
    const words = new Set<string>()

    for (const raw of lines) {
      const w = raw.trim().toUpperCase()
      if (w.length < 2 || w.length > 15) continue
      if (!/^[A-Z]+$/.test(w)) continue
      words.add(w)
      const list = byLength.get(w.length)
      if (list) list.push(w)
      else byLength.set(w.length, [w])
    }

    this.words = words
    this.byLength = byLength
    this.loaded = true
  }

  has(word: string): boolean {
    return this.words.has(word.toUpperCase())
  }

  wordsOfLength(len: number): string[] {
    return this.byLength.get(len) ?? []
  }

  /** Words that can be formed using only the given letter multiset (and optional extra fixed letters elsewhere). */
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

export const dictionary = new Dictionary()
