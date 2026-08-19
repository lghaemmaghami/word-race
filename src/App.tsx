import { StartScreen } from './components/StartScreen'
import { GameScreen } from './components/GameScreen'
import { EndScreen } from './components/EndScreen'
import { useGame } from './game/useGame'
import './App.css'

export default function App() {
  const game = useGame()

  if (game.screen === 'start') {
    return (
      <StartScreen
        dictReady={game.dictReady}
        dictError={game.dictError}
        onStart={game.startGame}
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
