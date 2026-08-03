// 大ボスの バランス：
// ・ちからが POWER_FULL に とどくと、どの学年も 25問に なる
// ・1・2年生は ミスできる回数に 上限(10回)
// ・3年生からは「だいたい 正答率85%」で クリアできる ラインに なる
import { test, expect } from 'vitest'
import {
  bossBaseOf, bossRequiredFor, bossMistakeDamage, bossMistakesLeft, bossMistakesAllowed,
  BOSS_MAX_MISTAKES, BOSS_PASS_RATE, BOSS_MIN_QUESTIONS, POWER_FULL,
} from './logic'
import { WORLDS } from '../data/worlds'

const hpAt = (lv: number) => 20 + (lv - 1) * 3 + 38 // フル装備の HPボーナスこみ

test('フル装備（ちから60）で どの学年も 25問', () => {
  const rows: string[] = []
  for (const w of WORLDS) {
    for (const s of w.stages) {
      const cells = [0, 15, 30, 45, POWER_FULL, 75].map((p) => String(bossRequiredFor(s.id, p)).padStart(3))
      expect(bossRequiredFor(s.id, POWER_FULL)).toBe(BOSS_MIN_QUESTIONS)
      expect(bossRequiredFor(s.id, 999)).toBe(BOSS_MIN_QUESTIONS) // それ以上 下がらない
      expect(bossRequiredFor(s.id, 0)).toBe(bossBaseOf(s.id)) // ちから0なら 基準どおり
      rows.push(`${s.id} 基準${String(bossBaseOf(s.id)).padStart(3)}問 → ${cells.join(' ')}`)
    }
  }
  console.log('ちから： 0   15   30   45   60   75')
  console.log(rows.join('\n'))
})

test('1・2年生は ミス上限10回、3年生からは 正答率85%ライン', () => {
  for (const w of WORLDS) {
    for (const s of w.stages) {
      const target = bossRequiredFor(s.id, 45) // そこそこ そろえた ころ
      const hp = hpAt(40)
      const n = bossMistakesLeft(hp, bossMistakeDamage(s.id, 38, hp, target))
      if (s.grade <= 2) expect(n).toBeLessThanOrEqual(BOSS_MAX_MISTAKES)
      else {
        const acc = (target / (target + n)) * 100
        expect(acc).toBeGreaterThan(BOSS_PASS_RATE * 100 - 4)
        expect(acc).toBeLessThan(BOSS_PASS_RATE * 100 + 4)
      }
    }
  }
})

test('ぼうぐが なければ 一撃で やられる', () => {
  for (const w of WORLDS) for (const s of w.stages) {
    expect(bossMistakesAllowed(s.id, 0, 100, bossRequiredFor(s.id, 50))).toBe(0)
    expect(bossMistakeDamage(s.id, 0, 100, 100)).toBe(100)
  }
})
