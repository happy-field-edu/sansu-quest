import type { Item, SaveData } from '../types'
import { ITEMS } from '../data/items'

// ---- けいけんちとレベル ----
export const expNeed = (level: number) => 30 + (level - 1) * 15

export function levelFromExp(exp: number) {
  let level = 1
  let rest = exp
  while (rest >= expNeed(level) && level < 99) {
    rest -= expNeed(level)
    level++
  }
  return { level, into: rest, need: expNeed(level) }
}

export function equippedItems(save: SaveData): Item[] {
  return Object.values(save.equipped)
    .map((id) => (id ? ITEMS[id] : undefined))
    .filter((i): i is Item => Boolean(i))
}

// ---- プレイヤーの総合ステータス ----
// power(=レベル+こうげき力) が高いほど、ボスに必要な問題数が 50問 → 25問まで減る。
export const BOSS_BASE = 50
export const BOSS_MIN = 25

export function playerStats(save: SaveData) {
  const { level, into, need } = levelFromExp(save.exp)
  const items = equippedItems(save)
  const atk = items.reduce((s, i) => s + i.atk, 0)
  const def = items.reduce((s, i) => s + i.def, 0)
  const hpBonus = items.reduce((s, i) => s + i.hp, 0)
  const power = level + atk
  return {
    level,
    into,
    need,
    atk,
    def,
    maxHp: 20 + (level - 1) * 3 + hpBonus,
    power,
    bossRequired: Math.max(BOSS_MIN, BOSS_BASE - power),
    mistakeDamage: Math.max(1, 5 - Math.floor(def / 3)),
  }
}

// ---- バトル定数 ----
export const PRACTICE_HP = 5 // れんしゅうモンスターは 5問正解でクリア
export const EXP_CORRECT = 4 // 1問正解ごとの経験値
export const EXP_PRACTICE_CLEAR = 20
export const EXP_BOSS_CLEAR = 80
