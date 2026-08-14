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

interface DictionaryApiMeaning {
  partOfSpeech?: string
  definitions?: Array<{ definition?: string; example?: string }>
}

interface DictionaryApiEntry {
  word?: string
  phonetic?: string
  meanings?: DictionaryApiMeaning[]
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
      for (const item of meaning.definitions ?? []) {
        if (!item.definition) continue
        senses.push({
          partOfSpeech: meaning.partOfSpeech || 'unknown',
          definition: item.definition,
          example: item.example,
        })
        if (senses.length >= 4) break
      }
      if (senses.length >= 4) break
    }
    if (senses.length >= 4) break
  }
  if (senses.length === 0) return null
  return {
    word: (entries[0]?.word ?? fallbackWord).toUpperCase(),
    phonetic: entries[0]?.phonetic,
    senses,
  }
}

export async function lookupDefinition(word: string): Promise<WordDefinition | null> {
  const key = word.trim().toLowerCase()
  if (!key) return null
  const cached = cache.get(key)
  if (cached) return cached

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`)
    if (res.ok) {
      const data = (await res.json()) as DictionaryApiEntry[]
      if (Array.isArray(data)) {
        const parsed = fromApi(data, word)
        if (parsed) {
          cache.set(key, parsed)
          return parsed
        }
      }
    }
  } catch {
    // Fall through to the local two-letter list.
  }

  const local = fromTwoLetterFallback(word)
  if (local) cache.set(key, local)
  return local
}
