import type { SaveData, WorldId } from '../types'
import { WORLD_BY_ID } from '../data/worlds'
import { seeded, ZONE_NAMES } from './config2d'

// グリッドベースのタイルマップ。1ワールド＝縦にならんだ6つの学年ゾーン。
// 下（1年生）から上（6年生）へ すすんでいく。
// 1ゾーン＝「村（集落）」＋「野原（モンスターがいる)」＋「大ボスの門」。

export const MAP_W = 48 // マップの横はば（マス）
export const ZONE_H = 30 // 1ゾーンの高さ（マス）
export const MAP_H = ZONE_H * 6 + 1 // いちばん上に城壁1行
export const PATH_X = 24 // まんなかの道の列
export const VILLAGE_H = 14 // ゾーンの下がわ 14行が 村

// タイルの種類
// g=草 p=道 t=木 r=岩 h=家(小) s=かんばん f=さく G=もん(ゾーンの出入り口) d=かざり
// n=むらびと(NPC) w=水（あるけない） c=宝箱
// ---- 村（集落）----
// H=屋根左 I=屋根右 J=かべ(窓) K=かべ(扉)   ※ふつうの家（2×2マス）
// 1=屋根左 2=屋根右 3=かべ(窓) 4=かべ(扉)   ※どうぐや（2×2マス）
// P=石だたみ（あるける） V=井戸 B=たる F=かがり火 L=はたけ
export type Tile =
  | 'g' | 'p' | 't' | 'r' | 'h' | 's' | 'f' | 'G' | 'd' | 'n' | 'w' | 'c'
  | 'H' | 'I' | 'J' | 'K' | '1' | '2' | '3' | '4'
  | 'P' | 'V' | 'B' | 'F' | 'L'

export interface Npc {
  x: number
  y: number
  emoji: string
  name: string
  lines: string[]
}

// どうぐやの 入口（この タイルに ぶつかると お店が ひらく）
export interface ShopDoor {
  x: number
  y: number
  stageId: string
}

// 宝箱：ふれると そうびが 手にはいる（1回きり。あけたかは セーブに のこる）
export interface Chest {
  id: string
  x: number
  y: number
  itemId: string
  stageId: string
}

export interface FieldMonster {
  id: string
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
  gateRows: { row: number; grade: number }[]
  signs: { x: number; y: number; stageId: string }[]
  npcs: Npc[]
  chests: Chest[]
  shops: ShopDoor[]
}

// 学年gのゾーンの行はんい（下=1年生）
export const zoneRows = (grade: number) => {
  const top = (6 - grade) * ZONE_H + 1
  return { top, bottom: top + ZONE_H - 1 }
}

export const gradeOfRow = (y: number) => Math.min(6, Math.max(1, 6 - Math.floor((y - 1) / ZONE_H)))

// 村（集落）の 行はんい。ここは モンスターが 入ってこない 安全地帯。
export const villageRows = (grade: number) => {
  const { bottom } = zoneRows(grade)
  return { vTop: bottom - VILLAGE_H, vBottom: bottom - 1 }
}

