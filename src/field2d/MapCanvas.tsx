import { useEffect, useRef } from 'react'
import type { WorldId } from '../types'
import { MAP_W, MAP_H, type WorldMap } from './map'
import { TILE, hash2 } from '../pixel/px'
import { grassTile, pathTile, waterTile, objTile, type ObjKind } from '../pixel/tiles'

// 地形を canvas に ドット絵で えがく。
//
// マップが とても ひろい（48×181マス）ので、マップ全体を 1まいの canvas に
// えがくと タブレットの上限を こえてしまう。そこで
// 「いま 見えている ところ＋まわり2マス」だけの canvas を つくり、
// それを マップの中の 正しい いちに おく。
// この canvas は ゆうしゃ達と おなじ「うごく入れもの」の中に あるので、
// カメラが なめらかに うごくと 地形も いっしょに なめらかに うごく
//（canvas だけ 先に とんでしまうと、ゆうしゃが 1歩ごとに はねて 見える）。
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

  // えがく まどの 左上（マスの めに そろえて、まわりに よゆうを とる）
  const drawX = Math.floor(camX / TILE) * TILE - TILE * 2
  const drawY = Math.floor(camY / TILE) * TILE - TILE * 2
  // 画面ぶん＋前後2マスずつ（カメラが なめらかに うごく あいだも きれない ように）
  const cw = viewW + TILE * 4
  const ch = viewH + TILE * 4

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, cw, ch)

    const t = map.tiles
    const gates = new Set(openGates.split(',').filter(Boolean))
    const isPath = (x: number, y: number) => {
      const c = t[y]?.[x]
      return c === 'p' || c === 'G'
    }
    const isWater = (x: number, y: number) => t[y]?.[x] === 'w'
    const maskOf = (x: number, y: number, f: (x: number, y: number) => boolean) =>
      (f(x, y - 1) ? 1 : 0) | (f(x + 1, y) ? 2 : 0) | (f(x, y + 1) ? 4 : 0) | (f(x - 1, y) ? 8 : 0)

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

    const tx0 = Math.floor(drawX / TILE)
    const ty0 = Math.floor(drawY / TILE)
    const cols = Math.ceil(cw / TILE)
    const rows = Math.ceil(ch / TILE)

    for (let ry = 0; ry < rows; ry++) {
      const y = ty0 + ry
      if (y < 0 || y >= MAP_H) continue
      for (let rx = 0; rx < cols; rx++) {
        const x = tx0 + rx
        if (x < 0 || x >= MAP_W) continue
        const tile = t[y]?.[x]
        if (!tile) continue
        const px0 = rx * TILE
        const py0 = ry * TILE
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
  }, [worldId, map, openGates, drawX, drawY, cw, ch])

  return (
    <canvas
      ref={ref}
      width={cw}
      height={ch}
      className="absolute"
      style={{ left: drawX, top: drawY, imageRendering: 'pixelated' }}
    />
  )
}
