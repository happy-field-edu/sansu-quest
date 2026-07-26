import type { SaveData, WorldId } from '../types'
import { WORLD_BY_ID } from '../data/worlds'
import { seeded, ZONE_NAMES } from './config2d'

// グリッドベースのタイルマップ。1ワールド＝縦にならんだ6つの学年ゾーン。
// 下（1年生）から上（6年生）へ すすんでいく。

export const MAP_W = 36 // マップの横はば（マス）
export const ZONE_H = 18 // 1ゾーンの高さ（マス）
export const MAP_H = ZONE_H * 6 + 1 // いちばん上に城壁1行
export const PATH_X = 18 // まんなかの道の列

// タイルの種類
// g=草 p=道 t=木 r=岩 h=家 s=かんばん f=さく G=もん(ゾーンの出入り口) d=かざり
// n=むらびと(NPC) w=水（あるけない） c=宝箱
export type Tile = 'g' | 'p' | 't' | 'r' | 'h' | 's' | 'f' | 'G' | 'd' | 'n' | 'w' | 'c'

export interface Npc {
  x: number
  y: number
  emoji: string
  name: string
  lines: string[]
}

// 宝箱：ふれると そうびが 手にはいる（1回きり。あけたかは セーブに のこる）
export interface Chest {
  id: string // `${stageId}-chest` など。あけた記録の キーになる
  x: number
  y: number
  itemId: string // 中身の そうび
  stageId: string
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
  chests: Chest[]
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

