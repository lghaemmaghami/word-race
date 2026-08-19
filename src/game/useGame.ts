import { useCallback, useEffect, useRef, useState } from 'react'
import { canSwapFullRack, createBag, fillRack, noTilesLeftToPlay, shuffle, swapFullRack } from './bag'
import { boardTileIds, cloneBoard, emptyBoard, findTileOnBoard, resetTileSeq } from './board'
import { PLAYER_TIME_OPTIONS_MS, DEFAULT_PLAYER_TIME_SECONDS, PLAYER_TIME_MS, letterValue } from './constants'
import { dictionary } from './dictionary'
import { runAiTurn } from './ai'
import { getPlayerName, saveLeaderboardEntry } from './leaderboard'
import { listWordsCompletedByTiles } from './scoring'
import { validateSubmission } from './validation'
import type { AiMoveSummary, Board, Difficulty, PlayedWord, Tile, TileOwner, TimeLimitSeconds } from './types'

export type Screen = 'start' | 'game' | 'end'

function collectLooseTiles(board: Board, committed: Board): Tile[] {
  const committedIds = boardTileIds(committed)
  const loose: Tile[] = []
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const t = board[r][c]
      if (t && !committedIds.has(t.id)) loose.push(t)
    }
  }
  return loose
}

function mergeRack(rack: Tile[], extras: Tile[]): Tile[] {
  const ids = new Set(rack.map((t) => t.id))
  const next = [...rack]
  for (const t of extras) {
    if (!ids.has(t.id)) next.push(t)
  }
  return next
}

function wordsCompletedThisPlay(board: Board, previousBoard: Board, by: TileOwner): PlayedWord[] {
  const prevIds = boardTileIds(previousBoard)
  const newIds = new Set<string>()
  for (const row of board) {
    for (const cell of row) {
      if (cell && !prevIds.has(cell.id)) newIds.add(cell.id)
    }
  }
  return listWordsCompletedByTiles(board, newIds).map((w) => ({ ...w, by }))
}

