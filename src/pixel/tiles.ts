import type { WorldId } from '../types'
import { PIX_THEME, type PixTheme } from './theme'
import { DOT, TILE, cachedTile, drawArt, px, type Art, type Pal } from './px'

// ============================================================
// マップタイルの ドット絵（16×16ドット＝32px）
// ・地面（草）／道／水 は となりのマスを 見て かたちが かわる（オートタイル）
// ・木・岩・家・立て札・さく・もん は 文字の絵（Art）
// ============================================================

const N = 16 // 1マス = 16ドット

// ---- 草（地面）：8種類の ばらつきを 用意して 平べったく 見えないようにする ----
export function grassTile(worldId: WorldId, vari: number): HTMLCanvasElement {
  const th = PIX_THEME[worldId]
  return cachedTile(`grass:${worldId}:${vari}`, TILE, TILE, (ctx) => {
    ctx.fillStyle = th.grass[0]
    ctx.fillRect(0, 0, TILE, TILE)
    // うっすら 市松（16ビット風の 地面の きめ）
    ctx.fillStyle = th.grass[1]
    ctx.globalAlpha = 0.18
    for (let y = 0; y < N; y += 2)
      for (let x = (y / 2) % 2; x < N; x += 2) px(ctx, x, y, th.grass[1])
    ctx.globalAlpha = 1
    // 草の は（2〜3本）。vari ごとに ばしょを かえる
    const blades: [number, number][][] = [
      [[3, 5], [4, 4], [10, 11], [11, 10]],
      [[6, 2], [7, 1], [12, 8], [2, 12]],
      [[9, 6], [10, 5], [4, 13], [13, 3]],
      [[2, 8], [3, 7], [11, 13], [7, 10]],
      [[13, 9], [12, 10], [5, 2], [8, 14]],
      [[5, 11], [6, 10], [14, 5], [1, 4]],
      [[8, 4], [9, 3], [3, 10], [12, 14]],
      [[11, 7], [10, 8], [6, 14], [14, 12]],
    ]
    for (const [x, y] of blades[vari % blades.length]) {
      px(ctx, x, y, th.grass[1])
      px(ctx, x, y - 1, th.grass[2])
    }
  })
}

// ---- 道（土）：となりが 道でない がわは ふちを まるめる ----
// mask のビット： 1=上 2=右 4=下 8=左
export function pathTile(worldId: WorldId, mask: number): HTMLCanvasElement {
  const th = PIX_THEME[worldId]
  return cachedTile(`path:${worldId}:${mask}`, TILE, TILE, (ctx) => {
    const up = mask & 1, right = mask & 2, down = mask & 4, left = mask & 8
    const x0 = left ? 0 : 1
    const x1 = right ? N - 1 : N - 2
    const y0 = up ? 0 : 1
    const y1 = down ? N - 1 : N - 2
    ctx.fillStyle = th.dirt[0]
    ctx.fillRect(x0 * DOT, y0 * DOT, (x1 - x0 + 1) * DOT, (y1 - y0 + 1) * DOT)
    // かどを まるめる（となりが 両どなりとも 道でない ところ）
    const round = (cx: number, cy: number) => {
      px(ctx, cx, cy, th.dirt[0]) // いったん もどして…
      ctx.clearRect(cx * DOT, cy * DOT, DOT, DOT)
    }
    if (!up && !left) round(x0, y0)
    if (!up && !right) round(x1, y0)
    if (!down && !left) round(x0, y1)
    if (!down && !right) round(x1, y1)
    // ふちを 1ドット こくして 立体感を 出す
    for (let x = x0; x <= x1; x++) {
      if (!up) px(ctx, x, y0, th.dirt[1])
      if (!down) px(ctx, x, y1, th.dirt[1])
    }
    for (let y = y0; y <= y1; y++) {
      if (!left) px(ctx, x0, y, th.dirt[1])
      if (!right) px(ctx, x1, y, th.dirt[1])
    }
    // 砂つぶ
    for (const [x, y] of [[4, 3], [9, 6], [6, 11], [12, 12], [3, 8]] as [number, number][]) {
      if (x >= x0 + 1 && x <= x1 - 1 && y >= y0 + 1 && y <= y1 - 1) px(ctx, x, y, th.dirt[2])
    }
  })
}

