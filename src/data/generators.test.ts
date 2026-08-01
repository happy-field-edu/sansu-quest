import { describe, expect, it } from 'vitest'
import { SKILLS, genProblem, genBossProblem } from './generators'
import { BANK } from './bank'
import { WORLDS, STAGE_BY_ID } from './worlds'
import type { Problem } from '../types'

// 全24単元（4ワールド×6学年）
const STAGE_IDS = WORLDS.flatMap((w) => w.stages).map((s) => s.id)

// ---- 選択肢を見るためのヘルパー（generators.ts の内部ロジックと同じ考え方）----

// 「2/4」と「1/2」のように 見た目がちがっても 値がおなじものを 同一視するキー
function valueKey(c: string): string {
  const f = /^(-?\d+)\/(\d+)$/.exec(c)
  if (f) return `#${Number(f[1]) / Number(f[2])}`
  const n = /^-?\d+(\.\d+)?/.exec(c)
  const unit = c.replace(/^-?\d+(\.\d+)?/, '')
  return n ? `${unit}#${Number(n[0])}` : c
}

// 先頭の数（分数もふくむ）。数で はじまらなければ null
function numOf(c: string): number | null {
  const f = /^(-?\d+)\/(\d+)$/.exec(c)
  if (f) return Number(f[1]) / Number(f[2])
  const n = /^-?\d+(\.\d+)?/.exec(c)
  return n ? Number(n[0]) : null
}

// 数のうしろについている単位・記号（「12cm」→「cm」、「3」→「」、数でなければ null）
function unitOf(c: string): string | null {
  if (!/^-?\d+(\.\d+)?/.test(c)) return null
  return c.replace(/^-?\d+(\.\d+)?/, '')
}

// 単位も記号もつかない、裸の数字か（「42」= true、「42cm」「1/2」= false）
const isBareNumber = (c: string) => /^-?\d+(\.\d+)?$/.test(c)

// 1問が こどもに出しても だいじょうぶな形か しらべて、
// おかしいところを 文章のリストで返す（例外を投げないので 全単元を まとめて点検できる）。
function findProblemFlaws(p: Problem, where: string): string[] {
  const at = `${where}${p.skill ? `／${p.skill}` : ''}: ${JSON.stringify(p)}`
  const flaws: string[] = []

  // 問題文
  if (p.text.length === 0) flaws.push(`問題文がからっぽ ${at}`)
  if (/NaN|undefined|Infinity/.test(p.text)) flaws.push(`問題文に NaN/undefined ${at}`)
  // 問題文のなかの分数も 約分ずみであるべき（「3/3 ÷ …」は 出さない）
  for (const m of p.text.matchAll(/(\d+)\/(\d+)/g)) {
    const [, n, d] = m
    if (Number(d) === 1) flaws.push(`問題文に 分母1の分数「${m[0]}」 ${at}`)
    if (Number(n) === Number(d)) flaws.push(`問題文に 1に等しい分数「${m[0]}」 ${at}`)
  }
  // 「3 : 3」のような 同じ数どうしの比は 比として 意味がない
  for (const m of p.text.matchAll(/(\d+)\s*:\s*(\d+)/g)) {
    if (m[1] === m[2]) flaws.push(`問題文に 同じ数どうしの比「${m[0]}」 ${at}`)
  }

  // 4択そろっている・正解の位置が正しい
  if (p.choices.length !== 4) flaws.push(`選択肢が4つでない ${at}`)
  if (p.answer < 0 || p.answer >= p.choices.length) flaws.push(`正解のindexが範囲外 ${at}`)

  for (const c of p.choices) {
    if (c.length === 0) flaws.push(`からっぽの選択肢 ${at}`)
    if (/NaN|undefined|Infinity/.test(c)) flaws.push(`選択肢に NaN/undefined ${at}`)
    // 小学校の答えに 負の数は出てこない
    const v = numOf(c)
    if (v !== null && v < 0) flaws.push(`負の数の選択肢「${c}」 ${at}`)
    // 「3/1」「1/0」のような 未約分・ゼロ除算の分数を出さない
    if (/^-?\d+\/1$/.test(c)) flaws.push(`分母が1の分数「${c}」 ${at}`)
    if (/^-?\d+\/0$/.test(c)) flaws.push(`分母が0の分数「${c}」 ${at}`)
    // 「4/4」「6/3」のように 整数で書ける分数は 整数で書く。
    // とくに 約分の問題で「4/4」が ならぶと 何を答えるのか わからなくなる
    const fm = /^(\d+)\/(\d+)$/.exec(c)
    if (fm !== null && Number(fm[2]) !== 0 && Number(fm[1]) % Number(fm[2]) === 0) {
      flaws.push(`整数で書ける分数「${c}」 ${at}`)
    }
  }

  // 4つとも 見た目も値もちがう（同じ答えが2つ ならんでいたら 答えられない）
  if (new Set(p.choices).size !== p.choices.length) flaws.push(`同じ文字の選択肢がある ${at}`)
  if (new Set(p.choices.map(valueKey)).size !== p.choices.length) flaws.push(`値が同じ選択肢がある ${at}`)

  // 小数の 計算ごさが 出ていないか。
  // JavaScript では 3.24 * 10 が 32.400000000000006 に なるので、
  // 丸めずに 文字にすると そのまま 選択肢に出てしまう。
  // 小学校の答えに 小数第5位以上は 出てこない。
  for (const s of [p.text, ...p.choices]) {
    const m = /\d\.(\d{5,})/.exec(s)
    if (m !== null) flaws.push(`小数の計算ごさ「${m[0]}」 ${at}`)
  }

  // 「人」「こ」「円」などは わりきれる数でなければ おかしい。
  // 例）1500円 ÷ 7 = 214.2857…円 のような 答えを 出さない
  const COUNT_UNITS = ['人', 'こ', '円', '本', 'まい', 'つ分', '通り', 'さつ', 'ひき', 'だい']
  for (const c of p.choices) {
    const u = unitOf(c)
    const v = numOf(c)
    if (u !== null && v !== null && COUNT_UNITS.includes(u) && !Number.isInteger(v)) {
      flaws.push(`わりきれない「${c}」 ${at}`)
    }
  }

  // 消去法ふうじ: 正解に単位がついているなら、裸の数字を まぜない。
  // （単位なしが1つだけ あると、計算しなくても それだけ形がちがうと わかってしまう）
  // 分数（単位が「/n」）は 約分で整数になることが あるので のぞく。
  const correct = p.choices[p.answer]
  const unit = correct === undefined ? null : unitOf(correct)
  if (unit && unit.length > 0 && !unit.startsWith('/')) {
    for (const c of p.choices) {
      if (isBareNumber(c)) flaws.push(`単位つきの正解「${correct}」に 裸の数字「${c}」がまざっている ${at}`)
    }
  }
  return flaws
}

