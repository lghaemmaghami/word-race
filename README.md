# Word Race

Single-player Scrabble-style word race against an AI on a shared 15×15 board.

## Play

```bash
npm install
npm run dev
```

Open the local URL, choose **Easy** or **Hard**, and race the clock.

## Rules (MVP)

- 90 seconds of active player time (pauses on AI turns)
- Full-board rearrange before submit; no locked tiles
- Delta scoring: `max(0, newBoardScore - previousBoardScore)`
- AI must move within 5 seconds or swap/pass
- Dictionary is ENABLE plus official Scrabble two-letter words (junk like IR/CS is rejected)
