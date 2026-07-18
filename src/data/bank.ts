import type { BankProblem } from './bankUtil'
import { BANK_KEISAN } from './bankKeisan'
import { BANK_RYOU } from './bankRyou'
import { BANK_ZUKEI } from './bankZukei'
import { BANK_KANKEI } from './bankKankei'

export type { BankProblem } from './bankUtil'

// 手作り問題バンク（24単元 × 通常10問＋ボス総復習6問 = 384問）。
// ジェネレータ（無限生成）とまぜて出題される。
export const BANK: Record<string, BankProblem[]> = {
  ...BANK_KEISAN,
  ...BANK_RYOU,
  ...BANK_ZUKEI,
  ...BANK_KANKEI,
}
