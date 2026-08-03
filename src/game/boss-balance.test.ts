// 大ボスの バランス：
// ・1・2年生は ミスできる回数に 上限(10回)
// ・3年生からは「だいたい 正答率85%」で クリアできる ラインに なる
import { test, expect } from 'vitest'
import { bossMistakeDamage, bossMistakesLeft, bossMistakesAllowed, bossRequiredFor, BOSS_MAX_MISTAKES, BOSS_PASS_RATE } from './logic'
import { WORLDS } from '../data/worlds'

const hpAt = (lv: number) => 20 + (lv - 1) * 3 + 38 // フル装備の HPボーナスこみ

test('1・2年生は ミス上限10回、3年生からは 正答率85%ライン', () => {
  const rows: string[] = []
  for (const w of WORLDS) {
    for (const s of w.stages) {
      const target = bossRequiredFor(s.id, 50)
      const cells: string[] = []
      for (const [lv, def] of [[10, 6], [30, 20], [50, 38]] as [number, number][]) {
        const hp = hpAt(lv)
        // じっさいに 画面に 出る 回数（ダメージから ぎゃく算した もの）
        const n = bossMistakesLeft(hp, bossMistakeDamage(s.id, def, hp, target))
        const acc = Math.round((target / (target + n)) * 1000) / 10
        cells.push(`${String(n).padStart(2)}回(${acc}%)`)
        if (s.grade <= 2) expect(n).toBeLessThanOrEqual(BOSS_MAX_MISTAKES)
      }
      // 3年生いこう・フル装備で 正答率が 85%前後（±3%）に なる
      if (s.grade >= 3) {
        const hp = hpAt(50)
        const n = bossMistakesLeft(hp, bossMistakeDamage(s.id, 38, hp, target))
        const acc = (target / (target + n)) * 100
        expect(acc).toBeGreaterThan(BOSS_PASS_RATE * 100 - 3)
        expect(acc).toBeLessThan(BOSS_PASS_RATE * 100 + 3)
      }
      rows.push(`${s.id} ${String(target).padStart(3)}問 → ${cells.join('  ')}`)
    }
  }
  console.log('（Lv10/まもり6  Lv30/まもり20  Lv50/まもり38）')
  console.log(rows.join('\n'))
})

test('ぼうぐが なければ 一撃で やられる', () => {
  for (const w of WORLDS) for (const s of w.stages) {
    expect(bossMistakesAllowed(s.id, 0, 100, bossRequiredFor(s.id, 50))).toBe(0)
    expect(bossMistakeDamage(s.id, 0, 100, 100)).toBe(100)
  }
})
