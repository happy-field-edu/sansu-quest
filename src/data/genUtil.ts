import type { Problem } from '../types'

// 問題ジェネレータの共通ヘルパー（generators.ts と skillsExtra.ts で共用）

export const ri = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

// 約分した分数。分母が1になったら整数であらわす（「4/2」→「2」、「3/1」→「3」）。
// 分母1の分数を そのまま出すと、算数として まちがった見せ方になる。
export const frac = (n: number, d: number): string => {
  const k = gcd(Math.abs(n), Math.abs(d)) || 1
  const den = d / k
  return den === 1 ? `${n / k}` : `${n / k}/${den}`
}

// 正解の書式（単位・記号・小数のけた数）を保ったまま、数だけずらした誤答をつくる。
// 単位のない裸の数字をまぜると、それだけが浮いて 問題を解かずに消去法で当てられてしまう。
function nearMiss(ans: string, taken: string[]): string | null {
  // 分数は ぶんし・ぶんぼを ずらして「約分ずみ」の分数にする。
  // 文字列の数だけ ずらすと 分母が 1 や 0 の分数（「2/1」など）が できてしまうので、
  // 分数だけは 専用の作り方にしている。
  const f = /^(\d+)\/(\d+)$/.exec(ans)
  if (f) {
    const n = Number(f[1])
    const d = Number(f[2])
    for (let k = 1; k <= 12; k++) {
      const cands = [
        frac(n + k, d),
        frac(n, d + k),
        n - k > 0 ? frac(n - k, d) : null,
        d - k > 1 ? frac(n, d - k) : null, // 分母は 2以上を たもつ
      ]
      for (const cand of cands) {
        if (cand !== null && cand !== ans && !taken.includes(cand)) return cand
      }
    }
    return null
  }

  const m = /^(.*?)(\d+(?:\.\d+)?)(\D*)$/.exec(ans)
  if (m === null) return null // 数をふくまない答え（「えんぴつ」「正方形」など）
  const [, head, numStr, tail] = m
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0
  const step = decimals === 0 ? 1 : Number((10 ** -decimals).toFixed(decimals))
  const n = Number(numStr)
  for (let k = 1; k <= 40; k++) {
    for (const sign of [1, -1]) {
      const v = n + sign * k * step
      if (v <= 0) continue // 小学校の答えに 0以下は 出てこない
      const cand = head + v.toFixed(decimals) + tail
      if (cand !== ans && !taken.includes(cand)) return cand
    }
  }
  return null
}

// 選択肢を「値」に正規化する。分数 a/b は数値、単位つき整数は 単位＋数値、
// それ以外は文字列そのまま。「6/12」と「1/2」のような 値がおなじ選択肢を はじくのに使う。
function canon(c: string): string {
  const f = /^(-?\d+)\/(\d+)$/.exec(c)
  if (f) return `#${Number(f[1]) / Number(f[2])}`
  const n = /^-?\d+(\.\d+)?/.exec(c)
  if (n) return `${c.replace(/^-?\d+(\.\d+)?/, '')}#${Number(n[0])}`
  return c
}

// 選択肢の 数値（先頭の数）。分数もふくむ。数でなければ null
function numVal(c: string): number | null {
  const f = /^(-?\d+)\/(\d+)$/.exec(c)
  if (f) return Number(f[1]) / Number(f[2])
  const n = /^-?\d+(\.\d+)?/.exec(c)
  return n ? Number(n[0]) : null
}

// 正解1つ + まちがい候補から3つ選んで4択にする。
// 文字列だけでなく「値」でも重複を のぞく（分数の 見た目ちがい・同値を はじく）。
// 候補が足りないときは nearMiss で「正解と同じ書式」のまちがいを作ってうめる。
// 裸の数字では うめない（消去法で当てられてしまうため）。数をふくまない答えで
// うめられないときは 3つ未満で返し、あとの sanitize() が 書式をそろえて うめる。
export function mc(text: string, answer: string | number, wrongCandidates: (string | number)[]): Problem {
  const ans = String(answer)
  const ansNum = numVal(ans)
  const takenVal = new Set([canon(ans)])
  const wrongs: string[] = []
  const tryPush = (w: string): boolean => {
    const wn = numVal(w)
    // 正解が 正の数のとき、負・ゼロの まちがいは 出さない（小学生の答えは 0以上）
    if (ansNum !== null && ansNum > 0 && wn !== null && wn <= 0) return false
    // 「4/4」「9/3」のように 整数で書ける分数は まちがいに しない。
    // 多くのテンプレートが `${a}/${b}` と 文字列で 分数を組み立てているため、
    // ぐうぜん 分子が 分母で わりきれると 約分されていない分数が ならんでしまう。
    // とくに 約分の問題で「4/4」が 出ると 何を答える問題か わからなくなる
    const wf = /^(\d+)\/(\d+)$/.exec(w)
    if (wf !== null && Number(wf[2]) !== 0 && Number(wf[1]) % Number(wf[2]) === 0) return false
    const v = canon(w)
    if (w !== ans && !wrongs.includes(w) && !takenVal.has(v)) {
      wrongs.push(w)
      takenVal.add(v)
      return true
    }
    return false
  }
  for (const w of wrongCandidates.map(String)) {
    tryPush(w)
    if (wrongs.length === 3) break
  }
  // 一度ためした数は blocked に入れて、毎回ちがう値へ ずらしていく
  const blocked = [ans]
  let guard = 0
  while (wrongs.length < 3 && guard++ < 60) {
    const filler = nearMiss(ans, [...blocked, ...wrongs])
    if (filler === null) break // これ以上 書式をたもって ずらせない
    blocked.push(filler)
    tryPush(filler)
  }
  const choices = shuffle([ans, ...wrongs])
  return { text, choices, answer: choices.indexOf(ans) }
}

export interface Skill {
  id: string
  name: string // 子どもに見せる技能名
  gen: () => Problem
}

export const S = (id: string, name: string, gen: () => Problem): Skill => ({ id, name, gen })
