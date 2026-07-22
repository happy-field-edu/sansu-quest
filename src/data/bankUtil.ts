// 手作り問題バンクの型とヘルパー（テンプレート方式）。
// 各エントリは「gen()を呼ぶたびに 数字が乱数でかわる」テンプレート関数。
// 文脈（文章題のストーリー・単元らしさ）は保ちつつ、出題ごとに数値が変化する。

export interface BankGen {
  skillId: string // 記録用（SKILLSの技能IDにあわせる）
  boss: boolean // true = 大ボス用（総復習・やや難しめ）
  // 呼ぶたびに数字がかわる。correct を先頭に、まちがい3つを wrongs に。
  gen: () => { text: string; correct: string; wrongs: string[] }
}

// 通常問題テンプレート
export const T = (skillId: string, gen: BankGen['gen']): BankGen => ({ skillId, boss: false, gen })

// 大ボス用テンプレート（総復習）
export const BT = (skillId: string, gen: BankGen['gen']): BankGen => ({ skillId, boss: true, gen })

const gcd2 = (a: number, b: number): number => (b === 0 ? a : gcd2(b, a % b))
const reduceFrac = (n: number, d: number): string => {
  const k = gcd2(Math.abs(n), Math.abs(d)) || 1
  return `${n / k}/${d / k}`
}

// 分数 n/d の答えと、書式のそろった まちがい3つを作る。
// すべて約分し、正解や他の誤答と かぶらないよう ぶんし・ぶんぼを ずらして うめる。
// extras は「ありがちな まちがい」を [ぶんし, ぶんぼ] で先に わたせる。
export function fracChoices(n: number, d: number, extras: [number, number][] = []): { correct: string; wrongs: string[] } {
  const correct = reduceFrac(n, d)
  const wrongs: string[] = []
  const add = (nn: number, dd: number) => {
    if (wrongs.length >= 3 || nn <= 0 || dd <= 1) return
    const s = reduceFrac(nn, dd)
    if (s !== correct && !wrongs.includes(s)) wrongs.push(s)
  }
  extras.forEach(([nn, dd]) => add(nn, dd))
  const perturb: [number, number][] = [[n + 1, d], [n - 1, d], [n, d + 1], [n + 2, d], [n + d, d], [n, d - 1]]
  perturb.forEach(([nn, dd]) => add(nn, dd))
  let k = 2
  while (wrongs.length < 3 && k < 30) {
    add(n + k, d)
    add(n, d + k)
    k++
  }
  return { correct, wrongs: wrongs.slice(0, 3) }
}

// 整数の答え n（単位つき）から、書式をそろえた まちがい3つを作る。
// 0以下・重複はさけ、足りなければ ±でうめる（消去法で当てられないように単位を必ずそろえる）。
export function wrong(n: number, unit = '', offs: number[] = [1, -1, 2]): string[] {
  const out: string[] = []
  const push = (o: number) => {
    const v = n + o
    const s = `${v}${unit}`
    if (o !== 0 && v > 0 && !out.includes(s)) out.push(s)
  }
  offs.forEach(push)
  let k = 1
  while (out.length < 3 && k < 60) {
    push(k)
    push(-k)
    k++
  }
  return out.slice(0, 3)
}

// 「ありがちな まちがい」の候補（数値）を わたし、正解や たがいに かぶるものを のぞいて
// 3つに そろえる。足りなければ ±で うめる。単位は そろえる。
export function pickWrongs(correct: number, unit: string, cands: number[]): string[] {
  const cor = `${correct}${unit}`
  const out: string[] = []
  const add = (v: number) => {
    const s = `${v}${unit}`
    if (v > 0 && s !== cor && !out.includes(s)) out.push(s)
  }
  cands.forEach(add)
  let k = 1
  while (out.length < 3 && k < 80) {
    add(correct + k)
    add(correct - k)
    k++
  }
  return out.slice(0, 3)
}

// 小数の答え（けた数 dec）から、書式をそろえた まちがい3つを作る
export function wrongF(n: number, dec: number, unit = '', offs: number[] = [1, -1, 2]): string[] {
  const step = Number((10 ** -dec).toFixed(dec))
  const out: string[] = []
  const push = (o: number) => {
    const v = Number((n + o * step).toFixed(dec))
    const s = `${v.toFixed(dec)}${unit}`
    if (o !== 0 && v > 0 && !out.includes(s)) out.push(s)
  }
  offs.forEach(push)
  let k = 1
  while (out.length < 3 && k < 60) {
    push(k)
    push(-k)
    k++
  }
  return out.slice(0, 3)
}
