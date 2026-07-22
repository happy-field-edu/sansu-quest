import type { SaveData, WorldId } from '../types'
import { WORLD_BY_ID } from '../data/worlds'
import { seeded, ZONE_NAMES } from './config2d'

// グリッドベースのタイルマップ。1ワールド＝縦にならんだ6つの学年ゾーン。
// 下（1年生）から上（6年生）へ すすんでいく。

export const MAP_W = 15 // マップの横はば（マス）
export const ZONE_H = 11 // 1ゾーンの高さ（マス）
export const MAP_H = ZONE_H * 6 + 1 // いちばん上に城壁1行
export const PATH_X = 7 // まんなかの道の列

// タイルの種類
// g=草 p=道 t=木 r=岩 h=家 s=かんばん f=さく G=もん(ゾーンの出入り口) d=かざり
// n=むらびと(NPC) w=水（あるけない）
export type Tile = 'g' | 'p' | 't' | 'r' | 'h' | 's' | 'f' | 'G' | 'd' | 'n' | 'w'

export interface Npc {
  x: number
  y: number
  emoji: string
  name: string
  lines: string[]
}

export interface FieldMonster {
  id: string // `${stageId}-p0` など
  stageId: string
  kind: 'practice' | 'boss'
  x: number
  y: number
  zoneTop: number // うろつき範囲（行）
  zoneBottom: number
}

export interface WorldMap {
  tiles: Tile[][] // [y][x]
  monsters: FieldMonster[]
  gateRows: { row: number; grade: number }[] // ゾーンgの出口（上へ）の行
  signs: { x: number; y: number; stageId: string }[]
  npcs: Npc[]
}

// 学年gのゾーンの行はんい（下=1年生）
export const zoneRows = (grade: number) => {
  const top = (6 - grade) * ZONE_H + 1
  return { top, bottom: top + ZONE_H - 1 }
}

export const gradeOfRow = (y: number) => Math.min(6, Math.max(1, 6 - Math.floor((y - 1) / ZONE_H)))

