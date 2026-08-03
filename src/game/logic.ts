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

// ---- 大ボスの こうげき力（ミスしたとき へるHP） ----
// ・村が おくに いくほど（学年が上がるほど）ダメージが 大きくなる
// ・まもりが 0（防具なし）だと 一撃で たおされる
// ・まもりが 高いほど ダメージが へって、ミスできる回数が ふえる
// 1・2年生の 大ボスで ミスできる 回数の 上限。
// これ以上 ミスできると（20〜60問しかないので）楽勝に なってしまう。
export const BOSS_MAX_MISTAKES = 10

// 3年生からの 合格ライン。「だいたい 正答率85%」で クリアできる ように する。
// 3年生いこうは 問題数が 100〜330問と とても 多いので、
// ミスできる 回数を 問題数に あわせて ふやさないと
// 「250問を 98%の 正確さで」という 人間ばなれした 要求に なってしまう。
export const BOSS_PASS_RATE = 0.85
// ぼうぐを ここまで そろえると 合格ライン（85%）まで ミスが ゆるされる
const DEF_FULL = 30

// 正答率が ちょうど 合格ライン(85%)に なる ミス回数（例：100問なら 17回）を
// 上限に、まもりの 強さで そこまで のびる。
function passLineMistakes(target: number, def: number): number {
  const ceiling = Math.floor((target * (1 - BOSS_PASS_RATE)) / BOSS_PASS_RATE)
  return Math.max(1, Math.round(ceiling * Math.min(1, def / DEF_FULL)))
}

// ミスしたとき へるHP。
export function bossMistakeDamage(stageId: string, def: number, maxHp: number, target: number): number {
  if (def <= 0) return maxHp // 防具なしは 一撃必殺！
  const grade = STAGE_BY_ID[stageId]?.grade ?? 1
  if (grade <= 2) {
    // 1・2年生は これまでどおり。学年が上がるほど ダメージが 大きく、
    // まもりが 高いほど 小さくなる（ただし ミスは 10回まで）
    const raw = (maxHp * (0.35 + 0.11 * grade)) / (1 + def / 8)
    const minDamage = Math.ceil(maxHp / (BOSS_MAX_MISTAKES + 1))
    return Math.max(1, minDamage, Math.min(maxHp, Math.ceil(raw)))
  }
  // 3年生からは 合格ライン(正答率85%)から ダメージを ぎゃく算する
  return Math.max(1, Math.round(maxHp / (passLineMistakes(target, def) + 1)))
}

// その大ボスで 何回 ミスできるか（画面に 出る 回数と かならず 一致する）
export function bossMistakesAllowed(stageId: string, def: number, maxHp: number, target: number): number {
  if (def <= 0) return 0
  return bossMistakesLeft(maxHp, bossMistakeDamage(stageId, def, maxHp, target))
}

// あと何回 ミスできるか（0なら つぎの ミスで ゲームオーバー）
export function bossMistakesLeft(hp: number, damage: number): number {
  if (damage <= 0) return 99
  return Math.max(0, Math.ceil(hp / damage) - 1)
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

// ---- コイン（どうぐやで そうびを かう おかね） ----
// 1問 せいかいするたび もらえる。まけても せいかいぶんは もらえる。
export const COIN_CORRECT = 3
// たおしたときの ボーナス。おくの村ほど 多い（何回でも もらえる＝コインかせぎ）
export const coinClearBonus = (stageId: string, isBoss: boolean): number => {
  const grade = STAGE_BY_ID[stageId]?.grade ?? 1
  return isBoss ? 50 + grade * 30 : 10 + grade * 5
}