export function useGame() {
  const [screen, setScreen] = useState<Screen>('start')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<TimeLimitSeconds>(DEFAULT_PLAYER_TIME_SECONDS)
  const [dictReady, setDictReady] = useState(dictionary.loaded)
  const [dictError, setDictError] = useState<string | null>(null)

  const [board, setBoard] = useState<Board>(() => emptyBoard())
  const [committedBoard, setCommittedBoard] = useState<Board>(() => emptyBoard())
  const [playerRack, setPlayerRack] = useState<Tile[]>([])
  const [aiRack, setAiRack] = useState<Tile[]>([])
  const [bag, setBag] = useState<Tile[]>([])
  const [previousBoardScore, setPreviousBoardScore] = useState(0)
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [timeLeftMs, setTimeLeftMs] = useState<number>(PLAYER_TIME_MS)
  const [turn, setTurn] = useState<'player' | 'ai'>('player')
  const [aiSummary, setAiSummary] = useState<AiMoveSummary | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [rackTileIdsThisTurn, setRackTileIdsThisTurn] = useState<Set<string>>(() => new Set())
  const [won, setWon] = useState(false)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [playedWords, setPlayedWords] = useState<PlayedWord[]>([])

  const endingRef = useRef(false)
  const aiBusy = useRef(false)
  const playerRackRef = useRef(playerRack)
  const stateRef = useRef({
    board,
    committedBoard,
    playerRack,
    aiRack,
    bag,
    previousBoardScore,
    playerScore,
    aiScore,
    difficulty,
  })

  playerRackRef.current = playerRack
  stateRef.current = {
    board,
    committedBoard,
    playerRack,
    aiRack,
    bag,
    previousBoardScore,
    playerScore,
    aiScore,
    difficulty,
  }

  useEffect(() => {
    let cancelled = false
    void dictionary
      .load()
      .then(() => {
        if (!cancelled) {
          setDictReady(dictionary.size > 0)
          if (dictionary.size === 0) {
            setDictError('Dictionary failed to load')
          }
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setDictError(e.message || 'Dictionary failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const endGame = useCallback((pScore: number, aScore: number, diff: Difficulty) => {
    if (endingRef.current) return
    endingRef.current = true
    const playerWon = pScore > aScore
    setWon(playerWon)
    const saved = saveLeaderboardEntry({
      date: new Date().toISOString(),
      playerName: getPlayerName() ?? 'Unknown',
      playerScore: pScore,
      aiScore: aScore,
      difference: pScore - aScore,
      won: playerWon,
      difficulty: diff,
    })
    setCurrentEntryId(saved?.id ?? null)
    setTurn('player')
    setBoard(cloneBoard(stateRef.current.committedBoard))
    setScreen('end')
  }, [])

  useEffect(() => {
    if (screen !== 'game' || turn !== 'player') return
    const id = window.setInterval(() => {
      setTimeLeftMs((t) => Math.max(0, t - 100))
    }, 100)
    return () => window.clearInterval(id)
  }, [screen, turn])

  useEffect(() => {
    if (screen === 'game' && timeLeftMs <= 0 && !endingRef.current) {
      endGame(playerScore, aiScore, difficulty)
    }
  }, [timeLeftMs, screen, playerScore, aiScore, difficulty, endGame])

  useEffect(() => {
    if (screen !== 'game' || turn !== 'player' || endingRef.current) return
    const loose = collectLooseTiles(board, committedBoard)
    if (noTilesLeftToPlay(playerRack, bag) && loose.length === 0) {
      endGame(playerScore, aiScore, difficulty)
    }
  }, [screen, turn, playerRack, bag, board, committedBoard, playerScore, aiScore, difficulty, endGame])

  const beginPlayerTurn = useCallback((rack: Tile[]) => {
    setRackTileIdsThisTurn(new Set(rack.map((t) => t.id)))
    setSelectedTileId(null)
    setSelectedCell(null)
    setTurn('player')
  }, [])

  const handOffToPlayerOrEnd = useCallback(
    (playerRack: Tile[], nextBag: Tile[], pScore: number, aScore: number, diff: Difficulty) => {
      if (noTilesLeftToPlay(playerRack, nextBag)) {
        endGame(pScore, aScore, diff)
        return
      }
      beginPlayerTurn(playerRack)
    },
    [beginPlayerTurn, endGame],
  )

  const runAi = useCallback(
    async (snapshot: {
      board: Board
      aiRack: Tile[]
      bag: Tile[]
      previousBoardScore: number
      aiScore: number
      playerScore: number
      difficulty: Difficulty
      playerRack: Tile[]
    }) => {
      if (aiBusy.current || endingRef.current) return
      if (noTilesLeftToPlay(snapshot.aiRack, snapshot.bag)) {
        handOffToPlayerOrEnd(
          snapshot.playerRack,
          snapshot.bag,
          snapshot.playerScore,
          snapshot.aiScore,
          snapshot.difficulty,
        )
        return
      }
      aiBusy.current = true
      setTurn('ai')
      setMessage('AI is thinking…')
      await new Promise((r) => setTimeout(r, 40))

      try {
        const result = runAiTurn({
          board: snapshot.board,
          rack: snapshot.aiRack,
          dict: dictionary,
          previousBoardScore: snapshot.previousBoardScore,
          difficulty: snapshot.difficulty,
        })

        if (result.type === 'play') {
          let nextBag = snapshot.bag
          let nextRack = result.move.rack
          ;({ rack: nextRack, bag: nextBag } = fillRack(nextRack, nextBag))
          const nextAiScore = snapshot.aiScore + result.move.moveScore
          setBoard(result.move.board)
          setCommittedBoard(cloneBoard(result.move.board))
          setPreviousBoardScore(result.move.boardScore)
          setPlayedWords((prev) => [
            ...prev,
            ...wordsCompletedThisPlay(result.move.board, snapshot.board, 'ai'),
          ])
          setAiRack(nextRack)
          setBag(nextBag)
          setAiScore(nextAiScore)
          setAiSummary({
            type: 'play',
            word: result.move.word,
            score: result.move.moveScore,
            detail: `AI played ${result.move.word} for +${result.move.moveScore}`,
          })
          setMessage(null)
          if (noTilesLeftToPlay(nextRack, nextBag)) {
            endGame(snapshot.playerScore, nextAiScore, snapshot.difficulty)
            return
          }
          handOffToPlayerOrEnd(
            snapshot.playerRack,
            nextBag,
            snapshot.playerScore,
            nextAiScore,
            snapshot.difficulty,
          )
          return
        }

        if (canSwapFullRack(snapshot.bag)) {
          const swapped = swapFullRack(snapshot.aiRack, snapshot.bag)
          if (swapped) {
            setAiRack(swapped.rack)
            setBag(swapped.bag)
            setAiSummary({ type: 'swap', detail: 'AI swapped its full rack' })
            setMessage(null)
            handOffToPlayerOrEnd(
              snapshot.playerRack,
              swapped.bag,
              snapshot.playerScore,
              snapshot.aiScore,
              snapshot.difficulty,
            )
            return
          }
        }

        setAiSummary({ type: 'pass', detail: 'AI passed' })
        setMessage(null)
        handOffToPlayerOrEnd(
          snapshot.playerRack,
          snapshot.bag,
          snapshot.playerScore,
          snapshot.aiScore,
          snapshot.difficulty,
        )
      } finally {
        aiBusy.current = false
      }
    },
    [endGame, handOffToPlayerOrEnd],
  )

  const startGame = useCallback(
    (d: Difficulty, limit: TimeLimitSeconds = DEFAULT_PLAYER_TIME_SECONDS) => {
      if (!dictionary.loaded) return
      resetTileSeq()
      endingRef.current = false
      aiBusy.current = false
      let nextBag = createBag()
      let pRack: Tile[] = []
      let aRack: Tile[] = []
      ;({ rack: pRack, bag: nextBag } = fillRack([], nextBag))
      ;({ rack: aRack, bag: nextBag } = fillRack([], nextBag))
      const blank = emptyBoard()
      setDifficulty(d)
      setTimeLimitSeconds(limit)
      setBag(nextBag)
      setPlayerRack(pRack)
      setAiRack(aRack)
      setBoard(blank)
      setCommittedBoard(blank)
      setPreviousBoardScore(0)
      setPlayerScore(0)
      setAiScore(0)
      setTimeLeftMs(PLAYER_TIME_OPTIONS_MS[limit])
      setAiSummary(null)
      setMessage('Cover the centre square on your first submit.')
      setPlayedWords([])
      setScreen('game')
      beginPlayerTurn(pRack)
    },
    [beginPlayerTurn],
  )

  const submit = useCallback(() => {
    if (turn !== 'player' || screen !== 'game') return
    const s = stateRef.current

    const result = validateSubmission({
      workingBoard: s.board,
      committedBoard: s.committedBoard,
      previousBoardScore: s.previousBoardScore,
      dict: dictionary,
      rackTileIdsThisTurn,
    })

    if (!result.ok) {
      setMessage(result.reason ?? 'Invalid submission')
      return
    }

    const gained = result.moveScore ?? 0
    const newPlayerScore = s.playerScore + gained
    const banked = result.boardScore ?? s.previousBoardScore
    setPlayerScore(newPlayerScore)
    setCommittedBoard(cloneBoard(s.board))
    setPreviousBoardScore(banked)
    setPlayedWords((prev) => [...prev, ...wordsCompletedThisPlay(s.board, s.committedBoard, 'player')])
    setMessage(gained > 0 ? `+${gained} points` : 'Board valid — no score gain')
    setSelectedTileId(null)
    setSelectedCell(null)

    const onBoard = boardTileIds(s.board)
    const remainingRack = s.playerRack.filter((t) => !onBoard.has(t.id))
    const { rack: filled, bag: nextBag } = fillRack(remainingRack, s.bag)
    setPlayerRack(filled)
    setBag(nextBag)

    if (noTilesLeftToPlay(filled, nextBag)) {
      endGame(newPlayerScore, s.aiScore, s.difficulty)
      return
    }

    void runAi({
      board: s.board,
      aiRack: s.aiRack,
      bag: nextBag,
      previousBoardScore: banked,
      aiScore: s.aiScore,
      playerScore: newPlayerScore,
      difficulty: s.difficulty,
      playerRack: filled,
    })
  }, [turn, screen, rackTileIdsThisTurn, runAi, endGame])

  const recall = useCallback(() => {
    if (turn !== 'player') return
    const s = stateRef.current
    const loose = collectLooseTiles(s.board, s.committedBoard)
    setBoard(cloneBoard(s.committedBoard))
    setPlayerRack(mergeRack(s.playerRack, loose))
    setSelectedTileId(null)
    setSelectedCell(null)
    setMessage('Recalled to last valid board')
  }, [turn])

  const shuffleRack = useCallback(() => {
    if (turn !== 'player') return
    setPlayerRack((r) => shuffle(r))
  }, [turn])

  const swapRack = useCallback(() => {
    if (turn !== 'player' || screen !== 'game') return
    const s = stateRef.current
    if (!canSwapFullRack(s.bag)) {
      setMessage('Need at least 7 tiles in the bag to swap')
      return
    }
    const loose = collectLooseTiles(s.board, s.committedBoard)
    const fullRack = mergeRack(s.playerRack, loose)
    const restored = cloneBoard(s.committedBoard)
    setBoard(restored)
    const swapped = swapFullRack(fullRack, s.bag)
    if (!swapped) {
      setMessage('Cannot swap right now')
      return
    }
    setPlayerRack(swapped.rack)
    setBag(swapped.bag)
    setSelectedTileId(null)
    setSelectedCell(null)
    setMessage('Swapped rack — turn forfeited')
    setAiSummary(null)

    void runAi({
      board: restored,
      aiRack: s.aiRack,
      bag: swapped.bag,
      previousBoardScore: s.previousBoardScore,
      aiScore: s.aiScore,
      playerScore: s.playerScore,
      difficulty: s.difficulty,
      playerRack: swapped.rack,
    })
  }, [turn, screen, runAi])

  const returnUncommittedToRack = useCallback((tileId: string): boolean => {
    if (turn !== 'player') return false
    const s = stateRef.current
    if (boardTileIds(s.committedBoard).has(tileId)) return false
    const loc = findTileOnBoard(s.board, tileId)
    if (!loc) return false
    const tile = s.board[loc.row][loc.col]
    if (!tile) return false

    const next = cloneBoard(s.board)
    next[loc.row][loc.col] = null
    setBoard(next)
    setPlayerRack(mergeRack(s.playerRack, [tile]))
    setSelectedTileId(null)
    setSelectedCell(null)
    setMessage(null)
    return true
  }, [turn])

  const selectRackTile = useCallback(
    (id: string) => {
      if (turn !== 'player') return
      if (selectedTileId && returnUncommittedToRack(selectedTileId)) return
      setSelectedTileId((cur) => (cur === id ? null : id))
      setSelectedCell(null)
    },
    [turn, selectedTileId, returnUncommittedToRack],
  )

  const returnSelectedToRack = useCallback(() => {
    if (!selectedTileId) return
    returnUncommittedToRack(selectedTileId)
  }, [selectedTileId, returnUncommittedToRack])

  const selectCell = useCallback(
    (row: number, col: number) => {
      if (turn !== 'player') return
      const s = stateRef.current
      const cell = s.board[row][col]

      if (selectedTileId) {
        if (cell && cell.id === selectedTileId) {
          if (!returnUncommittedToRack(cell.id)) {
            setSelectedTileId(null)
            setSelectedCell(null)
          }
          return
        }

        if (cell) {
          setMessage('That square already has a tile')
          return
        }

        const fromRack = s.playerRack.find((t) => t.id === selectedTileId)
        const fromBoard = findTileOnBoard(s.board, selectedTileId)
        const next = cloneBoard(s.board)
        let nextRack = [...s.playerRack]

        if (fromRack) {
          nextRack = nextRack.filter((t) => t.id !== selectedTileId)
          next[row][col] = fromRack
        } else if (fromBoard) {
          next[row][col] = s.board[fromBoard.row][fromBoard.col]
          next[fromBoard.row][fromBoard.col] = null
        } else {
          return
        }

        setBoard(next)
        setPlayerRack(nextRack)
        setSelectedTileId(null)
        setSelectedCell(null)
        setMessage(null)
        return
      }

      if (cell) {
        setSelectedTileId(cell.id)
        setSelectedCell({ row, col })
      } else {
        setSelectedCell({ row, col })
      }
    },
    [turn, selectedTileId, returnUncommittedToRack],
  )

  const playAgain = useCallback(
    () => startGame(difficulty, timeLimitSeconds),
    [startGame, difficulty, timeLimitSeconds],
  )
  const backToStart = useCallback(() => {
    endingRef.current = false
    setScreen('start')
  }, [])

  return {
    screen,
    difficulty,
    timeLimitSeconds,
    dictReady,
    dictError,
    board,
    committedBoard,
    playerRack,
    selectedTileId,
    selectedCell,
    playerScore,
    aiScore,
    timeLeftMs,
    turn,
    aiSummary,
    message,
    bagCount: bag.length,
    won,
    currentEntryId,
    playedWords,
    startGame,
    selectRackTile,
    selectCell,
    returnSelectedToRack,
    submit,
    recall,
    shuffleRack,
    swapRack,
    playAgain,
    backToStart,
    letterValue,
  }
}