// 見つかったおかしな点を まとめて報告する。
// 「どのテンプレートの どの種類の問題か」で 1件にまとめる（数字がちがうだけの
// 同じ不具合が 何十件も ならぶのを ふせぐ）。実例は 1つだけ そえる。
function expectNoFlaws(flaws: string[]) {
  const byKind = new Map<string, string>()
  for (const f of flaws) {
    const kind = f.split(': {')[0] // 実例のJSONを のぞいた部分＝不具合の種類
    if (!byKind.has(kind)) byKind.set(kind, f)
  }
  const lines = [...byKind.values()]
  expect(lines.slice(0, 30).join('\n---\n'), `${lines.length}種類のおかしな点`).toBe('')
}

describe('単元とデータの対応', () => {
  it('4ワールド×6学年＝24単元ある', () => {
    expect(STAGE_IDS).toHaveLength(24)
  })

  it('すべての単元に 技能が4つ以上ある', () => {
    for (const id of STAGE_IDS) {
      expect(SKILLS[id], `${id} に技能がない`).toBeDefined()
      expect(SKILLS[id].length, `${id} の技能が少なすぎる`).toBeGreaterThanOrEqual(4)
    }
  })

  it('技能IDが単元のなかで かぶっていない（正誤記録が混ざらないように）', () => {
    for (const id of STAGE_IDS) {
      const ids = SKILLS[id].map((s) => s.id)
      expect(new Set(ids).size, `${id} で技能IDが重複: ${ids.join(',')}`).toBe(ids.length)
    }
  })

  it('すべての単元に 手作りバンクの問題がある（れんしゅう用・大ボス用の両方）', () => {
    for (const id of STAGE_IDS) {
      const pool = BANK[id] ?? []
      expect(pool.filter((e) => !e.boss).length, `${id} にれんしゅう用バンクがない`).toBeGreaterThan(0)
      expect(pool.filter((e) => e.boss).length, `${id} に大ボス用バンクがない`).toBeGreaterThan(0)
    }
  })

  it('バンクの skillId が その単元の技能に ある（きろく画面で 迷子にならない）', () => {
    for (const id of STAGE_IDS) {
      const known = new Set(SKILLS[id].map((s) => s.id))
      for (const entry of BANK[id] ?? []) {
        expect(known.has(entry.skillId), `${id} のバンクに 未知の skillId「${entry.skillId}」`).toBe(true)
      }
    }
  })
})

describe('れんしゅう問題（genProblem）', () => {
  it('どの単元を 何度ひいても 4択が こわれない', () => {
    const flaws: string[] = []
    for (const id of STAGE_IDS) {
      for (let i = 0; i < 400; i++) {
        flaws.push(...findProblemFlaws(genProblem(id), `れんしゅう ${id}`))
      }
    }
    expectNoFlaws(flaws)
  })

  it('技能ごとに 直接生成しても 問題文と正解が こわれない', () => {
    const flaws: string[] = []
    for (const id of STAGE_IDS) {
      for (const skill of SKILLS[id]) {
        for (let i = 0; i < 120; i++) {
          const raw = skill.gen()
          const where = `${id}／${skill.name}(${skill.id}): ${JSON.stringify(raw)}`
          if (raw.text.length === 0) flaws.push(`問題文がからっぽ ${where}`)
          if (/NaN|undefined|Infinity/.test(raw.text)) flaws.push(`問題文に NaN/undefined ${where}`)
          // 正解そのものが 負の数・NaN になっていないか（sanitize は正解を守るので ここで見る）
          const correct = raw.choices[raw.answer]
          if (correct === undefined) {
            flaws.push(`正解がとれない ${where}`)
            continue
          }
          if (/NaN|undefined|Infinity/.test(correct)) flaws.push(`正解に NaN/undefined ${where}`)
          const v = numOf(correct)
          if (v !== null && v < 0) flaws.push(`正解が負の数「${correct}」 ${where}`)
        }
      }
    }
    expectNoFlaws(flaws)
  })
})

