import { test, expect } from 'vitest'
import { allMonsterArts } from './monsters'

// ドット絵は 文字列で かいているので、1行でも 長さが ずれると 絵が くずれる。
// ぜんぶの絵が きちんと 正方形か 自動で たしかめる。
test('モンスターの絵は 正方形（ザコ24／大ボス32ドット）', () => {
  const bad: string[] = []
  for (const [name, art] of Object.entries(allMonsterArts())) {
    const want = name.startsWith('b:') ? 32 : 24
    if (art.length !== want) bad.push(`${name}: 行数=${art.length} (期待 ${want})`)
    art.forEach((r, i) => { if (r.length !== want) bad.push(`${name}[${i}]: 幅=${r.length} (期待 ${want}) "${r}"`) })
  }
  if (bad.length) console.log(bad.join('\n'))
  expect(bad).toEqual([])
})
