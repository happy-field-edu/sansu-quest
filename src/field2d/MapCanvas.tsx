import { useEffect, useRef } from 'react'
import type { WorldId } from '../types'
import { MAP_W, MAP_H, type WorldMap } from './map'
import { TILE, hash2 } from '../pixel/px'
import { grassTile, pathTile, waterTile, objTile, type ObjKind } from '../pixel/tiles'

// 地形を canvas に ドット絵で えがく。
// マップが とても ひろく なったので、マップ全体ではなく
// 「いま 画面に 見えている ぶんだけ」を えがく（カメラが うごくたびに 描きなおし）。
// こうしないと 48×181マスぶんの canvas が 大きすぎて タブレットで あふれる。
export default function MapCanvas({
  worldId,
  map,
  openGates,
  camX,
  camY,
  viewW,
  viewH,
}: {
  worldId: WorldId
  map: WorldMap
  openGates: string
  camX: number
  camY: number
  viewW: number
  viewH: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, viewW, viewH)

    const t = map.tiles
    const gates = new Set(openGates.split(',').filter(Boolean))
    const isPath = (x: number, y: number) => {
      const c = t[y]?.[x]
      return c === 'p' || c === 'G'
    }
    const isWater = (x: number, y: number) => t[y]?.[x] === 'w'
    const maskOf = (x: number, y: number, f: (x: number, y: number) => boolean) =>
      (f(x, y - 1) ? 1 : 0) | (f(x + 1, y) ? 2 : 0) | (f(x, y + 1) ? 4 : 0) | (f(x - 1, y) ? 8 : 0)

    // 見えている はんい（はしは 1マス よぶんに えがく）
    const x0 = Math.max(0, Math.floor(camX / TILE))
    const x1 = Math.min(MAP_W - 1, Math.ceil((camX + viewW) / TILE))
    const y0 = Math.max(0, Math.floor(camY / TILE))
    const y1 = Math.min(MAP_H - 1, Math.ceil((camY + viewH) / TILE))

    // タイル1マスに かさねて えがく「もの」
    const OBJ: Partial<Record<string, ObjKind>> = {
      t: 'tree',
      r: 'rock',
      h: 'house',
      s: 'sign',
      f: 'fence',
      d: 'deco',
      H: 'roofL',
      I: 'roofR',
      J: 'wallWin',
      K: 'wallDoor',
      '1': 'shopRoofL',
      '2': 'shopRoofR',
      '3': 'shopWin',
      '4': 'shopDoor',
      V: 'well',
      B: 'barrel',
      F: 'fire',
      L: 'crop',
      P: 'plaza',
    }

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const tile = t[y]?.[x]
        if (!tile) continue
        const px0 = x * TILE - camX
        const py0 = y * TILE - camY
        // ① 地面（草）は どこにでも しく
        ctx.drawImage(grassTile(worldId, Math.floor(hash2(x, y) * 8)), px0, py0)
        // ② そのうえに 道・水・ものを かさねる
        if (tile === 'p') {
          ctx.drawImage(pathTile(worldId, maskOf(x, y, isPath)), px0, py0)
        } else if (tile === 'w') {
          ctx.drawImage(waterTile(worldId, maskOf(x, y, isWater), Math.floor(hash2(x, y, 3) * 4)), px0, py0)
        } else if (tile === 'G') {
          ctx.drawImage(pathTile(worldId, maskOf(x, y, isPath)), px0, py0)
          ctx.drawImage(objTile(worldId, gates.has(String(y)) ? 'gateOpen' : 'gateShut'), px0, py0)
        } else {
          const obj = OBJ[tile]
          if (obj) ctx.drawImage(objTile(worldId, obj), px0, py0)
          // 'g'（草）'n'（NPC）'c'（宝箱）は 地面のまま。うえに スプライトが のる
        }
      }
    }
  }, [worldId, map, openGates, camX, camY, viewW, viewH])

  return (
    <canvas
      ref={ref}
      width={viewW}
      height={viewH}
      className="absolute top-0 left-0"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
