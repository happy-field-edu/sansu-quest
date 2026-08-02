import { artUrl, layersUrl, type Art, type Layer, type Pal } from './px'
import { NO_LOOK, lookKey, type HeroLook } from './heroLook'

// ============================================================
// ゆうしゃ・むらびと・たからばこ・どうぐや の ドット絵
// ゆうしゃは 4ほうこう × 2コマ（あるくと 足が うごく）
// ============================================================

const mirror = (a: Art): Art => a.map((r) => [...r].reverse().join(''))

// ---- ゆうしゃ：からだ（上13ドット）＋ 足（2コマ） ----
const BODY_DOWN: Art = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....hhhhhhhh....',
  '.....FFFFFF.....',
  '.....FEFFEF.....',
  '.....FFFFFF.....',
  '......FFFF......',
  '....BBBBBBBB....',
  '...FBBBWWBBBF...',
  '...FBBbWWbBBF...',
  '....BBbbbbBB....',
  '....BBBBBBBB....',
]

const BODY_UP: Art = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....hhhhhhhh....',
  '.....KKKKKK.....',
  '.....KKKKKK.....',
  '.....KKKKKK.....',
  '......KKKK......',
  '....BBBBBBBB....',
  '...FBBBBBBBF....',
  '...FBBbbbbBF....',
  '....BBbbbbBB....',
  '....BBBBBBBB....',
]

const BODY_LEFT: Art = [
  '................',
  '....HHHHHH......',
  '...HHHHHHHH.....',
  '...hhhhhhhh.....',
  '....FFFFFK......',
  '...FEFFFFK......',
  '....FFFFFK......',
  '.....FFFF.......',
  '....BBBBBB......',
  '...FBBBBBB......',
  '...FBBbbBB......',
  '....BBbbBB......',
  '....BBBBBB......',
]

const LEGS: Record<string, Art[]> = {
  // [コマ0, コマ1]
  front: [
    ['.....SS..SS.....', '....SSS..SSS....', '................'],
    ['....SS....SS....', '...SSS....SSS...', '................'],
  ],
  side: [
    ['.....SSSS.......', '....SSSSS.......', '................'],
    ['....SSSS........', '...SSSSS........', '................'],
  ],
}

// ---- そうびの 絵（からだに かさねる） ----
// 「みぎ手に ぶき」「ひだり手に たて」を もった かたちで かき、
// むきに あわせて 左右を 入れかえる。
const W_STICK: Art = [
  '................',
  '................',
  '................',
  '............DDD.',
  '............DcD.',
  '............DcD.',
  '............DcD.',
  '............DcD.',
  '............DcD.',
  '............DcD.',
  '............DcD.',
  '............DcD.',
  '............DDD.',
  '................',
  '................',
  '................',
]

const W_SWORD: Art = [
  '................',
  '.............D..',
  '............DCD.',
  '............DCD.',
  '............DcD.',
  '............DcD.',
  '............DcD.',
  '............DcD.',
  '............DcD.',
  '...........DGGGD',
  '............DgD.',
  '............DgD.',
  '.............D..',
  '................',
  '................',
  '................',
]

const S_SMALL: Art = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..DDD...........',
  '.DSSSD..........',
  '.DSKSD..........',
  '.DSSSD..........',
  '.DSSSD..........',
  '..DSD...........',
  '................',
  '................',
  '................',
]

const S_LARGE: Art = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.DDDD...........',
  'DSSSSD..........',
  'DSSKSD..........',
  'DSKKKD..........',
  'DSSKSD..........',
  'DSSSSD..........',
  '.DSSD...........',
  '..DD............',
  '................',
  '................',
]

