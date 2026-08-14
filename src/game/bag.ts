import { TILE_DISTRIBUTION, RACK_SIZE } from './constants'
import { createTile } from './board'
import type { Tile } from './types'

export function createBag(): Tile[] {
  const tiles: Tile[] = []
  for (const [letter, count] of Object.entries(TILE_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      tiles.push(createTile(letter))
    }
  }
  return shuffle(tiles)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function drawTiles(bag: Tile[], count: number): { drawn: Tile[]; bag: Tile[] } {
  const drawn = bag.slice(0, count)
  return { drawn, bag: bag.slice(count) }
}

export function fillRack(rack: Tile[], bag: Tile[]): { rack: Tile[]; bag: Tile[] } {
  const need = RACK_SIZE - rack.length
  if (need <= 0) return { rack, bag }
  const { drawn, bag: nextBag } = drawTiles(bag, need)
  return { rack: [...rack, ...drawn], bag: nextBag }
}

export function canSwapFullRack(bag: Tile[]): boolean {
  return bag.length >= RACK_SIZE
}

export function swapFullRack(
  rack: Tile[],
  bag: Tile[],
): { rack: Tile[]; bag: Tile[] } | null {
  if (!canSwapFullRack(bag)) return null
  const returned = [...bag, ...rack]
  const shuffled = shuffle(returned)
  const { drawn, bag: nextBag } = drawTiles(shuffled, RACK_SIZE)
  return { rack: drawn, bag: nextBag }
}