export function buildWorldMap(worldId: WorldId): WorldMap {
  const world = WORLD_BY_ID[worldId]
  const rand = seeded(worldId.length * 1013 + 77)
  const tiles: Tile[][] = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => 'g' as Tile))

  const put = (x: number, y: number, t: Tile) => {
    if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) tiles[y][x] = t
  }
  const at = (x: number, y: number): Tile | undefined => tiles[y]?.[x]

  // そとわく（木）と いちばん上の城壁
  for (let y = 0; y < MAP_H; y++) {
    tiles[y][0] = 't'
    tiles[y][MAP_W - 1] = 't'
  }
  for (let x = 0; x < MAP_W; x++) {
    tiles[0][x] = 'f'
    tiles[MAP_H - 1][x] = 't'
  }

  // まんなかの道（村から ボスの門まで まっすぐ）
  for (let y = 1; y < MAP_H - 1; y++) tiles[y][PATH_X] = 'p'

  // ゾーンざかいの さく＋もん
  const gateRows: WorldMap['gateRows'] = []
  for (let g = 1; g <= 5; g++) {
    const row = zoneRows(g).top
    for (let x = 1; x < MAP_W - 1; x++) tiles[row][x] = 'f'
    tiles[row][PATH_X] = 'G'
    gateRows.push({ row, grade: g })
  }

  const signs: WorldMap['signs'] = []
  const npcs: Npc[] = []
  const shops: ShopDoor[] = []

  // ---- 2×2マスの たてもの を おく ----
  const house = (x: number, y: number, shop = false) => {
    put(x, y, shop ? '1' : 'H')
    put(x + 1, y, shop ? '2' : 'I')
    put(x, y + 1, shop ? '3' : 'J')
    put(x + 1, y + 1, shop ? '4' : 'K')
  }

  for (const stage of world.stages) {
    const { top } = zoneRows(stage.grade)
    const { vTop } = villageRows(stage.grade)
    const g = stage.grade

    // ==========================================================
    // ① 野原（村の 上）：森・岩場・川・わき道・モンスターの すみか
    // ==========================================================
    const fieldTop = top + 1
    const fieldBottom = vTop - 1

    // わき道（左右へ のびる 横道。ぐるっと まわれる）
    const branchY1 = fieldTop + 3
    const branchY2 = fieldBottom - 3
    for (let x = 5; x < MAP_W - 5; x++) {
      if (at(x, branchY1) === 'g') put(x, branchY1, 'p')
      if (at(x, branchY2) === 'g') put(x, branchY2, 'p')
    }
    for (let y = branchY1; y <= branchY2; y++) {
      if (at(5, y) === 'g') put(5, y, 'p')
      if (at(MAP_W - 6, y) === 'g') put(MAP_W - 6, y, 'p')
    }

    // 川（よこ切り）＋ はし：まわり道が いる しかけ
    if (g % 2 === 0) {
      const riverY = fieldTop + Math.floor((fieldBottom - fieldTop) / 2)
      for (let x = 1; x < MAP_W - 1; x++) {
        if (x === PATH_X || x === 5 || x === MAP_W - 6) continue // はし
        if (at(x, riverY) === 'g' || at(x, riverY) === 'p') put(x, riverY, 'w')
      }
    }

    // 森・岩場（かたまりで おく と 地形らしく なる）
    for (let i = 0; i < 22; i++) {
      const cx = 2 + Math.floor(rand() * (MAP_W - 4))
      const cy = fieldTop + 1 + Math.floor(rand() * Math.max(1, fieldBottom - fieldTop - 1))
      const kind: Tile = rand() < 0.62 ? 't' : 'r'
      const size = 3 + Math.floor(rand() * 4)
      for (let d = 0; d < size; d++) {
        const x = cx + Math.floor(rand() * 3) - 1
        const y = cy + Math.floor(rand() * 3) - 1
        if (x < 1 || x >= MAP_W - 1 || y <= fieldTop || y >= fieldBottom) continue
        if (Math.abs(x - PATH_X) <= 1) continue // 中央の道は あけておく
        if (at(x, y) !== 'g') continue
        put(x, y, kind)
      }
    }
    // かざり（花・水晶など）
    for (let i = 0; i < 16; i++) {
      const x = 1 + Math.floor(rand() * (MAP_W - 2))
      const y = fieldTop + 1 + Math.floor(rand() * Math.max(1, fieldBottom - fieldTop))
      if (at(x, y) === 'g') put(x, y, 'd')
    }

    // ==========================================================
    // ② 村（集落）：ひろば・井戸・かがり火・家4けん・どうぐや・はたけ
    // ==========================================================
    // 村の 入口（野原との さかい）に さくを ならべ、まん中だけ あける
    for (let x = 2; x < MAP_W - 2; x++) {
      if (Math.abs(x - PATH_X) <= 1) continue
      if (at(x, vTop) === 'g') put(x, vTop, 'f')
    }

    // ---- 村の 通り（よこ2本＋たて2本。ぐるっと まわれる） ----
    const road = (x: number, y: number) => {
      if (at(x, y) === 'g') put(x, y, 'p')
    }
    for (let x = 4; x <= MAP_W - 5; x++) {
      road(x, vTop + 4)
      road(x, vTop + 10)
    }
    for (let y = vTop + 4; y <= vTop + 13; y++) {
      road(PATH_X - 14, y)
      road(PATH_X + 15, y)
    }

    // ---- 中央ひろば（石だたみ） ----
    for (let y = vTop + 6; y <= vTop + 9; y++) {
      for (let x = PATH_X - 4; x <= PATH_X + 4; x++) put(x, y, 'P')
    }
    put(PATH_X - 3, vTop + 7, 'V') // 井戸
    put(PATH_X + 3, vTop + 7, 'F') // かがり火
    put(PATH_X - 3, vTop + 9, 'B') // たる
    put(PATH_X + 3, vTop + 9, 'B')
    for (let y = vTop + 5; y <= vTop + 10; y++) put(PATH_X, y, 'P') // まん中の 道は とおれる

    // ---- たてもの（2×2）。入口は 右下のマス、その 下に 小道を つける ----
    const building = (bx: number, by: number, shop = false) => {
      house(bx, by, shop)
      for (let y = by + 2; y <= by + 3; y++) road(bx + 1, y) // 入口から 通りへ
      if (shop) shops.push({ x: bx + 1, y: by + 1, stageId: stage.id })
    }
    building(PATH_X - 17, vTop + 1) // 家A
    building(PATH_X - 17, vTop + 7) // 家B
    building(PATH_X - 10, vTop + 11) // 家C
    building(PATH_X + 14, vTop + 1) // 家D
    building(PATH_X + 14, vTop + 7, true) // どうぐや（赤い屋根）
    building(PATH_X + 8, vTop + 11) // 家E
    building(PATH_X - 9, vTop + 1) // 家F（入口ちかく）

    // ---- はたけ（村の 左はし） ----
    for (let y = vTop + 6; y <= vTop + 9; y++) {
      for (let x = 3; x <= 6; x++) if (at(x, y) === 'g') put(x, y, 'L')
    }

    // ---- 村らしい こもの（たる・木）を すきまに ちらす ----
    for (const [bx, by] of [
      [PATH_X - 15, vTop + 5],
      [PATH_X + 13, vTop + 5],
      [PATH_X - 6, vTop + 12],
      [PATH_X + 5, vTop + 12],
      [PATH_X + 12, vTop + 12],
    ] as [number, number][]) {
      if (at(bx, by) === 'g') put(bx, by, 'B')
    }
    for (const [tx, ty] of [
      [2, vTop + 2],
      [2, vTop + 12],
      [MAP_W - 3, vTop + 3],
      [MAP_W - 3, vTop + 12],
      [PATH_X - 6, vTop + 2],
      [PATH_X + 5, vTop + 2],
      [PATH_X - 20, vTop + 11],
      [PATH_X + 19, vTop + 11],
    ] as [number, number][]) {
      if (at(tx, ty) === 'g') put(tx, ty, 't')
    }

    // 村の かんばん（入口の よこ）
    const sy = vTop + 1
    const sx = PATH_X - 3
    if (at(sx, sy) === 'g' || at(sx, sy) === 'p') {
      put(sx, sy, 's')
      signs.push({ x: sx, y: sy, stageId: stage.id })
    }
    // 野原の かんばん
    const sx2 = 6
    const sy2 = branchY1 + 1
    if (at(sx2, sy2) === 'g') {
      put(sx2, sy2, 's')
      signs.push({ x: sx2, y: sy2, stageId: stage.id })
    }
  }

  // ==========================================================
  // むらびと（NPC）：村の ひろばの まわりに 立たせる
  // ==========================================================
  const placeNpc = (grade: number, dx: number, dyFromVTop: number, emoji: string, name: string, lines: string[]) => {
    const { vTop } = villageRows(grade)
    const x = PATH_X + dx
    const y = vTop + dyFromVTop
    if (at(x, y) === undefined) return
    put(x, y, 'n')
    npcs.push({ x, y, emoji, name, lines })
  }
  const z1 = ZONE_NAMES[world.stages[0].id]
  placeNpc(1, -2, 7, '👵', 'むらの おばあさん', [
    `ここは 1ねんせいの 村「${z1}」だよ。`,
    '村の 中は あんぜん。モンスターは 北の 野原に いるからね。',
    'まけても だいじょうぶ、けいけんちは もらえるからね。',
  ])
  placeNpc(1, 2, 9, '👨‍🌾', 'むらびと', [
    'そうびを つよくすると、ボスを たおすのに ひつような もんだいの かずが へるぞ！',
    'モンスターを たおすと 🪙コインが もらえる。\n村の 東の 赤い屋根が どうぐやだ！',
    'とくに ぼうぐは 大じだ。まもりが 0の ままだと 大ボスの こうげきで 1回で やられてしまう。',
  ])
  placeNpc(1, -6, 3, '🧓', 'ものしり じいさん', [
    'マップは ひろいぞ。右上の ミニマップを 見れば、いまの ばしょと 👑ボスの ばしょが わかる。',
    '村を 出て まん中の 道を ずっと 北へ すすむと、この村の ボスに たどりつく。',
  ])
  placeNpc(2, 6, 3, '🧑‍🌾', 'はたけの ひと', [
    '川は わたれないよ。はしを さがして まわり道するんだ。',
    'わき道の さきには、たからばこが かくれていることも あるよ。',
  ])
  placeNpc(3, 3, 7, '🧙', 'たびの けんじゃ', [
    '⚠️あかい わざは にがての しるし。れんしゅうバトルでは にがてな もんだいが でやすいぞ。',
    'きろくの ちからで じぶんの にがてを しろう！',
  ])
  placeNpc(4, -3, 9, '👮', 'まもりの へい', [
    'ボスは 村の 出口を ふさいでいる。たおさないと つぎの学年へは いけない。',
    'メニュー（Xキー）で いまの ちからと ボスの ひつよう問題数が わかるぞ。',
  ])
  placeNpc(5, -2, 3, '🧒', 'ぼうけんずきの 子', [
    'けいさんが むずかしいときは「どうぐ」の けいさんメモを つかうと いいよ。',
    'ゆびで ひっさんが かけるんだ！',
  ])
  placeNpc(6, 3, 3, '🧝', 'エルフの けんじゃ', [
    'ここまで きたか…6年生の ボスは この ワールドで いちばん つよい。',
    'そうびを ぜんぶ ととのえて いどむのだ。',
  ])

  // ==========================================================
  // モンスター配置：野原にだけ（村には 入ってこない）
  // ==========================================================
  const monsters: FieldMonster[] = []
  for (const stage of world.stages) {
    const { top } = zoneRows(stage.grade)
    const { vTop } = villageRows(stage.grade)
    const fieldTop = top + 1
    const fieldBottom = vTop - 1
    // 左・中央・右の 3エリアに 3体ずつ＝9体（マップが ひろくなったぶん ふやす）
    const areas: [number, number][] = [
      [2, PATH_X - 6],
      [PATH_X - 5, PATH_X + 5],
      [PATH_X + 6, MAP_W - 3],
    ]
    let placed = 0
    for (const [xMin, xMax] of areas) {
      for (let k = 0; k < 3; k++) {
        let guard = 0
        while (guard++ < 300) {
          const x = xMin + Math.floor(rand() * (xMax - xMin + 1))
          const y = fieldTop + 1 + Math.floor(rand() * Math.max(1, fieldBottom - fieldTop - 1))
          if (at(x, y) !== 'g' && at(x, y) !== 'p') continue
          if (monsters.some((m) => Math.abs(m.x - x) + Math.abs(m.y - y) < 5)) continue
          monsters.push({
            id: `${stage.id}-p${placed}`,
            stageId: stage.id,
            kind: 'practice',
            x,
            y,
            zoneTop: fieldTop,
            zoneBottom: fieldBottom,
          })
          placed++
          break
        }
      }
    }
    // ボス：ゾーン出口（上のもん）の 1マス下で 道を ふさぐ
    const bossY = zoneRows(stage.grade).top + 1
    monsters.push({ id: `${stage.id}-b`, stageId: stage.id, kind: 'boss', x: PATH_X, y: bossY, zoneTop: bossY, zoneBottom: bossY })
  }

  // ==========================================================
  // 宝箱：野原の すみっこに かくす
  // ==========================================================
  const chests: Chest[] = []
  for (const stage of world.stages) {
    const { top } = zoneRows(stage.grade)
    const { vTop } = villageRows(stage.grade)
    const fieldTop = top + 1
    const fieldBottom = vTop - 1
    const [cx, cy] = stage.grade % 2 === 1 ? [2, fieldTop + 2] : [MAP_W - 3, fieldBottom - 2]
    for (let d = 0; d < 30; d++) {
      const x = Math.max(1, Math.min(MAP_W - 2, cx + ((d % 6) - 3)))
      const y = Math.max(fieldTop + 1, Math.min(fieldBottom, cy + (Math.floor(d / 6) - 2)))
      if (at(x, y) !== 'g') continue
      if (monsters.some((m) => m.x === x && m.y === y)) continue
      put(x, y, 'c')
      chests.push({ id: `${stage.id}-chest`, x, y, itemId: stage.itemId, stageId: stage.id })
      break
    }
  }

  return { tiles, monsters, gateRows, signs, npcs, chests, shops }
}

// あるける タイルか。草・道・石だたみ だけ あるける。
// もん(G)は 前の学年の大ボスを たおしていれば あるける。
export function isWalkable(map: WorldMap, save: SaveData, worldId: WorldId, x: number, y: number): boolean {
  if (x < 0 || y < 0 || y >= MAP_H || x >= MAP_W) return false
  const t = map.tiles[y][x]
  if (t === 'g' || t === 'p' || t === 'P') return true
  if (t === 'G') {
    const gate = map.gateRows.find((g) => g.row === y)
    if (!gate) return false
    return save.cleared.includes(`${worldId}-${gate.grade}`)
  }
  return false
}

// スタート位置：いちばん すすんだ 村の 入口ちかく
export function startPos(save: SaveData, worldId: WorldId): { x: number; y: number } {
  let maxZone = 1
  while (maxZone < 6 && save.cleared.includes(`${worldId}-${maxZone}`)) maxZone++
  return { x: PATH_X, y: villageRows(maxZone).vTop + 12 }
}
