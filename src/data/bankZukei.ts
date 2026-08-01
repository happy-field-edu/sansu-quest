import { T, BT, wrong, pickWrongs, type BankGen } from './bankUtil'
import { ri, pick, shuffle } from './genUtil'

// 図形のワールド：テンプレート問題バンク
export const BANK_ZUKEI: Record<string, BankGen[]> = {
  // ===== 1年 いろいろなかたち =====
  'zukei-1': [
    T('mitsuke', () => {
      const shapes = [{ n: 'まる', s: '🟢' }, { n: 'さんかく', s: '🔺' }, { n: 'しかく', s: '🟦' }, { n: 'ほし', s: '⭐' }]
      const t = pick(shapes)
      return { text: `「${t.n}」の かたちは どれかな？`, correct: t.s, wrongs: shapes.filter((x) => x.s !== t.s).map((x) => x.s) }
    }),
    T('kazoe', () => {
      const target = pick(['🔺', '🟢', '🟦'])
      const n = ri(2, 4)
      const others = shuffle(['🔺', '🟢', '🟦', '⭐'].filter((x) => x !== target))
      const seq = shuffle([...Array(n).fill(target), others[0], others[0], others[1]]).join(' ')
      return { text: `つぎの なかに ${target}は いくつ ある？\n${seq}`, correct: `${n}こ`, wrongs: wrong(n, 'こ') }
    }),
    T('seishitsu', () => {
      if (Math.random() < 0.5) return { text: `よく ころがる かたちは どれ？`, correct: '🟢 まる', wrongs: ['🟦 しかく', '🔺 さんかく', '⭐ ほし'] }
      return { text: `たかく つみあげ やすい かたちは どれ？`, correct: '🟦 しかく', wrongs: ['🟢 まる', '🥚 たまご', '⭐ ほし'] }
    }),
    T('kousei', () => {
      return { text: `🔺の いろいたを 2まい あわせて できる かたちは？`, correct: '🟦 しかく', wrongs: ['🟢 まる', '⭐ ほし', '🥚 たまご'] }
    }),
    BT('seishitsu', () => {
      return { text: `ころがすことも、たかく つむことも できる かたちは？`, correct: 'つつの かたち', wrongs: ['ボールの かたち', 'さいころの かたち', 'はこの かたち'] }
    }),
    BT('kazoe', () => {
      const a = ri(3, 5)
      const b = ri(2, 4)
      const c = ri(1, 3)
      const shapes = ['🔺', '🟦', '🟢']
      const counts = [a, b, c]
      const maxi = counts.indexOf(Math.max(...counts))
      return { text: `${shapes[0]}が ${a}こ、${shapes[1]}が ${b}こ、${shapes[2]}が ${c}こ。いちばん おおいのは？`, correct: shapes[maxi], wrongs: shapes.filter((_, i) => i !== maxi).concat('みんな おなじ').slice(0, 3) }
    }),
  ],

  // ===== 2年 三角形と四角形 =====
  'zukei-2': [
    T('choten', () => {
      const t = pick([{ n: '三角形', v: 3 }, { n: '四角形', v: 4 }, { n: '五角形', v: 5 }, { n: '六角形', v: 6 }])
      return { text: `${t.n} の「ちょう点」は いくつ？`, correct: `${t.v}つ`, wrongs: wrong(t.v, 'つ') }
    }),
    T('hen', () => {
      const t = pick([{ n: '三角形', v: 3 }, { n: '四角形', v: 4 }, { n: '五角形', v: 5 }, { n: '六角形', v: 6 }])
      return { text: `${t.n} の「へん」は なん本？`, correct: `${t.v}本`, wrongs: wrong(t.v, '本') }
    }),
    T('hanbetsu', () => {
      const n = pick([3, 4])
      return { text: `${n}本の 直線で かこまれた かたちを なんと いう？`, correct: n === 3 ? '三角形' : '四角形', wrongs: [n === 3 ? '四角形' : '三角形', '円', '五角形'] }
    }),
    T('seishitsu', () => {
      if (Math.random() < 0.5) return { text: `かどが みんな 直角で、4つの 辺の 長さが みんな 同じ 四角形は？`, correct: '正方形', wrongs: ['長方形', '三角形', '円'] }
      return { text: `かどが みんな 直角で、むかいあう 辺の 長さが 同じ 四角形は？`, correct: '長方形', wrongs: ['正方形', '五角形', '直角三角形'] }
    }),
    T('chokkaku', () => {
      const t = pick([{ n: '長方形', v: 4 }, { n: '正方形', v: 4 }, { n: '直角三角形', v: 1 }])
      return { text: `${t.n} に 直角は いくつ ある？`, correct: `${t.v}つ`, wrongs: ['1つ', '2つ', '3つ', '4つ'].filter((x) => x !== `${t.v}つ`).slice(0, 3) }
    }),
    BT('seishitsu', () => {
      const q = pick([{ t: 'はこの かたちに「面」は いくつ ある？', a: '6つ', w: ['4つ', '8つ', '12こ'] }, { t: 'はこの かたちに「ちょう点」は いくつ ある？', a: '8つ', w: ['6つ', '12こ', '4つ'] }, { t: 'はこの かたちに「辺」は なん本 ある？', a: '12本', w: ['8本', '6本', '4本'] }])
      return { text: q.t, correct: q.a, wrongs: q.w }
    }),
    BT('chokkaku', () => {
      return { text: `正方形の かみを ななめ半分に 切ると、どんな 三角形が できる？`, correct: '直角三角形', wrongs: ['正三角形', '二等辺三角形だけ', '円'] }
    }),
  ],

  // ===== 3年 円と球 =====
  'zukei-3': [
    T('chokkei', () => {
      const r = ri(2, 9)
      return { text: `半径 ${r}cm の円の 直径は？`, correct: `${r * 2}cm`, wrongs: pickWrongs(r * 2, 'cm', [r, r * 2 + 1, r + 2]) }
    }),
    T('hankei', () => {
      const r = ri(2, 9)
      return { text: `直径 ${r * 2}cm の円の 半径は？`, correct: `${r}cm`, wrongs: pickWrongs(r, 'cm', [r * 2, r * 4, r + 1]) }
    }),
    T('kotoba', () => {
      const q = pick([{ t: '円の まん中の 点を なんと いう？', a: '中心' }, { t: '中心から 円のまわりまで ひいた 直線を なんと いう？', a: '半径' }, { t: '中心を 通って、円の はしから はしまで ひいた 直線を なんと いう？', a: '直径' }])
      return { text: q.t, correct: q.a, wrongs: ['中心', '半径', '直径', '円周'].filter((w) => w !== q.a).slice(0, 3) }
    }),
    T('compass', () => {
      const r = ri(2, 9)
      return { text: `半径 ${r}cm の円を かくとき、コンパスは なんcmに ひらく？`, correct: `${r}cm`, wrongs: [`${r * 2}cm`, `${r / 2}cm`, `${r + 1}cm`] }
    }),
    T('kyu', () => {
      return { text: `球を まっぷたつに 切ると、切り口は どんな 形？`, correct: '円', wrongs: ['三角形', '四角形', '球'] }
    }),
    BT('chokkei', () => {
      const r = ri(4, 8)
      return { text: `半径 ${r}cm の円が 2つ、中心と 中心を むすぶように よこに ぴったり ならんで います。中心と 中心の 長さは？`, correct: `${r * 2}cm`, wrongs: [`${r}cm`, `${r * 4}cm`, `${r * 3}cm`] }
    }),
    BT('chokkei', () => {
      const a = ri(4, 8)
      const b = a + ri(2, 6)
      return { text: `たて ${a}cm、よこ ${b}cm の長方形に ぴったり 入る いちばん 大きい 円の 直径は？`, correct: `${a}cm`, wrongs: [`${b}cm`, `${a / 2}cm`, `${a + b}cm`] }
    }),
  ],

  // ===== 4年 角度 =====
  'zukei-4': [
    T('chokkaku', () => {
      const n = ri(1, 4)
      return { text: `直角（90度）${n}こ分の 角度は？`, correct: `${90 * n}度`, wrongs: [`${90 * n + 10}度`, `${45 * n}度`, `${90 * (n + 1)}度`] }
    }),
    T('keisan', () => {
      const a = pick([30, 45, 60, 90])
      const b = pick([30, 45, 60])
      return { text: `${a}度 と ${b}度 を あわせた 角度は？`, correct: `${a + b}度`, wrongs: [`${a + b + 10}度`, `${a - b > 0 ? a - b : b - a}度`, `${a + b - 5}度`] }
    }),
    T('kaiten', () => {
      const q = pick([{ t: '半回転の 角度は？', a: '180度' }, { t: '一回転の 角度は？', a: '360度' }, { t: '直角の 角度は？', a: '90度' }])
      return { text: q.t, correct: q.a, wrongs: ['90度', '180度', '360度', '270度'].filter((w) => w !== q.a).slice(0, 3) }
    }),
    T('bundoki', () => {
      const k = ri(2, 9)
      return { text: `分度器で 10度の めもり ${k}つ分の 角度は？`, correct: `${k * 10}度`, wrongs: [`${k * 10 + 10}度`, `${k}度`, `${k * 5}度`] }
    }),
    BT('kaiten', () => {
      const min = pick([15, 30])
      return { text: `とけいの ながい はりが ${min}分間で まわる 角度は？`, correct: `${min * 6}度`, wrongs: [`${min}度`, `${min * 6 + 90}度`, `${min * 3}度`] }
    }),
    BT('keisan', () => {
      const a = pick([120, 135, 150, 100])
      return { text: `180度 から ${a}度 を ひいた 角度は？`, correct: `${180 - a}度`, wrongs: [`${180 - a + 10}度`, `${a}度`, `${360 - a}度`] }
    }),
    BT('keisan', () => {
      const a = pick([210, 250, 270, 300])
      return { text: `360度 から ${a}度 を ひいた 角度は？`, correct: `${360 - a}度`, wrongs: [`${360 - a + 10}度`, `${360 - a - 10}度`, `${a}度`] }
    }),
  ],

  // ===== 5年 図形の角と合同 =====
  'zukei-5': [
    T('sankaku', () => {
      const a = ri(3, 9) * 10
      const b = ri(2, Math.max(2, Math.min(6, 16 - a / 10))) * 10
      return { text: `三角形の 2つの角が ${a}度 と ${b}度 のとき、のこりの角は？`, correct: `${180 - a - b}度`, wrongs: [`${360 - a - b}度`, `${180 - a}度`, `${180 - a - b + 10}度`] }
    }),
    T('shikaku', () => {
      const a = pick([60, 70, 80, 90, 100])
      const b = pick([70, 80, 90, 100])
      const c = pick([60, 70, 80, 90])
      const ans = 360 - a - b - c
      return { text: `四角形の 3つの角が ${a}度・${b}度・${c}度 のとき、のこりの角は？`, correct: `${ans}度`, wrongs: pickWrongs(ans, '度', [180 - a, ans + 10, ans - 10]) }
    }),
    T('takakkei', () => {
      const t = pick([{ n: '三角形', v: 3 }, { n: '四角形', v: 4 }, { n: '五角形', v: 5 }, { n: '六角形', v: 6 }])
      const ans = (t.v - 2) * 180
      return { text: `${t.n} の 角の大きさの和は？`, correct: `${ans}度`, wrongs: [`${ans + 180}度`, `${ans - 180 > 0 ? ans - 180 : 90}度`, `${t.v * 180}度`] }
    }),
    T('nitohen', () => {
      const apex = pick([20, 40, 80, 100, 140])
      const ans = (180 - apex) / 2
      return { text: `二等辺三角形の 頂点の角が ${apex}度 のとき、底辺の 1つの角は？`, correct: `${ans}度`, wrongs: pickWrongs(ans, '度', [ans + 10, 180 - apex, apex]) }
    }),
    T('godo', () => {
      const q = pick(['対応する 辺の長さ', '対応する 角の大きさ'])
      return { text: `合同な 2つの図形で、${q}は どうなっている？`, correct: '等しい', wrongs: ['2倍になる', '半分になる', 'ばらばら'] }
    }),
    BT('takakkei', () => {
      const t = pick([{ n: '正五角形', v: 5, one: 108 }, { n: '正六角形', v: 6, one: 120 }])
      return { text: `${t.n} の 1つの角の 大きさは？`, correct: `${t.one}度`, wrongs: [`${t.one + 12}度`, `${t.one - 12}度`, `${(t.v - 2) * 180}度`] }
    }),
    BT('nitohen', () => {
      const base = pick([50, 55, 65, 70, 75])
      return { text: `二等辺三角形の 底辺の 1つの角が ${base}度 のとき、頂点の角は？`, correct: `${180 - base * 2}度`, wrongs: [`${180 - base}度`, `${base}度`, `${180 - base * 2 + 10}度`] }
    }),
  ],

  // ===== 6年 対称・円の面積 =====
  'zukei-6': [
    T('menseki', () => {
      const r = pick([2, 3, 4, 5, 10])
      const area = Math.round(r * r * 3.14 * 100) / 100
      // 半径2cm のときだけ 円周(2×2×3.14)と 面積(2×2×3.14)が どちらも 12.56 で
      // ぶつかるので、正解とかぶった候補は のぞいて うめなおす
      const cands = [Math.round(2 * r * 3.14 * 100) / 100, r * r * 3, r * r].filter((v) => v !== area)
      const wrongs: string[] = []
      for (const v of cands) if (!wrongs.includes(`${v}cm²`)) wrongs.push(`${v}cm²`)
      let k = 1
      while (wrongs.length < 3 && k < 30) {
        const v = Math.round((area + k * 0.5) * 100) / 100
        if (!wrongs.includes(`${v}cm²`)) wrongs.push(`${v}cm²`)
        k++
      }
      return { text: `半径 ${r}cm の円の面積は？（半径×半径×3.14）`, correct: `${area}cm²`, wrongs: wrongs.slice(0, 3) }
    }),
    T('enshu', () => {
      const d = pick([3, 4, 5, 6, 8, 10])
      const circ = Math.round(d * 3.14 * 100) / 100
      const cands = [Math.round((d / 2) * 3.14 * 100) / 100, d * 3, d * d].filter((v) => v !== circ)
      const wrongs: string[] = []
      for (const v of cands) if (!wrongs.includes(`${v}cm`)) wrongs.push(`${v}cm`)
      let k = 1
      while (wrongs.length < 3 && k < 30) {
        const v = Math.round((circ + k * 0.5) * 100) / 100
        if (!wrongs.includes(`${v}cm`)) wrongs.push(`${v}cm`)
        k++
      }
      return { text: `直径 ${d}cm の円の 円周の長さは？（直径×3.14）`, correct: `${circ}cm`, wrongs: wrongs.slice(0, 3) }
    }),
    T('sentaisho', () => {
      const sym = pick(['A', 'H', 'M', 'O', 'T', 'U', 'V', 'W', 'Y'])
      const wrongs = shuffle(['F', 'G', 'J', 'L', 'P', 'R', 'S', 'Z', 'N', 'Q']).slice(0, 3)
      return { text: `線対称な形の アルファベットは どれ？`, correct: sym, wrongs }
    }),
    T('tentaisho', () => {
      const sym = pick(['N', 'S', 'Z'])
      const wrongs = shuffle(['A', 'T', 'U', 'V', 'E', 'F', 'M', 'W', 'Y']).slice(0, 3)
      return { text: `点対称な形（180度回すと 同じ形）の アルファベットは どれ？`, correct: sym, wrongs }
    }),
    T('kakudai', () => {
      if (Math.random() < 0.5) {
        const k = pick([2, 3])
        const a = ri(2, 9)
        return { text: `${a}cm の辺を ${k}倍に 拡大すると なんcm？`, correct: `${a * k}cm`, wrongs: pickWrongs(a * k, 'cm', [a + k, a * k + 1, a]) }
      }
      const k = pick([2, 3])
      const a = ri(2, 6) * k
      return { text: `${a}cm の辺を 1/${k} に 縮小すると なんcm？`, correct: `${a / k}cm`, wrongs: pickWrongs(a / k, 'cm', [a * k, a / k + 1, a]) }
    }),
    BT('menseki', () => {
      const r = pick([4, 6, 8, 10])
      const round2 = (v: number) => Math.round(v * 100) / 100
      const half = round2(((r / 2) * (r / 2) * 3.14) / 2)
      const cands = [round2((r / 2) * (r / 2) * 3.14), round2(r * r * 3.14), round2(((r / 2) * (r / 2) * 3.14) / 4)].filter((v) => v !== half)
      const wrongs: string[] = []
      for (const v of cands) if (!wrongs.includes(`${v}cm²`)) wrongs.push(`${v}cm²`)
      let k = 1
      while (wrongs.length < 3 && k < 30) {
        const v = round2(half + k * 1.5)
        if (!wrongs.includes(`${v}cm²`)) wrongs.push(`${v}cm²`)
        k++
      }
      return { text: `直径 ${r}cm の 半円の面積は？`, correct: `${half}cm²`, wrongs: wrongs.slice(0, 3) }
    }),
    BT('menseki', () => {
      return { text: `円の 半径を 2倍に すると、面積は なん倍に なる？`, correct: '4倍', wrongs: ['2倍', '8倍', '3.14倍'] }
    }),
    BT('kakudai', () => {
      const k = pick([2, 3, 4])
      return { text: `${k}倍に 拡大した図形の 面積は、もとの なん倍？`, correct: `${k * k}倍`, wrongs: pickWrongs(k * k, '倍', [k, k * 2, k * k + 1]) }
    }),
  ],
}