export function buildWorldMap(worldId: WorldId): WorldMap {
  const world = WORLD_BY_ID[worldId]
  const rand = seeded(worldId.length * 1013 + 77)
  const tiles: Tile[][] = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => 'g' as Tile))

  // そとわく（木）と いちばん上の城壁
  for (let y = 0; y < MAP_H; y++) {
    tiles[y][0] = 't'
    tiles[y][MAP_W - 1] = 't'
  }
  for (let x = 0; x < MAP_W; x++) {
    tiles[0][x] = 'f'
    tiles[MAP_H - 1][x] = 't'
  }

  // まんなかの道
  for (let y = 1; y < MAP_H - 1; y++) tiles[y][PATH_X] = 'p'

  // ゾーンざかいの さく＋もん（学年gの上のはし）
  const gateRows: WorldMap['gateRows'] = []
  for (let g = 1; g <= 5; g++) {
    const row = zoneRows(g).top
    for (let x = 1; x < MAP_W - 1; x++) tiles[row][x] = 'f'
    tiles[row][PATH_X] = 'G'
    gateRows.push({ row, grade: g })
  }

  // ゾーンごとの かざりつけ
  const signs: WorldMap['signs'] = []
  for (const stage of world.stages) {
    const { top, bottom } = zoneRows(stage.grade)
    // 木・岩・かざりを ばらまく（道と もんの前は あけておく）
    for (let i = 0; i < 14; i++) {
      const x = 1 + Math.floor(rand() * (MAP_W - 2))
      const y = top + 1 + Math.floor(rand() * (ZONE_H - 2))
      if (Math.abs(x - PATH_X) <= 1) continue // 道ぞいは あけておく
      if (tiles[y][x] !== 'g') continue
      const r = rand()
      tiles[y][x] = r < 0.55 ? 't' : r < 0.8 ? 'r' : 'd'
    }
    // 1年生ゾーンは村：家を2けん
    if (stage.grade === 1) {
      for (const hx of [3, 11]) {
        const hy = bottom - 3
        tiles[hy][hx] = 'h'
        tiles[hy][hx + 1] = 'h'
      }
    }
    // ゾーン入口の かんばん
    const sy = bottom - 1
    const sx = PATH_X - 2
    tiles[sy][sx] = 's'
    signs.push({ x: sx, y: sy, stageId: stage.id })

    // 2・4年生ゾーンには 小さな 池（あるけない）
    if (stage.grade === 2 || stage.grade === 4) {
      const wx = stage.grade === 2 ? 2 : MAP_W - 5
      const wy = top + 3
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 3; dx++) {
          if (tiles[wy + dy]?.[wx + dx] === 'g') tiles[wy + dy][wx + dx] = 'w'
        }
    }
  }

  // むらびと（NPC）：ぶつかる か Ⓐボタンで はなせる
  const npcs: Npc[] = []
  const placeNpc = (grade: number, x: number, dyFromBottom: number, emoji: string, name: string, lines: string[]) => {
    const y = zoneRows(grade).bottom - dyFromBottom
    if (tiles[y]?.[x] === undefined) return
    tiles[y][x] = 'n'
    npcs.push({ x, y, emoji, name, lines })
  }
  const z1 = ZONE_NAMES[world.stages[0].id]
  placeNpc(1, PATH_X - 2, 3, '👵', 'むらの おばあさん', [
    `ここは 1ねんせいの 「${z1}」だよ。`,
    'モンスターに ぶつかると たたかいが はじまるよ。まけても だいじょうぶ、けいけんちは もらえるからね。',
  ])
  placeNpc(1, PATH_X + 3, 6, '👨‍🌾', 'むらびと', [
    'そうびを つよくすると、ボスを たおすのに ひつような もんだいの かずが へるぞ！',
    'モンスターを たおして そうびを あつめるのじゃ。',
  ])
  placeNpc(3, PATH_X + 2, 4, '🧙', 'たびの けんじゃ', [
    '⚠️あかい わざは にがての しるし。れんしゅうバトルでは にがてな もんだいが でやすいぞ。',
    'きろくの ちからで じぶんの にがてを しろう！',
  ])
  placeNpc(5, PATH_X - 3, 5, '🧒', 'ぼうけんずきの 子', [
    'けいさんが むずかしいときは「どうぐ」の けいさんメモを つかうと いいよ。',
    'ゆびで ひっさんが かけるんだ！',
  ])

  // モンスター配置：各ゾーンに れんしゅう3体＋もんの前に ボス
  const monsters: FieldMonster[] = []
  for (const stage of world.stages) {
    const { top, bottom } = zoneRows(stage.grade)
    let placed = 0
    let guard = 0
    while (placed < 3 && guard < 200) {
      guard++
      const x = 1 + Math.floor(rand() * (MAP_W - 2))
      const y = top + 2 + Math.floor(rand() * (ZONE_H - 4))
      if (tiles[y][x] !== 'g' && tiles[y][x] !== 'p') continue
      if (y > bottom - 2 && Math.abs(x - PATH_X) <= 1) continue // スタートちかくは あけておく
      if (monsters.some((m) => m.x === x && m.y === y)) continue
      monsters.push({ id: `${stage.id}-p${placed}`, stageId: stage.id, kind: 'practice', x, y, zoneTop: top + 1, zoneBottom: bottom })
      placed++
    }
    // ボス：ゾーン出口（上のもん）の 1マス下で 道を ふさぐ
    const bossY = stage.grade === 6 ? zoneRows(6).top + 1 : zoneRows(stage.grade).top + 1
    monsters.push({ id: `${stage.id}-b`, stageId: stage.id, kind: 'boss', x: PATH_X, y: bossY, zoneTop: bossY, zoneBottom: bossY })
  }

  return { tiles, monsters, gateRows, signs, npcs }
}

// あるける タイルか。
// 木・岩・家・さく・水・立て札・NPCは あるけない（すり抜けなし）。
// もん(G)は 前の学年の大ボスを たおしていれば あるける。
export function isWalkable(map: WorldMap, save: SaveData, worldId: WorldId, x: number, y: number): boolean {
  if (x < 0 || y < 0 || y >= MAP_H || x >= MAP_W) return false
  const t = map.tiles[y][x]
  if (t === 'g' || t === 'p') return true
  if (t === 'G') {
    const gate = map.gateRows.find((g) => g.row === y)
    if (!gate) return false
    return save.cleared.includes(`${worldId}-${gate.grade}`)
  }
  return false
}

// スタート位置：いちばん すすんだ ゾーンの 入口
export function startPos(save: SaveData, worldId: WorldId): { x: number; y: number } {
  let maxZone = 1
  while (maxZone < 6 && save.cleared.includes(`${worldId}-${maxZone}`)) maxZone++
  return { x: PATH_X, y: zoneRows(maxZone).bottom - 1 }
}
