import type { Problem } from '../types'
import { BANK } from './bank'

// 各単元を評価規準ベースの「技能」に細分化し、技能ごとに問題を生成する。
// 例）2年「長さとかさ」→ たんい変換 / かさのたんい / 長さの計算 / 大小くらべ / たんいえらび

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

// 正解の書式（単位・記号・小数のけた数）を保ったまま、末尾の数だけずらした誤答をつくる。
// まちがい候補が重複や正解との衝突でへったときの穴うめ用。
// 単位のない裸の数字をまぜると、それだけが浮いて 問題を解かずに消去法で当てられてしまう。
function nearMiss(ans: string, taken: string[]): string | null {
  const m = /^(.*?)(\d+(?:\.\d+)?)(\D*)$/.exec(ans)
  if (!m) return null // 数をふくまない答え（「えんぴつ」「正方形」など）
  const [, head, numStr, tail] = m
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0
  const step = decimals === 0 ? 1 : Number((10 ** -decimals).toFixed(decimals))
  const n = Number(numStr)
  for (let k = 1; k <= 20; k++) {
    for (const sign of [1, -1]) {
      const v = n + sign * k * step
      if (v <= 0) continue // 小学校では負の数を出さない
      const cand = head + v.toFixed(decimals) + tail
      if (cand !== ans && !taken.includes(cand)) return cand
    }
  }
  return null
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
    const filler = nearMiss(ans, wrongs)
    if (!filler) break
    wrongs.push(filler)
  }
  const choices = shuffle([ans, ...wrongs])
  return { text, choices, answer: choices.indexOf(ans) }
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
// 約分した分数。分母が1になったら整数であらわす（「1/1」ではなく「1」）
const frac = (n: number, d: number): string => {
  const k = gcd(n, d)
  const den = d / k
  return den === 1 ? `${n / k}` : `${n / k}/${den}`
}
const fmtTime = (h: number, m: number) => (m === 0 ? `${h}時` : `${h}時${m}分`)

// ---- 技能の定義 ----
export interface Skill {
  id: string
  name: string // 子どもに見せる技能名
  gen: () => Problem
}

const S = (id: string, name: string, gen: () => Problem): Skill => ({ id, name, gen })

