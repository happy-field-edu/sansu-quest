import { artUrl, type Art, type Pal } from './px'

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

const HERO_PAL: Pal = {
  H: '#e04a4a', // ぼうし
  h: '#a92f2f',
  F: '#ffd9a8', // かお
  E: '#2a2a3a', // め
  K: '#7a4a24', // かみ
  B: '#3f74d8', // ふく
  b: '#2b53a5',
  W: '#f2e6c8', // むねの かざり
  S: '#6b4326', // くつ
}

export type Dir4 = 'up' | 'down' | 'left' | 'right'

export function heroUrl(dir: Dir4, frame: 0 | 1): string {
  const legs = LEGS[dir === 'left' || dir === 'right' ? 'side' : 'front'][frame]
  let body = dir === 'up' ? BODY_UP : dir === 'down' ? BODY_DOWN : BODY_LEFT
  let art = [...body, ...legs]
  if (dir === 'right') art = mirror(art)
  return artUrl(`hero:${dir}:${frame}`, art, HERO_PAL)
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
