import type { Item } from '../types'
import { ITEMS } from './items'
import { STAGE_BY_ID } from './worlds'

// ============================================================
// どうぐや（ショップ）の しなもの
// ・村（学年ゾーン）ごとに 1けん。おくの村ほど つよい そうびを あつかう。
// ・6つの スロット（ぶき・たて・よろい・かぶと・くつ・おまもり）が
//   1つずつ ならぶので、2年生でも「どれを かうか」を えらびやすい。
// ・そのうえで、その村の そうび（たからばこと おなじもの）も 1つ ならべる。
//   → たからばこを 見つけられなくても、コインを ためれば 手にはいる。
// ============================================================

// 1・2年生の村＝きほん装備 / 3・4年生＝てつの装備 / 5・6年生＝伝説の装備
const BASIC_BY_TIER: Record<number, string[]> = {
  1: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'],
  2: ['b7', 'b8', 'b9', 'b10', 'b11', 'b12'],
  3: ['b13', 'b14', 'b15', 'b16', 'b17', 'b18'],
}

export const tierOfGrade = (grade: number) => (grade <= 2 ? 1 : grade <= 4 ? 2 : 3)

// その村の どうぐやが ならべている そうび（ならんでいる じゅん）
export function shopStock(grade: number, stageId: string): Item[] {
  const tier = tierOfGrade(grade)
  const ids = [...BASIC_BY_TIER[tier]]
  // 3年生いこうは、1つ下の ランクの やすい ぼうぐも 1つだけ のこす
  // （コインが たりない子が「なにも かえない」に ならないように）
  if (tier > 1) ids.push(BASIC_BY_TIER[tier - 1][1])
  // その村の そうび（たからばこと おなじもの）
  const local = STAGE_BY_ID[stageId]?.itemId
  if (local && !ids.includes(local)) ids.push(local)
  return ids.map((id) => ITEMS[id]).filter(Boolean)
}

// そうびの つよさ（かいかえの ときに「つよくなった？」を くらべる ものさし）
export const itemScore = (i: Item) => i.atk * 3 + i.def * 3 + i.hp

// あたらしい そうびが いまの そうびより つよいか（つよければ 自動で つけかえる）
export function isUpgrade(next: Item, current: Item | undefined): boolean {
  if (!current) return true
  return itemScore(next) > itemScore(current)
}
