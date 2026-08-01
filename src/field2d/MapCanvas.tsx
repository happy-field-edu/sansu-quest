import { useEffect, useRef } from 'react'
import type { WorldId } from '../types'
import { MAP_W, MAP_H, type WorldMap } from './map'
import { TILE, hash2 } from '../pixel/px'
import { grassTile, pathTile, waterTile, objTile } from '../pixel/tiles'

// マップ全体を 1まいの canvas に ドット絵で えがく。
// 3900マスぶんの <div> を やめる ことで 見た目も 動きも よくなる。
// えがきなおすのは ワールドが かわった ときと、もんが ひらいた ときだけ。
export default function MapCanvas({
  worldId,
  map,
  openGates,
}: {
  worldId: WorldId
  map: WorldMap
  openGates: string // ひらいた もんの キー（かわったら えがきなおす）
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const t = map.tiles
    const gates = new Set(openGates.split(',').filter(Boolean))
    // となりが おなじ なかまか（道・水の かたちを きめる）
    const isPath = (x: number, y: number) => {
      const c = t[y]?.[x]
      return c === 'p' || c === 'G'
    }
    const isWater = (x: number, y: number) => t[y]?.[x] === 'w'
    const maskOf = (x: number, y: number, f: (x: number, y: number) => boolean) =>
      (f(x, y - 1) ? 1 : 0) | (f(x + 1, y) ? 2 : 0) | (f(x, y + 1) ? 4 : 0) | (f(x - 1, y) ? 8 : 0)

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tile = t[y]?.[x]
        if (!tile) continue
        const px0 = x * TILE
        const py0 = y * TILE
        // ① 地面（草）は どこにでも しく
        ctx.drawImage(grassTile(worldId, Math.floor(hash2(x, y) * 8)), px0, py0)
        // ② そのうえに 道・水・ものを かさねる
        switch (tile) {
          case 'p':
            ctx.drawImage(pathTile(worldId, maskOf(x, y, isPath)), px0, py0)
            break
          case 'w':
            ctx.drawImage(waterTile(worldId, maskOf(x, y, isWater), Math.floor(hash2(x, y, 3) * 4)), px0, py0)
            break
          case 't':
            ctx.drawImage(objTile(worldId, 'tree'), px0, py0)
            break
          case 'r':
            ctx.drawImage(objTile(worldId, 'rock'), px0, py0)
            break
          case 'h':
            ctx.drawImage(objTile(worldId, 'house'), px0, py0)
            break
          case 's':
            ctx.drawImage(objTile(worldId, 'sign'), px0, py0)
            break
          case 'f':
            ctx.drawImage(objTile(worldId, 'fence'), px0, py0)
            break
          case 'd':
            ctx.drawImage(objTile(worldId, 'deco'), px0, py0)
            break
          case 'G': {
            // もんの 下は 道。たおしていれば アーチが ひらく
            ctx.drawImage(pathTile(worldId, maskOf(x, y, isPath)), px0, py0)
            const open = gates.has(String(y))
            ctx.drawImage(objTile(worldId, open ? 'gateOpen' : 'gateShut'), px0, py0)
            break
          }
          default:
            break // 'g'（草）'n'（NPC）'c'（宝箱）は 地面のまま。うえに スプライトが のる
        }
      }
    }
  }, [worldId, map, openGates])

  return (
    <canvas
      ref={ref}
      width={MAP_W * TILE}
      height={MAP_H * TILE}
      className="absolute top-0 left-0"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
