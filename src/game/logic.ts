import type { Item, SaveData, WorldId } from '../types'
import { ITEMS } from '../data/items'
import { STAGE_BY_ID } from '../data/worlds'

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

// ---- 大ボスの必要問題数（ワールド×学年でだんだん増える） ----
// 村が おくに いくほど、また ワールドによって、必要な正解数が ふえる。
// 例）足し算の村(1年)=50, 掛け算の村(2年)=100 …（数と計算ワールドは 学年×50）
// power(=レベル+こうげき力) が高いほど、その基準から 問題数が 減る（さいてい 基準の半分）。
export const BOSS_BASE_BY_WORLD: Record<WorldId, number> = {
  keisan: 50, //  50, 100, 150, 200, 250, 300
  ryou: 40, //  40,  80, 120, 160, 200, 240
  zukei: 45, //  45,  90, 135, 180, 225, 270
  kankei: 55, //  55, 110, 165, 220, 275, 330
}

// そのステージの 大ボス基準問題数
export function bossBaseOf(stageId: string): number {
  const stage = STAGE_BY_ID[stageId]
  const per = BOSS_BASE_BY_WORLD[stage.worldId] ?? 50
  return per * stage.grade
}

// 基準の半分を さいていラインにする（強くても これより下がらない）
export const bossMinOf = (stageId: string): number => Math.ceil(bossBaseOf(stageId) / 2)

// power を引いた、じっさいに たおすのに ひつような正解数
export function bossRequiredFor(stageId: string, power: number): number {
  return Math.max(bossMinOf(stageId), bossBaseOf(stageId) - power)
}

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
    mistakeDamage: Math.max(1, 5 - Math.floor(def / 3)),
  }
}

// ---- 技能の習熟度（きろく画面・チップの色分けに使う） ----
export type SkillLevel = 'none' | 'good' | 'mid' | 'weak'

export function skillLevelOf(
  stats: SaveData['skillStats'],
  stageId: string,
  skillId: string,
): { level: SkillLevel; o: number; x: number } {
  const st = stats[`${stageId}:${skillId}`]
  const o = st?.o ?? 0
  const x = st?.x ?? 0
  if (o + x < 3) return { level: 'none', o, x } // 3問未満は判定しない
  const acc = o / (o + x)
  return { level: acc >= 0.8 ? 'good' : acc >= 0.6 ? 'mid' : 'weak', o, x }
}

// ---- バトル定数 ----
export const PRACTICE_HP = 5 // れんしゅうモンスターは 5問正解でクリア
export const EXP_CORRECT = 4 // 1問正解ごとの経験値
export const EXP_PRACTICE_CLEAR = 20
export const EXP_BOSS_CLEAR = 80
