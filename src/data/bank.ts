import type { BankGen } from './bankUtil'
import { BANK_KEISAN } from './bankKeisan'
import { BANK_RYOU } from './bankRyou'
import { BANK_ZUKEI } from './bankZukei'
import { BANK_KANKEI } from './bankKankei'

export type { BankGen } from './bankUtil'

// 手作り問題バンク（24単元）。各エントリはテンプレート関数で、
// 出題ごとに数字が乱数でかわる。ジェネレータ（無限生成）とまぜて出題される。
export const BANK: Record<string, BankGen[]> = {
  ...BANK_KEISAN,
  ...BANK_RYOU,
  ...BANK_ZUKEI,
  ...BANK_KANKEI,
}