// ---- 水：きしべ（となりが 水でない がわ）を あわ色に する ----
export function waterTile(worldId: WorldId, mask: number, vari: number): HTMLCanvasElement {
  const th = PIX_THEME[worldId]
  return cachedTile(`water:${worldId}:${mask}:${vari}`, TILE, TILE, (ctx) => {
    ctx.fillStyle = th.water[0]
    ctx.fillRect(0, 0, TILE, TILE)
    // ふかい ところ
    ctx.fillStyle = th.water[1]
    ctx.globalAlpha = 0.5
    for (let y = 0; y < N; y += 4) ctx.fillRect(0, y * DOT, TILE, DOT)
    ctx.globalAlpha = 1
    // なみ（vari で ずらす）
    const waves: [number, number][][] = [
      [[2, 4], [3, 4], [9, 9], [10, 9]],
      [[6, 2], [7, 2], [12, 11], [13, 11]],
      [[4, 12], [5, 12], [11, 5], [12, 5]],
      [[8, 7], [9, 7], [2, 13], [3, 13]],
    ]
    for (const [x, y] of waves[vari % waves.length]) px(ctx, x, y, th.water[2])
    // きしべ
    const up = mask & 1, right = mask & 2, down = mask & 4, left = mask & 8
    ctx.fillStyle = th.water[2]
    if (!up) ctx.fillRect(0, 0, TILE, DOT)
    if (!down) ctx.fillRect(0, (N - 1) * DOT, TILE, DOT)
    if (!left) ctx.fillRect(0, 0, DOT, TILE)
    if (!right) ctx.fillRect((N - 1) * DOT, 0, DOT, TILE)
  })
}

// ============================================================
// もの（木・岩・家 など）の ドット絵
// ============================================================

const TREE: Art = [
  '......DDD.......',
  '....DDMMMDD.....',
  '...DMMMLLMMD....',
  '..DMMLLLLLMMD...',
  '..DMLLLLLLLMD...',
  '.DMMLLLLLLLMMD..',
  '.DMLLLLLLLLLMD..',
  '.DMMLLLLLLLMMD..',
  '..DMMLLLLLMMD...',
  '..DDMMMLMMMDD...',
  '....DDMMMDD.....',
  '......TST.......',
  '......TST.......',
  '......TST.......',
  '.....STTTS......',
  '....SSSSSSS.....',
]

const ROCK: Art = [
  '................',
  '................',
  '.....HHHH.......',
  '....HHMMMM......',
  '...HHMMMMMM.....',
  '..HHMMMMMMDD....',
  '..HMMMMMMMMD....',
  '.HMMMMMMMMMDD...',
  '.HMMMMMMMMMMD...',
  '.HMMMMMMMMMMD...',
  '.DMMMMMMMMMDD...',
  '..DDMMMMMMDD....',
  '...DDDDDDDD.....',
  '....SSSSSSS.....',
  '................',
  '................',
]

const HOUSE: Art = [
  '................',
  '.......A........',
  '......AAA.......',
  '.....AAAAA......',
  '....AAAAAAA.....',
  '...AAAAAAAAA....',
  '..AAAAAAAAAAA...',
  '.AAAAAAAAAAAAA..',
  '.BBBBBBBBBBBBB..',
  '..WWWWWWWWWWW...',
  '..WWCCWWWCCWW...',
  '..WWCCWWWCCWW...',
  '..WWWWDDDWWWW...',
  '..WWWWDKDWWWW...',
  '..WWWWDDDWWWW...',
  '..SSSSSSSSSSS...',
]

const FENCE: Art = [
  '................',
  '................',
  '..P..........P..',
  '..P..........P..',
  'PPPPPPPPPPPPPPPP',
  'SSSSSSSSSSSSSSSS',
  '..P..........P..',
  '..P..........P..',
  'PPPPPPPPPPPPPPPP',
  'SSSSSSSSSSSSSSSS',
  '..P..........P..',
  '..P..........P..',
  '..S..........S..',
  '................',
  '................',
  '................',
]