// ランクごとの 色
const WEAPON_ART = [null, W_STICK, W_SWORD, W_SWORD, W_SWORD]
const WEAPON_PAL: (Pal | null)[] = [
  null,
  { C: '#c99a5a', c: '#a9793f', G: '#6b4326', g: '#5a3720', D: '#3f2810' }, // 木
  { C: '#eef3fa', c: '#b6c0cf', G: '#8a6a3a', g: '#6b4a2a', D: '#2e343c' }, // 鉄
  { C: '#fff0a0', c: '#e8c44a', G: '#8a6a3a', g: '#6b4a2a', D: '#5a3f0c' }, // 金
  { C: '#ffffff', c: '#8ee6ff', G: '#e8e8f0', g: '#a8b0c0', D: '#1f4a60' }, // 光
]
const SHIELD_ART = [null, S_SMALL, S_LARGE]
const SHIELD_PAL: (Pal | null)[] = [
  null,
  { D: '#5a3720', S: '#a9793f', K: '#f2e6c8' }, // 木
  { D: '#454c58', S: '#c2cad6', K: '#7fc7e8' }, // 鉄・ミスリル
]
const ARMOR_PAL = [
  { B: '#3f74d8', b: '#2b53a5' }, // たびの服
  { B: '#4f9e4f', b: '#3a7a3a' }, // 布
  { B: '#9aa0aa', b: '#6a707a' }, // 鉄
  { B: '#c0563f', b: '#8a3826' }, // 竜
]
const HELMET_PAL = [
  { H: '#e04a4a', h: '#a92f2f' }, // 赤いぼうし
  { H: '#a9793f', h: '#7d5528' }, // かわ
  { H: '#b8c0cc', h: '#7a828e' }, // 鉄
  { H: '#f4d94e', h: '#c99a2a' }, // せいなる
]
const BOOTS_COL = ['#6b4326', '#8a5a2a', '#7a828e', '#4f8fe0']

function bodyPal(look: HeroLook): Pal {
  return {
    ...HELMET_PAL[look.helmet] ?? HELMET_PAL[0],
    ...ARMOR_PAL[look.armor] ?? ARMOR_PAL[0],
    F: '#ffd9a8', // かお
    E: '#2a2a3a', // め
    K: '#7a4a24', // かみ
    W: look.charm ? '#7fe3ff' : '#f2e6c8', // むねの かざり（おまもりで 光る）
    S: BOOTS_COL[look.boots] ?? BOOTS_COL[0],
  }
}

export type Dir4 = 'up' | 'down' | 'left' | 'right'

// そうびを かさねた ゆうしゃ。
// ・たて は「うしろ」から えがく（下むきだけ 体の 手前）
// ・ぶき は いつも 体の 手前
export function heroUrl(dir: Dir4, frame: 0 | 1, look: HeroLook = NO_LOOK): string {
  const legs = LEGS[dir === 'left' || dir === 'right' ? 'side' : 'front'][frame]
  const body = dir === 'up' ? BODY_UP : dir === 'down' ? BODY_DOWN : BODY_LEFT
  const bodyArt = [...body, ...legs]
  // 下むき いがいは そうびの 左右を 入れかえる（うしろ姿・よこ姿）
  const flip = dir !== 'down'
  const side = (a: Art) => (flip ? mirror(a) : a)

  const layers: Layer[] = []
  const shieldArt = SHIELD_ART[look.shield]
  const shieldPal = SHIELD_PAL[look.shield]
  const front = dir === 'down' // たてが 体の 手前に 見えるか
  if (shieldArt && shieldPal && !front) layers.push({ art: side(shieldArt), pal: shieldPal })
  layers.push({ art: bodyArt, pal: bodyPal(look) })
  if (shieldArt && shieldPal && front) layers.push({ art: shieldArt, pal: shieldPal })
  const weaponArt = WEAPON_ART[look.weapon]
  const weaponPal = WEAPON_PAL[look.weapon]
  if (weaponArt && weaponPal) layers.push({ art: side(weaponArt), pal: weaponPal })

  // みぎむきは ぜんぶ かさねてから 左右反転する
  const flipAll = dir === 'right'
  const final = flipAll ? layers.map((l) => ({ art: mirror(l.art), pal: l.pal })) : layers
  return layersUrl(`hero:${dir}:${frame}:${lookKey(look)}`, final)
}

