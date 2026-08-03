// 大ボスの バランス：ぼうぐを かためても ミスできる回数が
// 上限を こえない ことを たしかめる（こえると 楽勝に なってしまう）
import { test, expect } from 'vitest'
import { bossMistakeDamage, bossMistakesLeft, bossRequiredFor, BOSS_MAX_MISTAKES } from './logic'
import { WORLDS } from '../data/worlds'

test('ミスできる回数は 上限を こえない', () => {
  const hpAt = (lv: number) => 20 + (lv - 1) * 3 + 38 // フル装備のHPボーナスこみ
  let worst = 0
  const rows: string[] = []
  for (const w of WORLDS) {
    for (const s of w.stages) {
      const cells: string[] = []
      for (const [lv, def] of [[10, 6], [30, 20], [50, 38], [99, 38]] as [number, number][]) {
        const hp = hpAt(lv)
        const n = bossMistakesLeft(hp, bossMistakeDamage(s.id, def, hp))
        worst = Math.max(worst, n)
        cells.push(String(n))
      }
      if (s.grade <= 2 || s.grade === 6) rows.push(`${s.id} ${String(bossRequiredFor(s.id, 50)).padStart(3)}問 → ${cells.join(' / ')}`)
    }
  }
  console.log('Lv10def6 / Lv30def20 / Lv50def38 / Lv99def38')
  console.log(rows.join('\n'))
  console.log('さいだいの ミス回数 =', worst, '（上限', BOSS_MAX_MISTAKES, '）')
  expect(worst).toBeLessThanOrEqual(BOSS_MAX_MISTAKES)
})
