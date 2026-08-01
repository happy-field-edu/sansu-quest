import { T, BT, wrong, wrongF, fracChoices, type BankGen } from './bankUtil'
import { ri, pick, frac, gcd } from './genUtil'

// 数と計算のワールド：テンプレート問題バンク（呼ぶたびに数字が乱数でかわる）
export const BANK_KEISAN: Record<string, BankGen[]> = {
  // ===== 1年 たし算とひき算 =====
  'keisan-1': [
    T('add', () => {
      const a = ri(2, 8)
      const b = ri(1, 9 - a > 1 ? 9 - a : 1)
      return { text: `${a} ＋ ${b} ＝ ？`, correct: `${a + b}`, wrongs: wrong(a + b) }
    }),
    T('add', () => {
      const fruit = pick(['りんご', 'みかん', 'いちご', 'あめ'])
      const a = ri(2, 6)
      const b = ri(1, 4)
      return { text: `${fruit}が ${a}こ、もう ${b}こ あります。あわせて なんこ？`, correct: `${a + b}こ`, wrongs: wrong(a + b, 'こ') }
    }),
    T('add', () => {
      const a = ri(2, 6)
      const b = ri(1, 4)
      return { text: `バスに ${a}人 のって います。バスていで ${b}人 のってきました。ぜんぶで なん人？`, correct: `${a + b}人`, wrongs: wrong(a + b, '人') }
    }),
    T('sub', () => {
      const a = ri(4, 10)
      const b = ri(1, a - 1)
      return { text: `${a} − ${b} ＝ ？`, correct: `${a - b}`, wrongs: wrong(a - b) }
    }),
    T('sub', () => {
      const a = ri(4, 9)
      const b = ri(1, a - 1)
      return { text: `ふうせんが ${a}こ ありました。${b}こ とんでいきました。のこりは なんこ？`, correct: `${a - b}こ`, wrongs: wrong(a - b, 'こ') }
    }),
    T('three', () => {
      const a = ri(2, 5)
      const b = ri(2, 5)
      const c = ri(1, a + b - 1)
      return { text: `${a} ＋ ${b} − ${c} ＝ ？`, correct: `${a + b - c}`, wrongs: wrong(a + b - c) }
    }),
    T('box', () => {
      const total = ri(6, 10)
      const a = ri(1, total - 1)
      return { text: `${a} ＋ □ ＝ ${total}　□に はいる かずは？`, correct: `${total - a}`, wrongs: wrong(total - a) }
    }),
    T('box', () => {
      const a = ri(5, 10)
      const b = ri(1, a - 1)
      return { text: `${a} − □ ＝ ${a - b}　□に はいる かずは？`, correct: `${b}`, wrongs: wrong(b) }
    }),
    T('word', () => {
      const a = ri(3, 6)
      const b = ri(2, 4)
      return { text: `こうえんに 子どもが ${a}人 います。${b}人 きました。ぜんぶで なん人？`, correct: `${a + b}人`, wrongs: wrong(a + b, '人') }
    }),
    // ボス（くり上がり・くり下がり）
    BT('add', () => {
      const a = ri(5, 9)
      const b = ri(11 - a, 9)
      return { text: `${a} ＋ ${b} ＝ ？（くりあがりに ちゅうい！）`, correct: `${a + b}`, wrongs: wrong(a + b) }
    }),
    BT('sub', () => {
      const ans = ri(3, 9)
      const b = ri(ans + 2 > 11 ? 2 : 11 - ans, 9)
      const a = ans + b // 11〜18
      return { text: `${a} − ${b} ＝ ？（くりさがりに ちゅうい！）`, correct: `${ans}`, wrongs: wrong(ans) }
    }),
    BT('three', () => {
      const a = ri(4, 8)
      const b = ri(4, 8)
      const c = ri(2, 6)
      return { text: `${a} ＋ ${b} − ${c} ＝ ？`, correct: `${a + b - c}`, wrongs: wrong(a + b - c) }
    }),
    BT('word', () => {
      const a = ri(4, 6)
      const b = ri(2, 4)
      const c = ri(1, 3)
      return { text: `みかんが ${a}こ あります。${b}こ もらって、${c}こ たべました。いま なんこ？`, correct: `${a + b - c}こ`, wrongs: wrong(a + b - c, 'こ') }
    }),
    BT('box', () => {
      const b = ri(3, 7)
      const r = ri(4, 9)
      return { text: `□ − ${b} ＝ ${r}　□に はいる かずは？`, correct: `${b + r}`, wrongs: wrong(b + r) }
    }),
  ],

  // ===== 2年 九九 =====
  'keisan-2': [
    T('kuku', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      return { text: `${a} × ${b} ＝ ？`, correct: `${a * b}`, wrongs: wrong(a * b, '', [a, -a, 1]) }
    }),
    T('bai', () => {
      const a = ri(2, 9)
      const k = ri(2, 9)
      return { text: `${a} の ${k}ばいは いくつ？`, correct: `${a * k}`, wrongs: wrong(a * k, '', [a, -a, a + k]) }
    }),
    T('box', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      return { text: `${a} × □ ＝ ${a * b}　□に はいる かずは？`, correct: `${b}`, wrongs: wrong(b) }
    }),
    T('word', () => {
      const a = ri(2, 8)
      const b = ri(2, 8)
      const thing = pick(['あめ', 'みかん', 'クッキー', 'えんぴつ'])
      return { text: `1ふくろに ${thing}が ${a}こずつ 入って います。${b}ふくろでは ぜんぶで なんこ？`, correct: `${a * b}こ`, wrongs: wrong(a * b, 'こ', [a, -a, a + b]) }
    }),
    BT('kuku', () => {
      const a = ri(6, 9)
      const b = ri(6, 9)
      return { text: `${a} × ${b} ＝ ？`, correct: `${a * b}`, wrongs: wrong(a * b, '', [a, -a, 1]) }
    }),
    BT('rule', () => {
      const a = ri(3, 8)
      const b = ri(3, 8)
      return { text: `${a} × ${b + 1} の こたえは、${a} × ${b} の こたえより いくつ 大きい？`, correct: `${a}`, wrongs: wrong(a, '', [b, 1, -1]) }
    }),
    BT('word', () => {
      const a = ri(3, 6)
      const b = ri(3, 5)
      const c = ri(2, 5)
      return { text: `クッキーが 1はこに ${a}こずつ ${b}はこ分と、ばらで ${c}こ あります。ぜんぶで なんこ？`, correct: `${a * b + c}こ`, wrongs: wrong(a * b + c, 'こ', [a, -c, 2]) }
    }),
    // skillId は その単元に じっさいに ある技能を さすこと。
    // ない技能IDにすると 正誤きろくが きろく画面に出てこなくなる。
    BT('hissan2', () => {
      const a = ri(23, 68)
      const b = ri(23, 68)
      return { text: `ひっ算で けいさんしよう。${a} ＋ ${b} ＝ ？`, correct: `${a + b}`, wrongs: wrong(a + b, '', [10, -10, 1]) }
    }),
    BT('hissan2', () => {
      const b = ri(23, 45)
      const a = b + ri(20, 50)
      return { text: `ひっ算で けいさんしよう。${a} − ${b} ＝ ？`, correct: `${a - b}`, wrongs: wrong(a - b, '', [10, -10, 1]) }
    }),
  ],

  // ===== 3年 わり算 =====
  'keisan-3': [
    T('div', () => {
      const b = ri(2, 9)
      const q = ri(2, 9)
      return { text: `${b * q} ÷ ${b} ＝ ？`, correct: `${q}`, wrongs: wrong(q) }
    }),
    T('amari', () => {
      const b = ri(3, 9)
      const q = ri(2, 8)
      const r = ri(1, b - 1)
      return { text: `${b * q + r} ÷ ${b} ＝ ？`, correct: `${q} あまり ${r}`, wrongs: [`${q + 1} あまり ${r}`, `${q} あまり ${r === 1 ? 2 : r - 1}`, `${q - 1} あまり ${r}`] }
    }),
    T('box', () => {
      const b = ri(2, 9)
      const q = ri(2, 9)
      return { text: `□ ÷ ${b} ＝ ${q}　□に はいる かずは？`, correct: `${b * q}`, wrongs: wrong(b * q, '', [b, -b, 1]) }
    }),
    T('big', () => {
      const b = ri(2, 4)
      const q = ri(2, 4) * 10
      return { text: `${b * q} ÷ ${b} ＝ ？`, correct: `${q}`, wrongs: wrong(q, '', [10, -10, q / 10]) }
    }),
    T('word', () => {
      const b = ri(2, 6)
      const q = ri(2, 8)
      return { text: `クッキーが ${b * q}こ あります。${b}人で 同じかずずつ 分けると、1人分は なんこ？`, correct: `${q}こ`, wrongs: wrong(q, 'こ') }
    }),
    BT('amari', () => {
      const b = ri(4, 8)
      const q = ri(5, 9)
      const r = ri(1, b - 1)
      return { text: `${b * q + r} ÷ ${b} ＝ ？`, correct: `${q} あまり ${r}`, wrongs: [`${q} あまり ${r === 1 ? 2 : r - 1}`, `${q + 1} あまり ${r}`, `${q - 1} あまり ${r}`] }
    }),
    BT('word', () => {
      const b = ri(3, 5)
      const total = ri(20, 35)
      const r = total % b
      const cands: number[] = []
      for (let i = 0; i < b; i++) if (i !== r) cands.push(i)
      cands.push(Math.floor(total / b))
      const wrongs: string[] = []
      for (const c of cands) {
        const s = `${c}こ`
        if (!wrongs.includes(s) && s !== `${r}こ`) wrongs.push(s)
        if (wrongs.length === 3) break
      }
      return { text: `${total}この あめを ${b}人で 同じかずずつ 分けます。あまりは なんこ？`, correct: `${r}こ`, wrongs }
    }),
    BT('kakezanH', () => {
      const a = ri(12, 39)
      const b = ri(2, 4)
      return { text: `${a} × ${b} ＝ ？`, correct: `${a * b}`, wrongs: wrong(a * b, '', [b, -b, 10]) }
    }),
    BT('hissan3', () => {
      const a = ri(234, 678)
      const b = ri(123, 456)
      return { text: `ひっ算で けいさんしよう。${a} ＋ ${b} ＝ ？`, correct: `${a + b}`, wrongs: wrong(a + b, '', [100, -100, 10]) }
    }),
  ],

  // ===== 4年 小数 =====
  'keisan-4': [
    T('add', () => {
      const x = ri(11, 49)
      const y = ri(11, 49)
      const f = (n: number) => (n / 10).toFixed(1)
      return { text: `${f(x)} ＋ ${f(y)} ＝ ？`, correct: f(x + y), wrongs: wrongF((x + y) / 10, 1) }
    }),
    T('sub', () => {
      const y = ri(11, 40)
      const x = y + ri(5, 45)
      const f = (n: number) => (n / 10).toFixed(1)
      return { text: `${f(x)} − ${f(y)} ＝ ？`, correct: f(x - y), wrongs: wrongF((x - y) / 10, 1) }
    }),
    T('shikumi', () => {
      const n = ri(11, 99)
      return { text: `0.1 を ${n}こ あつめた かずは？`, correct: (n / 10).toFixed(1), wrongs: [`${n}`, (n / 100).toFixed(2), ((n + 1) / 10).toFixed(1)] }
    }),
    T('line', () => {
      const a = ri(1, 8)
      const k = ri(1, 9)
      return { text: `数直線で ${a} と ${a + 1} の あいだが 10こに 分かれています。${a} から めもり ${k}つ分 すすんだ かずは？`, correct: (a + k / 10).toFixed(1), wrongs: [`${a + k}`, (a + (k + 1) / 10).toFixed(1), (a + k / 100).toFixed(2)] }
    }),
    T('daisho', () => {
      const a = ri(1, 8)
      return { text: `${a}.09 と ${a}.1 では、どちらが 大きい？`, correct: `${a}.1`, wrongs: [`${a}.09`, 'おなじ', 'くらべられない'] }
    }),
    BT('add', () => {
      const x = ri(105, 380)
      const y = ri(105, 380)
      const f = (n: number) => (n / 100).toFixed(2)
      return { text: `${f(x)} ＋ ${f(y)} ＝ ？`, correct: f(x + y), wrongs: wrongF((x + y) / 100, 2) }
    }),
    BT('sub', () => {
      const x = ri(4, 8)
      const y = ri(11, 39) / 10
      return { text: `${x} − ${y.toFixed(1)} ＝ ？`, correct: (x - y).toFixed(1), wrongs: wrongF(x - y, 1) }
    }),
    BT('shikumi', () => {
      const n = ri(120, 480)
      return { text: `0.01 を ${n}こ あつめた かずは？`, correct: (n / 100).toFixed(2), wrongs: [(n / 10).toFixed(1), `${n}`, ((n + 1) / 100).toFixed(2)] }
    }),
  ],

  // ===== 5年 分数のたし算 =====
  'keisan-5': [
    T('add', () => {
      const [d1, d2] = pick([[2, 3], [2, 4], [3, 6], [3, 4], [4, 6]])
      const n1 = ri(1, d1 - 1)
      const n2 = ri(1, d2 - 1)
      const L = (d1 * d2) / gcd(d1, d2)
      const s = n1 * (L / d1) + n2 * (L / d2)
      const { correct, wrongs } = fracChoices(s, L, [[n1 + n2, d1 + d2], [s + 1, L], [n1 + n2, L]])
      return { text: `${frac(n1, d1)} ＋ ${frac(n2, d2)} ＝ ？`, correct, wrongs }
    }),
    T('sub', () => {
      const [d1, d2] = pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 5]])
      const L = (d1 * d2) / gcd(d1, d2)
      let n1 = ri(2, d1)
      let n2 = ri(1, d2 - 1)
      let diff = n1 * (L / d1) - n2 * (L / d2)
      if (diff <= 0) {
        n1 = d1 - 1
        n2 = 1
        diff = n1 * (L / d1) - n2 * (L / d2)
      }
      const { correct, wrongs } = fracChoices(diff, L, [[diff + 1, L], [n1 * (L / d1) + n2 * (L / d2), L]])
      return { text: `${frac(n1, d1)} − ${frac(n2, d2)} ＝ ？`, correct, wrongs }
    }),
    T('tsubun', () => {
      const [d1, d2] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 6]])
      const n1 = ri(1, d1 - 1)
      const L = (d1 * d2) / gcd(d1, d2)
      return { text: `${n1}/${d1} と 1/${d2} を 通分すると、${n1}/${d1} は どうなる？`, correct: `${n1 * (L / d1)}/${L}`, wrongs: [`${n1}/${L}`, `${n1 * (L / d2)}/${L}`, `${n1}/${d1 + d2}`] }
    }),
    T('yakubun', () => {
      const [n, d] = pick([[1, 2], [2, 3], [3, 4], [1, 3], [2, 5], [3, 5]])
      const k = ri(2, 4)
      const { correct, wrongs } = fracChoices(n, d)
      return { text: `${n * k}/${d * k} を 約分すると？`, correct, wrongs }
    }),
    T('daisho', () => {
      const big = pick(['2/3', '3/4', '4/5', '5/6', '3/5'])
      const smalls = ['1/3', '2/5', '1/4', '3/8', '1/2'].filter((s) => s !== big).slice(0, 3)
      return { text: `1/2 より 大きい 分数は どれ？`, correct: big, wrongs: smalls }
    }),
    BT('add', () => {
      const [d1, d2] = pick([[3, 4], [2, 3], [4, 6], [3, 5], [4, 5]])
      const n1 = ri(1, d1 - 1)
      const n2 = ri(1, d2 - 1)
      const L = (d1 * d2) / gcd(d1, d2)
      const s = n1 * (L / d1) + n2 * (L / d2)
      const { correct, wrongs } = fracChoices(s, L, [[n1 + n2, d1 + d2], [s + 1, L], [n1 + n2, L]])
      return { text: `${frac(n1, d1)} ＋ ${frac(n2, d2)} ＝ ？`, correct, wrongs }
    }),
    BT('yakubun', () => {
      const [n, d] = pick([[2, 3], [3, 4], [1, 2], [3, 5]])
      const k = ri(4, 8)
      const { correct, wrongs } = fracChoices(n, d)
      return { text: `${n * k}/${d * k} を 約分すると？`, correct, wrongs }
    }),
    BT('daisho', () => {
      const fracs = pick([['5/6', '3/4', '2/3', '1/2'], ['4/5', '3/4', '3/5', '1/2'], ['5/6', '2/3', '3/5', '1/3']])
      return { text: `いちばん 大きい 分数は どれ？`, correct: fracs[0], wrongs: fracs.slice(1) }
    }),
  ],

  // ===== 6年 分数×分数・文字式 =====
  'keisan-6': [
    T('mulInt', () => {
      const d = ri(3, 8)
      const n = ri(1, d - 1)
      const k = ri(2, 6)
      const { correct, wrongs } = fracChoices(n * k, d, [[n + k, d], [n, d * k], [n * k + 1, d]])
      return { text: `${n}/${d} × ${k} ＝ ？`, correct, wrongs }
    }),
    // ぶんぼを 先に決めて ぶんしを その下で 引く（真分数にする）。
    // べつべつに 乱数で決めると「3/3」のような 1に等しい分数が 問題文に出てしまう。
    T('mulFrac', () => {
      const d1 = ri(2, 4)
      const n1 = ri(1, d1 - 1)
      const d2 = ri(3, 5)
      const n2 = ri(1, d2 - 1)
      const { correct, wrongs } = fracChoices(n1 * n2, d1 * d2, [[n1 + n2, d1 + d2], [n1 * d2, d1 * n2]])
      return { text: `${n1}/${d1} × ${n2}/${d2} ＝ ？`, correct, wrongs }
    }),
    T('divFrac', () => {
      const d1 = ri(2, 4)
      const n1 = ri(1, d1 - 1)
      const d2 = ri(3, 5)
      const n2 = ri(1, d2 - 1)
      const { correct, wrongs } = fracChoices(n1 * d2, d1 * n2, [[n1 * n2, d1 * d2]])
      return { text: `${n1}/${d1} ÷ ${n2}/${d2} ＝ ？`, correct, wrongs }
    }),
    T('moji', () => {
      const a = ri(2, 9)
      const b = ri(2, 9)
      if (Math.random() < 0.5) return { text: `x ＋ ${a} ＝ ${a + b} の とき、x は いくつ？`, correct: `${b}`, wrongs: wrong(b, '', [a, 1, -1]) }
      return { text: `x × ${a} ＝ ${a * b} の とき、x は いくつ？`, correct: `${b}`, wrongs: wrong(b, '', [a, 1, -1]) }
    }),
    T('shiki', () => {
      const k = ri(2, 6)
      const box = ri(30, 80)
      return { text: `1こ x 円の おかしを ${k}こ 買って、${box}円の はこに 入れます。代金を あらわす式は？`, correct: `x × ${k} ＋ ${box}`, wrongs: [`x × ${box} ＋ ${k}`, `x ＋ ${k} ＋ ${box}`, `x ÷ ${k} ＋ ${box}`] }
    }),
    BT('divFrac', () => {
      const d1 = ri(4, 6)
      const n1 = ri(2, d1 - 1)
      const d2 = ri(5, 7)
      const n2 = ri(3, d2 - 1)
      const { correct, wrongs } = fracChoices(n1 * d2, d1 * n2, [[n1 * n2, d1 * d2], [n1, d1]])
      return { text: `${n1}/${d1} ÷ ${n2}/${d2} ＝ ？`, correct, wrongs }
    }),
    BT('mulFrac', () => {
      const d1 = ri(4, 5)
      const n1 = ri(2, d1 - 1)
      const d2 = ri(6, 8)
      const n2 = ri(3, d2 - 1)
      const { correct, wrongs } = fracChoices(n1 * n2, d1 * d2, [[n1 + n2, d1 + d2], [n1 * d2, d1 * n2]])
      return { text: `${n1}/${d1} × ${n2}/${d2} ＝ ？`, correct, wrongs }
    }),
    BT('moji', () => {
      const a = ri(2, 5)
      const x = ri(3, 8)
      const c = ri(1, 6)
      return { text: `x × ${a} − ${c} ＝ ${a * x - c} の とき、x は いくつ？`, correct: `${x}`, wrongs: wrong(x, '', [1, -1, a]) }
    }),
  ],
}