export const SKILLS: Record<string, Skill[]> = {
  // ================= 数と計算 =================
  'keisan-1': [
    S('add', 'たしざん', () => {
      const a = ri(1, 9)
      const b = ri(1, 10 - a)
      return mc(`${a} ＋ ${b} ＝ ？`, a + b, [a + b + 1, a + b - 1, a + b + 2, a + b - 2])
    }),
    S('sub', 'ひきざん', () => {
      const a = ri(2, 10)
      const b = ri(1, a - 1)
      return mc(`${a} − ${b} ＝ ？`, a - b, [a - b + 1, a - b - 1, a - b + 2, a + b])
    }),
    S('three', '3つのかず', () => {
      const a = ri(2, 5)
      const b = ri(1, 5)
      const c = ri(1, a + b - 1)
      return mc(`${a} ＋ ${b} − ${c} ＝ ？`, a + b - c, [a + b - c + 1, a + b - c - 1, a + b + c, a - b + c])
    }),
    S('box', '□をもとめる', () => {
      const total = ri(5, 10)
      const a = ri(1, total - 1)
      const ans = total - a
      return mc(`${a} ＋ □ ＝ ${total}　□に はいる かずは？`, ans, [ans + 1, ans - 1, total + a, total])
    }),
    S('word', 'ぶんしょうだい', () => {
      if (Math.random() < 0.5) {
        const a = ri(2, 6)
        const b = ri(1, 4)
        return mc(`りんごが ${a}こ あります。${b}こ もらいました。ぜんぶで なんこに なった？`, `${a + b}こ`, [
          `${a + b + 1}こ`,
          `${a - b}こ`,
          `${a + b - 1}こ`,
        ])
      }
      const a = ri(5, 10)
      const b = ri(1, a - 1)
      return mc(`こどもが ${a}にん あそんで います。${b}にん かえりました。のこりは なんにん？`, `${a - b}にん`, [
        `${a - b + 1}にん`,
        `${a + b}にん`,
        `${a - b - 1}にん`,
      ])
    }),
  ],
  'keisan-2': [
    S('kuku', '九九', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      return mc(`${a} × ${b} ＝ ？`, a * b, [a * (b + 1), a * (b - 1), (a + 1) * b, a * b + 1])
    }),
    S('bai', '〜ばい', () => {
      const a = ri(2, 9)
      const k = ri(2, 9)
      return mc(`${a} の ${k}ばいは いくつ？`, a * k, [a + k, a * k + a, a * (k + 1), a * k - 1])
    }),
    S('box', '□をもとめる', () => {
      const a = ri(2, 9)
      const ans = ri(2, 9)
      return mc(`${a} × □ ＝ ${a * ans}　□に はいる かずは？`, ans, [ans + 1, ans - 1, a, a * ans])
    }),
    S('rule', '九九のきまり', () => {
      const a = ri(2, 9)
      let b = ri(2, 9)
      if (b === a) b = b === 9 ? 8 : b + 1
      return mc(`${a} × ${b} と おなじ こたえに なる しきは どれ？`, `${b} × ${a}`, [
        `${a} × ${a}`,
        `${b} × ${b}`,
        `${a + 1} × ${b}`,
      ])
    }),
    S('word', 'ぶんしょうだい', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      // a*b+a と a*(b+1) は同じ式なので、まちがい候補には片方だけ使う
      return mc(`1さらに みかんが ${a}こずつ のって います。${b}さらでは ぜんぶで なんこ？`, `${a * b}こ`, [
        `${a + b}こ`, // たし算してしまう
        `${a * (b + 1)}こ`, // 1さら多くかぞえる
        `${a * (b - 1)}こ`, // 1さら少なくかぞえる
        `${a * b + 1}こ`,
      ])
    }),
  ],
  'keisan-3': [
    S('div', 'わり算', () => {
      const b = ri(2, 9)
      const q = ri(2, 9)
      return mc(`${b * q} ÷ ${b} ＝ ？`, q, [q + 1, q - 1, q + 2, b])
    }),
    S('amari', 'あまりのあるわり算', () => {
      const b = ri(3, 9)
      const q = ri(2, 8)
      const r = ri(1, b - 1)
      return mc(`${b * q + r} ÷ ${b} ＝ ？`, `${q} あまり ${r}`, [
        `${q + 1} あまり ${r}`,
        `${q} あまり ${r === 1 ? 2 : r - 1}`,
        `${q - 1} あまり ${r}`,
      ])
    }),
    S('box', '□をもとめる', () => {
      const b = ri(2, 9)
      const q = ri(2, 9)
      return mc(`□ ÷ ${b} ＝ ${q}　□に はいる かずは？`, b * q, [b * q + b, b * q - b, b + q, q])
    }),
    S('word', 'ぶんしょうだい', () => {
      const b = ri(2, 6)
      const q = ri(2, 8)
      return mc(`${b * q}このクッキーを ${b}人で おなじかずずつ 分けます。1人分は なんこ？`, `${q}こ`, [
        `${q + 1}こ`,
        `${q - 1}こ`,
        `${b}こ`,
      ])
    }),
    S('big', 'なん十のわり算', () => {
      const b = ri(2, 4)
      const q = ri(2, 4) * 10
      return mc(`${b * q} ÷ ${b} ＝ ？`, q, [q + 10, q - 10, q / 10, b * 10])
    }),
  ],
  'keisan-4': [
    S('add', '小数のたし算', () => {
      const x = ri(11, 49)
      const y = ri(11, 49)
      const f = (n: number) => (n / 10).toFixed(1)
      return mc(`${f(x)} ＋ ${f(y)} ＝ ？`, f(x + y), [f(x + y + 1), f(x + y - 1), f(x + y + 10), f(x + y - 10)])
    }),
    S('sub', '小数のひき算', () => {
      const y = ri(11, 40)
      const x = y + ri(5, 45)
      const f = (n: number) => (n / 10).toFixed(1)
      return mc(`${f(x)} − ${f(y)} ＝ ？`, f(x - y), [f(x - y + 1), f(x - y - 1), f(x - y + 10), f(x + y)])
    }),
    S('shikumi', '0.1がなんこ', () => {
      const n = ri(11, 99)
      if (Math.random() < 0.5) {
        return mc(`0.1 を ${n}こ あつめた数は？`, (n / 10).toFixed(1), [
          String(n),
          (n / 100).toFixed(2),
          ((n + 1) / 10).toFixed(1),
        ])
      }
      return mc(`${(n / 10).toFixed(1)} は 0.1 を なんこ あつめた数？`, `${n}こ`, [`${n * 10}こ`, `${n + 1}こ`, `${Math.floor(n / 10)}こ`])
    }),
    S('daisho', '大小くらべ', () => {
      const a = ri(1, 8)
      return mc(`いちばん 大きい数は どれ？`, `${a}.5`, [`${a}.05`, `${a}.45`, `${a}.15`])
    }),
    S('line', '数直線', () => {
      const a = ri(1, 8)
      const k = ri(1, 9)
      return mc(
        `数直線で ${a} と ${a + 1} のあいだが 10こに 分かれています。${a} から めもり ${k}つ分 すすんだ ところの数は？`,
        (a + k / 10).toFixed(1),
        [String(a + k), (a + (k + 1) / 10).toFixed(1), (a - k / 10).toFixed(1), (a + k / 100).toFixed(2)],
      )
    }),
  ],
  'keisan-5': [
    S('add', '分数のたし算', () => {
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
      return mc(`${frac(n1, d1)} ＋ ${frac(n2, d2)} ＝ ？`, ans, [
        frac(n1 + n2, d1 + d2),
        `${n1 * d2 + n2 * d1 + 1}/${d1 * d2}`,
        `${n1 + n2}/${d1 * d2}`,
        '1/2',
      ])
    }),
    S('sub', '分数のひき算', () => {
      const [n1, d1, n2, d2] = pick([
        [1, 2, 1, 3],
        [3, 4, 1, 2],
        [2, 3, 1, 2],
        [5, 6, 1, 3],
        [3, 4, 1, 3],
        [1, 2, 1, 4],
      ])
      const ans = frac(n1 * d2 - n2 * d1, d1 * d2)
      return mc(`${n1}/${d1} − ${n2}/${d2} ＝ ？`, ans, [
        `${n1 * d2 - n2 * d1 + 1}/${d1 * d2}`,
        frac(n1 + n2, d1 + d2),
        '1/2',
        '1/6',
      ])
    }),
    S('tsubun', '通分', () => {
      const [d1, d2] = pick([
        [2, 3],
        [3, 4],
        [2, 5],
        [4, 6],
        [3, 5],
      ])
      const n1 = ri(1, d1 - 1)
      const L = (d1 * d2) / gcd(d1, d2)
      const ans = `${n1 * (L / d1)}/${L}`
      return mc(`${n1}/${d1} と 1/${d2} を通分すると、${n1}/${d1} は どうなる？`, ans, [
        `${n1}/${L}`,
        `${n1 * (L / d2)}/${L}`,
        `${n1}/${d1 + d2}`,
      ])
    }),
    S('yakubun', '約分', () => {
      const [n, d] = pick([
        [1, 2],
        [2, 3],
        [3, 4],
        [1, 3],
        [2, 5],
        [3, 5],
      ])
      const k = ri(2, 4)
      return mc(`${n * k}/${d * k} を 約分すると？`, `${n}/${d}`, [`${n * k}/${d}`, `${n}/${d * k}`, `${n + 1}/${d}`])
    }),
    S('daisho', '大小くらべ', () => {
      const big = pick(['2/3', '3/4', '4/5', '5/6', '3/5'])
      const smalls = shuffle(['1/3', '2/5', '1/4', '3/8', '1/2']).slice(0, 3)
      return mc(`1/2 より 大きい 分数は どれ？`, big, smalls)
    }),
  ],
  'keisan-6': [
    S('mulInt', '分数×整数', () => {
      const d = ri(3, 9)
      const n = ri(1, d - 1)
      const k = ri(2, 9)
      return mc(`${n}/${d} × ${k} ＝ ？`, frac(n * k, d), [`${n + k}/${d}`, `${n}/${d * k}`, `${n * k + 1}/${d}`, '1/2'])
    }),
    S('mulFrac', '分数×分数', () => {
      const [n1, d1, n2, d2] = [ri(1, 3), ri(2, 4), ri(1, 3), ri(2, 5)]
      return mc(`${n1}/${d1} × ${n2}/${d2} ＝ ？`, frac(n1 * n2, d1 * d2), [
        frac(n1 * d2, d1 * n2 || 1),
        `${n1 + n2}/${d1 + d2}`,
        `${n1 * n2 + 1}/${d1 * d2}`,
      ])
    }),
    S('divFrac', '分数÷分数', () => {
      const [n1, d1, n2, d2] = [ri(1, 3), ri(2, 4), ri(1, 3), ri(2, 5)]
      return mc(`${n1}/${d1} ÷ ${n2}/${d2} ＝ ？`, frac(n1 * d2, d1 * n2), [
        frac(n1 * n2, d1 * d2),
        `${n1 * d2 + 1}/${d1 * n2}`,
        '1/2',
      ])
    }),
    S('moji', 'xの値をもとめる', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      if (Math.random() < 0.5) {
        return mc(`x ＋ ${a} ＝ ${a + b} の とき、x は？`, b, [b + 1, b - 1, a + b, a])
      }
      return mc(`x × ${a} ＝ ${a * b} の とき、x は？`, b, [b + 1, b - 1, a * b, a])
    }),
    S('shiki', '式にあらわす', () => {
      const k = ri(2, 9)
      return mc(`1こ x 円の おかしを ${k}こ 買います。代金を あらわす式は どれ？`, `x × ${k}`, [
        `x ＋ ${k}`,
        `x − ${k}`,
        `x ÷ ${k}`,
      ])
    }),
  ],

  // ================= 量と測定 =================
  'ryou-1': [
    S('nanji', 'なんじ', () => {
      const h = ri(1, 12)
      return mc(
        `とけいの みじかい はりが「${h}」、ながい はりが「12」を さしているよ。いま なんじかな？`,
        `${h}じ`,
        [`${(h % 12) + 1}じ`, `${h === 1 ? 12 : h - 1}じ`, `${((h + 5) % 12) + 1}じ`],
      )
    }),
    S('han', 'なんじはん', () => {
      const h = ri(1, 12)
      return mc(
        `みじかい はりが「${h}」と「${(h % 12) + 1}」の あいだ、ながい はりが「6」を さしているよ。なんじかな？`,
        `${h}じはん`,
        [`${(h % 12) + 1}じはん`, `${h}じ`, `${h}じ6ぷん`],
      )
    }),
    S('kurabe', 'ながさくらべ', () => {
      const a = ri(3, 9)
      let b = ri(3, 9)
      if (b === a) b = b === 9 ? 3 : b + 1
      return mc(
        `えんぴつは ますの ${a}こ分、クレヨンは ますの ${b}こ分の ながさです。ながいのは どっち？`,
        a > b ? 'えんぴつ' : 'クレヨン',
        [a > b ? 'クレヨン' : 'えんぴつ', 'おなじ', 'くらべられない'],
      )
    }),
    S('hari', 'とけいのはり', () => {
      if (Math.random() < 0.5) {
        return mc(`ながい はりが とけいを ひとまわりすると、どれだけ 時間が たつ？`, '60ぷん', ['30ぷん', '12ぷん', '5ふん'])
      }
      return mc(`みじかい はりが「1」から「2」まで うごくと、どれだけ 時間が たつ？`, '1じかん', ['2じかん', '30ぷん', '5ふん'])
    }),
  ],
  'ryou-2': [
    S('cmmm', '長さのたんい', () => {
      const a = ri(1, 9)
      const b = ri(1, 9)
      return mc(`${a}cm ${b}mm は なんmm かな？`, `${a * 10 + b}mm`, [`${a + b}mm`, `${a * 100 + b}mm`, `${b * 10 + a}mm`])
    }),
    S('kasa', 'かさのたんい', () => {
      const a = ri(1, 9)
      if (Math.random() < 0.5) {
        return mc(`${a}L は なんdL かな？`, `${a * 10}dL`, [`${a}dL`, `${a * 100}dL`, `${a + 10}dL`])
      }
      return mc(`${a}L は なんmL かな？`, `${a * 1000}mL`, [`${a * 100}mL`, `${a * 10}mL`, `${a}mL`])
    }),
    S('keisan', '長さの計算', () => {
      const a = ri(2, 6)
      const b = ri(1, 8)
      const c = ri(1, 3)
      return mc(`${a}cm${b}mm ＋ ${c}cm ＝ ？`, `${a + c}cm${b}mm`, [
        `${a + c}cm${b + 1}mm`,
        `${a}cm${b + c}mm`,
        `${a + c + 1}cm${b}mm`,
      ])
    }),
    S('daisho', '大小くらべ', () => {
      const c = ri(2, 5)
      const d = ri(1, 8)
      const v2 = c * 10 + d
      const v1 = v2 + pick([-3, -2, 2, 3])
      const ans = v1 > v2 ? `${v1}mm` : `${c}cm${d}mm`
      return mc(`${v1}mm と ${c}cm${d}mm では、どちらが ながい？`, ans, [
        v1 > v2 ? `${c}cm${d}mm` : `${v1}mm`,
        'おなじ',
        'くらべられない',
      ])
    }),
    S('erabi', 'たんいえらび', () => {
      const [thing, unit] = pick([
        ['プールの たての ながさ', 'm'],
        ['えんぴつの ながさ', 'cm'],
        ['ありの 体の ながさ', 'mm'],
        ['おふろに 入れる 水の かさ', 'L'],
      ])
      return mc(`「${thing}」を あらわすのに ちょうどよい たんいは？`, unit, ['m', 'cm', 'mm', 'L'].filter((u) => u !== unit))
    }),
  ],
  'ryou-3': [
    S('omosa', '重さのたんい', () => {
      const a = ri(1, 5)
      const b = ri(1, 9) * 100
      return mc(`${a}kg ${b}g は なんg かな？`, `${a * 1000 + b}g`, [`${a * 100 + b}g`, `${a + b}g`, `${a * 1000 + b + 100}g`])
    }),
    S('jikan', '時間のたんい', () => {
      if (Math.random() < 0.5) {
        const h = ri(1, 3)
        const m = ri(1, 5) * 10
        return mc(`${h}時間${m}分 は なん分 かな？`, `${h * 60 + m}分`, [`${h * 100 + m}分`, `${h + m}分`, `${h * 60 + m + 10}分`])
      }
      const m = ri(1, 5)
      return mc(`${m}分 は なん秒 かな？`, `${m * 60}秒`, [`${m * 100}秒`, `${m * 10}秒`, `${m * 60 + 10}秒`])
    }),
    S('keisan', '重さの計算', () => {
      const a = ri(1, 3)
      const b = ri(1, 5) * 100
      const c = ri(1, 4) * 100
      const total = b + c
      return mc(
        `${a}kg${b}g の かばんに ${c}g の 本を 入れると、ぜんぶで なんkg なんg？`,
        total >= 1000 ? `${a + 1}kg${total - 1000}g` : `${a}kg${total}g`,
        [`${a}kg${b}g`, `${a + 1}kg${total >= 1000 ? total - 900 : total + 100}g`, `${a}kg${total >= 1000 ? total - 1000 : total + 100}g`],
      )
    }),
    S('jikoku', '時こくの計算', () => {
      const h = ri(1, 10)
      const m = pick([10, 20, 30, 40])
      const add = pick([20, 30, 40, 50])
      const total = m + add
      const ans = fmtTime(h + Math.floor(total / 60), total % 60)
      return mc(`${fmtTime(h, m)}の ${add}分後の 時こくは？`, ans, [
        fmtTime(h, (m + add) % 60),
        fmtTime(h + 1, (total + 10) % 60),
        fmtTime(h, add),
      ])
    }),
    S('memori', 'はかりのめもり', () => {
      const u = pick([10, 20, 50, 100])
      const n = ri(2, 9)
      return mc(`1めもりが ${u}g の はかりで、はりが めもり ${n}つ分 すすみました。おもさは なんg？`, `${u * n}g`, [
        `${u * (n + 1)}g`,
        `${u + n}g`,
        `${n}g`,
      ])
    }),
  ],
  'ryou-4': [
    S('choho', '長方形の面積', () => {
      const a = ri(2, 12)
      const b = ri(2, 12)
      return mc(`たて${a}cm、よこ${b}cm の長方形の面積は？`, `${a * b}cm²`, [
        `${2 * (a + b)}cm²`,
        `${a + b}cm²`,
        `${a * b + a}cm²`,
      ])
    }),
    S('seiho', '正方形の面積', () => {
      const a = ri(2, 12)
      return mc(`1辺が ${a}cm の正方形の面積は？`, `${a * a}cm²`, [`${a * 4}cm²`, `${a * 2}cm²`, `${a * a + a}cm²`])
    }),
    S('mawari', 'まわりの長さとのくべつ', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      return mc(`たて${a}cm、よこ${b}cm の長方形の「まわりの長さ」は？`, `${2 * (a + b)}cm`, [
        `${a * b}cm`,
        `${a + b}cm`,
        `${2 * (a + b) + 2}cm`,
      ])
    }),
    S('gyaku', 'たて・よこをもとめる', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      return mc(`面積が ${a * b}cm² の長方形。たてが ${a}cm のとき、よこは？`, `${b}cm`, [`${b + 1}cm`, `${b - 1}cm`, `${a}cm`])
    }),
    S('big', '大きな面積', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      return mc(`たて${a}m、よこ${b}m の花だんの面積は？`, `${a * b}m²`, [`${2 * (a + b)}m²`, `${a + b}m²`, `${a * b}cm²`])
    }),
  ],
  'ryou-5': [
    S('chokuho', '直方体の体積', () => {
      const a = ri(2, 6)
      const b = ri(2, 6)
      const c = ri(2, 6)
      return mc(`たて${a}cm、よこ${b}cm、高さ${c}cm の直方体の体積は？`, `${a * b * c}cm³`, [
        `${a * b}cm³`,
        `${a + b + c}cm³`,
        `${a * b * c + a}cm³`,
      ])
    }),
    S('rippo', '立方体の体積', () => {
      const a = ri(2, 6)
      return mc(`1辺が ${a}cm の立方体の体積は？`, `${a * a * a}cm³`, [`${a * a}cm³`, `${a * 6}cm³`, `${a * 3}cm³`])
    }),
    S('tani', 'かさと体積', () => {
      const a = ri(1, 5)
      return mc(`${a}L は なんcm³？（1L＝1000cm³）`, `${a * 1000}cm³`, [`${a * 100}cm³`, `${a * 10000}cm³`, `${a * 10}cm³`])
    }),
    S('gyaku', '高さをもとめる', () => {
      const a = ri(2, 5)
      const b = ri(2, 5)
      const c = ri(2, 6)
      return mc(`体積が ${a * b * c}cm³ の直方体。たて${a}cm、よこ${b}cm のとき、高さは？`, `${c}cm`, [
        `${c + 1}cm`,
        `${c - 1}cm`,
        `${a * b}cm`,
      ])
    }),
    S('m3', '大きな体積', () => {
      const a = ri(2, 4)
      const b = ri(2, 4)
      const c = ri(2, 3)
      return mc(`たて${a}m、よこ${b}m、高さ${c}m の プールの体積は？`, `${a * b * c}m³`, [
        `${a * b * c}cm³`,
        `${a + b + c}m³`,
        `${a * b}m³`,
      ])
    }),
  ],
  'ryou-6': [
    S('michinori', '道のりをもとめる', () => {
      const v = pick([30, 40, 50, 60])
      const t = ri(2, 5)
      return mc(`時速${v}km で ${t}時間 走ると、すすむ道のりは？`, `${v * t}km`, [`${v + t}km`, `${v * t + v}km`, `${v}km`])
    }),
    S('hayasa', '速さをもとめる', () => {
      const v = pick([30, 40, 50, 60])
      const t = ri(2, 4)
      return mc(`${v * t}km の道のりを ${t}時間で 走る車の速さは、時速なんkm？`, `${v}km`, [
        `${v * t}km`,
        `${v + t}km`,
        `${v - 10}km`,
      ])
    }),
    S('jikan', '時間をもとめる', () => {
      const v = pick([30, 40, 50, 60])
      const t = ri(2, 5)
      return mc(`時速${v}km で ${v * t}km すすむには、なん時間 かかる？`, `${t}時間`, [`${t + 1}時間`, `${t - 1}時間`, `${v}時間`])
    }),
    S('kansan', '時速と分速', () => {
      const v = pick([60, 120, 180, 240])
      return mc(`時速${v}km は 分速なんkm？`, `${v / 60}km`, [`${v}km`, `${v / 6}km`, `${v / 60 + 1}km`])
    }),
    S('kurabe', '速さくらべ', () => {
      const sa = ri(3, 6)
      const sb = sa + pick([-2, -1, 1, 2])
      const ta = pick([2, 3])
      const tb = pick([2, 3])
      return mc(
        `Aさんは ${sa * ta}km を ${ta}時間、Bさんは ${sb * tb}km を ${tb}時間で 歩きました。速いのは？`,
        sa > sb ? 'Aさん' : 'Bさん',
        [sa > sb ? 'Bさん' : 'Aさん', 'おなじ', 'くらべられない'],
      )
    }),
  ],

  // ================= 図形 =================
  'zukei-1': [
    S('mitsuke', 'かたちみつけ', () => {
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
    }),
    S('kazoe', 'かたちかぞえ', () => {
      const t = ri(2, 4)
      const others = 7 - t
      const seq = shuffle([
        ...Array(t).fill('🔺'),
        ...Array(Math.ceil(others / 2)).fill('🟢'),
        ...Array(Math.floor(others / 2)).fill('🟦'),
      ]).join(' ')
      return mc(`つぎの なかに 🔺は いくつ ある？\n${seq}`, `${t}こ`, [`${t + 1}こ`, `${t - 1}こ`, `${t + 2}こ`])
    }),
    S('seishitsu', 'かたちのせいしつ', () => {
      if (Math.random() < 0.5) {
        return mc(`よく ころがる かたちは どれ？`, '🟢 まる', ['🟦 しかく', '🔺 さんかく', '⭐ ほし'])
      }
      return mc(`たかく つみあげ やすい かたちは どれ？`, '🟦 しかく', ['🟢 まる', '🥚 たまご', '⭐ ほし'])
    }),
    S('kousei', 'かたちづくり', () => {
      return mc(`🔺の いろいたを 2まい あわせて できる かたちは？`, '🟦 しかく', ['🟢 まる', '⭐ ほし', '🥚 たまご'])
    }),
  ],
  'zukei-2': [
    S('choten', 'ちょう点のかず', () => {
      const shapes = [
        { name: '三角形', n: 3 },
        { name: '四角形', n: 4 },
        { name: '五角形', n: 5 },
        { name: '六角形', n: 6 },
      ]
      const t = pick(shapes)
      return mc(`${t.name} の「ちょう点」は いくつ？`, `${t.n}つ`, ['3つ', '4つ', '5つ', '6つ', '8つ'])
    }),
    S('hen', 'へんのかず', () => {
      const shapes = [
        { name: '三角形', n: 3 },
        { name: '四角形', n: 4 },
        { name: '五角形', n: 5 },
      ]
      const t = pick(shapes)
      return mc(`${t.name} の「へん」は なん本？`, `${t.n}本`, ['3本', '4本', '5本', '6本'])
    }),
    S('hanbetsu', 'かたちのなまえ', () => {
      const n = pick([3, 4])
      return mc(`${n}本の 直線で かこまれた かたちを なんと いう？`, n === 3 ? '三角形' : '四角形', [
        n === 3 ? '四角形' : '三角形',
        '円',
        '五角形',
      ])
    }),
    S('seishitsu', '長方形と正方形', () => {
      if (Math.random() < 0.5) {
        return mc(`かどが みんな 直角で、4つの辺の長さが みんな 同じ 四角形は？`, '正方形', ['長方形', '三角形', '円'])
      }
      return mc(`かどが みんな 直角で、むかいあう辺の長さが 同じ 四角形は？`, '長方形', ['正方形', '三角形', '五角形'])
    }),
    S('chokkaku', '直角のかず', () => {
      const t = pick([
        { name: '長方形', n: 4 },
        { name: '正方形', n: 4 },
        { name: '直角三角形', n: 1 },
      ])
      return mc(`${t.name} に 直角は いくつ ある？`, `${t.n}つ`, ['1つ', '2つ', '3つ', '4つ'])
    }),
  ],
  'zukei-3': [
    S('chokkei', '直径をもとめる', () => {
      const r = ri(2, 9)
      return mc(`半径 ${r}cm の円の 直径は？`, `${r * 2}cm`, [`${r}cm`, `${r * 2 + 1}cm`, `${r + 2}cm`])
    }),
    S('hankei', '半径をもとめる', () => {
      const r = ri(2, 9)
      return mc(`直径 ${r * 2}cm の円の 半径は？`, `${r}cm`, [`${r * 2}cm`, `${r * 4}cm`, `${r + 1}cm`])
    }),
    S('kotoba', '円のことば', () => {
      const q = pick([
        { t: '円の まん中の 点を なんと いう？', a: '中心' },
        { t: '中心から 円のまわりまで ひいた 直線を なんと いう？', a: '半径' },
        { t: '中心を 通って、円のはしから はしまで ひいた 直線を なんと いう？', a: '直径' },
      ])
      return mc(q.t, q.a, ['中心', '半径', '直径', '円周'].filter((w) => w !== q.a))
    }),
    S('kyu', '球のせいしつ', () => {
      return mc(`球を まっぷたつに 切ると、切り口は どんな形？`, '円', ['三角形', '四角形', '球'])
    }),
    S('compass', 'コンパスのつかい方', () => {
      const r = ri(2, 9)
      return mc(`直径 ${r * 2}cm の円を コンパスで かくには、なんcmに ひらけば よい？`, `${r}cm`, [
        `${r * 2}cm`,
        `${r * 4}cm`,
        `${r + 1}cm`,
      ])
    }),
  ],
  'zukei-4': [
    S('chokkaku', '直角なんこ分', () => {
      const n = ri(1, 4)
      return mc(`直角（90度）${n}こ分の 角度は？`, `${90 * n}度`, [`${90 * n + 10}度`, `${45 * n}度`, `${90 * (n + 1)}度`])
    }),
    S('keisan', '角度の計算', () => {
      const a = pick([30, 45, 60, 90, 120])
      const b = pick([30, 45, 60])
      if (Math.random() < 0.5 && a + b <= 180) {
        return mc(`${a}度 と ${b}度 を あわせた 角度は？`, `${a + b}度`, [`${a + b + 10}度`, `${a - b}度`, `${a + b - 5}度`])
      }
      return mc(`180度 から ${a}度 を ひいた 角度は？`, `${180 - a}度`, [`${180 - a + 10}度`, `${a}度`, `${90 - a > 0 ? 90 - a : a + 10}度`])
    }),
    S('kaiten', '半回転と一回転', () => {
      const q = pick([
        { t: '半回転の 角度は？', a: '180度' },
        { t: '一回転の 角度は？', a: '360度' },
        { t: '直角の 角度は？', a: '90度' },
      ])
      return mc(q.t, q.a, ['90度', '180度', '360度', '270度'].filter((w) => w !== q.a))
    }),
    S('jogi', '三角じょうぎの角', () => {
      const outsider = pick([50, 70, 75, 100, 120])
      const insiders = shuffle([90, 60, 45, 30]).slice(0, 3)
      return mc(`三角じょうぎの 角度に「ない」のは どれ？`, `${outsider}度`, insiders.map((n) => `${n}度`))
    }),
    S('bundoki', '分度器のめもり', () => {
      const k = ri(2, 9)
      return mc(`分度器で 10度の めもり ${k}つ分の 角度は？`, `${k * 10}度`, [`${k * 10 + 10}度`, `${k}度`, `${k * 5}度`])
    }),
  ],
  'zukei-5': [
    S('sankaku', '三角形の角', () => {
      const a = ri(3, 9) * 10
      const b = ri(2, Math.min(6, 16 - a / 10)) * 10
      const ans = 180 - a - b
      return mc(`三角形の 2つの角が ${a}度 と ${b}度 のとき、のこりの角は？`, `${ans}度`, [
        `${360 - a - b}度`,
        `${180 - a}度`,
        `${ans + 10}度`,
      ])
    }),
    S('shikaku', '四角形の角', () => {
      const a = pick([60, 70, 80, 90, 100])
      const b = pick([70, 80, 90, 100])
      const c = pick([60, 70, 80, 90])
      const ans = 360 - a - b - c
      return mc(`四角形の 3つの角が ${a}度・${b}度・${c}度 のとき、のこりの角は？`, `${ans}度`, [
        `${180 - a}度`,
        `${ans + 10}度`,
        `${ans - 10}度`,
      ])
    }),
    S('takakkei', '多角形の角の和', () => {
      const t = pick([
        { name: '三角形', n: 3 },
        { name: '四角形', n: 4 },
        { name: '五角形', n: 5 },
        { name: '六角形', n: 6 },
      ])
      const ans = (t.n - 2) * 180
      return mc(`${t.name} の 角の大きさの和は？`, `${ans}度`, [`${ans + 180}度`, `${ans - 180 > 0 ? ans - 180 : 90}度`, `${t.n * 180}度`])
    }),
    S('nitohen', '二等辺三角形の角', () => {
      const apex = pick([20, 40, 60, 80, 100])
      const base = (180 - apex) / 2
      return mc(`二等辺三角形の 頂点の角が ${apex}度 のとき、底辺の 1つの角は？`, `${base}度`, [
        `${base + 10}度`,
        `${180 - apex}度`,
        `${apex}度`,
      ])
    }),
    S('godo', '合同のせいしつ', () => {
      const q = pick([
        { t: '合同な 2つの図形で、対応する 辺の長さは どうなっている？', a: '等しい' },
        { t: '合同な 2つの図形で、対応する 角の大きさは どうなっている？', a: '等しい' },
      ])
      return mc(q.t, q.a, ['2倍になる', '半分になる', 'ばらばら'])
    }),
  ],
  'zukei-6': [
    S('menseki', '円の面積', () => {
      const r = pick([2, 3, 4, 10])
      const area = Math.round(r * r * 3.14 * 100) / 100
      const circ = Math.round(2 * r * 3.14 * 100) / 100
      return mc(`半径 ${r}cm の円の面積は？（半径×半径×3.14）`, `${area}cm²`, [`${circ}cm²`, `${r * r * 3}cm²`, `${r * r}cm²`])
    }),
    S('enshu', '円周の長さ', () => {
      const d = pick([2, 3, 4, 5, 10])
      const circ = Math.round(d * 3.14 * 100) / 100
      const half = Math.round((d / 2) * 3.14 * 100) / 100
      return mc(`直径 ${d}cm の円の 円周の長さは？（直径×3.14）`, `${circ}cm`, [`${half}cm`, `${d * 3}cm`, `${d * d}cm`])
    }),
    S('sentaisho', '線対称', () => {
      const ans = pick(['A', 'H', 'M', 'O', 'T', 'U'])
      const wrongs = shuffle(['F', 'G', 'J', 'L', 'P', 'R', 'S', 'Z']).slice(0, 3)
      return mc(`線対称な形の アルファベットは どれ？`, ans, wrongs)
    }),
    S('tentaisho', '点対称', () => {
      const ans = pick(['N', 'S', 'Z'])
      const wrongs = shuffle(['A', 'T', 'U', 'V', 'E', 'F']).slice(0, 3)
      return mc(`点対称な形（180度回すと 同じ形）の アルファベットは どれ？`, ans, wrongs)
    }),
    S('kakudai', '拡大と縮小', () => {
      if (Math.random() < 0.5) {
        const k = pick([2, 3])
        const a = ri(2, 9)
        return mc(`${a}cm の辺を ${k}倍に 拡大すると なんcm？`, `${a * k}cm`, [`${a + k}cm`, `${a * k + 1}cm`, `${a}cm`])
      }
      const a = ri(2, 6) * 2
      return mc(`${a}cm の辺を 1/2 に 縮小すると なんcm？`, `${a / 2}cm`, [`${a * 2}cm`, `${a / 2 + 1}cm`, `${a}cm`])
    }),
  ],

  // ================= 数量関係 =================
  'kankei-1': [
    S('fue', 'ふえるならび', () => {
      const start = ri(1, 5)
      const step = pick([1, 2, 3, 5, 10])
      const terms = [0, 1, 2, 3].map((i) => start + step * i)
      return mc(`${terms.join('、')}、□ …　□に はいる かずは？`, start + step * 4, [
        start + step * 4 + 1,
        start + step * 4 - 1,
        start + step * 5,
      ])
    }),
    S('heru', 'へるならび', () => {
      const step = pick([1, 2, 5])
      const start = ri(12, 20) + step * 4
      const terms = [0, 1, 2, 3].map((i) => start - step * i)
      const ans = start - step * 4
      return mc(`${terms.join('、')}、□ …　□に はいる かずは？`, ans, [ans + step, ans - step, ans + 1])
    }),
    S('sen', 'かずのせん', () => {
      const a = ri(5, 15)
      const d = ri(1, 5)
      if (Math.random() < 0.5) {
        return mc(`かずのせんで、${a} より ${d} 大きい かずは？`, a + d, [a - d, a + d + 1, a + d - 1])
      }
      return mc(`かずのせんで、${a} より ${d} 小さい かずは？`, a - d, [a + d, a - d - 1, a - d + 1])
    }),
    S('tobi', 'とびのかず', () => {
      const step = pick([2, 5, 10])
      const start = step
      const terms = [0, 1, 2].map((i) => start + step * i)
      return mc(`${step}とびで かぞえるよ。${terms.join('、')}、□ …　□は？`, start + step * 3, [
        start + step * 3 + 1,
        start + step * 2,
        start + step * 4,
      ])
    }),
    S('daisho', '大小くらべ', () => {
      const a = ri(30, 90)
      const nums = [a, a + 2, a - 3, a + 9]
      const max = Math.max(...nums)
      return mc(`いちばん 大きい かずは どれ？`, max, nums.filter((n) => n !== max))
    }),
  ],
  'kankei-2': [
    S('kazoe', '○のかず', () => {
      const fruit = pick(['🍎', '🍊', '🍇', '🍓'])
      const n = ri(3, 9)
      return mc(`${fruit} の かずを ○で あらわしたよ。\n${'○'.repeat(n)}\n${fruit} は いくつかな？`, `${n}こ`, [
        `${n + 1}こ`,
        `${n - 1}こ`,
        `${n + 2}こ`,
      ])
    }),
    S('ichiban', 'いちばん多い', () => {
      const fruits = shuffle(['りんご', 'みかん', 'いちご', 'バナナ']).slice(0, 3)
      const counts = shuffle([ri(2, 3), ri(4, 5), ri(6, 8)])
      const lines = fruits.map((f, i) => `${f}　${'○'.repeat(counts[i])}`).join('\n')
      const maxIdx = counts.indexOf(Math.max(...counts))
      return mc(`ひょうを 見て こたえてね。\n${lines}\nいちばん 多いのは どれ？`, fruits[maxIdx], [
        ...fruits.filter((_, i) => i !== maxIdx),
        'ぶどう',
      ])
    }),
    S('chigai', 'ちがいをよむ', () => {
      const a = ri(4, 9)
      const b = ri(1, a - 1)
      return mc(`りんごが ${a}こ、みかんが ${b}こ あります。りんごは みかんより なんこ 多い？`, `${a - b}こ`, [
        `${a + b}こ`,
        `${a - b + 1}こ`,
        `${a - b - 1}こ`,
      ])
    }),
    S('gokei', 'あわせたかず', () => {
      const a = ri(3, 8)
      const b = ri(2, 7)
      return mc(`いちごが ${a}こ、バナナが ${b}本 あります。あわせて いくつ？`, `${a + b}`, [
        `${a + b + 1}`,
        `${a - b}`,
        `${a + b - 1}`,
      ])
    }),
  ],
  'kankei-3': [
    S('memori', '1めもりの大きさ', () => {
      const k = pick([2, 5, 10])
      const n = ri(2, 9)
      return mc(`ぼうグラフの 1めもりは ${k} です。めもり ${n}こ分の 大きさは？`, k * n, [k * n + k, k * n - k, n])
    }),
    S('yomi', 'グラフをよむ', () => {
      const u = pick([2, 5, 10])
      const n = ri(2, 9)
      return mc(`1めもりが ${u}人の ぼうグラフで、すきな どうぶつの ぼうは めもり ${n}つ分でした。なん人？`, `${u * n}人`, [
        `${u * (n + 1)}人`,
        `${u + n}人`,
        `${n}人`,
      ])
    }),
    S('kaku', 'グラフにあらわす', () => {
      const u = pick([2, 5, 10])
      const n = ri(2, 9)
      return mc(`1めもりが ${u} の ぼうグラフで、${u * n} を あらわすには めもり いくつ分 かけば よい？`, `${n}つ分`, [
        `${n + 1}つ分`,
        `${u}つ分`,
        `${u * n}つ分`,
      ])
    }),
    S('kurabe', 'グラフでくらべる', () => {
      const u = pick([2, 5, 10])
      const n2 = ri(2, 5)
      const n1 = n2 + ri(1, 4)
      return mc(
        `1めもり${u}人の ぼうグラフで、ねこすきは めもり${n1}つ分、いぬすきは めもり${n2}つ分。ちがいは なん人？`,
        `${(n1 - n2) * u}人`,
        [`${n1 - n2}人`, `${(n1 + n2) * u}人`, `${(n1 - n2) * u + u}人`],
      )
    }),
  ],
  'kankei-4': [
    S('mawari', 'まわりの長さのきまり', () => {
      const n = ri(2, 9)
      return mc(`1辺が ${n}cm の正方形の まわりの長さは？`, `${n * 4}cm`, [`${n * 2}cm`, `${n * n}cm`, `${n + 4}cm`])
    }),
    S('hyo', '表のきまり', () => {
      const k = ri(2, 5)
      const x = ri(4, 7)
      return mc(
        `だんの数が 1、2、3…と ふえると、高さは ${k}、${k * 2}、${k * 3}…と かわります。だんの数が ${x} のとき、高さは？`,
        k * x,
        [k * (x + 1), k * x + 1, k + x],
      )
    }),
    S('wa', '和がきまった数', () => {
      const total = pick([10, 12, 15, 20])
      const a = ri(1, total - 1)
      return mc(`x ＋ y ＝ ${total} の きまりが あるとき、x が ${a} なら y は？`, total - a, [
        total + a,
        total - a + 1,
        total - a - 1,
      ])
    }),
    S('kimari', 'きまりみつけ', () => {
      if (Math.random() < 0.5) {
        const start = pick([1, 2, 3])
        const terms = [start, start * 2, start * 4, start * 8]
        return mc(`${terms.join('、')}、□ …　□に はいる かずは？（きまりを 見つけよう）`, start * 16, [
          start * 12,
          start * 10,
          start * 16 + 1,
        ])
      }
      const step = pick([2, 3, 4])
      const start = ri(15, 25)
      const terms = [0, 1, 2, 3].map((i) => start - step * i)
      const ans = start - step * 4
      return mc(`${terms.join('、')}、□ …　□に はいる かずは？`, ans, [ans + step, ans - step, ans + 1])
    }),
  ],
  'kankei-5': [
    S('ryo', 'くらべる量をもとめる', () => {
      const base = pick([100, 200, 300, 400, 500])
      const p = pick([10, 20, 50])
      return mc(`${base}円の ${p}％ は なん円？`, `${(base * p) / 100}円`, [
        `${base - p}円`,
        `${(base * p) / 10}円`,
        `${(base * p) / 100 + 10}円`,
      ])
    }),
    S('wariai', '割合をもとめる', () => {
      const base = pick([50, 100, 200, 400])
      const p = pick([10, 20, 25, 50])
      return mc(`${(base * p) / 100} は ${base} の 何％？`, `${p}％`, [`${p + 10}％`, `${p / 2 > 0 ? p / 2 : 5}％`, `${p * 2}％`])
    }),
    S('moto', 'もとにする量をもとめる', () => {
      const base = pick([200, 300, 400, 500])
      const p = pick([10, 20, 50])
      return mc(`ある ねだんの ${p}％ が ${(base * p) / 100}円 のとき、もとの ねだんは？`, `${base}円`, [
        `${base / 2}円`,
        `${base + 100}円`,
        `${(base * p) / 100}円`,
      ])
    }),
    S('buai', '歩合と百分率', () => {
      const n = ri(1, 9)
      if (Math.random() < 0.5) {
        return mc(`${n}割 は 何％？`, `${n * 10}％`, [`${n}％`, `${n * 100}％`, `${n * 10 + 5}％`])
      }
      return mc(`${n * 10}％ は 何割？`, `${n}割`, [`${n * 10}割`, `${n + 1}割`, `${n - 1 > 0 ? n - 1 : 10}割`])
    }),
    S('nebiki', 'ね引きの計算', () => {
      const base = ri(2, 10) * 100
      const p = pick([10, 20, 30, 50])
      return mc(`${base}円の品物が ${p}％引きです。はらう お金は？`, `${(base * (100 - p)) / 100}円`, [
        `${(base * p) / 100}円`,
        `${base - p}円`,
        `${(base * (100 - p)) / 100 - 10}円`,
      ])
    }),
  ],
  'kankei-6': [
    S('hirei', '比例の式', () => {
      const k = ri(2, 5)
      const x = ri(2, 9)
      // k*x+k と k*(x+1) は同じ式なので、まちがい候補には片方だけ使う
      return mc(`y ＝ ${k} × x　の式で、x が ${x} のとき y は？`, k * x, [k + x, k * (x + 1), k * (x - 1), k * x + 1])
    }),
    S('hi', '等しい比', () => {
      const a = ri(2, 5)
      const b = ri(2, 5)
      const m = ri(2, 4)
      return mc(`${a} : ${b} ＝ ${a * m} : □　□に はいる かずは？`, b * m, [a * m, b * m + 1, b + m])
    }),
    S('kantan', '比をかんたんにする', () => {
      const [a, b] = pick([
        [2, 3],
        [3, 4],
        [1, 2],
        [2, 5],
        [3, 5],
        [1, 3],
      ])
      const k = ri(2, 6)
      return mc(`${a * k} : ${b * k} を かんたんに すると？`, `${a} : ${b}`, [`${b} : ${a}`, `${a * k} : ${b}`, `${a + 1} : ${b}`])
    }),
    S('hanpirei', '反比例', () => {
      const area = pick([12, 24, 36])
      const x = pick([2, 3, 4, 6])
      return mc(`面積が ${area}cm² の長方形。たてが ${x}cm のとき、よこは？`, `${area / x}cm`, [
        `${area * x}cm`,
        `${area / x + 1}cm`,
        `${area - x}cm`,
      ])
    }),
    S('miwake', '比例の見わけ方', () => {
      const k = ri(2, 5)
      return mc(`x が 2倍、3倍…になると y も 2倍、3倍…になる（比例している）式は どれ？`, `y ＝ ${k} × x`, [
        `y ＝ x ＋ ${k}`,
        `y ＝ ${k * 6} ÷ x`,
        `y ＝ x − ${k}`,
      ])
    }),
  ],
}

