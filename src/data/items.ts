import type { Item } from '../types'

// 装備は 3つの ルートで 手にはいる。
//   ① たからばこ（マップの すみに かくれている／その村の そうび）
//   ② どうぐや（ショップ）で コインを はらって かう
//   ③ 大ボスを たおした ごほうび
// atk = ボス必要問題数を減らす / def = ミスダメージを減らす / hp = さいだいHP
// price = どうぐやでの ねだん（コイン）
const list: Item[] = [
  // ---- 数と計算のワールド ----
  { id: 'k1', name: 'たしざんの剣', emoji: '🗡️', slot: 'ぶき', atk: 2, def: 0, hp: 0, price: 60, desc: 'すべての計算の きほんが やどる剣。6年生まで ずっと たよりになる。' },
  { id: 'k2', name: '九九の大剣', emoji: '⚔️', slot: 'ぶき', atk: 5, def: 0, hp: 0, price: 130, desc: '九九を となえると 光る大剣。わり算ボスに とくに つよい。' },
  { id: 'k3', name: 'わり算の宝刀', emoji: '🪓', slot: 'ぶき', atk: 8, def: 0, hp: 0, price: 200, desc: 'なんでも 公平に わけられる 伝説の刃。' },
  { id: 'k4', name: '小数の魔法剣', emoji: '✨', slot: 'ぶき', atk: 11, def: 0, hp: 0, price: 270, desc: '0.1きざみで するどさを 調整できる ふしぎな剣。' },
  { id: 'k5', name: 'ぶんすうの盾', emoji: '🛡️', slot: 'たて', atk: 0, def: 6, hp: 5, price: 290, desc: '通分の力で どんな攻撃も 半分に わけて ふせぐ盾。' },
  { id: 'k6', name: '文字式の聖剣', emoji: '🌟', slot: 'ぶき', atk: 14, def: 0, hp: 0, price: 380, desc: 'x と y の力を やどした 最強クラスの聖剣。' },
  // ---- 量と測定のワールド ----
  { id: 'r1', name: 'とけいのおまもり', emoji: '⏰', slot: 'おまもり', atk: 0, def: 0, hp: 8, price: 70, desc: '時をよむ力で ピンチの時間を のばしてくれる。' },
  { id: 'r2', name: 'ながさのブーツ', emoji: '👢', slot: 'くつ', atk: 0, def: 2, hp: 4, price: 120, desc: 'cm と mm を きちんと はかれる 旅のブーツ。' },
  { id: 'r3', name: 'おもさのよろい', emoji: '🥋', slot: 'よろい', atk: 0, def: 4, hp: 4, price: 180, desc: 'ずっしり 1kg = 1000g。おもさが 身をまもる。' },
  { id: 'r4', name: 'めんせきのマント', emoji: '🧥', slot: 'よろい', atk: 0, def: 6, hp: 6, price: 260, desc: 'たて×よこ の広さで 体をつつむ マント。' },
  { id: 'r5', name: 'たいせきのかぶと', emoji: '⛑️', slot: 'かぶと', atk: 0, def: 5, hp: 6, price: 280, desc: 'たて×よこ×高さ。3つの方向から 頭をまもる。' },
  { id: 'r6', name: 'はやさのブーツ', emoji: '👟', slot: 'くつ', atk: 2, def: 4, hp: 8, price: 340, desc: '時速100kmで かけぬける 風のブーツ。' },
  // ---- 図形のワールド ----
  { id: 'z1', name: 'かたちのバッジ', emoji: '🔷', slot: 'おまもり', atk: 1, def: 0, hp: 4, price: 65, desc: 'まる・さんかく・しかくの 力がつまった バッジ。' },
  { id: 'z2', name: '三角コンパスの剣', emoji: '📐', slot: 'ぶき', atk: 4, def: 1, hp: 0, price: 130, desc: '三角形の ちょう点のように するどい 剣。' },
  { id: 'z3', name: 'えんばんの盾', emoji: '🔵', slot: 'たて', atk: 0, def: 3, hp: 3, price: 170, desc: '半径×2 = 直径。まんまるだから すきがない。' },
  { id: 'z4', name: '角度のオノ', emoji: '🪃', slot: 'ぶき', atk: 7, def: 0, hp: 0, price: 230, desc: '90度に ふりぬくと 直角の いちげきが 出る。' },
  { id: 'z5', name: 'ごうどうのかぶと', emoji: '🪖', slot: 'かぶと', atk: 0, def: 7, hp: 4, price: 300, desc: 'ぴったり 重なる 2まいの合同な板で できている。' },
  { id: 'z6', name: 'たいしょうの翼', emoji: '🦋', slot: 'おまもり', atk: 5, def: 2, hp: 4, price: 330, desc: '線対称の うつくしい翼。左右の バランスは かんぺき。' },
  // ---- 数量関係のワールド ----
  { id: 's1', name: 'ならびのゆびわ', emoji: '💍', slot: 'おまもり', atk: 1, def: 0, hp: 6, price: 75, desc: '2, 4, 6, 8… 数のならびが 未来を おしえてくれる。' },
  { id: 's2', name: 'グラフの地図', emoji: '🗺️', slot: 'おまもり', atk: 3, def: 0, hp: 2, price: 120, desc: 'ボスの弱点が ひとめで わかる ふしぎな地図。' },
  { id: 's3', name: 'めもりの槍', emoji: '🔱', slot: 'ぶき', atk: 6, def: 0, hp: 0, price: 180, desc: '1めもりの大きさを 見ぬいて 弱点を つらぬく槍。' },
  { id: 's4', name: 'かわり方のローブ', emoji: '🧣', slot: 'よろい', atk: 2, def: 5, hp: 5, price: 260, desc: 'きまりを 見つけると 形をかえて 身をまもる ローブ。' },
  { id: 's5', name: 'わりあいメガネ', emoji: '👓', slot: 'おまもり', atk: 6, def: 0, hp: 2, price: 270, desc: '50%引きも 見やぶれる メガネ。ボスの手ごわさも 割引!?' },
  { id: 's6', name: 'ひれいの魔法石', emoji: '💎', slot: 'おまもり', atk: 8, def: 0, hp: 10, price: 360, desc: 'がんばりに 比例して 力がわきでる 伝説の石。' },

  // ============================================================
  // どうぐや（ショップ）で かえる きほんの そうび。
  // 「まもり」が 0 のままだと 大ボスの こうげきは 一撃で やられるので、
  // 1年生の 村でも かえる やすい ぼうぐを そろえてある。
  // ============================================================
  // ---- 1・2年生の どうぐや（やすい きほん装備） ----
  { id: 'b1', name: 'きの ぼう', emoji: '🥢', slot: 'ぶき', atk: 1, def: 0, hp: 0, price: 40, desc: 'どうぐやの いちばん やすい ぶき。それでも ボスの もんだいが 1問 へる。' },
  { id: 'b2', name: 'かわの たて', emoji: '🟫', slot: 'たて', atk: 0, def: 2, hp: 2, price: 60, desc: 'はじめての ぼうぐに ぴったり。ミスの ダメージを へらしてくれる。' },
  { id: 'b3', name: 'ぬのの ふく', emoji: '👕', slot: 'よろい', atk: 0, def: 2, hp: 3, price: 70, desc: 'かるくて うごきやすい ふく。まもりが 0の ままは あぶないぞ。' },
  { id: 'b4', name: 'たびの ぼうし', emoji: '🧢', slot: 'かぶと', atk: 0, def: 1, hp: 2, price: 45, desc: 'たびだちの ぼうし。あたまを ちょっとだけ まもってくれる。' },
  { id: 'b5', name: 'わらじ', emoji: '🥿', slot: 'くつ', atk: 0, def: 1, hp: 1, price: 35, desc: 'やすいけれど、はいて いないより ずっと いい。' },
  { id: 'b6', name: 'きぼうの おまもり', emoji: '🍀', slot: 'おまもり', atk: 0, def: 1, hp: 3, price: 55, desc: 'よつばの おまもり。すこしだけ ゆうきが わいてくる。' },
  // ---- 3・4年生の どうぐや（てつの装備） ----
  { id: 'b7', name: 'はがねの けん', emoji: '🔪', slot: 'ぶき', atk: 6, def: 0, hp: 0, price: 190, desc: 'よく きれる はがねの けん。ボスの もんだいが 6問 へる。' },
  { id: 'b8', name: 'てつの たて', emoji: '🛡', slot: 'たて', atk: 0, def: 4, hp: 3, price: 175, desc: 'ずっしり おもい てつの たて。ミスに つよくなる。' },
  { id: 'b9', name: 'てつの よろい', emoji: '🦺', slot: 'よろい', atk: 0, def: 5, hp: 4, price: 210, desc: 'からだ ぜんたいを つつむ てつの よろい。' },
  { id: 'b10', name: 'てつの かぶと', emoji: '⛑', slot: 'かぶと', atk: 0, def: 4, hp: 3, price: 180, desc: 'あたまを がっちり まもる てつの かぶと。' },
  { id: 'b11', name: 'はやての くつ', emoji: '🥾', slot: 'くつ', atk: 0, def: 3, hp: 3, price: 160, desc: 'かぜのように はやく あるける くつ。' },
  { id: 'b12', name: 'まもりの おまもり', emoji: '🧿', slot: 'おまもり', atk: 0, def: 3, hp: 5, price: 190, desc: 'わるい こうげきを はねかえすと いわれる おまもり。' },
  // ---- 5・6年生の どうぐや（伝説の装備） ----
  { id: 'b13', name: 'ひかりの けん', emoji: '⚡', slot: 'ぶき', atk: 10, def: 0, hp: 0, price: 380, desc: 'ひかりを あつめた けん。ボスの もんだいが 10問も へる。' },
  { id: 'b14', name: 'ミスリルの たて', emoji: '💠', slot: 'たて', atk: 0, def: 8, hp: 6, price: 400, desc: 'かるくて とても かたい ミスリルの たて。' },
  { id: 'b15', name: 'りゅうの よろい', emoji: '🐉', slot: 'よろい', atk: 0, def: 9, hp: 8, price: 450, desc: 'りゅうの うろこで できた さいきょうクラスの よろい。' },
  { id: 'b16', name: 'せいなる かぶと', emoji: '👑', slot: 'かぶと', atk: 0, def: 8, hp: 6, price: 410, desc: 'ひかりを はなつ せいなる かぶと。' },
  { id: 'b17', name: 'しっぷうの くつ', emoji: '🩰', slot: 'くつ', atk: 0, def: 6, hp: 5, price: 350, desc: 'かぜと はしる しっぷうの くつ。' },
  { id: 'b18', name: 'まもりの しんじゅ', emoji: '🔮', slot: 'おまもり', atk: 0, def: 6, hp: 8, price: 380, desc: 'ふしぎな 力で ゆうしゃを つつむ しんじゅ。' },
]

export const ITEMS: Record<string, Item> = Object.fromEntries(list.map((i) => [i.id, i]))

// ステージ（学年×単元）の そうびの かず。もちもの画面の「〇／24」に つかう。
export const STAGE_ITEM_COUNT = 24
