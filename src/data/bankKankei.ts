import { T, BT, wrong, pickWrongs, type BankGen } from './bankUtil'
import { ri, pick, shuffle, gcd } from './genUtil'

// 数量関係のワールド：テンプレート問題バンク
export const BANK_KANKEI: Record<string, BankGen[]> = {
  // ===== 1年 かずのならび =====
  'kankei-1': [
    T('fue', () => {
      const start = ri(1, 5)
      const step = pick([1, 2, 3, 5])
      const terms = [0, 1, 2, 3].map((i) => start + step * i)
      return { text: `${terms.join('、')}、□ …　□に はいる かずは？`, correct: `${start + step * 4}`, wrongs: wrong(start + step * 4, '', [1, -1, step]) }
    }),
    T('heru', () => {
      const step = pick([1, 2, 5])
      const start = ri(12, 20) + step * 4
      const terms = [0, 1, 2, 3].map((i) => start - step * i)
      const ans = start - step * 4
      return { text: `${terms.join('、')}、□ …　□に はいる かずは？`, correct: `${ans}`, wrongs: wrong(ans, '', [step, -step, 1]) }
    }),
    T('sen', () => {
      const a = ri(5, 15)
      const d = ri(1, 5)
      if (Math.random() < 0.5) return { text: `かずのせんで、${a} より ${d} 大きい かずは？`, correct: `${a + d}`, wrongs: wrong(a + d, '', [1, -1, d]) }
      return { text: `かずのせんで、${a} より ${d} 小さい かずは？`, correct: `${a - d}`, wrongs: wrong(a - d, '', [1, -1, d]) }
    }),
    T('tobi', () => {
      const step = pick([2, 5, 10])
      const terms = [1, 2, 3].map((i) => step * i)
      return { text: `${step}とびで かぞえるよ。${terms.join('、')}、□ …　□は？`, correct: `${step * 4}`, wrongs: wrong(step * 4, '', [1, -step, step]) }
    }),
    T('daisho', () => {
      const nums = shuffle([ri(30, 45), ri(50, 65), ri(70, 89), ri(20, 29)])
      const max = Math.max(...nums)
      return { text: `いちばん 大きい かずは どれ？`, correct: `${max}`, wrongs: nums.filter((n) => n !== max).map(String) }
    }),
    BT('sen', () => {
      const tens = ri(2, 8)
      let ones = ri(1, 9)
      if (ones === tens) ones = tens === 9 ? 1 : ones + 1 // 桁反転が正解と かぶらないように
      const ans = tens * 10 + ones
      return { text: `10 が ${tens}こ と、1 が ${ones}こ で いくつ？`, correct: `${ans}`, wrongs: pickWrongs(ans, '', [ones * 10 + tens, tens + ones, ans + 1]) }
    }),
    BT('sen', () => {
      const a = ri(3, 8) * 10
      return { text: `かずのせんで、${a} と ${a + 10} の ちょうど まんなかの かずは？`, correct: `${a + 5}`, wrongs: wrong(a + 5, '', [1, -1, 5]) }
    }),
  ],

  // ===== 2年 ひょうとグラフ =====
  'kankei-2': [
    T('kazoe', () => {
      const fruit = pick(['🍎', '🍊', '🍇', '🍓'])
      const n = ri(3, 9)
      return { text: `${fruit} の かずを ○で あらわしたよ。\n${'○'.repeat(n)}\n${fruit} は いくつ？`, correct: `${n}こ`, wrongs: wrong(n, 'こ') }
    }),
    T('ichiban', () => {
      const fruits = shuffle(['りんご', 'みかん', 'いちご', 'バナナ']).slice(0, 3)
      const counts = shuffle([ri(2, 3), ri(4, 5), ri(6, 8)])
      const lines = fruits.map((f, i) => `${f}　${'○'.repeat(counts[i])}`).join('\n')
      const maxi = counts.indexOf(Math.max(...counts))
      return { text: `ひょうを 見て こたえてね。\n${lines}\nいちばん 多いのは どれ？`, correct: fruits[maxi], wrongs: fruits.filter((_, i) => i !== maxi).concat('ぶどう').slice(0, 3) }
    }),
    T('chigai', () => {
      const a = ri(5, 9)
      const b = ri(1, a - 1)
      return { text: `りんごが ${a}こ、みかんが ${b}こ あります。りんごは みかんより なんこ 多い？`, correct: `${a - b}こ`, wrongs: wrong(a - b, 'こ') }
    }),
    T('gokei', () => {
      const a = ri(3, 8)
      const b = ri(2, 7)
      return { text: `いちごが ${a}こ、バナナが ${b}本 あります。あわせて いくつ？`, correct: `${a + b}`, wrongs: wrong(a + b) }
    }),
    BT('gokei', () => {
      const a = ri(4, 7)
      const b = ri(3, 6)
      const c = ri(2, 5)
      return { text: `りんご${a}こ、みかん${b}こ、いちご${c}こ。くだものは ぜんぶで なんこ？`, correct: `${a + b + c}こ`, wrongs: wrong(a + b + c, 'こ') }
    }),
    BT('chigai', () => {
      const a = ri(8, 14)
      const b = ri(3, 7)
      return { text: `いぬが ${a}ひき、ねこが ${b}ひき います。ちがいは なんびき？`, correct: `${a - b}ひき`, wrongs: [`${a + b}ひき`, `${a - b + 1}ひき`, `${a - b - 1}ひき`] }
    }),
  ],

  // ===== 3年 ぼうグラフ =====
  'kankei-3': [
    T('memori', () => {
      const k = pick([2, 5, 10])
      const n = ri(2, 9)
      return { text: `ぼうグラフの 1めもりは ${k} です。めもり ${n}こ分の 大きさは？`, correct: `${k * n}`, wrongs: wrong(k * n, '', [k, -k, n]) }
    }),
    // まちがい候補は 手で3つならべず pickWrongs にわたす。
    // u=2, n=2 のときの u+n(=4) と u*n(=4) のように、
    // ある数のくみあわせだけ 正解とかぶるのを 自動で のぞいてくれる。
    T('yomi', () => {
      const u = pick([2, 5, 10])
      const n = ri(2, 9)
      return {
        text: `1めもりが ${u}人の ぼうグラフで、ぼうは めもり ${n}つ分。なん人？`,
        correct: `${u * n}人`,
        wrongs: pickWrongs(u * n, '人', [u * (n + 1), u + n, n]),
      }
    }),
    T('kaku', () => {
      const u = pick([2, 5, 10])
      const n = ri(2, 9)
      return {
        text: `${u * n} を あらわすには、1めもり ${u} の ぼうグラフで めもり いくつ分？`,
        correct: `${n}つ分`,
        wrongs: pickWrongs(n, 'つ分', [n + 1, u, u * n]),
      }
    }),
    T('kurabe', () => {
      const u = pick([2, 5, 10])
      const n2 = ri(2, 5)
      const n1 = n2 + ri(1, 4)
      return { text: `1めもり${u}人の ぼうグラフで、ねこすきは めもり${n1}つ分、いぬすきは めもり${n2}つ分。ちがいは なん人？`, correct: `${(n1 - n2) * u}人`, wrongs: [`${n1 - n2}人`, `${(n1 + n2) * u}人`, `${(n1 - n2) * u + u}人`] }
    }),
    BT('kurabe', () => {
      const total = ri(25, 35)
      const a = ri(8, 13)
      const b = ri(7, 11)
      // total が a+b の ちょうど2倍のとき、a+b が 正解(total-a-b)と かぶる
      return {
        text: `クラス${total}人に すきな 動物を 聞きました。犬${a}人、ねこ${b}人、のこりは 鳥。鳥は なん人？`,
        correct: `${total - a - b}人`,
        wrongs: pickWrongs(total - a - b, '人', [a + b, total - a, total - a - b + 2]),
      }
    }),
    BT('kaku', () => {
      const u = pick([20, 50])
      const n = ri(3, 7)
      // 単位は ぜんぶ「つ分」で そろえる（1つだけ「こ分」だと 形のちがいで 見わけられてしまう）
      return {
        text: `ぼうの 大きさが ${u * n} でした。1めもり ${u} の グラフでは めもり いくつ分？`,
        correct: `${n}つ分`,
        wrongs: pickWrongs(n, 'つ分', [n + 1, u, n - 1]),
      }
    }),
  ],

  // ===== 4年 変わり方 =====
  'kankei-4': [
    T('mawari', () => {
      const n = ri(2, 12)
      // n=4 のとき n*n(=16) が 正解 n*4(=16) と かぶり、n*2 と n+4 も どちらも 8 になる
      return {
        text: `1辺が ${n}cm の正方形の まわりの長さは？`,
        correct: `${n * 4}cm`,
        wrongs: pickWrongs(n * 4, 'cm', [n * 2, n * n, n + 4]),
      }
    }),
    T('hyo', () => {
      const k = ri(2, 5)
      const x = ri(4, 7)
      return { text: `だんの数が 1、2、3… と ふえると 高さは ${k}、${k * 2}、${k * 3}… と かわります。だんの数が ${x} のとき 高さは？`, correct: `${k * x}`, wrongs: wrong(k * x, '', [k, -k, 1]) }
    }),
    T('wa', () => {
      const total = pick([10, 12, 15, 20])
      const a = ri(1, total - 1)
      return { text: `x ＋ y ＝ ${total} の きまりが あるとき、x が ${a} なら y は？`, correct: `${total - a}`, wrongs: wrong(total - a, '', [1, -1, a]) }
    }),
    T('kimari', () => {
      if (Math.random() < 0.5) {
        const start = pick([1, 2, 3])
        const terms = [start, start * 2, start * 4, start * 8]
        return { text: `${terms.join('、')}、□ …　□に はいる かずは？（きまりを 見つけよう）`, correct: `${start * 16}`, wrongs: [`${start * 12}`, `${start * 10}`, `${start * 16 + 1}`] }
      }
      const step = pick([2, 3, 4])
      const ans = ri(1, 6)
      const start = ans + step * 4 // 答えが かならず 1以上に なるように
      const terms = [0, 1, 2, 3].map((i) => start - step * i)
      return { text: `${terms.join('、')}、□ …　□に はいる かずは？`, correct: `${ans}`, wrongs: wrong(ans, '', [step, -step, 1]) }
    }),
    BT('hyo', () => {
      const a = ri(2, 5)
      const b = ri(2, 4)
      const x = ri(5, 8)
      return { text: `y ＝ x × ${a} ＋ ${b} の きまりが あるとき、x が ${x} なら y は？`, correct: `${a * x + b}`, wrongs: wrong(a * x + b, '', [a, -b, 1]) }
    }),
    BT('kimari', () => {
      const base = ri(1, 3)
      const terms = [1, 2, 3, 4].map((i) => base * i * i)
      return { text: `${terms.join('、')}、□ …　□に はいる かずは？`, correct: `${base * 25}`, wrongs: [`${base * 20}`, `${base * 30}`, `${base * 25 + 1}`] }
    }),
  ],

  // ===== 5年 割合 =====
  'kankei-5': [
    T('ryo', () => {
      const base = pick([100, 200, 300, 400, 500])
      const p = pick([10, 20, 25, 50])
      // base=100, p=50 のとき base-p(=50) が 正解(=50)と かぶる
      return {
        text: `${base}円の ${p}％ は なん円？`,
        correct: `${(base * p) / 100}円`,
        wrongs: pickWrongs((base * p) / 100, '円', [base - p, (base * p) / 10, (base * p) / 100 + 10]),
      }
    }),
    T('wariai', () => {
      const base = pick([50, 100, 200, 400])
      const p = pick([10, 20, 25, 50])
      // p=10 のとき p+10(=20) と p*2(=20) が 同じになる。
      // 半分の まちがいは 25％→13％ のように 整数に そろえる
      return {
        text: `${(base * p) / 100} は ${base} の 何％？`,
        correct: `${p}％`,
        wrongs: pickWrongs(p, '％', [p + 10, p * 2, Math.round(p / 2)]),
      }
    }),
    T('moto', () => {
      const base = pick([200, 300, 400, 500])
      const p = pick([10, 20, 50])
      // p=50 のとき base*p/100 と base/2 が 同じになる
      return {
        text: `ある ねだんの ${p}％ が ${(base * p) / 100}円 のとき、もとの ねだんは？`,
        correct: `${base}円`,
        wrongs: pickWrongs(base, '円', [base / 2, base + 100, (base * p) / 100]),
      }
    }),
    T('buai', () => {
      const n = ri(1, 9)
      if (Math.random() < 0.5) {
        return { text: `${n}割 は 何％？`, correct: `${n * 10}％`, wrongs: pickWrongs(n * 10, '％', [n, n * 100, n * 10 + 5]) }
      }
      // n=1 のとき n*10(=10) と 「n-1が0なので10」が 同じになる
      return { text: `${n * 10}％ は 何割？`, correct: `${n}割`, wrongs: pickWrongs(n, '割', [n * 10, n + 1, n + 2]) }
    }),
    T('nebiki', () => {
      const base = ri(2, 10) * 100
      const p = pick([10, 20, 30, 50])
      // p=50 のとき「ひく額」と「はらう額」が 同じになり 正解と かぶる。
      // 定価そのまま・すこし ずれた額も 候補にして うめる
      const pay = (base * (100 - p)) / 100
      return {
        text: `${base}円の 品物が ${p}％引き。はらう お金は？`,
        correct: `${pay}円`,
        wrongs: pickWrongs(pay, '円', [(base * p) / 100, base - p, pay - 10, pay + 10, base]),
      }
    }),
    BT('nebiki', () => {
      const base = ri(6, 15) * 100
      const p = pick([20, 25, 30])
      const pay = (base * (100 - p)) / 100
      return {
        text: `定価 ${base}円の 品物を ${p / 10}割引きで 買います。はらう お金は？`,
        correct: `${pay}円`,
        wrongs: pickWrongs(pay, '円', [(base * p) / 100, base - p, pay - 100, pay + 100, base]),
      }
    }),
    BT('moto', () => {
      const base = pick([200, 300, 400, 600])
      const p = pick([15, 20, 25])
      return {
        text: `ある学校の ${p}％ が ${(base * p) / 100}人 のとき、学校ぜんいんは なん人？`,
        correct: `${base}人`,
        wrongs: pickWrongs(base, '人', [(base * p) / 100 + base, base / 2, (base * p) / 100]),
      }
    }),
  ],

  // ===== 6年 比とその利用 =====
  'kankei-6': [
    T('hirei', () => {
      const k = ri(2, 5)
      const x = ri(2, 9)
      return { text: `y ＝ ${k} × x の式で、x が ${x} のとき y は？`, correct: `${k * x}`, wrongs: wrong(k * x, '', [k, -k, x]) }
    }),
    T('hi', () => {
      const a = ri(2, 5)
      // a と b が おなじだと「3 : 3」という 比になってしまうので ずらす
      let b = ri(2, 5)
      if (b === a) b = a === 5 ? 2 : a + 1
      const m = ri(2, 4)
      return { text: `${a} : ${b} ＝ ${a * m} : □　□に はいる かずは？`, correct: `${b * m}`, wrongs: wrong(b * m, '', [a * m - b * m, 1, -1]) }
    }),
    T('kantan', () => {
      const [a, b] = pick([[2, 3], [3, 4], [1, 2], [2, 5], [3, 5]])
      const k = ri(2, 6)
      const correct = `${a} : ${b}`
      // a=1, k=2 のとき a*k(=2) と a+1(=2) が 同じ比になってしまうので、
      // 候補を 多めに ならべて かぶらない3つを えらぶ
      // ありがちな まちがいの順: ぎゃく比 → かたほうだけ約分 → ぶんぼ側だけ ずれる
      const cands = [`${b} : ${a}`, `${a * k} : ${b}`, `${a} : ${b + 1}`, `${a + 1} : ${b + 1}`, `${a + 1} : ${b}`]
      const wrongs: string[] = []
      for (const c of cands) {
        if (wrongs.length < 3 && c !== correct && !wrongs.includes(c)) wrongs.push(c)
      }
      return { text: `${a * k} : ${b * k} を かんたんに すると？`, correct, wrongs }
    }),
    T('hanpirei', () => {
      const area = pick([12, 24, 36])
      const x = pick([2, 3, 4, 6])
      return { text: `面積が ${area}cm² の長方形。たてが ${x}cm のとき、よこは？`, correct: `${area / x}cm`, wrongs: [`${area * x}cm`, `${area / x + 1}cm`, `${area - x}cm`] }
    }),
    T('hirei', () => {
      const m = ri(2, 4)
      // 1m分の ねだんを 先に決めて 合計を 出す。
      // 合計を 先に決めると 210円÷4m＝52.5円 のように わりきれず、
      // 小学生の 答えに ならない
      const unit = ri(2, 9) * 10
      const price = unit * m
      return {
        text: `${m}m で ${price}円の リボン。1m の ねだんは？`,
        correct: `${unit}円`,
        wrongs: pickWrongs(unit, '円', [price, unit * m * m, unit + 10]),
      }
    }),
    BT('hi', () => {
      const r1 = ri(2, 4)
      const r2raw = ri(1, 3)
      // 姉と妹の比が おなじだと「妹の分」が 正解と ぴったり かぶるので ずらす
      const r2 = r2raw === r1 ? r1 + 1 : r2raw
      // 「1つ分」を先に決めて 合計を 比の和の倍数にする。
      // 合計を先に決めると 1500÷7 のように わりきれず、
      // 214.2857…円 という 答えに なってしまう
      const one = pick([100, 150, 200, 250])
      const total = one * (r1 + r2)
      // ありがちな まちがい: 妹の分 / 1つ分だけ答える / 半分にする / 1つ多くとる。
      // 候補を 多めに わたして、かぶった分は pickWrongs に のぞかせる
      return {
        text: `${total}円を 姉と妹で ${r1} : ${r2} に 分けます。姉の分は なん円？`,
        correct: `${one * r1}円`,
        wrongs: pickWrongs(one * r1, '円', [one * r2, one, total / 2, one * (r1 + 1)]),
      }
    }),
    BT('kantan', () => {
      const [a, b] = pick([[2, 3], [3, 4], [3, 5], [4, 5]])
      const k = ri(3, 8)
      const g = gcd(a * k, b * k)
      return { text: `${a * k} : ${b * k} を いちばん かんたんな 整数の比に すると？`, correct: `${(a * k) / g} : ${(b * k) / g}`, wrongs: [`${(b * k) / g} : ${(a * k) / g}`, `${a * k} : ${b}`, `${a + 1} : ${b + 1}`] }
    }),
  ],
}
