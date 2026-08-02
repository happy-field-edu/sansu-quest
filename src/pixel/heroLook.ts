import type { SaveData, Slot } from '../types'
import { ITEMS } from '../data/items'

// ============================================================
// そうびを ゆうしゃの 見た目に かえる ための「見た目データ」
// 42種類の そうびに 1つずつ 絵を かくのは たいへんなので、
// つよさ（atk / def）で ランクわけして「木→鉄→金→光」のように
// かたちと 色を きめる。あたらしい そうびを ふやしても 自動で 反映される。
// ============================================================

export interface HeroLook {
  weapon: number // 0=なし 1=木のぼう 2=鉄のけん 3=金のけん 4=ひかりのけん
  shield: number // 0=なし 1=小さい たて 2=大きい たて
  armor: number // 0=たびの服 1=布 2=鉄 3=竜
  helmet: number // 0=赤いぼうし 1=かわ 2=鉄 3=せいなる
  boots: number // 0=ふつう 1=かわ 2=鉄 3=風
  charm: boolean // おまもりを つけていると むねの かざりが 光る
}

export const NO_LOOK: HeroLook = { weapon: 0, shield: 0, armor: 0, helmet: 0, boots: 0, charm: false }

export function heroLookOf(save: SaveData): HeroLook {
  const eq = (slot: Slot) => {
    const id = save.equipped[slot]
    return id ? ITEMS[id] : undefined
  }
  const w = eq('ぶき')
  const s = eq('たて')
  const a = eq('よろい')
  const h = eq('かぶと')
  const b = eq('くつ')
  return {
    weapon: w ? (w.atk <= 2 ? 1 : w.atk <= 6 ? 2 : w.atk <= 10 ? 3 : 4) : 0,
    shield: s ? (s.def <= 3 ? 1 : 2) : 0,
    armor: a ? (a.def <= 2 ? 1 : a.def <= 5 ? 2 : 3) : 0,
    helmet: h ? (h.def <= 2 ? 1 : h.def <= 5 ? 2 : 3) : 0,
    boots: b ? (b.def <= 2 ? 1 : b.def <= 4 ? 2 : 3) : 0,
    charm: Boolean(eq('おまもり')),
  }
}

// キャッシュの かぎ（おなじ 見た目なら 絵を つくりなおさない）
export const lookKey = (l: HeroLook) =>
  `${l.weapon}${l.shield}${l.armor}${l.helmet}${l.boots}${l.charm ? 1 : 0}`
