import { useState } from 'react'

const MAX_NAME_LENGTH = 20
const VALID_NAME_RE = /^[A-Za-z0-9 _-]*$/

interface NameScreenProps {
  onSubmit: (name: string) => void
}

export function NameScreen({ onSubmit }: NameScreenProps) {
  const [name, setName] = useState('')
  const trimmed = name.trim()
  const isValid = trimmed.length > 0 && VALID_NAME_RE.test(trimmed)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= MAX_NAME_LENGTH && VALID_NAME_RE.test(value)) {
      setName(value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) onSubmit(trimmed)
  }

  return (
    <div className="screen start-screen">
      <div className="hero-glow" aria-hidden />
      <header className="brand-block">
        <h1 className="brand">Word Race</h1>
        <p className="tagline">Enter your name to join the leaderboard</p>
      </header>

      <form onSubmit={handleSubmit} className="name-form">
        <input
          type="text"
          className="name-input"
          placeholder="Your name"
          value={name}
          onChange={handleChange}
          maxLength={MAX_NAME_LENGTH}
          autoFocus
        />
        <p className="name-hint">Letters, numbers, spaces, hyphens, underscores only</p>
        <button type="submit" className="btn btn-primary" disabled={!isValid}>
          Continue
        </button>
      </form>
    </div>
  )
}
