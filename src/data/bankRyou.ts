import { T, BT, wrong, pickWrongs, type BankGen } from './bankUtil'
import { ri, pick, shuffle } from './genUtil'

const fmtTime = (h: number, m: number) => (m === 0 ? `${h}時` : `${h}時${m}分`)
// h いがいの 時（1〜12）を n こ、シャッフルして返す
const otherHours = (h: number, n: number) =>
  shuffle(Array.from({ length: 12 }, (_, i) => i + 1).filter((x) => x !== h)).slice(0, n)

// 時こくの まちがい3つ（正解と かぶらないよう ずらす）
const timeWrongs = (baseMin: number): string[] => {
  const toT = (m: number) => fmtTime(Math.floor(m / 60), m % 60)
  const correct = toT(baseMin)
  const out: string[] = []
  for (const off of [10, -10, 60, -60, 20, -20, 30]) {
    const m = baseMin + off
    const s = toT(m)
    if (m > 0 && s !== correct && !out.includes(s)) out.push(s)
    if (out.length === 3) break
  }
  return out
}

// 量と測定のワールド：テンプレート問題バンク
export const BANK_RYOU: Record<string, BankGen[]> = {
  // ===== 1年 とけいと ながさくらべ =====
  'ryou-1': [
    T('nanji', () => {
      const h = ri(1, 12)
      return { text: `みじかい はりが「${h}」、ながい はりが「12」。いま なんじ？`, correct: `${h}じ`, wrongs: otherHours(h, 3).map((x) => `${x}じ`) }
    }),
    T('han', () => {
      const h = ri(1, 12)
      const o = otherHours(h, 2)
      return { text: `みじかい はりが「${h}」と「${(h % 12) + 1}」の あいだ、ながい はりが「6」。いま なんじ？`, correct: `${h}じはん`, wrongs: [`${o[0]}じはん`, `${h}じ`, `${o[1]}じはん`] }
    }),
    T('kurabe', () => {
      const a = ri(4, 9)
      let b = ri(4, 9)
      if (b === a) b = b === 9 ? 4 : b + 1
      const [t1, t2] = pick([['えんぴつ', 'クレヨン'], ['テープ', 'リボン'], ['ひも', 'ぼう']])
      return { text: `${t1}は ますの ${a}こ分、${t2}は ますの ${b}こ分。ながいのは どっち？`, correct: a > b ? t1 : t2, wrongs: [a > b ? t2 : t1, 'おなじ', 'くらべられない'] }
    }),
    T('hari', () => {
      if (Math.random() < 0.5) return { text: `ながい はりが とけいを ひとまわりすると、どれだけ 時間が たつ？`, correct: '60ぷん', wrongs: ['30ぷん', '12ふん', '5ふん'] }
      const h = ri(1, 11)
      return { text: `みじかい はりが「${h}」から「${h + 1}」まで うごくと、どれだけ 時間が たつ？`, correct: '1じかん', wrongs: ['2じかん', '30ぷん', '5ふん'] }
    }),
    BT('han', () => {
      const h = ri(1, 11)
      const o = otherHours(h, 2)
      return { text: `あさ おきたとき、みじかい はりは「${h}」と「${h + 1}」の あいだ、ながい はりは「6」でした。なんじ？`, correct: `${h}じはん`, wrongs: [`${o[0]}じはん`, `${h}じ`, `${o[1]}じはん`] }
    }),
    BT('kurabe', () => {
      const vals = [ri(4, 6), ri(7, 9), ri(10, 12)]
      const names = ['あ', 'い', 'う']
      const maxi = vals.indexOf(Math.max(...vals))
      return { text: `えんぴつ「あ」は ます${vals[0]}こ分、「い」は ます${vals[1]}こ分、「う」は ます${vals[2]}こ分。いちばん ながいのは？`, correct: names[maxi], wrongs: names.filter((_, i) => i !== maxi).concat('ぜんぶおなじ').slice(0, 3) }
    }),
    BT('hari', () => {
      return { text: `ながい はりが「12」から「6」まで うごくと、なんぷん たつ？`, correct: '30ぷん', wrongs: ['6ぷん', '60ぷん', '12ふん'] }
    }),
  ],

  // ===== 2年 長さとかさのたんい =====
  'ryou-2': [
    T('cmmm', () => {
      const a = ri(1, 9)
      let b = ri(1, 9)
      if (b === a) b = a === 9 ? 1 : a + 1 // a≠b にして 桁反転が正解と かぶらないように
      return { text: `${a}cm ${b}mm は なんmm？`, correct: `${a * 10 + b}mm`, wrongs: [`${a + b}mm`, `${a * 100 + b}mm`, `${b * 10 + a}mm`] }
    }),
    T('kasa', () => {
      const a = ri(1, 9)
      if (Math.random() < 0.5) return { text: `${a}L は なんdL？`, correct: `${a * 10}dL`, wrongs: [`${a}dL`, `${a * 100}dL`, `${a + 10}dL`] }
      return { text: `${a}L は なんmL？`, correct: `${a * 1000}mL`, wrongs: [`${a * 100}mL`, `${a * 10}mL`, `${a}mL`] }
    }),
    T('keisan', () => {
      const a = ri(2, 6)
      const b = ri(1, 8)
      const c = ri(1, 3)
      return { text: `${a}cm${b}mm ＋ ${c}cm ＝ ？`, correct: `${a + c}cm${b}mm`, wrongs: [`${a + c}cm${b + 1}mm`, `${a}cm${b + c}mm`, `${a + c + 1}cm${b}mm`] }
    }),
    T('daisho', () => {
      const c = ri(2, 5)
      const d = ri(1, 8)
      const v2 = c * 10 + d
      const v1 = v2 + pick([-3, -2, 2, 3])
      return { text: `${v1}mm と ${c}cm${d}mm では、どちらが ながい？`, correct: v1 > v2 ? `${v1}mm` : `${c}cm${d}mm`, wrongs: [v1 > v2 ? `${c}cm${d}mm` : `${v1}mm`, 'おなじ', 'くらべられない'] }
    }),
    T('erabi', () => {
      const [thing, unit] = pick([['プールの たての ながさ', 'm'], ['えんぴつの ながさ', 'cm'], ['ありの 体の ながさ', 'mm'], ['おふろの 水の かさ', 'L'], ['ぎゅうにゅう 1本の かさ', 'mL']])
      return { text: `「${thing}」に ちょうどよい たんいは？`, correct: unit, wrongs: ['m', 'cm', 'mm', 'L', 'mL', 'dL'].filter((u) => u !== unit).slice(0, 3) }
    }),
    BT('cmmm', () => {
      const a = ri(1, 3)
      const b = ri(10, 90)
      return { text: `${a}m ${b}cm は なんcm？`, correct: `${a * 100 + b}cm`, wrongs: [`${a * 10 + b}cm`, `${a + b}cm`, `${a * 1000 + b}cm`] }
    }),
    BT('keisan', () => {
      const a = ri(2, 5)
      const b = ri(5, 9)
      const c = ri(2, 5)
      const d = ri(5, 9)
      const mm = b + d // 10〜18（くり上がり あり）
      const cm = a + c + 1
      return { text: `${a}cm${b}mm ＋ ${c}cm${d}mm ＝ ？`, correct: `${cm}cm${mm % 10}mm`, wrongs: [`${a + c}cm${mm}mm`, `${cm}cm${(mm % 10) + 1}mm`, `${a + c}cm${mm % 10}mm`] }
    }),
    BT('kasa', () => {
      const dl = pick([2, 3, 4, 6, 7, 8]) // 5をのぞく（10-dl==dl の かぶりを ふせぐ）
      return { text: `1L − ${dl}dL ＝ なんdL？`, correct: `${10 - dl}dL`, wrongs: [`${dl}dL`, `${10 - dl + 1}dL`, `${10 + dl}dL`] }
    }),
  ],

  // ===== 3年 重さと時間 =====
  'ryou-3': [
    T('omosa', () => {
      const a = ri(1, 5)
      const b = ri(1, 9) * 100
      return { text: `${a}kg ${b}g は なんg？`, correct: `${a * 1000 + b}g`, wrongs: [`${a * 100 + b}g`, `${a + b}g`, `${a * 1000 + b + 100}g`] }
    }),
    T('jikan', () => {
      if (Math.random() < 0.5) {
        const m = ri(2, 5)
        return { text: `${m}分 は なん秒？`, correct: `${m * 60}秒`, wrongs: [`${m * 100}秒`, `${m * 10}秒`, `${m * 60 + 10}秒`] }
      }
      const h = ri(1, 3)
      const m = ri(1, 5) * 10
      return { text: `${h}時間${m}分 は なん分？`, correct: `${h * 60 + m}分`, wrongs: [`${h * 100 + m}分`, `${h + m}分`, `${h * 60 + m + 10}分`] }
    }),
    T('jikoku', () => {
      const h = ri(1, 10)
      const m = pick([10, 20, 30, 40])
      const add = pick([20, 30, 40, 50])
      const base = h * 60 + m + add
      return { text: `${fmtTime(h, m)}の ${add}分後の 時こくは？`, correct: fmtTime(Math.floor(base / 60), base % 60), wrongs: timeWrongs(base) }
    }),
    T('memori', () => {
      const u = pick([10, 20, 50, 100])
      const n = ri(2, 9)
      return { text: `1めもりが ${u}g の はかりで、はりが めもり ${n}つ分 すすみました。おもさは？`, correct: `${u * n}g`, wrongs: [`${u * (n + 1)}g`, `${u + n}g`, `${n}g`] }
    }),
    BT('omosa', () => {
      const a = ri(2, 5)
      return { text: `${a}t（トン）は なんkg？`, correct: `${a * 1000}kg`, wrongs: [`${a * 100}kg`, `${a * 10}kg`, `${a * 10000}kg`] }
    }),
    BT('keisan', () => {
      const a = ri(600, 950)
      const b = ri(400, 850)
      const total = a + b
      return { text: `${a}g ＋ ${b}g ＝ ？`, correct: total >= 1000 ? `${Math.floor(total / 1000)}kg${total % 1000}g` : `${total}g`, wrongs: [`${total}g`, `${Math.floor(total / 1000)}kg${(total % 1000) + 100}g`, `${a + b - 100}g`].slice(0, 3) }
    }),
    BT('jikoku', () => {
      const h = ri(8, 10)
      const m = pick([40, 45, 50])
      const walk = pick([20, 25, 30])
      const base = h * 60 + m + walk
      return { text: `家を ${fmtTime(h, m)}に 出て、${walk}分 あるくと なん時なん分に つく？`, correct: fmtTime(Math.floor(base / 60), base % 60), wrongs: timeWrongs(base) }
    }),
  ],

  // ===== 4年 面積 =====
  'ryou-4': [
    T('choho', () => {
      const a = ri(2, 12)
      const b = ri(2, 12)
      return { text: `たて${a}cm、よこ${b}cm の長方形の面積は？`, correct: `${a * b}cm²`, wrongs: pickWrongs(a * b, 'cm²', [2 * (a + b), a + b, a * b + a]) }
    }),
    T('seiho', () => {
      const a = ri(2, 12)
      return { text: `1辺が ${a}cm の正方形の面積は？`, correct: `${a * a}cm²`, wrongs: pickWrongs(a * a, 'cm²', [a * 4, a * 2, a * a + a]) }
    }),
    T('mawari', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      return { text: `たて${a}cm、よこ${b}cm の長方形の「まわりの長さ」は？`, correct: `${2 * (a + b)}cm`, wrongs: pickWrongs(2 * (a + b), 'cm', [a * b, a + b, 2 * (a + b) + 2]) }
    }),
    T('gyaku', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      return { text: `面積が ${a * b}cm² の長方形。たてが ${a}cm のとき、よこは？`, correct: `${b}cm`, wrongs: wrong(b, 'cm') }
    }),
    T('big', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      return { text: `たて${a}m、よこ${b}m の花だんの面積は？`, correct: `${a * b}m²`, wrongs: [...pickWrongs(a * b, 'm²', [2 * (a + b), a + b]).slice(0, 2), `${a * b}cm²`] }
    }),
    BT('choho', () => {
      const a = ri(6, 10)
      const b = ri(6, 12)
      const ca = ri(2, a - 2)
      const cb = ri(2, b - 2)
      return { text: `たて${a}cm よこ${b}cm の長方形から、たて${ca}cm よこ${cb}cm の長方形を 切り取った形の面積は？`, correct: `${a * b - ca * cb}cm²`, wrongs: [`${a * b}cm²`, `${a * b - ca * cb + ca}cm²`, `${(a - ca) * (b - cb)}cm²`] }
    }),
    BT('mawari', () => {
      const s = ri(4, 9)
      return { text: `まわりの長さが ${s * 4}cm の正方形。1辺の長さは？`, correct: `${s}cm`, wrongs: wrong(s, 'cm', [s, -1, 2]) }
    }),
    BT('big', () => {
      const a = ri(2, 4)
      return { text: `${a}m² は なんcm²？`, correct: `${a * 10000}cm²`, wrongs: [`${a * 100}cm²`, `${a * 1000}cm²`, `${a * 100000}cm²`] }
    }),
  ],

  // ===== 5年 体積 =====
  'ryou-5': [
    T('chokuho', () => {
      const a = ri(2, 6)
      const b = ri(2, 6)
      const c = ri(2, 6)
      return { text: `たて${a}cm、よこ${b}cm、高さ${c}cm の直方体の体積は？`, correct: `${a * b * c}cm³`, wrongs: pickWrongs(a * b * c, 'cm³', [a * b, a + b + c, a * b * c + a]) }
    }),
    T('rippo', () => {
      const a = ri(2, 6)
      return { text: `1辺が ${a}cm の立方体の体積は？`, correct: `${a * a * a}cm³`, wrongs: pickWrongs(a * a * a, 'cm³', [a * a, a * 6, a * 3]) }
    }),
    T('tani', () => {
      const a = ri(1, 5)
      return { text: `${a}L は なんcm³？（1L＝1000cm³）`, correct: `${a * 1000}cm³`, wrongs: [`${a * 100}cm³`, `${a * 10000}cm³`, `${a * 10}cm³`] }
    }),
    T('gyaku', () => {
      const a = ri(2, 5)
      const b = ri(2, 5)
      const c = ri(2, 6)
      return { text: `体積が ${a * b * c}cm³ の直方体。たて${a}cm、よこ${b}cm のとき、高さは？`, correct: `${c}cm`, wrongs: wrong(c, 'cm', [1, -1, a]) }
    }),
    BT('chokuho', () => {
      const a = ri(2, 5)
      const b = ri(3, 6)
      const c = ri(2, 4)
      const a2 = ri(2, 4)
      const b2 = ri(2, 3)
      return { text: `たて${a}cm よこ${b}cm 高さ${c}cm の直方体と、たて${a2}cm よこ${b2}cm 高さ${c}cm の直方体を 上下に つないだ形の体積は？`, correct: `${a * b * c + a2 * b2 * c}cm³`, wrongs: [`${a * b * c}cm³`, `${(a + a2) * (b + b2) * c}cm³`, `${a * b * c + a2 * b2 * c + c}cm³`] }
    }),
    BT('rippo', () => {
      return { text: `立方体の 1辺の長さを 2倍に すると、体積は なん倍に なる？`, correct: '8倍', wrongs: ['2倍', '4倍', '6倍'] }
    }),
    BT('tani', () => {
      const s = pick([10, 20]) // 1000cm³=1L で わりきれる 辺のみ
      const liters = (s * s * s) / 1000
      return { text: `1辺が ${s}cm の立方体に いっぱいに 入る水は なんL？`, correct: `${liters}L`, wrongs: pickWrongs(liters, 'L', [s, s * s * s]) }
    }),
  ],

  // ===== 6年 速さ =====
  'ryou-6': [
    T('michinori', () => {
      const v = pick([30, 40, 50, 60])
      const t = ri(2, 5)
      return { text: `時速${v}km で ${t}時間 走ると、すすむ道のりは？`, correct: `${v * t}km`, wrongs: [`${v + t}km`, `${v * t + v}km`, `${v}km`] }
    }),
    T('hayasa', () => {
      const v = pick([30, 40, 50, 60])
      const t = ri(2, 4)
      return { text: `${v * t}km の道のりを ${t}時間で 走る車の速さは、時速なんkm？`, correct: `時速${v}km`, wrongs: [`時速${v * t}km`, `時速${v + t}km`, `時速${v - 10}km`] }
    }),
    T('jikan', () => {
      const v = pick([30, 40, 50, 60])
      const t = ri(2, 5)
      return { text: `時速${v}km で ${v * t}km すすむには、なん時間 かかる？`, correct: `${t}時間`, wrongs: wrong(t, '時間', [1, -1, 2]) }
    }),
    T('kansan', () => {
      const v = pick([60, 120, 180, 240])
      return { text: `時速${v}km は 分速なんkm？`, correct: `分速${v / 60}km`, wrongs: [`分速${v}km`, `分速${v / 6}km`, `分速${v / 60 + 1}km`] }
    }),
    BT('michinori', () => {
      const v = pick([45, 60, 90])
      const min = pick([20, 40])
      const ans = (v * min) / 60
      return { text: `時速${v}km の車が ${min}分 走ると、すすむ道のりは？`, correct: `${ans}km`, wrongs: pickWrongs(ans, 'km', [v, ans + 5, min]) }
    }),
    BT('kansan', () => {
      const ms = pick([10, 15, 20, 25])
      return { text: `秒速${ms}m の電車の速さは、時速なんkm？`, correct: `時速${(ms * 3600) / 1000}km`, wrongs: [`時速${ms}km`, `時速${(ms * 3600) / 1000 / 6}km`, `時速${ms * 60}km`] }
    }),
    BT('jikan', () => {
      const v = pick([60, 70, 80])
      const min = ri(10, 18)
      return { text: `家から公園までは ${v * min}m。分速${v}m で あるくと なん分 かかる？`, correct: `${min}分`, wrongs: wrong(min, '分', [3, -3, v / 10]) }
    }),
  ],
}