// 単元の技能名リスト（UIの「みがく力」チップ用）
export function skillNames(stageId: string): string[] {
  return (SKILLS[stageId] ?? []).map((s) => s.name)
}

// 技能IDから表示名をひく（バンク問題用）
function skillNameOf(stageId: string, skillId: string): string {
  return SKILLS[stageId]?.find((s) => s.id === skillId)?.name ?? 'そうふくしゅう'
}

// 手作りバンクから1問ひく（boss=true なら総復習のむずかしめ問題）
function fromBank(stageId: string, boss: boolean): Problem | null {
  const pool = (BANK[stageId] ?? []).filter((p) => (boss ? p.boss : !p.boss))
  if (pool.length === 0) return null
  const p = pool[Math.floor(Math.random() * pool.length)]
  const choices = shuffle([...p.choices]) // 正解は choices[0] に書いてあるのでシャッフルして探す
  return {
    text: p.text,
    choices,
    answer: choices.indexOf(p.choices[0]),
    skill: skillNameOf(stageId, p.skillId),
    skillId: p.skillId,
  }
}

// 大ボス用に1問生成する。
// 70% は手作りの「総復習・むずかしめ」問題、30% は全技能まぜこぜの通常問題。
export function genBossProblem(stageId: string): Problem {
  if (Math.random() < 0.7) {
    const b = fromBank(stageId, true)
    if (b) return b
  }
  return genProblem(stageId)
}

