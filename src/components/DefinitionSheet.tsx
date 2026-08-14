import { useEffect, useState } from 'react'
import { lookupDefinition, type WordDefinition } from '../game/definitions'

interface DefinitionSheetProps {
  word: string
  onClose: () => void
}

export function DefinitionSheet({ word, onClose }: DefinitionSheetProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [def, setDef] = useState<WordDefinition | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setDef(null)
    void lookupDefinition(word)
      .then((result) => {
        if (cancelled) return
        setDef(result)
        setStatus(result ? 'ready' : 'missing')
      })
      .catch(() => {
        if (!cancelled) setStatus('missing')
      })
    return () => {
      cancelled = true
    }
  }, [word])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="def-overlay" onClick={onClose} role="presentation">
      <div
        className="def-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="def-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="def-header">
          <div>
            <p className="def-kicker">Definition</p>
            <h3 id="def-title">{word}</h3>
            {def?.phonetic ? <p className="def-phonetic">{def.phonetic}</p> : null}
          </div>
          <button type="button" className="btn btn-ghost def-close" onClick={onClose} aria-label="Close definition">
            Close
          </button>
        </header>

        {status === 'loading' ? <p className="def-status">Looking up {word}…</p> : null}
        {status === 'missing' ? (
          <p className="def-status">No definition found for {word}.</p>
        ) : null}
        {status === 'ready' && def ? (
          <ol className="def-senses">
            {def.senses.map((sense, i) => (
              <li key={`${sense.partOfSpeech}-${i}`}>
                <span className="def-pos">{sense.partOfSpeech}</span>
                <p>{sense.definition}</p>
                {sense.example ? <p className="def-example">“{sense.example}”</p> : null}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  )
}
