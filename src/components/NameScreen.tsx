import { useState } from 'react'

interface NameScreenProps {
  onSubmit: (name: string) => void
}

export function NameScreen({ onSubmit }: NameScreenProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length > 0) onSubmit(trimmed)
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
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={name.trim().length === 0}>
          Continue
        </button>
      </form>
    </div>
  )
}
