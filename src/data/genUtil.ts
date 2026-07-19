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

// 正解の書式（単位・記号・小数のけた数）を保ったまま、末尾の数だけずらした誤答をつくる。
// 単位のない裸の数字をまぜると、それだけが浮いて 問題を解かずに消去法で当てられてしまう。
function nearMiss(ans: string, taken: string[]): string | null {
  const m = /^(.*?)(\d+(?:\.\d+)?)(\D*)$/.exec(ans)
  if (!m) return null
  const [, head, numStr, tail] = m
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0
  const step = decimals === 0 ? 1 : Number((10 ** -decimals).toFixed(decimals))
  const n = Number(numStr)
  for (let k = 1; k <= 20; k++) {
    for (const sign of [1, -1]) {
      const v = n + sign * k * step
      if (v <= 0) continue
      const cand = head + v.toFixed(decimals) + tail
      if (cand !== ans && !taken.includes(cand)) return cand
    }
  }
  return null
}

// 正解1つ + まちがい候補から3つ選んで4択にする
export function mc(text: string, answer: string | number, wrongCandidates: (string | number)[]): Problem {
  const ans = String(answer)
  const wrongs: string[] = []
  for (const w of wrongCandidates.map(String)) {
    if (w !== ans && !wrongs.includes(w)) wrongs.push(w)
    if (wrongs.length === 3) break
  }
  while (wrongs.length < 3) {
    const filler = nearMiss(ans, [ans, ...wrongs]) ?? String(ri(1, 99))
    if (filler !== ans && !wrongs.includes(filler)) wrongs.push(filler)
    else break
  }
  while (wrongs.length < 3) wrongs.push(String(ri(100, 999))) // 保険（通常ここには来ない）
  const choices = shuffle([ans, ...wrongs])
  return { text, choices, answer: choices.indexOf(ans) }
}

export const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

export const frac = (n: number, d: number): string => {
  const k = gcd(n, d)
  return `${n / k}/${d / k}`
}

export interface Skill {
  id: string
  name: string // 子どもに見せる技能名
  gen: () => Problem
}

export const S = (id: string, name: string, gen: () => Problem): Skill => ({ id, name, gen })
