import { TWO_LETTER_DEFINITIONS } from './twoLetterDefinitions'

export interface DefinitionSense {
  partOfSpeech: string
  definition: string
  example?: string
}

export interface WordDefinition {
  word: string
  phonetic?: string
  senses: DefinitionSense[]
}

const cache = new Map<string, WordDefinition>()
const MAX_WORD_LEN = 15
const MAX_TEXT_LEN = 500
const WORD_RE = /^[a-z]+$/i

interface DictionaryApiMeaning {
  partOfSpeech?: string
  definitions?: Array<{ definition?: string; example?: string }>
}

interface DictionaryApiEntry {
  word?: string
  phonetic?: string
  meanings?: DictionaryApiMeaning[]
}

interface WiktionarySenseGroup {
  partOfSpeech?: string
  language?: string
  definitions?: Array<{ definition?: string }>
}

/** Wiktionary uses "symbol" for glyph/notation senses rather than ordinary vocabulary. */
const SYMBOL_PART_OF_SPEECH = 'symbol'

function normalizePartOfSpeech(pos: string): string {
  return pos.trim().toLowerCase()
}

function isLinguisticPartOfSpeech(pos: string): boolean {
  return normalizePartOfSpeech(pos) !== SYMBOL_PART_OF_SPEECH
}

function isEnglishLanguage(language: string | undefined): boolean {
  const lang = (language ?? '').trim().toLowerCase()
  return !lang || lang === 'english'
}

function sanitizeText(value: unknown, max = MAX_TEXT_LEN): string | null {
  if (typeof value !== 'string') return null
  const cleaned = stripHtml(value)
  if (!cleaned) return null
  return cleaned.slice(0, max)
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLookupWord(word: string): string | null {
  const key = word.trim().toLowerCase()
  if (!key || key.length > MAX_WORD_LEN || !WORD_RE.test(key)) return null
  return key
}

function fromTwoLetterFallback(word: string): WordDefinition | null {
  const def = TWO_LETTER_DEFINITIONS[word.toUpperCase()]
  if (!def) return null
  return { word: word.toUpperCase(), senses: [{ partOfSpeech: 'noun', definition: def }] }
}

function fromApi(entries: DictionaryApiEntry[], fallbackWord: string): WordDefinition | null {
  const senses: DefinitionSense[] = []
  for (const entry of entries) {
    for (const meaning of entry.meanings ?? []) {
      const partOfSpeech = sanitizeText(meaning.partOfSpeech, 40) || 'unknown'
      if (!isLinguisticPartOfSpeech(partOfSpeech)) continue
      for (const item of meaning.definitions ?? []) {
        const definition = sanitizeText(item.definition)
        if (!definition) continue
        const example = sanitizeText(item.example) ?? undefined
        senses.push({ partOfSpeech: normalizePartOfSpeech(partOfSpeech), definition, example })
        if (senses.length >= 4) break
      }
      if (senses.length >= 4) break
    }
    if (senses.length >= 4) break
  }
  if (senses.length === 0) return null
  const word = sanitizeText(entries[0]?.word, MAX_WORD_LEN)?.toUpperCase() ?? fallbackWord.toUpperCase()
  const phonetic = sanitizeText(entries[0]?.phonetic, 80) ?? undefined
  return { word, phonetic, senses }
}

function fromWiktionary(payload: Record<string, WiktionarySenseGroup[]>, word: string): WordDefinition | null {
  if (!payload || typeof payload !== 'object') return null
  const groups = payload.en ?? []
  const senses: DefinitionSense[] = []
  const seen = new Set<string>()

  for (const group of groups) {
    if (!group || typeof group !== 'object') continue
    if (!isEnglishLanguage(group.language)) continue
    const partOfSpeech = sanitizeText(group.partOfSpeech, 40) || 'unknown'
    if (!isLinguisticPartOfSpeech(partOfSpeech)) continue
    for (const item of group.definitions ?? []) {
      const definition = item?.definition ? sanitizeText(item.definition) : null
      if (!definition || seen.has(definition)) continue
      seen.add(definition)
      senses.push({
        partOfSpeech: normalizePartOfSpeech(partOfSpeech),
        definition,
      })
      if (senses.length >= 4) break
    }
    if (senses.length >= 4) break
  }

  if (senses.length === 0) return null
  return { word: word.toUpperCase(), senses }
}

async function lookupFreeDictionary(word: string): Promise<WordDefinition | null> {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
  if (!res.ok) return null
  const data: unknown = await res.json()
  if (!Array.isArray(data)) return null
  return fromApi(data as DictionaryApiEntry[], word)
}

async function lookupWiktionary(word: string): Promise<WordDefinition | null> {
  const res = await fetch(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    },
  )
  if (!res.ok) return null
  const data: unknown = await res.json()
  if (!data || typeof data !== 'object') return null
  return fromWiktionary(data as Record<string, WiktionarySenseGroup[]>, word)
}

/**
 * Resolve a definition for a playable word.
 * Order: Free Dictionary API → Wiktionary → local two-letter glosses.
 */
export async function lookupDefinition(word: string): Promise<WordDefinition | null> {
  const key = normalizeLookupWord(word)
  if (!key) return null
  const cached = cache.get(key)
  if (cached) return cached

  try {
    const free = await lookupFreeDictionary(key)
    if (free) {
      cache.set(key, free)
      return free
    }
  } catch {
    // Try the next source.
  }

  try {
    const wiki = await lookupWiktionary(key)
    if (wiki) {
      cache.set(key, wiki)
      return wiki
    }
  } catch {
    // Try the next source.
  }

  const local = fromTwoLetterFallback(word)
  if (local) {
    cache.set(key, local)
    return local
  }

  return null
}
