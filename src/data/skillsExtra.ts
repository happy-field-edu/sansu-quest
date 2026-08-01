import { S, mc, ri, pick, shuffle, frac, gcd, type Skill } from './genUtil'

// 教科書（啓林館版）の年間単元構成と、市販テストの評価規準を分析して追加した技能。
// 既存の SKILLS に統合される（CURRICULUM.md 参照）。

export const SKILLS_EXTRA: Record<string, Skill[]> = {
  // ===== 1年 =====
  'keisan-1': [
    S('kuriagari', 'くり上がり', () => {
      const a = ri(6, 9)
      const b = ri(11 - a, 9)
      return mc(`${a} ＋ ${b} ＝ ？`, a + b, [a + b - 1, a + b + 1, a + b - 10])
    }),
    S('kurisagari', 'くり下がり', () => {
      const ans = ri(2, 9)
      const b = ri(11 - ans > 2 ? 11 - ans : 2, 9)
      const a = ans + b
      return mc(`${a} − ${b} ＝ ？`, ans, [ans + 1, ans - 1, a - 10])
    }),
    S('ikutsu', 'いくつといくつ', () => {
      const total = pick([10, 10, 10, 8, 9])
      const a = ri(1, total - 1)
      return mc(`${total}は ${a}と いくつ？`, total - a, [total - a + 1, total - a - 1, total + a])
    }),
  ],
  'ryou-1': [
    S('nagasa', 'いくつ分の ながさ', () => {
      const a = ri(4, 9)
      const b = ri(2, a - 1)
      return mc(`テープは ますの ${a}こ分、ひもは ますの ${b}こ分です。ちがいは ます いくつ分？`, `${a - b}こ分`, [
        `${a + b}こ分`,
        `${a - b + 1}こ分`,
        `${a}こ分`,
      ])
    }),
  ],
  'zukei-1': [
    S('utsusu', 'かたちうつし', () => {
      const q = pick([
        { t: 'さいころの かたちの めんを かみに うつすと？', a: 'ましかく', w: ['まる', 'さんかく', 'ほし'] },
        { t: 'つつの かたちの そこを かみに うつすと？', a: 'まる', w: ['ましかく', 'さんかく', 'ほし'] },
        { t: 'ボールの かたちを つみあげられる？', a: 'つめない', w: ['つめる', 'よく ころがらない', 'たいらな めんが ある'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
  ],
  'kankei-1': [
    S('nanbanme', 'なんばんめ', () => {
      const n = ri(3, 8)
      const k = ri(2, n - 1)
      return mc(`${n}人が 1れつに ならんで います。まえから ${k}ばんめの 人の うしろには なん人 いる？`, `${n - k}人`, [
        `${n - k + 1}人`,
        `${k}人`,
        `${n - k - 1}人`,
      ])
    }),
  ],

  // ===== 2年 =====
  'keisan-2': [
    S('hissan2', 'ひっ算（2けた）', () => {
      if (Math.random() < 0.5) {
        const a = ri(15, 79)
        const b = ri(15, 99 - a > 15 ? 99 - a : 20)
        return mc(`ひっ算で けいさんしよう。${a} ＋ ${b} ＝ ？`, a + b, [a + b + 10, a + b - 10, a + b + 1])
      }
      const ans = ri(15, 60)
      const b = ri(15, 39)
      return mc(`ひっ算で けいさんしよう。${ans + b} − ${b} ＝ ？`, ans, [ans + 10, ans - 10, ans + 1])
    }),
    S('tani1000', '1000までのかず', () => {
      const h = ri(2, 9)
      const t = ri(1, 9)
      const o = ri(1, 9)
      return mc(`100を ${h}こ、10を ${t}こ、1を ${o}こ あわせた かずは？`, h * 100 + t * 10 + o, [
        h * 100 + o * 10 + t,
        h * 10 + t * 10 + o,
        h * 100 + t * 10 + o + 100,
      ])
    }),
  ],
  'ryou-2': [
    S('mL', 'かさの けいさん', () => {
      const a = ri(2, 8)
      const b = ri(1, 9)
      return mc(`${a}L${b}dL ＋ ${10 - b}dL ＝ ？`, `${a + 1}L`, [`${a}L${10}dL`, `${a + 1}L${b}dL`, `${a}L${b}dL`])
    }),
    S('mnagasa', '長さのたんい（m）', () => {
      const a = ri(1, 5)
      const b = ri(10, 90)
      return mc(`${a}m${b}cm は なんcm？`, `${a * 100 + b}cm`, [`${a * 10 + b}cm`, `${a + b}cm`, `${a * 100 + b + 100}cm`])
    }),
  ],
  'zukei-2': [
    S('hakosikaku', 'はこの形', () => {
      const q = pick([
        { t: 'はこの形で、むかいあう 面の 形と 大きさは？', a: '同じ', w: ['ちがう', '2倍になる', '半分になる'] },
        { t: 'さいころの形（立方体）の 面は みんな どんな形？', a: '正方形', w: ['長方形', '三角形', '円'] },
        { t: 'はこの形の 辺は なん本？', a: '12本', w: ['8本', '6本', '4本'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
  ],
  'kankei-2': [
    S('sanuke', 'たし算・ひき算のかんけい', () => {
      const a = ri(3, 9)
      const b = ri(2, 8)
      return mc(`えんぴつを ${b}本 もらったので、ぜんぶで ${a + b}本に なりました。はじめの 本数を もとめる式は？`, `${a + b} − ${b}`, [
        `${a + b} ＋ ${b}`,
        `${b} ＋ ${a + b}`,
        `${b} − ${a + b}`,
      ])
    }),
  ],

  // ===== 3年 =====
  'keisan-3': [
    S('imi', 'わり算の意味', () => {
      if (Math.random() < 0.5) {
        const n = ri(2, 9) * ri(2, 5)
        const p = ri(2, 6)
        return mc(`「${n}このあめを ${p}人に 同じ数ずつ 分ける」を もとめる式は？`, `${n} ÷ ${p}`, [
          `${p} ÷ ${n}`,
          `${n} − ${p}`,
          `${n} × ${p}`,
        ])
      }
      const b = ri(2, 6)
      const q = ri(2, 8)
      return mc(`${b * q} ÷ ${b} の答えは、何のだんの 九九を つかって もとめる？`, `${b}のだん`, [
        `${q}のだん`,
        `${b * q}のだん`,
        `${b + 1}のだん`,
      ])
    }),
    S('amarikankei', 'あまりの大きさ', () => {
      const b = ri(4, 9)
      return mc(`${b} でわった ときの あまりは、いくつより 小さく なる？`, `${b}`, [`${b - 1}`, `${b + 1}`, '1'])
    }),
    S('hissan3', 'ひっ算（3けた）', () => {
      if (Math.random() < 0.5) {
        const a = ri(120, 480)
        const b = ri(130, 390)
        return mc(`ひっ算で けいさんしよう。${a} ＋ ${b} ＝ ？`, a + b, [a + b + 100, a + b - 100, a + b + 10])
      }
      const ans = ri(120, 480)
      const b = ri(130, 350)
      return mc(`ひっ算で けいさんしよう。${ans + b} − ${b} ＝ ？`, ans, [ans + 100, ans - 100, ans + 10])
    }),
    S('kakezanH', 'かけ算のひっ算', () => {
      const a = ri(12, 68)
      const b = ri(3, 9)
      return mc(`ひっ算で けいさんしよう。${a} × ${b} ＝ ？`, a * b, [a * b + 10, a * b - b, a * b + b])
    }),
    S('ichiman', '一万をこえる数', () => {
      const q = pick([
        () => {
          const n = ri(2, 9)
          return mc(`${n} を 100倍 した数は？`, n * 100, [n * 10, n * 1000, n + 100])
        },
        () => {
          const n = ri(2, 9) * 100
          return mc(`${n} を 10でわった 数は？`, n / 10, [n * 10, n / 100, n - 10])
        },
        () => {
          const a = ri(2, 9)
          const b = ri(1, 9)
          return mc(`10000を ${a}こ、1000を ${b}こ あわせた 数は？`, a * 10000 + b * 1000, [
            a * 1000 + b * 100,
            a * 10000 + b,
            (a + b) * 10000,
          ])
        },
      ])
      return q()
    }),
    S('bunsu3', '分数のいみ', () => {
      const d = pick([3, 4, 5, 6, 8])
      const n = ri(1, d - 1)
      if (Math.random() < 0.5) {
        return mc(`1mを ${d}等分した ${n}こ分の 長さは？`, `${n}/${d}m`, [`${d}/${n}m`, `${n}/${d + 1}m`, `${n + 1}/${d}m`])
      }
      return mc(`${frac(n, d)} と ${frac(d - n, d)} を たすと いくつ？`, '1', [`${d}/${d + d}`, `1/${d}`, '2'])
    }),
  ],
  'ryou-3': [
    S('km', '長さのたんい（km）', () => {
      if (Math.random() < 0.5) {
        const a = ri(1, 5)
        const b = ri(1, 9) * 100
        return mc(`${a}km${b}m は なんm？`, `${a * 1000 + b}m`, [`${a * 100 + b}m`, `${a + b}m`, `${a * 10000 + b}m`])
      }
      const a = ri(2, 9)
      return mc(`${a * 1000}m は なんkm？`, `${a}km`, [`${a * 10}km`, `${a / 10}km`, `${a * 100}km`])
    }),
    S('michi', '道のりときょり', () => {
      const a = ri(3, 8) * 100
      const b = ri(2, 6) * 100
      const total = a + b
      return mc(
        `家から 公園まで ${a}m、公園から 学校まで ${b}m です。家から 公園を通って 学校までの 道のりは？`,
        total >= 1000 ? `${Math.floor(total / 1000)}km${total % 1000}m` : `${total}m`,
        [`${a}m`, `${a - b}m`, total >= 1000 ? `${total}km` : `${total + 100}m`],
      )
    }),
    S('byou', '秒', () => {
      const q = pick([
        () => mc('1分は なん秒？', '60秒', ['100秒', '30秒', '10秒']),
        () => {
          const m = ri(2, 5)
          const s = ri(10, 50)
          return mc(`${m}分${s}秒 は なん秒？`, `${m * 60 + s}秒`, [`${m * 100 + s}秒`, `${m + s}秒`, `${m * 60}秒`])
        },
      ])
      return q()
    }),
  ],
  'zukei-3': [
    S('nitohen3', '二等辺三角形と正三角形', () => {
      const q = pick([
        { t: '3つの 辺の 長さが みんな 等しい 三角形を なんと いう？', a: '正三角形', w: ['二等辺三角形', '直角三角形', '長方形'] },
        { t: '2つの 辺の 長さが 等しい 三角形を なんと いう？', a: '二等辺三角形', w: ['正三角形', '直角三角形', '平行四辺形'] },
        { t: '正三角形の 3つの 角の 大きさは？', a: 'みんな 等しい', w: ['ぜんぶ ちがう', '2つだけ 等しい', '1つが 直角'] },
        { t: '二等辺三角形で 大きさが 等しい 角は？', a: '2つ', w: ['3つ', '1つ', '0こ'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
    S('kaku3', '角の大きさ', () => {
      const q = pick([
        { t: '1つの ちょう点から 出る 2つの 辺が つくる 形を なんと いう？', a: '角', w: ['辺', 'ちょう点', '面'] },
        { t: '角の 大きさは 何で きまる？', a: '辺の ひらきぐあい', w: ['辺の 長さ', '辺の 太さ', '紙の 大きさ'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
  ],
  'kankei-3': [
    S('hyoseiri', '表のせいり', () => {
      const a = ri(4, 9)
      const b = ri(3, 8)
      const c = ri(2, 7)
      return mc(`すきなくだものしらべ：りんご${a}人、みかん${b}人、ぶどう${c}人。しらべた 人数は ぜんぶで なん人？`, `${a + b + c}人`, [
        `${a + b}人`,
        `${a + b + c + 1}人`,
        `${Math.max(a, b, c)}人`,
      ])
    }),
    S('nanbai', '何倍でしょう', () => {
      const base = ri(2, 6)
      const k = ri(2, 5)
      if (Math.random() < 0.5) {
        return mc(`赤いテープは ${base}cm、青いテープは ${base * k}cm です。青は 赤の 何倍？`, `${k}倍`, [
          `${base * k}倍`,
          `${k + 1}倍`,
          `${base}倍`,
        ])
      }
      const k2 = ri(2, 4)
      return mc(`もとの 長さ ${base}cm を ${k}倍 して、さらに ${k2}倍 すると 何cm？`, `${base * k * k2}cm`, [
        `${base * (k + k2)}cm`,
        `${base * k}cm`,
        `${base + k + k2}cm`,
      ])
    }),
  ],

  // ===== 4年 =====
  'keisan-4': [
    S('gaisu', 'がい数（四捨五入）', () => {
      const q = pick([
        () => {
          const n = ri(1200, 8900)
          const r = Math.round(n / 100) * 100
          return mc(`${n} を 四捨五入して 百の位までの がい数に すると？`, `${r}`, [`${r + 100}`, `${r - 100}`, `${Math.floor(n / 100) * 100}`])
        },
        () => {
          const n = ri(12000, 89000)
          const r = Math.round(n / 1000) * 1000
          return mc(`${n} を 四捨五入して 千の位までの がい数に すると？`, `${r}`, [`${r + 1000}`, `${r - 1000}`, `${Math.floor(n / 1000) * 1000}`])
        },
        () => {
          const a = ri(21, 48) * 100
          const b = ri(21, 48) * 100
          const est = Math.round(a / 1000) * 1000 + Math.round(b / 1000) * 1000
          return mc(`${a} ＋ ${b} を、千の位までの がい数に して 見つもると？`, `約${est}`, [`約${est + 1000}`, `約${est - 1000}`, `約${a + b}`])
        },
      ])
      return q()
    }),
    S('junjo', '計算のじゅんじょ', () => {
      const q = pick([
        () => {
          const a = ri(2, 9)
          const b = ri(2, 9)
          const c = ri(2, 9)
          return mc(`${a} ＋ ${b} × ${c} ＝ ？`, a + b * c, [(a + b) * c, a + b + c, a * b + c])
        },
        () => {
          const a = ri(3, 9)
          const b = ri(2, 8)
          const c = ri(2, 5)
          return mc(`(${a} ＋ ${b}) × ${c} ＝ ？`, (a + b) * c, [a + b * c, a + b + c, a * c + b])
        },
        () => {
          const b = ri(2, 6)
          const c = ri(2, 6)
          const a = b * c + ri(2, 20) // a ≥ b×c にして 答えが 0以上になるように
          return mc(`${a} − ${b} × ${c} ＝ ？`, a - b * c, [(a - b) * c, a - b - c, a - b + c])
        },
      ])
      return q()
    }),
    S('shosukake', '小数×整数・÷整数', () => {
      if (Math.random() < 0.5) {
        const x = ri(12, 48) / 10
        const k = ri(2, 9)
        return mc(`${x.toFixed(1)} × ${k} ＝ ？`, (Math.round(x * 10 * k) / 10).toFixed(1), [
          (Math.round(x * 10 * k) / 10 + 1).toFixed(1),
          (x + k).toFixed(1),
          (Math.round(x * 10 * k) / 100).toFixed(2),
        ])
      }
      const k = ri(2, 8)
      const ans = ri(11, 49) / 10
      const x = Math.round(ans * k * 10) / 10
      return mc(`${x.toFixed(1)} ÷ ${k} ＝ ？`, ans.toFixed(1), [(ans + 0.1).toFixed(1), (ans * 10).toFixed(1), (x - k).toFixed(1)])
    }),
    S('oku', '一億をこえる数', () => {
      const q = pick([
        () => {
          const a = ri(2, 9)
          return mc(`1億を ${a}こ あつめた 数は？`, `${a}億`, [`${a}万`, `${a}兆`, `${a * 10}億`])
        },
        () => mc('1兆は 1億を なんこ あつめた 数？', '1万こ', ['1000こ', '100こ', '10億こ']),
        () => {
          const a = ri(2, 9)
          return mc(`${a}億 を 10倍 した 数は？`, `${a}0億`, [`${a}億`, `${a}兆`, `${a}000万`])
        },
      ])
      return q()
    }),
    S('warizanH', 'わり算のひっ算', () => {
      if (Math.random() < 0.5) {
        const b = ri(3, 9)
        const q = ri(12, 98)
        return mc(`${b * q} ÷ ${b} ＝ ？`, q, [q + 1, q - 1, q + 10])
      }
      const b = ri(12, 38)
      const q = ri(3, 9)
      const r = ri(1, b - 1)
      return mc(`${b * q + r} ÷ ${b} ＝ ？`, `${q} あまり ${r}`, [
        `${q + 1} あまり ${r}`,
        `${q} あまり ${r === 1 ? 2 : r - 1}`,
        `${q - 1} あまり ${r}`,
      ])
    }),
  ],
  'ryou-4': [
    S('fukugo', '複合図形の面積', () => {
      const a = ri(6, 12)
      const b = ri(6, 12)
      const c = ri(2, Math.min(4, a - 2))
      const d = ri(2, Math.min(5, b - 2))
      return mc(
        `たて${a}cm、よこ${b}cm の 長方形から、たて${c}cm、よこ${d}cm の 長方形を 切り取った 形の 面積は？`,
        `${a * b - c * d}cm²`,
        [`${a * b}cm²`, `${a * b + c * d}cm²`, `${c * d}cm²`],
      )
    }),
    S('tanikankei', '面積のたんいの関係', () => {
      const q = pick([
        () => mc('1m² は なんcm²？', '10000cm²', ['100cm²', '1000cm²', '100000cm²']),
        () => mc('1a（アール）は なんm²？', '100m²', ['10m²', '1000m²', '10000m²']),
        () => mc('1ha（ヘクタール）は なんm²？', '10000m²', ['100m²', '1000m²', '1000000m²']),
        () => mc('1km² は なんm²？', '1000000m²', ['1000m²', '10000m²', '100000m²']),
      ])
      return q()
    }),
  ],
  'zukei-4': [
    S('suichoku', '垂直と平行', () => {
      const q = pick([
        { t: '2本の 直線が 直角に まじわって いる とき、その 2本の 直線は どんな 関係？', a: '垂直', w: ['平行', '合同', '対称'] },
        { t: '1本の 直線に 垂直な 2本の 直線は、どんな 関係に なる？', a: '平行', w: ['垂直', '合同', 'まじわる'] },
        { t: '平行な 2本の 直線の はばは、どこも どうなって いる？', a: '等しい', w: ['だんだん 広がる', 'だんだん せまくなる', 'ばらばら'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
    S('shikakukei4', '四角形の性質', () => {
      const q = pick([
        { t: '向かいあう 1組の 辺だけが 平行な 四角形を なんと いう？', a: '台形', w: ['平行四辺形', 'ひし形', '長方形'] },
        { t: '向かいあう 2組の 辺が 平行な 四角形を なんと いう？', a: '平行四辺形', w: ['台形', 'ひし形', '三角形'] },
        { t: '4つの 辺の 長さが みんな 等しい 四角形を なんと いう？', a: 'ひし形', w: ['台形', '長方形', '平行四辺形'] },
        { t: '平行四辺形の 向かいあう 角の 大きさは？', a: '等しい', w: ['ちがう', '合わせて 90度', 'ぜんぶ 直角'] },
        { t: '長方形の 2本の 対角線の 長さは？', a: '等しい', w: ['ちがう', '2倍に なる', '半分に なる'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
    S('rippotai', '直方体と立方体', () => {
      const q = pick([
        { t: '直方体の 面は いくつ ある？', a: '6つ', w: ['4つ', '8つ', '12こ'] },
        { t: '直方体の ちょう点は いくつ ある？', a: '8つ', w: ['6つ', '12こ', '4つ'] },
        { t: '直方体で、1つの 面に 垂直な 面は いくつ ある？', a: '4つ', w: ['2つ', '1つ', '6つ'] },
        { t: '直方体で、1つの 面に 平行な 面は いくつ ある？', a: '1つ', w: ['2つ', '4つ', '3つ'] },
        { t: '立方体の 展開図で、面は 何こ かかれる？', a: '6こ', w: ['4こ', '8こ', '12こ'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
  ],
  'kankei-4': [
    S('oresen', '折れ線グラフ', () => {
      const q = pick([
        { t: '折れ線グラフで、線の かたむきが 急な ところは 何を あらわす？', a: '変わり方が 大きい', w: ['変わり方が 小さい', '変わらない', 'へって いる'] },
        { t: '折れ線グラフで、線が 右上がりの とき、数量は どう なって いる？', a: 'ふえて いる', w: ['へって いる', '変わらない', 'わからない'] },
        { t: '気温の 1日の 変わり方を あらわすのに いちばん よい グラフは？', a: '折れ線グラフ', w: ['ぼうグラフ', '円グラフ', '帯グラフ'] },
        { t: 'クラスの すきな 教科の 人数を くらべるのに よい グラフは？', a: 'ぼうグラフ', w: ['折れ線グラフ', '数直線', '表だけ'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
    S('nijigen', '二次元の表', () => {
      const a = ri(3, 8)
      const b = ri(2, 7)
      const c = ri(2, 6)
      const d = ri(1, 5)
      return mc(
        `けがしらべの 表です。\n　　　　すりきず　打ぼく\n校庭　　${a}人　　${b}人\n体育館　${c}人　　${d}人\n「すりきず」の 合計は なん人？`,
        `${a + c}人`,
        [`${a + b}人`, `${a + b + c + d}人`, `${b + d}人`],
      )
    }),
    S('kantanwariai', 'かんたんな割合', () => {
      const base = ri(2, 6) * 10
      const k = ri(2, 4)
      if (Math.random() < 0.5) {
        return mc(`もとの ねだん ${base}円の ガムが、${base * k}円に なりました。ねだんは 何倍に なった？`, `${k}倍`, [
          `${base * k}倍`,
          `${k + 1}倍`,
          `${base}倍`,
        ])
      }
      return mc(`Aの テープは ${base}cm、Bの テープは ${base * k}cm。Bは Aの 何倍？`, `${k}倍`, [`${k + 1}倍`, `${base}倍`, `${base * k}倍`])
    }),
  ],

  // ===== 5年 =====
  'keisan-5': [
    S('baisu', '倍数と公倍数', () => {
      const q = pick([
        () => {
          const [a, b] = pick([
            [2, 3],
            [3, 4],
            [4, 6],
            [6, 8],
            [3, 5],
            [4, 10],
          ])
          const l = (a * b) / gcd(a, b)
          return mc(`${a} と ${b} の 最小公倍数は？`, l, [a * b === l ? l + a : a * b, l + 1, a + b])
        },
        () => {
          const n = ri(2, 9)
          const k = ri(3, 6)
          return mc(`${n} の 倍数を 小さい 順に ならべた とき、${k}番目の 数は？`, n * k, [n * (k + 1), n + k, n * k + 1])
        },
      ])
      return q()
    }),
    S('yakusu', '約数と公約数', () => {
      const q = pick([
        () => {
          const [a, b] = pick([
            [8, 12],
            [9, 15],
            [12, 18],
            [16, 24],
            [10, 25],
            [18, 30],
          ])
          return mc(`${a} と ${b} の 最大公約数は？`, gcd(a, b), [gcd(a, b) * 2, gcd(a, b) + 1, (a * b) / gcd(a, b)])
        },
        () => {
          const n = pick([12, 18, 20, 24, 28, 36])
          const divs = []
          for (let i = 1; i <= n; i++) if (n % i === 0) divs.push(i)
          return mc(`${n} の 約数は ぜんぶで 何こ？`, `${divs.length}こ`, [`${divs.length + 1}こ`, `${divs.length - 1}こ`, `${n}こ`])
        },
      ])
      return q()
    }),
    S('gusu', '偶数と奇数', () => {
      const q = pick([
        () => {
          const n = ri(10, 99)
          return mc(`${n} は 偶数？ 奇数？`, n % 2 === 0 ? '偶数' : '奇数', [n % 2 === 0 ? '奇数' : '偶数', 'どちらでもない', '両方'])
        },
        () => mc('偶数と 奇数を たすと、答えは どうなる？', '奇数', ['偶数', '0になる', 'きまらない']),
        () => mc('0 は 偶数と 奇数の どちら？', '偶数', ['奇数', 'どちらでもない', '両方']),
      ])
      return q()
    }),
    S('shobun', 'わり算の商を分数で', () => {
      const a = ri(2, 8)
      const b = ri(3, 9)
      if (a === b) return mc(`${a} ÷ ${b + 1} の 商を 分数で あらわすと？`, frac(a, b + 1), [frac(b + 1, a), `${a}/${b}`, `${a + b}`])
      return mc(`${a} ÷ ${b} の 商を 分数で あらわすと？`, frac(a, b), [frac(b, a), `${a * b}`, `${a + b}/${b}`])
    }),
    S('shosukake5', '小数×小数・÷小数', () => {
      if (Math.random() < 0.5) {
        const a = ri(11, 49) / 10
        const b = ri(11, 29) / 10
        const ans = Math.round(a * b * 100) / 100
        // ans * 10 を そのまま 文字にすると 3.24×10 が
        // 「32.400000000000006」に なる（小数の 計算ごさ）。かならず 丸める
        const times10 = Math.round(ans * 1000) / 100
        return mc(`${a.toFixed(1)} × ${b.toFixed(1)} ＝ ？`, `${ans}`, [`${Math.round(a * b * 10) / 10}`, `${(a + b).toFixed(1)}`, `${times10}`])
      }
      const b = pick([0.2, 0.4, 0.5, 0.8, 2.5])
      const ans = ri(2, 9)
      const a = Math.round(ans * b * 100) / 100
      return mc(`${a} ÷ ${b} ＝ ？`, `${ans}`, [`${ans * 10}`, `${Math.round(a * b * 100) / 100}`, `${ans + 1}`])
    }),
  ],
  'ryou-5': [
    S('heikin', '平均', () => {
      const q = pick([
        () => {
          const ns = Array.from({ length: ri(3, 5) }, () => ri(10, 40))
          const sum = ns.reduce((a, b) => a + b, 0)
          const avg = Math.round((sum / ns.length) * 10) / 10
          return mc(`${ns.join('、')} の 平均は？`, `${avg}`, [`${sum}`, `${Math.round(avg) + 1}`, `${Math.round(sum / (ns.length + 1))}`])
        },
        () => mc('平均を もとめる 式は？', '合計 ÷ 個数', ['合計 × 個数', '個数 ÷ 合計', '合計 ＋ 個数']),
        () => {
          const avg = ri(20, 60)
          const n = ri(3, 8)
          return mc(`1個 平均 ${avg}g の たまごが ${n}個 あります。合計は 約なんg？`, `${avg * n}g`, [`${avg + n}g`, `${avg}g`, `${avg * n + avg}g`])
        },
      ])
      return q()
    }),
    S('tanniryo', '単位量あたりの大きさ', () => {
      const q = pick([
        () => {
          const people = pick([100, 200, 400, 500])
          const area = pick([2, 4, 5, 8])
          return mc(`人口 ${people * area}人、面積 ${area}km² の 町の 人口密度（1km²あたりの人数）は？`, `${people}人`, [
            `${people * area}人`,
            `${area}人`,
            `${people + area}人`,
          ])
        },
        () => {
          const price = ri(3, 9) * 20
          const n = ri(3, 8)
          return mc(`${n}こで ${price * n}円の おかし。1こ あたりの ねだんは？`, `${price}円`, [`${price * n}円`, `${price + n}円`, `${Math.round(price / n)}円`])
        },
        () => {
          const l = pick([5, 8, 10, 12])
          const km = l * pick([8, 10, 12])
          return mc(`ガソリン ${l}L で ${km}km 走る 車。1Lあたり なんkm 走る？`, `${km / l}km`, [`${km}km`, `${l}km`, `${km / l + 1}km`])
        },
      ])
      return q()
    }),
    S('fukugotai', '複合図形の体積', () => {
      const a = ri(3, 6)
      const b = ri(3, 6)
      const c = ri(2, 5)
      const d = ri(2, 4)
      const e = ri(2, 4)
      const f = ri(2, 3)
      return mc(
        `たて${a}cm・よこ${b}cm・高さ${c}cm の 直方体と、たて${d}cm・よこ${e}cm・高さ${f}cm の 直方体を くっつけた 形の 体積は？`,
        `${a * b * c + d * e * f}cm³`,
        [`${a * b * c}cm³`, `${a * b * c - d * e * f}cm³`, `${(a + d) * (b + e) * (c + f)}cm³`],
      )
    }),
    S('yoseki', '容積・内のり', () => {
      // たて・よこを 10の倍数、深さを 5の倍数にして 体積を 500の倍数にする。
      // ばらばらの数にすると 18×23×7＝2898cm³＝2.898L のように
      // 小数第3位まで ある答えになり、5年生の 問題として むずかしすぎる
      const a = ri(1, 3) * 10
      const b = ri(1, 3) * 10
      const c = ri(1, 4) * 5
      const cm3 = a * b * c
      return mc(`内のりが たて${a}cm・よこ${b}cm・深さ${c}cm の 水そう。いっぱいに 入る 水は 何L？`, `${cm3 / 1000}L`, [
        `${cm3}L`,
        `${cm3 / 100}L`,
        `${cm3 / 10000}L`,
      ])
    }),
  ],
  'zukei-5': [
    S('sankakumen', '三角形の面積', () => {
      const b = ri(4, 14)
      const h = ri(4, 12)
      return mc(`底辺 ${b}cm、高さ ${h}cm の 三角形の 面積は？`, `${(b * h) / 2}cm²`, [`${b * h}cm²`, `${b + h}cm²`, `${(b * h) / 2 + b}cm²`])
    }),
    S('heikoumen', '平行四辺形の面積', () => {
      const b = ri(4, 14)
      const h = ri(3, 10)
      return mc(`底辺 ${b}cm、高さ ${h}cm の 平行四辺形の 面積は？`, `${b * h}cm²`, [`${(b * h) / 2}cm²`, `${b + h}cm²`, `${2 * (b + h)}cm²`])
    }),
    S('daikeimen', '台形・ひし形の面積', () => {
      if (Math.random() < 0.5) {
        const a = ri(3, 8)
        const b = ri(a + 1, 14)
        const h = ri(4, 10)
        return mc(`上底 ${a}cm、下底 ${b}cm、高さ ${h}cm の 台形の 面積は？`, `${((a + b) * h) / 2}cm²`, [
          `${(a + b) * h}cm²`,
          `${a * b}cm²`,
          `${((a + b) * h) / 2 + h}cm²`,
        ])
      }
      const d1 = ri(4, 12)
      const d2 = ri(4, 12)
      return mc(`対角線が ${d1}cm と ${d2}cm の ひし形の 面積は？`, `${(d1 * d2) / 2}cm²`, [
        `${d1 * d2}cm²`,
        `${d1 + d2}cm²`,
        `${(d1 * d2) / 2 + d1}cm²`,
      ])
    }),
    S('seitakakkei', '正多角形', () => {
      const q = pick([
        { t: '正六角形の 1つの 角の 大きさは？', a: '120度', w: ['108度', '90度', '135度'] },
        { t: '正五角形の 1つの 角の 大きさは？', a: '108度', w: ['120度', '90度', '72度'] },
        { t: '円の 中心の まわりを 等分して 正六角形を かく とき、中心の 角を 何度ずつに 分ける？', a: '60度', w: ['72度', '45度', '90度'] },
        { t: '正多角形の 辺の 長さと 角の 大きさは？', a: 'どちらも みんな 等しい', w: ['辺だけ 等しい', '角だけ 等しい', 'ばらばら'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
    S('enshu5', '円周と円周率', () => {
      const q = pick([
        () => mc('円周率は 円周が 直径の 何倍かを あらわす。およそ いくつ？', '3.14', ['1.14', '31.4', '2.14']),
        () => {
          const d = pick([4, 5, 8, 10, 20])
          return mc(`直径 ${d}cm の 円の 円周は？`, `${Math.round(d * 3.14 * 100) / 100}cm`, [
            `${Math.round((d / 2) * 3.14 * 100) / 100}cm`,
            `${d * 3}cm`,
            `${Math.round(d * d * 3.14 * 100) / 100}cm`,
          ])
        },
        () => {
          const r = pick([3, 5, 6, 10])
          return mc(`半径 ${r}cm の 円の 円周は？`, `${Math.round(2 * r * 3.14 * 100) / 100}cm`, [
            `${Math.round(r * 3.14 * 100) / 100}cm`,
            `${r * 2}cm`,
            `${Math.round(r * r * 3.14 * 100) / 100}cm`,
          ])
        },
      ])
      return q()
    }),
  ],
  'kankei-5': [
    S('obigraph', '帯グラフ・円グラフ', () => {
      const q = pick([
        () => {
          const total = pick([200, 400, 500, 800])
          const p = pick([10, 20, 25, 40])
          return mc(`ぜんたい ${total}人の 円グラフで、ある 部分が ${p}％ でした。その 人数は？`, `${(total * p) / 100}人`, [
            `${p}人`,
            `${total - p}人`,
            `${(total * p) / 10}人`,
          ])
        },
        () => mc('全体に対する 部分の 割合の 変化を くらべるのに よい グラフは？', '帯グラフ', ['折れ線グラフ', 'ぼうグラフ', '数直線']),
        () => mc('円グラフや 帯グラフの 百分率を ぜんぶ たすと いくつに なる？', '100％', ['1％', '50％', 'グラフによる']),
      ])
      return q()
    }),
    S('hirei5', '比例の意味', () => {
      const q = pick([
        () => {
          const k = ri(2, 6)
          return mc(`1mの ねだんが ${k * 50}円の リボン。長さが 2倍、3倍に なると 代金は？`, '2倍、3倍に なる', [
            '半分、3分の1に なる',
            '変わらない',
            '2ふえ、3ふえる',
          ])
        },
        () => {
          const k = ri(2, 8)
          const x = ri(3, 9)
          return mc(`○が 1 ふえると □が ${k} ふえます。○が ${x} の とき □は？（○が0のとき□も0）`, k * x, [k + x, k * x + k, x])
        },
      ])
      return q()
    }),
  ],
  'kankei-6': [
    S('hinoati', '比の値', () => {
      const a = ri(2, 9)
      // a と b が おなじだと「6 : 6」という 意味のない比（比の値=1）になるので ずらす
      let b = ri(2, 9)
      if (b === a) b = a === 9 ? 2 : a + 1
      return mc(`${a} : ${b} の 比の値は？`, frac(a, b), [frac(b, a), `${a * b}`, `${a + b}`])
    }),
    S('hibunpai', '比例配分', () => {
      const [x, y] = pick([
        [2, 3],
        [3, 5],
        [1, 3],
        [3, 2],
        [4, 1],
      ])
      // 「1つ分」を先に決めて 合計を 比の和の倍数にする。
      // 合計を 先に決めると 1500円を 3:5 に分ける（÷8）で 187.5円 のように
      // わりきれず、小学生の 答えに ならない
      const one = pick([100, 150, 200, 250, 300])
      const total = one * (x + y)
      const part = one * x
      return mc(`${total}円を ${x} : ${y} に 分けます。多い ほうでは なく、${x} に あたる 分は なん円？`, `${part}円`, [
        `${total - part}円`,
        `${total / (x + y)}円`,
        `${(total * y) / (x + y) + 100}円`,
      ])
    }),
    S('daihyochi', '代表値（平均・中央・最頻）', () => {
      const q = pick([
        () => mc('データを 大きさの 順に ならべた とき、まん中に くる 値を なんと いう？', '中央値', ['平均値', '最頻値', '合計']),
        () => mc('データの 中で いちばん 多く 出てくる 値を なんと いう？', '最頻値', ['中央値', '平均値', '範囲']),
        () => {
          const ns = shuffle([3, 5, 5, 7, 9])
          return mc(`${ns.join('、')} の 最頻値は？`, '5', ['7', '9', '3'])
        },
        () => {
          const ns = [2, 4, 6, 8, 10]
          return mc(`${ns.join('、')} の 中央値は？`, '6', ['5', '4', '8'])
        },
      ])
      return q()
    }),
    S('chujougraph', '柱状グラフ・度数分布', () => {
      const q = pick([
        { t: 'データの ちらばりの ようすを あらわす グラフを なんと いう？', a: '柱状グラフ（ヒストグラム）', w: ['円グラフ', '折れ線グラフ', '帯グラフ'] },
        { t: '「10以上15未満」の はんいに 入るのは どの 数？', a: '12', w: ['15', '9', '16'] },
        { t: '度数分布表の 「度数」とは 何を あらわす？', a: 'その はんいに 入る データの 個数', w: ['合計', '平均', 'いちばん 大きい 値'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
    S('baai', '場合の数', () => {
      const q = pick([
        () => {
          const n = pick([3, 4])
          const ans = n === 3 ? 6 : 24
          return mc(`${n}人が 1れつに ならぶ ならび方は ぜんぶで 何通り？`, `${ans}通り`, [`${n}通り`, `${ans / 2}通り`, `${n * n}通り`])
        },
        () => {
          const n = pick([4, 5])
          const ans = (n * (n - 1)) / 2
          return mc(`${n}チームが どのチームとも 1回ずつ 試合を します。試合は ぜんぶで 何試合？`, `${ans}試合`, [
            `${n}試合`,
            `${n * (n - 1)}試合`,
            `${ans + 1}試合`,
          ])
        },
        () => mc('1、2、3の カードを ならべて 3けたの 整数を つくると、何こ できる？', '6こ', ['3こ', '9こ', '12こ']),
      ])
      return q()
    }),
  ],
  'zukei-6': [
    S('taishoseishitsu', '対称の性質', () => {
      const q = pick([
        { t: '線対称な 図形で、対応する 2つの 点を むすぶ 直線と 対称の軸の 関係は？', a: '垂直に まじわる', w: ['平行', '重なる', '45度で まじわる'] },
        { t: '正方形の 対称の軸は 何本？', a: '4本', w: ['2本', '1本', '8本'] },
        { t: '長方形の 対称の軸は 何本？', a: '2本', w: ['4本', '1本', '0本'] },
        { t: '円の 対称の軸は 何本？', a: '数えきれない（無数）', w: ['1本', '2本', '4本'] },
        { t: '点対称な 図形を 対称の中心の まわりに 何度 まわすと もとの 形に 重なる？', a: '180度', w: ['90度', '360度', '45度'] },
      ])
      return mc(q.t, q.a, q.w)
    }),
    S('shukuzu', '縮図の利用', () => {
      const q = pick([
        () => {
          const scale = pick([1000, 10000])
          const cm = ri(3, 9)
          const m = (cm * scale) / 100
          return mc(`1/${scale} の 縮図で ${cm}cm の 長さは、実際には なんm？`, `${m}m`, [`${m * 10}m`, `${m / 10}m`, `${cm}m`])
        },
        () => {
          const m = pick([50, 100, 200])
          const cm = pick([5, 10])
          const scale = (m * 100) / cm
          return mc(`実際の ${m}m が 縮図で ${cm}cm。この 縮図は 何分の1？`, `1/${scale}`, [`1/${scale * 10}`, `1/${scale / 10}`, `1/${m}`])
        },
      ])
      return q()
    }),
    S('enfukugo', '円をふくむ複合図形', () => {
      const q = pick([
        () => {
          const r = pick([2, 4, 5, 10])
          const area = Math.round(r * r * 3.14 * 100) / 100
          return mc(`半径 ${r}cm の 円の 4分の1（おうぎ形）の 面積は？`, `${Math.round((area / 4) * 100) / 100}cm²`, [
            `${area}cm²`,
            `${Math.round((area / 2) * 100) / 100}cm²`,
            `${Math.round((area / 3) * 100) / 100}cm²`,
          ])
        },
        () => {
          const a = pick([10, 20])
          const r = a / 2
          const circle = Math.round(r * r * 3.14 * 100) / 100
          return mc(`1辺 ${a}cm の 正方形の 中に ぴったり 入る 円。正方形から 円を のぞいた 部分の 面積は？`, `${Math.round((a * a - circle) * 100) / 100}cm²`, [
            `${circle}cm²`,
            `${a * a}cm²`,
            `${Math.round((a * a + circle) * 100) / 100}cm²`,
          ])
        },
      ])
      return q()
    }),
  ],
  'ryou-6': [
    S('kakuchu', '角柱・円柱の体積', () => {
      const q = pick([
        () => {
          const b = ri(3, 8)
          const h = ri(3, 7)
          const t = ri(4, 10)
          return mc(`底辺${b}cm・高さ${h}cm の 三角形を 底面と する 三角柱で、柱の 高さが ${t}cm。体積は？`, `${((b * h) / 2) * t}cm³`, [
            `${b * h * t}cm³`,
            `${(b * h) / 2}cm³`,
            `${b + h + t}cm³`,
          ])
        },
        () => {
          const r = pick([2, 3, 5])
          const h = ri(4, 10)
          const v = Math.round(r * r * 3.14 * h * 100) / 100
          return mc(`半径${r}cm の 円を 底面と する 円柱で、高さが ${h}cm。体積は？`, `${v}cm³`, [
            `${Math.round(r * r * 3.14 * 100) / 100}cm³`,
            `${Math.round(2 * r * 3.14 * h * 100) / 100}cm³`,
            `${v * 2}cm³`,
          ])
        },
        () => mc('角柱や 円柱の 体積を もとめる 公式は？', '底面積 × 高さ', ['底面積 ÷ 高さ', '底面積 × 高さ ÷ 2', '底面積 ＋ 高さ']),
      ])
      return q()
    }),
    S('oyoso', 'およその形と大きさ', () => {
      const q = pick([
        () => {
          const a = ri(4, 9)
          const b = ri(4, 9)
          return mc(`池の 形を たて 約${a}m、よこ 約${b}m の 長方形と みると、およその 面積は？`, `約${a * b}m²`, [
            `約${2 * (a + b)}m²`,
            `約${a + b}m²`,
            `約${(a * b) / 2}m²`,
          ])
        },
        () => {
          const b = ri(4, 10)
          const h = ri(4, 10)
          return mc(`葉の 形を 底辺 約${b}cm、高さ 約${h}cm の 三角形と みると、およその 面積は？`, `約${(b * h) / 2}cm²`, [
            `約${b * h}cm²`,
            `約${b + h}cm²`,
            `約${(b * h) / 4}cm²`,
          ])
        },
      ])
      return q()
    }),
  ],
}