// 1問生成する（れんしゅう用）。
// 50% は手作りバンクの実問題、50% はジェネレータ（数がえ問題）。
// stats（技能べつ正誤記録）を渡すと、ジェネレータ側は まちがいが多い技能・
// まだやっていない技能を優先して出題する。渡さなければ全技能を均等に出す。
export function genProblem(stageId: string, stats?: Record<string, { o: number; x: number }>): Problem {
  if (Math.random() < 0.5) {
    const b = fromBank(stageId, false)
    if (b) return b
  }
  const skills = SKILLS[stageId]
  if (!skills || skills.length === 0) throw new Error(`no skills for ${stageId}`)
  let skill: Skill
  if (stats) {
    const weights = skills.map((s) => {
      const st = stats[`${stageId}:${s.id}`]
      const o = st?.o ?? 0
      const x = st?.x ?? 0
      const n = o + x
      const errRate = n === 0 ? 0.5 : x / n // 未挑戦の技能もやや優先
      return 1 + errRate * 2.5 // まちがい率が高いほど出やすい（最大3.5倍）
    })
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let idx = 0
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i]
      if (r <= 0) {
        idx = i
        break
      }
    }
    skill = skills[idx]
  } else {
    skill = skills[Math.floor(Math.random() * skills.length)]
  }
  return { ...skill.gen(), skill: skill.name, skillId: skill.id }
}