// ---- むらびと（NPC）：シルエットは 共通、色と ぼうしで 見分ける ----
const NPC_BASE: Art = [
  '................',
  '................',
  '.....KKKKKK.....',
  '....KKKKKKKK....',
  '....KFFFFFFK....',
  '....KFEFFEFK....',
  '.....FFFFFF.....',
  '......FFFF......',
  '....AAAAAAAA....',
  '...FAAAAAAAAF...',
  '...FAAaaaaAAF...',
  '....AAaaaaAA....',
  '....AAAAAAAA....',
  '.....SS..SS.....',
  '....SSS..SSS....',
  '................',
]

// つばの ひろい ぼうし（のうふ）
const NPC_HAT: Art = [
  '................',
  '.....HHHHHH.....',
  '...HHHHHHHHHH...',
  '..HHHHHHHHHHHH..',
  '....KFFFFFFK....',
  '....KFEFFEFK....',
  '.....FFFFFF.....',
  '......FFFF......',
  '....AAAAAAAA....',
  '...FAAAAAAAAF...',
  '...FAAaaaaAAF...',
  '....AAaaaaAA....',
  '....AAAAAAAA....',
  '.....SS..SS.....',
  '....SSS..SSS....',
  '................',
]

// とんがり ぼうし（けんじゃ・まほうつかい）＋つえ
const NPC_MAGE: Art = [
  '.......H........',
  '......HHH.......',
  '.....HHHHH......',
  '....HHHHHHH.....',
  '...HHHHHHHHH....',
  '.....FFFFFF..C..',
  '.....FEFFEF..P..',
  '.....FFFFFF..P..',
  '....AAAAAAA..P..',
  '...FAAAAAAAAP...',
  '...FAAaaaaAAP...',
  '....AAaaaaAA.P..',
  '....AAAAAAAA.P..',
  '....AAAAAAAA....',
  '.....SSSSSS.....',
  '................',
]

// かぶと（まもりの へい）
const NPC_GUARD: Art = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....HHHHHHHH....',
  '....HFFFFFFH....',
  '....HFEFFEFH....',
  '.....FFFFFF.....',
  '....AAAAAAAA....',
  '...AAAAAAAAAA...',
  '...FAAaaaaAAF...',
  '...FAAaaaaAAF...',
  '....AAaaaaAA....',
  '....AAAAAAAA....',
  '.....SS..SS.....',
  '....SSS..SSS....',
  '................',
]

export interface NpcLook {
  art: Art
  pal: Pal
}

// NPCの 見た目（もとの絵文字ごとに 色と かたちを わりあて）
const NPC_LOOKS: Record<string, NpcLook> = {
  '👵': { art: NPC_BASE, pal: { K: '#e8e4dc', F: '#ffd9a8', E: '#3a3a4a', A: '#b06aa8', a: '#8b4e85', S: '#6b4326' } },
  '👨‍🌾': { art: NPC_HAT, pal: { H: '#e0c46a', K: '#5a3a1e', F: '#ffd9a8', E: '#3a3a4a', A: '#4f9e4f', a: '#3a7a3a', S: '#6b4326' } },
  '🧓': { art: NPC_BASE, pal: { K: '#dcd8d0', F: '#ffd9a8', E: '#3a3a4a', A: '#8a6a44', a: '#6a4f32', S: '#5a3a20' } },
  '🧑‍🌾': { art: NPC_HAT, pal: { H: '#d8b95e', K: '#3a2a18', F: '#ffd9a8', E: '#3a3a4a', A: '#c88a3a', a: '#9c682a', S: '#6b4326' } },
  '🧙': { art: NPC_MAGE, pal: { H: '#5a4a9e', F: '#ffd9a8', E: '#3a3a4a', A: '#6a5ab0', a: '#4c3f88', S: '#4a3a70', P: '#8a6a3a', C: '#7fe3ff' } },
  '👮': { art: NPC_GUARD, pal: { H: '#b8bcc4', F: '#ffd9a8', E: '#3a3a4a', A: '#8e949e', a: '#6a707a', S: '#4a4e56' } },
  '🧒': { art: NPC_BASE, pal: { K: '#8a5a2a', F: '#ffd9a8', E: '#3a3a4a', A: '#e8c04a', a: '#bd9630', S: '#6b4326' } },
  '🧝': { art: NPC_MAGE, pal: { H: '#4f9e6a', F: '#ffe4c0', E: '#3a5a4a', A: '#5cb07a', a: '#3f8a5a', S: '#3a6a4a', P: '#c8a86a', C: '#ffe36a' } },
}

