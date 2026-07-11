import type { Problem } from '../types'

// ---- ヘルパー ----
const ri = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 正解1つ + まちがい候補から3つ選んで4択にする
function mc(text: string, answer: string | number, wrongCandidates: (string | number)[]): Problem {
  const ans = String(answer)
  const wrongs: string[] = []
  for (const w of wrongCandidates.map(String)) {
    if (w !== ans && !wrongs.includes(w)) wrongs.push(w)
    if (wrongs.length === 3) break
  }
  while (wrongs.length < 3) {
    const filler = String(ri(1, 99))
    if (filler !== ans && !wrongs.includes(filler)) wrongs.push(filler)
  }
  const choices = shuffle([ans, ...wrongs])
  return { text, choices, answer: choices.indexOf(ans) }
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
const frac = (n: number, d: number): string => {
  const k = gcd(n, d)
  return `${n / k}/${d / k}`
}

// ---- 各ステージの問題ジェネレータ ----
const GENERATORS: Record<string, () => Problem> = {
  // ===== 数と計算 =====
  'keisan-1': () => {
    if (Math.random() < 0.5) {
      const a = ri(1, 9)
      const b = ri(1, 10 - a)
      return mc(`${a} ＋ ${b} ＝ ？`, a + b, [a + b + 1, a + b - 1, a + b + 2, a + b - 2])
    }
    const a = ri(2, 10)
    const b = ri(1, a - 1)
    return mc(`${a} − ${b} ＝ ？`, a - b, [a - b + 1, a - b - 1, a - b + 2, a + b])
  },
  'keisan-2': () => {
    const a = ri(2, 9)
    const b = ri(2, 9)
    return mc(`${a} × ${b} ＝ ？`, a * b, [a * (b + 1), a * (b - 1), (a + 1) * b, a * b + 1])
  },
  'keisan-3': () => {
    const b = ri(2, 9)
    const q = ri(2, 9)
    return mc(`${b * q} ÷ ${b} ＝ ？`, q, [q + 1, q - 1, q + 2, b])
  },
  'keisan-4': () => {
    const x = ri(11, 49)
    const y = ri(11, 49)
    const f = (n: number) => (n / 10).toFixed(1)
    return mc(`${f(x)} ＋ ${f(y)} ＝ ？`, f(x + y), [f(x + y + 1), f(x + y - 1), f(x + y + 10), f(x + y - 10)])
  },
  'keisan-5': () => {
    const [d1, d2] = pick([
      [2, 3],
      [2, 4],
      [3, 6],
      [2, 6],
      [4, 8],
      [3, 4],
    ])
    const n1 = ri(1, d1 - 1)
    const n2 = ri(1, d2 - 1)
    const ans = frac(n1 * d2 + n2 * d1, d1 * d2)
    return mc(`${frac(n1, d1)} ＋ ${frac(n2, d2)} ＝ ？　（分数でこたえよう）`, ans, [
      frac(n1 + n2, d1 + d2),
      `${n1 * d2 + n2 * d1 + 1}/${d1 * d2}`,
      `${n1 + n2}/${d1 * d2}`,
      '1/2',
      '2/3',
    ])
  },
  'keisan-6': () => {
    const d = ri(3, 9)
    const n = ri(1, d - 1)
    const k = ri(2, 9)
    return mc(`${n}/${d} × ${k} ＝ ？　（分数でこたえよう）`, frac(n * k, d), [
      frac(n * k, d * k) === frac(n * k, d) ? `${n}/${d + 1}` : frac(n * k, d * k),
      `${n + k}/${d}`,
      `${n}/${d * k}`,
      `${n * k + 1}/${d}`,
    ])
  },

  // ===== 量と測定 =====
  'ryou-1': () => {
    const h = ri(1, 12)
    return mc(
      `とけいの みじかい はりが「${h}」、ながい はりが「12」を さしているよ。いま なんじかな？`,
      `${h}じ`,
      [`${(h % 12) + 1}じ`, `${h === 1 ? 12 : h - 1}じ`, `${((h + 5) % 12) + 1}じ`, `${h}じはん`],
    )
  },
  'ryou-2': () => {
    if (Math.random() < 0.5) {
      const a = ri(1, 9)
      const b = ri(1, 9)
      return mc(`${a}cm ${b}mm は なんmm かな？`, `${a * 10 + b}mm`, [
        `${a + b}mm`,
        `${a * 100 + b}mm`,
        `${b * 10 + a}mm`,
        `${a * 10 + b + 10}mm`,
      ])
    }
    const a = ri(1, 9)
    return mc(`${a}L は なんdL かな？`, `${a * 10}dL`, [`${a}dL`, `${a * 100}dL`, `${a * 10 + 1}dL`, `${a + 10}dL`])
  },
  'ryou-3': () => {
    if (Math.random() < 0.5) {
      const a = ri(1, 5)
      const b = ri(1, 9) * 100
      return mc(`${a}kg ${b}g は なんg かな？`, `${a * 1000 + b}g`, [
        `${a * 100 + b}g`,
        `${a + b}g`,
        `${a * 1000 + b + 100}g`,
        `${a * 10000 + b}g`,
      ])
    }
    const h = ri(1, 3)
    const m = ri(1, 5) * 10
    return mc(`${h}時間${m}分 は なん分 かな？`, `${h * 60 + m}分`, [
      `${h * 100 + m}分`,
      `${h + m}分`,
      `${h * 60 + m + 10}分`,
      `${h * 30 + m}分`,
    ])
  },
  'ryou-4': () => {
    const a = ri(2, 12)
    const b = ri(2, 12)
    return mc(`たて${a}cm、よこ${b}cm の長方形の面積は？`, `${a * b}cm²`, [
      `${2 * (a + b)}cm²`,
      `${a + b}cm²`,
      `${a * b + a}cm²`,
      `${a * b - b}cm²`,
    ])
  },
  'ryou-5': () => {
    const a = ri(2, 6)
    const b = ri(2, 6)
    const c = ri(2, 6)
    return mc(`たて${a}cm、よこ${b}cm、高さ${c}cm の直方体の体積は？`, `${a * b * c}cm³`, [
      `${a * b}cm³`,
      `${a + b + c}cm³`,
      `${a * b * c + a}cm³`,
      `${a * b * c * 2}cm³`,
    ])
  },
  'ryou-6': () => {
    const v = pick([30, 40, 50, 60])
    const t = ri(2, 5)
    return mc(`時速${v}km で ${t}時間 走ると、すすむ道のりは？`, `${v * t}km`, [
      `${v + t}km`,
      `${v * t + v}km`,
      `${v * (t + 1)}km`,
      `${v}km`,
    ])
  },

  // ===== 図形 =====
  'zukei-1': () => {
    const shapes = [
      { name: 'さんかく', sym: '🔺' },
      { name: 'まる', sym: '🟢' },
      { name: 'しかく', sym: '🟦' },
      { name: 'ほし', sym: '⭐' },
    ]
    const target = pick(shapes)
    return mc(
      `「${target.name}」の かたちは どれかな？`,
      target.sym,
      shapes.filter((s) => s.sym !== target.sym).map((s) => s.sym),
    )
  },
  'zukei-2': () => {
    const shapes = [
      { name: '三角形', n: 3 },
      { name: '四角形', n: 4 },
      { name: '五角形', n: 5 },
      { name: '六角形', n: 6 },
    ]
    const t = pick(shapes)
    return mc(`${t.name} の「ちょう点」は いくつ？`, `${t.n}つ`, ['3つ', '4つ', '5つ', '6つ', '8つ'])
  },
  'zukei-3': () => {
    const r = ri(2, 9)
    if (Math.random() < 0.5) {
      return mc(`半径 ${r}cm の円の 直径は？`, `${r * 2}cm`, [`${r}cm`, `${r * 2 + 1}cm`, `${r + 2}cm`, `${r * 3}cm`])
    }
    return mc(`直径 ${r * 2}cm の円の 半径は？`, `${r}cm`, [`${r * 2}cm`, `${r * 4}cm`, `${r + 1}cm`, `${r - 1}cm`])
  },
  'zukei-4': () => {
    const n = ri(1, 4)
    return mc(`直角（90度）${n}こ分の 角度は？`, `${90 * n}度`, [
      `${90 * n + 10}度`,
      `${45 * n}度`,
      `${90 * (n + 1)}度`,
      `${90 * n - 10}度`,
    ])
  },
  'zukei-5': () => {
    const a = ri(3, 9) * 10
    const b = ri(2, Math.min(6, 16 - a / 10)) * 10
    const ans = 180 - a - b
    return mc(`三角形の 2つの角が ${a}度 と ${b}度 のとき、のこりの角は？`, `${ans}度`, [
      `${360 - a - b}度`,
      `${180 - a}度`,
      `${a + b}度`,
      `${ans + 10}度`,
    ])
  },
  'zukei-6': () => {
    if (Math.random() < 0.5) {
      const k = pick([2, 3])
      const a = ri(2, 9)
      return mc(`${a}cm の辺を ${k}倍に 拡大すると なんcm？`, `${a * k}cm`, [
        `${a + k}cm`,
        `${a * k + 1}cm`,
        `${a * (k + 1)}cm`,
        `${a}cm`,
      ])
    }
    const r = pick([2, 3, 4, 10])
    const area = Math.round(r * r * 3.14 * 100) / 100
    const circ = Math.round(2 * r * 3.14 * 100) / 100
    return mc(`半径 ${r}cm の円の面積は？（半径×半径×3.14）`, `${area}cm²`, [
      `${circ}cm²`,
      `${Math.round(r * 3.14 * 100) / 100}cm²`,
      `${r * r * 3}cm²`,
      `${r * r}cm²`,
    ])
  },

  // ===== 数量関係 =====
  'kankei-1': () => {
    const start = ri(1, 5)
    const step = pick([1, 2, 3, 5, 10])
    const terms = [0, 1, 2, 3].map((i) => start + step * i)
    return mc(`${terms.join('、')}、□ …　□に はいる かずは？`, start + step * 4, [
      start + step * 4 + 1,
      start + step * 4 - 1,
      start + step * 5,
      start + step * 3,
    ])
  },
  'kankei-2': () => {
    const fruit = pick(['🍎', '🍊', '🍇', '🍓'])
    const n = ri(3, 9)
    return mc(`${fruit} の かずを ○で あらわしたよ。\n${'○'.repeat(n)}\n${fruit} は いくつかな？`, `${n}こ`, [
      `${n + 1}こ`,
      `${n - 1}こ`,
      `${n + 2}こ`,
    ])
  },
  'kankei-3': () => {
    const k = pick([2, 5, 10])
    const n = ri(2, 9)
    return mc(`ぼうグラフの 1めもりは ${k} です。めもり ${n}こ分の 大きさは？`, k * n, [k * n + k, k * n - k, n, k + n])
  },
  'kankei-4': () => {
    const n = ri(2, 9)
    return mc(`1辺が ${n}cm の正方形の まわりの長さは？`, `${n * 4}cm`, [
      `${n * 2}cm`,
      `${n * n}cm`,
      `${n + 4}cm`,
      `${n * 4 + 2}cm`,
    ])
  },
  'kankei-5': () => {
    const base = pick([100, 200, 300, 400, 500])
    const p = pick([10, 20, 50])
    return mc(`${base}円の ${p}％ は なん円？`, `${(base * p) / 100}円`, [
      `${base - p}円`,
      `${(base * p) / 10}円`,
      `${base + p}円`,
      `${(base * p) / 100 + 10}円`,
    ])
  },
  'kankei-6': () => {
    if (Math.random() < 0.5) {
      const k = ri(2, 5)
      const x = ri(2, 9)
      return mc(`y ＝ ${k} × x　の式で、x が ${x} のとき y は？`, k * x, [k + x, k * x + k, k * (x + 1), x])
    }
    const a = ri(2, 5)
    const b = ri(2, 5)
    const m = ri(2, 4)
    return mc(`${a} : ${b} ＝ ${a * m} : □　□に はいる かずは？`, b * m, [a * m, b * m + 1, b + m, a * b])
  },
}

export function genProblem(stageId: string): Problem {
  const gen = GENERATORS[stageId]
  if (!gen) throw new Error(`no generator for ${stageId}`)
  return gen()
}
