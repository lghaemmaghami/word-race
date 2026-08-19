import { useState } from 'react'
import { StartScreen } from './components/StartScreen'
import { GameScreen } from './components/GameScreen'
import { EndScreen } from './components/EndScreen'
import { NameScreen } from './components/NameScreen'
import { useGame } from './game/useGame'
import { getPlayerName, setPlayerName as savePlayerName } from './game/leaderboard'
import './App.css'

export default function App() {
  const game = useGame()
  const [playerName, setPlayerName] = useState<string | null>(getPlayerName)

  if (!playerName) {
    return (
      <NameScreen
        onSubmit={(name) => {
          savePlayerName(name)
          setPlayerName(name)
        }}
      />
    )
  }

  if (game.screen === 'start') {
    return (
      <StartScreen
        dictReady={game.dictReady}
        dictError={game.dictError}
        onStart={game.startGame}
        playerName={playerName}
      />
    )
  }

  if (game.screen === 'end') {
    return (
      <EndScreen
        won={game.won}
        playerScore={game.playerScore}
        aiScore={game.aiScore}
        difficulty={game.difficulty}
        board={game.committedBoard}
        playedWords={game.playedWords}
        currentEntryId={game.currentEntryId}
        onPlayAgain={game.playAgain}
        onHome={game.backToStart}
      />
    )
  }

  return <GameScreen game={game} />
}