  // ゾーンごとの かざりつけ（広くなったマップを 探検する たのしさを つくる）
  const signs: WorldMap['signs'] = []
  for (const stage of world.stages) {
    const { top, bottom } = zoneRows(stage.grade)
    const g = stage.grade

    // --- わき道：中央の道から 左右へ のびる 横道（探検ルート） ---
    const branchY1 = top + 4
    const branchY2 = bottom - 4
    for (let x = 4; x < MAP_W - 4; x++) {
      if (tiles[branchY1][x] === 'g') tiles[branchY1][x] = 'p'
      if (tiles[branchY2][x] === 'g') tiles[branchY2][x] = 'p'
    }
    // 左右のはしを たてに つなぐ 小道（ぐるっと まわれる）
    for (let y = branchY1; y <= branchY2; y++) {
      if (tiles[y][4] === 'g') tiles[y][4] = 'p'
      if (tiles[y][MAP_W - 5] === 'g') tiles[y][MAP_W - 5] = 'p'
    }

    // --- 川（よこ切り）＋ はし：ぐるっと まわり道が いる しかけ ---
    if (g % 2 === 0) {
      const riverY = top + Math.floor(ZONE_H / 2)
      for (let x = 1; x < MAP_W - 1; x++) {
        if (x === PATH_X || x === 4 || x === MAP_W - 5) continue // 道の ところは はし
        if (tiles[riverY][x] === 'g' || tiles[riverY][x] === 'p') tiles[riverY][x] = 'w'
      }
    }

    // --- 森・岩場（かたまりで おく と 地形らしく なる） ---
    for (let i = 0; i < 10; i++) {
      const cx = 2 + Math.floor(rand() * (MAP_W - 4))
      const cy = top + 2 + Math.floor(rand() * (ZONE_H - 4))
      const kind = rand() < 0.6 ? 't' : 'r'
      const size = 2 + Math.floor(rand() * 3)
      for (let d = 0; d < size; d++) {
        const x = cx + Math.floor(rand() * 3) - 1
        const y = cy + Math.floor(rand() * 3) - 1
        if (x < 1 || x >= MAP_W - 1 || y <= top || y >= bottom) continue
        if (Math.abs(x - PATH_X) <= 1) continue // 中央の道は あけておく
        if (tiles[y][x] !== 'g') continue
        tiles[y][x] = kind
      }
    }
    // かざり（花・水晶など）を ちらす
    for (let i = 0; i < 12; i++) {
      const x = 1 + Math.floor(rand() * (MAP_W - 2))
      const y = top + 1 + Math.floor(rand() * (ZONE_H - 2))
      if (tiles[y][x] === 'g') tiles[y][x] = 'd'
    }

    // --- 1年生ゾーンは 村：家を 4けん ならべる ---
    if (g === 1) {
      for (const [hx, hy] of [
        [PATH_X - 10, bottom - 4],
        [PATH_X - 6, bottom - 8],
        [PATH_X + 6, bottom - 4],
        [PATH_X + 10, bottom - 8],
      ]) {
        if (tiles[hy]?.[hx] === undefined) continue
        tiles[hy][hx] = 'h'
        if (tiles[hy][hx + 1] !== undefined) tiles[hy][hx + 1] = 'h'
      }
    }

    // --- かんばん：ゾーン入口と、わき道のはしにも ---
    const sy = bottom - 1
    const sx = PATH_X - 2
    if (tiles[sy][sx] === 'g' || tiles[sy][sx] === 'p') {
      tiles[sy][sx] = 's'
      signs.push({ x: sx, y: sy, stageId: stage.id })
    }
    const sx2 = 5
    const sy2 = branchY1 + 1
    if (tiles[sy2]?.[sx2] === 'g') {
      tiles[sy2][sx2] = 's'
      signs.push({ x: sx2, y: sy2, stageId: stage.id })
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
  placeNpc(1, PATH_X - 3, 3, '👵', 'むらの おばあさん', [
    `ここは 1ねんせいの 「${z1}」だよ。`,
    'モンスターに ぶつかると たたかいが はじまるよ。まけても だいじょうぶ、けいけんちは もらえるからね。',
  ])
  placeNpc(1, PATH_X + 4, 6, '👨‍🌾', 'むらびと', [
    'そうびを つよくすると、ボスを たおすのに ひつような もんだいの かずが へるぞ！',
    'モンスターを たおして そうびを あつめるのじゃ。',
  ])
  placeNpc(1, PATH_X - 9, 7, '🧓', 'ものしり じいさん', [
    'マップは ひろいぞ。右上の ミニマップを 見れば、いまの ばしょと 👑ボスの ばしょが わかる。',
    'まん中の 道を まっすぐ 北へ すすむと、この村の ボスに たどりつくぞ。',
  ])
  placeNpc(2, PATH_X + 8, 5, '🧑‍🌾', 'はたけの ひと', [
    '川は わたれないよ。はしを さがして まわり道するんだ。',
    'わき道の さきには、たまに いい そうびを もった モンスターが いるよ。',
  ])
  placeNpc(3, PATH_X + 3, 4, '🧙', 'たびの けんじゃ', [
    '⚠️あかい わざは にがての しるし。れんしゅうバトルでは にがてな もんだいが でやすいぞ。',
    'きろくの ちからで じぶんの にがてを しろう！',
  ])
  placeNpc(4, PATH_X - 7, 6, '👮', 'まもりの へい', [
    'ボスは 村の 出口を ふさいでいる。たおさないと つぎの学年へは いけない。',
    'メニュー（Xキー）で いまの ちからと ボスの ひつよう問題数が わかるぞ。',
  ])
  placeNpc(5, PATH_X - 4, 5, '🧒', 'ぼうけんずきの 子', [
    'けいさんが むずかしいときは「どうぐ」の けいさんメモを つかうと いいよ。',
    'ゆびで ひっさんが かけるんだ！',
  ])
  placeNpc(6, PATH_X + 5, 6, '🧝', 'エルフの けんじゃ', [
    'ここまで きたか…6年生の ボスは この ワールドで いちばん つよい。',
    'そうびを ぜんぶ ととのえて いどむのだ。'])

  // モンスター配置：各ゾーンに れんしゅう3体＋もんの前に ボス
  const monsters: FieldMonster[] = []
  for (const stage of world.stages) {
    const { top, bottom } = zoneRows(stage.grade)
    // ひろくなった ぶん、1ゾーンに 6体。
    // 左・中央・右の 3エリアに 2体ずつ おいて、どこを 歩いても 出会えるようにする。
    const areas: [number, number][] = [
      [2, PATH_X - 4], // 左
      [PATH_X - 3, PATH_X + 3], // 中央（道ぞい）
      [PATH_X + 4, MAP_W - 3], // 右
    ]
    let placed = 0
    for (const [xMin, xMax] of areas) {
      for (let k = 0; k < 2; k++) {
        let guard = 0
        while (guard++ < 200) {
          const x = xMin + Math.floor(rand() * (xMax - xMin + 1))
          const y = top + 2 + Math.floor(rand() * (ZONE_H - 4))
          if (tiles[y]?.[x] !== 'g' && tiles[y]?.[x] !== 'p') continue
          if (y > bottom - 3 && Math.abs(x - PATH_X) <= 2) continue // スタートちかくは あけておく
          if (monsters.some((m) => Math.abs(m.x - x) + Math.abs(m.y - y) < 4)) continue // くっつきすぎ 防止
          monsters.push({ id: `${stage.id}-p${placed}`, stageId: stage.id, kind: 'practice', x, y, zoneTop: top + 1, zoneBottom: bottom })
          placed++
          break
        }
      }
    }
    // ボス：ゾーン出口（上のもん）の 1マス下で 道を ふさぐ
    const bossY = stage.grade === 6 ? zoneRows(6).top + 1 : zoneRows(stage.grade).top + 1
    monsters.push({ id: `${stage.id}-b`, stageId: stage.id, kind: 'boss', x: PATH_X, y: bossY, zoneTop: bossY, zoneBottom: bossY })
  }

  // 宝箱：ゾーンの すみっこ（中央の道から はなれた ところ）に かくす。
  // 中身は その村の そうび → 探検すると ボスが よわくなる ごほうび。
  const chests: Chest[] = []
  for (const stage of world.stages) {
    const { top, bottom } = zoneRows(stage.grade)
    // 学年ごとに 左すみ／右すみを 入れかえて 変化をつける
    const [cx, cy] = stage.grade % 2 === 1 ? [2, top + 2] : [MAP_W - 3, bottom - 3]
    for (let d = 0; d < 20; d++) {
      const x = Math.max(1, Math.min(MAP_W - 2, cx + ((d % 5) - 2)))
      const y = Math.max(top + 1, Math.min(bottom, cy + (Math.floor(d / 5) - 2)))
      if (tiles[y]?.[x] !== 'g') continue
      if (monsters.some((m) => m.x === x && m.y === y)) continue
      tiles[y][x] = 'c'
      chests.push({ id: `${stage.id}-chest`, x, y, itemId: stage.itemId, stageId: stage.id })
      break
    }
  }

  return { tiles, monsters, gateRows, signs, npcs, chests }
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