export function npcUrl(emoji: string): string {
  const look = NPC_LOOKS[emoji] ?? NPC_LOOKS['👵']
  return artUrl(`npc:${emoji}`, look.art, look.pal)
}

// ---- どうぐや（ショップの たてもの） ----
const SHOP: Art = [
  '................',
  '..RRRRRRRRRRRR..',
  '..RRRRRRRRRRRR..',
  '..DDDDDDDDDDDD..',
  '.YWYWYWYWYWYWYW.',
  '.WYWYWYWYWYWYWY.',
  '..LLLLLLLLLLLL..',
  '..LCCLLLLLLCCL..',
  '..LCCLLGGLLCCL..',
  '..LLLLGGGGLLLL..',
  '..LLLLGGGGLLLL..',
  '..LLLLGGGGLLLL..',
  '..LLLLGGKGLLLL..',
  '..LLLLGGGGLLLL..',
  '..SSSSSSSSSSSS..',
  '................',
]

const SHOP_PAL: Pal = {
  R: '#c0563f', // やね
  D: '#8a3826',
  Y: '#f2e2b8', // ひさしの しましま
  W: '#d84a4a',
  L: '#e8d4a8', // かべ
  C: '#7fc7e8', // まど
  G: '#8a5a32', // とびら
  K: '#f4d94e', // ドアノブ
  S: '#6a5238',
}

export const shopUrl = () => artUrl('shop', SHOP, SHOP_PAL)

// ---- たからばこ ----
const CHEST_SHUT: Art = [
  '................',
  '................',
  '...LLLLLLLLLL...',
  '..LWWWWWWWWWWL..',
  '..LWKKKKKKKKWL..',
  '..LWWWWWWWWWWL..',
  '..LLLLLLLLLLLL..',
  '..DDDDDKKDDDDD..',
  '..BWWWWKKWWWWB..',
  '..BWWWWWWWWWWB..',
  '..BWWWWWWWWWWB..',
  '..BWWWWWWWWWWB..',
  '..BBBBBBBBBBBB..',
  '...SSSSSSSSSS...',
  '................',
  '................',
]

const CHEST_OPEN: Art = [
  '................',
  '...LLLLLLLLLL...',
  '..LWWWWWWWWWWL..',
  '..LLLLLLLLLLLL..',
  '................',
  '................',
  '..DDDDDDDDDDDD..',
  '..BNNNNNNNNNNB..',
  '..BNNNNNNNNNNB..',
  '..BWWWWWWWWWWB..',
  '..BWWWWWWWWWWB..',
  '..BWWWWWWWWWWB..',
  '..BBBBBBBBBBBB..',
  '...SSSSSSSSSS...',
  '................',
  '................',
]

const CHEST_PAL: Pal = {
  L: '#8a5a2a',
  W: '#c08a44',
  D: '#6b4020',
  B: '#a8763a',
  K: '#f4d94e',
  S: '#4a2c14',
  N: '#2a1a0e', // なかみの かげ
}

// ---- コイン（どうぐやの めじるし） ----
const COIN: Art = [
  '................',
  '.....DDDD.......',
  '....DKKKKD......',
  '...DKYYYYKD.....',
  '...DKYWWYKD.....',
  '...DKYWWYKD.....',
  '...DKYYYYKD.....',
  '....DKKKKD......',
  '.....DDDD.......',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
]

export const coinUrl = () =>
  artUrl('coin', COIN, { D: '#6b4a10', K: '#c99a2a', Y: '#f4d94e', W: '#fff6c0' })

export const chestUrl = (open: boolean) =>
  artUrl(`chest:${open ? 'o' : 'c'}`, open ? CHEST_OPEN : CHEST_SHUT, CHEST_PAL)
