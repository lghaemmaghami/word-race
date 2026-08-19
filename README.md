# Word Race

Single-player word race against an AI on a shared 15×15 board.

## Play

**Fixed URL:** https://lghaemmaghami.github.io/word-race/

Local:

```bash
npm install
npm run dev
```

Open the local URL, choose **Easy** or **Hard**, and race the clock.

## Rules (MVP)

- 90 or 180 seconds of active player time (pauses on AI turns)
- Game also ends when the bag is empty and a player has no tiles left to play
- Full-board rearrange before submit; no locked tiles
- Official Scrabble turn scoring: sum words formed/modified each turn; premiums on newly played tiles only; +50 bingo for using all 7 rack tiles; end-game rack adjustments
- AI must move within 5 seconds or swap/pass
- Dictionary is ENABLE plus the official two-letter word list (junk like IR/CS is rejected)