const SIGN: Art = [
  '................',
  '..BBBBBBBBBB....',
  '..BLLLLLLLLB....',
  '..BLDDLDDLLB....',
  '..BLLLLLLLLB....',
  '..BLDDDLDDLB....',
  '..BLLLLLLLLB....',
  '..BBBBBBBBBB....',
  '......PP........',
  '......PP........',
  '......PP........',
  '......PP........',
  '.....SSSS.......',
  '................',
  '................',
  '................',
]

// もん：とじている（とびら）／ひらいている（アーチ）
const GATE_SHUT: Art = [
  '................',
  '...SSSSSSSSSS...',
  '..SLLLLLLLLLLS..',
  '..SLDDDDDDDDLS..',
  '..SLDWWWWWWDLS..',
  '..SLDWWWWWWDLS..',
  '..SLDWWKKWWDLS..',
  '..SLDWWWWWWDLS..',
  '..SLDWWWWWWDLS..',
  '..SLDWWWWWWDLS..',
  '..SLDWWWWWWDLS..',
  '..SLDDDDDDDDLS..',
  '..SLLLLLLLLLLS..',
  '...SSSSSSSSSS...',
  '................',
  '................',
]

const GATE_OPEN: Art = [
  '................',
  '...SSSSSSSSSS...',
  '..SLLLLLLLLLLS..',
  '..SLDD....DDLS..',
  '..SLD......DLS..',
  '..SLD......DLS..',
  '..SLD......DLS..',
  '..SLD......DLS..',
  '..SLD......DLS..',
  '..SLD......DLS..',
  '..SLD......DLS..',
  '..SLD......DLS..',
  '..SLL......LLS..',
  '...SS......SS...',
  '................',
  '................',
]

const FLOWER: Art = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.......F........',
  '......FYF.......',
  '.....FYCYF......',
  '......FYF.......',
  '.......F........',
  '.......G........',
  '......GG........',
  '................',
  '................',
  '................',
]

function pal(th: PixTheme, kind: string): Pal {
  switch (kind) {
    case 'tree':
      return { L: th.leaf[0], M: th.leaf[1], D: th.leaf[2], T: th.trunk[0], S: th.trunk[1] }
    case 'rock':
      return { H: th.rock[0], M: th.rock[1], D: th.rock[2], S: th.rock[3] }
    case 'house':
      return { A: th.roof[0], B: th.roof[1], W: th.wall[0], C: th.wall[1], S: th.wall[2], D: th.trunk[0], K: '#f4d94e' }
    case 'fence':
      return { P: th.trunk[0], S: th.trunk[1] }
    case 'sign':
      return { B: th.trunk[1], L: '#e0bd85', D: '#6b4a2a', P: th.trunk[0], S: th.trunk[1] }
    case 'gate':
      return { S: th.rock[3], L: th.rock[0], D: th.rock[2], W: th.trunk[0], K: '#f4d94e' }
    case 'deco':
      return { F: th.deco[0], Y: th.deco[1], C: '#ffffff', G: th.grass[1] }
    default:
      return {}
  }
}

const ART: Record<string, Art> = {
  tree: TREE,
  rock: ROCK,
  house: HOUSE,
  fence: FENCE,
  sign: SIGN,
  gateShut: GATE_SHUT,
  gateOpen: GATE_OPEN,
  deco: FLOWER,
}

// もの（木・岩…）のタイル。とうめいな背景なので 草の うえに かさねて つかう。
export function objTile(worldId: WorldId, kind: keyof typeof ART): HTMLCanvasElement {
  const th = PIX_THEME[worldId]
  const palKind = kind === 'gateShut' || kind === 'gateOpen' ? 'gate' : kind
  return cachedTile(`obj:${worldId}:${kind}`, TILE, TILE, (ctx) => {
    drawArt(ctx, ART[kind], pal(th, palKind))
  })
}