describe('大ボス問題（genBossProblem）', () => {
  it('どの単元を 何度ひいても 4択が こわれない', () => {
    const flaws: string[] = []
    for (const id of STAGE_IDS) {
      for (let i = 0; i < 300; i++) {
        flaws.push(...findProblemFlaws(genBossProblem(id), `大ボス ${id}`))
      }
    }
    expectNoFlaws(flaws)
  })
})

describe('手作りバンクのテンプレート', () => {
  it('どのテンプレートも 毎回 まちがいを3つ そろえて返す', () => {
    const flaws: string[] = []
    for (const id of STAGE_IDS) {
      for (const entry of BANK[id] ?? []) {
        for (let i = 0; i < 300; i++) {
          const r = entry.gen()
          const where = `${id}／${entry.skillId}${entry.boss ? '(ボス)' : ''}: ${JSON.stringify(r)}`
          if (r.text.length === 0) flaws.push(`問題文がからっぽ ${where}`)
          if (/NaN|undefined|Infinity/.test(r.text)) flaws.push(`問題文に NaN/undefined ${where}`)
          if (r.correct.length === 0) flaws.push(`正解がからっぽ ${where}`)
          if (/NaN|undefined|Infinity/.test(r.correct)) flaws.push(`正解に NaN/undefined ${where}`)
          if (r.wrongs.length !== 3) flaws.push(`まちがいが3つでない ${where}`)
          if (r.wrongs.includes(r.correct)) flaws.push(`まちがいに正解が入っている ${where}`)
          // 見た目がちがっても 値がおなじ（「2/4」と「1/2」）まちがいも 出さない
          const keys = [r.correct, ...r.wrongs].map(valueKey)
          if (new Set(keys).size !== keys.length) flaws.push(`値が同じ選択肢がある ${where}`)
          for (const w of r.wrongs) {
            if (/NaN|undefined|Infinity/.test(w)) flaws.push(`まちがいに NaN/undefined ${where}`)
            const v = numOf(w)
            if (v !== null && v < 0) flaws.push(`まちがいが負の数「${w}」 ${where}`)
          }
        }
      }
    }
    expectNoFlaws(flaws)
  })
})

describe('にがて優先の出題（きろくにもとづく重みづけ）', () => {
  it('まちがいが多い技能が、できている技能より よく出る', () => {
    // 「数と計算・1年」で 1つめの技能だけ 全問まちがい、のこりは 全問正解という記録を作る
    const id = 'keisan-1'
    const skills = SKILLS[id]
    const weak = skills[0]
    const stats: Record<string, { o: number; x: number }> = {}
    for (const s of skills) {
      stats[`${id}:${s.id}`] = s.id === weak.id ? { o: 0, x: 12 } : { o: 12, x: 0 }
    }

    const count: Record<string, number> = {}
    const N = 6000
    for (let i = 0; i < N; i++) {
      const p = genProblem(id, stats)
      if (p.skillId) count[p.skillId] = (count[p.skillId] ?? 0) + 1
    }

    const weakCount = count[weak.id] ?? 0
    // にがて技能の重みは 3.5倍、できている技能は 1倍。
    // 半分は手作りバンクから出るので うすまるが、それでも はっきり多くなるはず
    for (const s of skills.slice(1)) {
      expect(weakCount, `にがての「${weak.name}」が「${s.name}」より出ていない`).toBeGreaterThan(count[s.id] ?? 0)
    }
  })

  it('きろくを わたさなければ すべての技能が出る（大ボスの総合テスト用）', () => {
    const id = 'keisan-1'
    const seen = new Set<string>()
    for (let i = 0; i < 3000; i++) {
      const p = genProblem(id)
      if (p.skillId) seen.add(p.skillId)
    }
    for (const s of SKILLS[id]) {
      expect(seen.has(s.id), `技能「${s.name}」が 1度も出なかった`).toBe(true)
    }
  })
})

describe('ステージ定義', () => {
  it('STAGE_BY_ID から 24単元すべて ひける', () => {
    for (const id of STAGE_IDS) {
      expect(STAGE_BY_ID[id], `${id} がひけない`).toBeDefined()
      expect(STAGE_BY_ID[id].grade).toBeGreaterThanOrEqual(1)
      expect(STAGE_BY_ID[id].grade).toBeLessThanOrEqual(6)
    }
  })
})
