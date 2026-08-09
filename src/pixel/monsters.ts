import { artUrl, type Art, type Pal } from './px'

// ============================================================
// モンスターの ドット絵（ドラクエ風）
//
// 「安っぽく 見えない」ために 3つの ルールを まもって かいている。
//   ① 立体感：ひかり(H) → 中間(A) → かげ(B) の 3だんかいで ぬる。
//      ひかりは 左上、かげは 右下。これだけで まるく ふくらんで 見える。
//   ② 目：白目(E)＋くろ目(P)＋ハイライト(G) の 3点セット。
//      四角い 白ぬきの 目は 一気に 安っぽく なるので つかわない。
//   ③ りんかく(D)は まっ黒では なく、その色を こくした 色。
//      まっ黒だと きつく 見え、色が にごる。
//
// ・ザコは 24×24ドット、大ボスは 32×32ドット
// ・左右対称の ものは「左半分」だけ かいて sym() で 鏡にする
// パレット： H=ひかり A=本体 B=かげ C=アクセント D=りんかく
//           E=白目 P=くろ目 G=目のハイライト W=きば・歯
// ============================================================

const sym = (half: Art): Art => half.map((r) => r + [...r].reverse().join(''))

// ---- 目は あとから はめこむ ----
// 目を 絵の中に 直接 かくと、左右対称の モンスターでは
// 鏡にした とき まん中で くっついて「一本の 帯」に 見えてしまう。
// そこで 目だけ 別に もっておき、きまった いちに 焼きこむ。
const EYE: Art = ['DEED', 'EGPE', 'EPPE', 'DEED']
const EYE_BIG: Art = ['DEEED', 'EGPPE', 'EPPPE', 'EPPPE', 'DEEED']

function stamp(art: Art, sprite: Art, x: number, y: number): Art {
  const out = art.map((r) => [...r])
  sprite.forEach((row, dy) => {
    ;[...row].forEach((ch, dx) => {
      if (ch === '.') return
      const ry = y + dy
      const rx = x + dx
      if (out[ry] && rx >= 0 && rx < out[ry].length) out[ry][rx] = ch
    })
  })
  return out.map((r) => r.join(''))
}

// 左右対称の かおに 目を 2つ（x は 左目の いち）
const withEyes = (art: Art, x: number, y: number, big = false): Art => {
  const eye = big ? EYE_BIG : EYE
  const w = art[0].length
  return stamp(stamp(art, eye, x, y), eye, w - x - eye[0].length, y)
}
// よこむきの モンスターに 目を 1つ
const withEye = (art: Art, x: number, y: number, big = false): Art =>
  stamp(art, big ? EYE_BIG : EYE, x, y)


// ---------------- ザコ（左12ドット → 24×24） ----------------

// スライム：しずくがた＋大きな目＋にっこり口（ドラクエの かお）
const SLIME: Art = withEyes(sym([
  '............',
  '............',
  '...........D',
  '..........DH',
  '.........DHH',
  '........DHHA',
  '.......DHHAA',
  '......DHHAAA',
  '.....DHHAAAA',
  '....DHHAAAAA',
  '...DHHAAAAAA',
  '..DHHAAAAAAA',
  '..DHAAADDDDA',
  '.DHAAADAAAAD',
  '.DHAAADAAAAD',
  '.DHAAADDDDDA',
  '.DHAAAAAAAAA',
  '.DHAAAAAAAAA',
  '.DBAAAAAWWWW',
  '.DBBAAAAAWWW',
  '..DBBAAAAAAA',
  '..DDBBBAAAAA',
  '....DDBBBBBB',
  '......DDDDDD',
]), 6, 12)

// いもむし：ふしのある からだ＋つの＋まるい目
const BUG: Art = withEyes(sym([
  '............',
  '.........D..',
  '........DC..',
  '.......DC...',
  '......DDDDDD',
  '.....DHHHAAA',
  '....DHHAAAAA',
  '....DHAADDDD',
  '....DHAADAAA',
  '....DHAADAAA',
  '....DHAADDDD',
  '....DHAAAAAA',
  '....DBAAAWWW',
  '...DDDDDDDDD',
  '...DHHAAAAAA',
  '...DBBAAAAAA',
  '...DDDDDDDDD',
  '...DHHAAAAAA',
  '...DBBAAAAAA',
  '....DDDDDDDD',
  '....DBBAAAAA',
  '.....DDBBBBB',
  '.......DDDDD',
  '............',
]), 6, 7)

// コウモリ：まくの ある つばさ＋大きな目＋きば
const BAT: Art = withEyes(sym([
  '............',
  '............',
  'DD..........',
  'DBD.........',
  'DBBD...DDDDD',
  'DBBBD.DHHHAA',
  'DBHBBDDHHAAA',
  'DBHHBBDHAAAA',
  'DBBHHBDHADDD',
  '.DBBHBDHADAA',
  '.DBBBBDHADAA',
  '..DBBBDHADDD',
  '...DBBDHAAAA',
  '....DDDHAAWW',
  '.......DBAWW',
  '.......DBAAA',
  '........DBAA',
  '........DDBA',
  '..........DD',
  '............',
  '............',
  '............',
  '............',
  '............',
]), 8, 8)

// おおかみ：よこむき。とがった耳・長い鼻づら・きば・ふさふさの しっぽ。
// 正面むきの まる顔だと「ネコ」に 見えてしまうので、
// イヌ科と ひとめで わかる よこむきの シルエットに した。
const BEAST: Art = withEye([
  '........................',
  '....DD.....DD...........',
  '...DHAD...DHAD..........',
  '...DHAAD.DHAAD..........',
  '...DHHAADDHAAD..........',
  '....DHHHAAAAAD..........',
  '...DHHHAAAAAAD..........',
  '..DHHHAAAAAAAD..........',
  '.DHHAAAAAAAAAD.......DD.',
  'DHAAAAAAAAAAAD......DBBD',
  'DAWWAAAAAAAAAD.....DBBBD',
  'DAWWAAAAAAAAAAD...DBBBBD',
  '.DDAAAAAAAAAAAADDDBBBBD.',
  '...DDDHAAAAAAAAAABBBBD..',
  '......DHHAAAAAAAAABBD...',
  '......DHHAAAAAAAAADD....',
  '......DBBAAAAAAAAAD.....',
  '......DBBAAAAAAAAAD.....',
  '......DBBAAAAAAAAAD.....',
  '......DHADDDDDDHAAD.....',
  '......DHAD....DHAAD.....',
  '......DBAD....DBAAD.....',
  '......DDDD....DDDDD.....',
  '........................',
], 5, 6)

// おばけ：ふわっと した からだ＋ぎざぎざの すそ
const GHOST: Art = withEyes(sym([
  '............',
  '............',
  '......DDDDDD',
  '....DDHHHHAA',
  '...DHHHHAAAA',
  '..DHHHAAAAAA',
  '..DHHAAAAAAA',
  '..DHAADDDDAA',
  '..DHAADAAAAD',
  '..DHAADAAAAD',
  '..DHAADDDDAA',
  '..DHAAAAAAAA',
  '..DHAAAAAAAA',
  '..DHAAAAWWWW',
  '..DHAAAAAWWW',
  '..DBAAAAAAAA',
  '..DBBAAAAAAA',
  '..DBBBAAAAAA',
  '..DBBDDDBBBB',
  '..DBD...DBBB',
  '..DD.....DDB',
  '..........DD',
  '............',
  '............',
]), 6, 7)

// ぞう：正面むき。大きな耳＋まん中に たれた 長い鼻＋きば
const ELEPHANT: Art = withEyes(sym([
  '............',
  '............',
  '.......DDDDD',
  '....DDDHHHAA',
  '..DDHHHHHAAA',
  '.DHHHHHHAAAA',
  'DHHHHHHAAAAA',
  'DHHHHHAAAAAA',
  'DHHHHAAAAAAA',
  'DHHHAAAAAAAA',
  'DBHHAAAAAAAA',
  '.DBBAAAAAAAA',
  '..DDBAAAAAAA',
  '....DBAAAAAA',
  '....DBAWWDAA',
  '....DBAWWDAA',
  '....DBAAADAA',
  '....DBBAADAA',
  '....DHAADDAA',
  '....DHAAD.DA',
  '....DBAAD.DA',
  '....DDDDD.DA',
  '..........DB',
  '..........DD',
]), 6, 6)

// ビーバー：まるい からだ＋まえ歯（きば）＋ひらたい しっぽ
const BEAVER: Art = withEyes(sym([
  '............',
  '............',
  '..DD........',
  '.DHHD.......',
  '.DHHHDDDDDDD',
  '..DHHHHHHAAA',
  '..DHHHHHAAAA',
  '..DHHHHAAAAA',
  '..DHHHAAAAAA',
  '..DHHAAAAAAA',
  '..DHAAAAADDD',
  '..DHAAAAADWW',
  '..DHAAAAADWW',
  '..DHAAAAADDD',
  '..DHHAAAAAAA',
  '.DHHHAAAAAAA',
  'DHHAAAAAAAAA',
  'DHAAAAAAAAAA',
  'DBAAAAAAAAAA',
  'DBBAAAAAAAAA',
  'DBBBAAAAAAAA',
  '.DBBBBBBBBBB',
  '..DDBBBBBBBB',
  '....DDDDDDDD',
]), 5, 6)


// リス：よこむき。大きな ふさふさの しっぽ＋まえ歯
const SQUIRREL: Art = withEye([
  '........................',
  '........................',
  '...DD........DDDD.......',
  '..DHAD.....DDHHHHD......',
  '..DHAADDDD.DHHHHHHD.....',
  '..DHHHHHHADDHHHHAAAD....',
  '..DHHHHHAAADHHHAAAAD....',
  '..DHAAAAAAADHHAAAAAD....',
  '..DHAAAAAAADHAAAAAAD....',
  '..DHAAWWAAADHAAAAABD....',
  '...DAAWWAAAADAAAABBD....',
  '...DHAAAAAAADAAABBBD....',
  '...DHAAAAAAAADABBBBD....',
  '...DHAAAAAAAAADBBBBD....',
  '...DBAAAAAAAAADBBBD.....',
  '...DBBAAAAAAAADDDD......',
  '....DBAADDDAAD..........',
  '....DHAD..DHAD..........',
  '....DBAD..DBAD..........',
  '....DDDD..DDDD..........',
  '........................',
  '........................',
  '........................',
  '........................',
], 4, 5)

// ピカリ：いなずまの トゲが 出た 光の たま。
// （さかなの絵だと 名前と 合わない）
const SPARK: Art = withEyes(sym([
  '..........C.',
  '.........CC.',
  '........CC..',
  '.......DDDDD',
  '.C....DHHHAA',
  '..C..DHHHAAA',
  '...CDHHAAAAA',
  '....DHAAAAAA',
  '...DHAAAAAAA',
  '..DHAAAAAAAA',
  '..DHAAAAAAAA',
  '..DHAAAAAAAA',
  '..DHAAAAAAAA',
  '..DBAAAAAAAA',
  '...DBAAAAAAA',
  '....DBAAAAAA',
  '...C.DBAAAAA',
  '..C...DBBBBB',
  '.C.....DDDDD',
  'C...........',
  '............',
  '............',
  '............',
  '............',
]), 6, 8)

// ミラー：手かがみ。かがみに かおが うつっている。
const MIRROR: Art = withEyes(sym([
  '............',
  '......DDDDDD',
  '....DDCCCCCC',
  '...DCCHHHHAA',
  '..DCHHHAAAAA',
  '..DCHHAAAAAA',
  '..DCHAAAAAAA',
  '..DCHAAAAAAA',
  '..DCHAAAAAAA',
  '..DCHAAAAAAA',
  '..DCHAAAAAAA',
  '..DCHAAAAAAA',
  '...DCHAAAAAA',
  '....DCCAAAAA',
  '.....DDCCCCC',
  '.......DDDDD',
  '.........DCC',
  '.........DCC',
  '.........DCC',
  '........DCCC',
  '........DDDD',
  '............',
  '............',
  '............',
]), 7, 6)

// ---- 左右ひたいちでない ザコ（24幅を そのまま かく） ----

// へび：とぐろ＋もちあげた 頭＋した
const SNAKE: Art = withEye([
  '........................',
  '............DDDDDD......',
  '...........DHHHAAAD.....',
  '...........DHADDDAD.....',
  '...........DHADAAAD.....',
  '...........DHADAAAD.....',
  '...........DHADDDDD..CC.',
  '...........DHAAAAD...CC.',
  '..........DHHAAAD.......',
  '.........DHHAAAD........',
  '........DHHAAAD.........',
  '.......DHHAAAD..........',
  '......DHHAAAD...........',
  '.....DHHAAAD............',
  '....DHHAAADDDDDDDD......',
  '..DDHHAAAAAAAAAAAAD.....',
  '..DHHAAAAAAAAAAAAAAD....',
  '..DHAABBBBBBBBBBBBAD....',
  '..DBAABBBBBBBBBBBBAD....',
  '..DBBAAAAAAAAAAAAAAD....',
  '...DBBBBBBBBBBBBBBD.....',
  '....DDDDDDDDDDDDDD......',
  '........................',
  '........................',
], 15, 3)

// とり：よこむき。くちばし・つばさ・尾ばね
const BIRD: Art = withEye([
  '........................',
  '........................',
  '.........DDDDD..........',
  '........DHHHAAD.........',
  '.......DHHDDDAAD........',
  '.......DHDAAADAD..CCC...',
  '....CCCDHDAAADAD.CCCC...',
  '...CCCCDHDDDDDAADCCCC...',
  '....CCCDHAAAAAAADCCC....',
  '.......DHHAAAAAAAAD.....',
  '......DHHAABBBBAAAAD....',
  '.....DHHAABBBBBBAAAAD...',
  '.....DHAABBBBBBBBAAAD...',
  '.....DHAAABBBBBBAAAAD...',
  '......DHAAAABBAAAAAD....',
  '.......DHAAAAAAAAAD.....',
  '........DDHAAAAADD......',
  '..........DBAABD........',
  '..........DCDDCD........',
  '..........DC..CD........',
  '.........DDD..DDD.......',
  '........................',
  '........................',
  '........................',
], 10, 4)

// ロボ：しかくい からだ＋アンテナ＋ランプの目
const ROBOT: Art = withEyes(sym([
  '............',
  '.........DC.',
  '.........DC.',
  '......DDDDDD',
  '.....DHHHAAA',
  '.....DHDDDDD',
  '.....DHDAAAA',
  '.....DHDAAAA',
  '.....DHDDDDD',
  '.....DHAAAAA',
  '.....DHACCCC',
  '.....DBAAAAA',
  '...DDDDDDDDD',
  '..DHDHHHAAAA',
  '..DHDHAAAAAA',
  '..DHDHABBBBB',
  '..DHDBABBBBB',
  '..DBDBAAAAAA',
  '..DBDBBBBBBB',
  '..DDDDDDDDDD',
  '.....DHAADBA',
  '.....DBAADBA',
  '.....DDDDDDD',
  '............',
]), 6, 5)

// かに：はさみ＋こうら＋あし
const CRAB: Art = withEyes(sym([
  '............',
  '..DD........',
  '.DHHD.......',
  'DHHAAD......',
  'DHAAAD..DDDD',
  'DBAAAD.DHHHA',
  '.DBAD.DHHAAA',
  '..DD.DHAADDD',
  '.....DHADAAA',
  '.....DHADAAA',
  '....DHHADDDD',
  '....DHAAAAAA',
  '....DHAAAWWW',
  '....DBAAAAAA',
  '...DBBAAAAAA',
  '...DBBBBBBBB',
  '...DDDDDDDDD',
  '..DHD.DHD.DH',
  '..DBD.DBD.DB',
  '..DD..DD..DD',
  '............',
  '............',
  '............',
  '............',
]), 7, 8)


// まほうつかい：とんがりぼうし＋つえ
const MAGE: Art = withEyes(sym([
  '...........D',
  '..........DH',
  '.........DHH',
  '........DHHC',
  '.......DHHCC',
  '......DHHCCC',
  '.....DHHCCCC',
  '..DDDDDDDDDD',
  '.....DDDDDDD',
  '.....DHAAAAA',
  '.....DHDDDDA',
  '.....DHDAAAD',
  '.....DHDAAAD',
  '.....DHDDDDA',
  '....DHHAAAAA',
  '...DHHAAAAAA',
  '..DHHAAAABBB',
  '..DHAAAABBBB',
  '..DHAACCCBBB',
  '..DBAAAABBBB',
  '..DBBAAABBBB',
  '..DBBBBBBBBB',
  '...DDDDDDDDD',
  '............',
]), 6, 10)

// さかな：よこむき。ひれ・尾
const FISH: Art = withEye([
  '........................',
  '........................',
  '........................',
  '.........DDDDDD.........',
  '......DDDHHHHAAADD....DD',
  '....DDHHHHAAAAAAAAD..DHD',
  '..DDHHHAAAAAAAAAAAADDHAD',
  '..DHHDDDDAAAAAAAAAAADHAD',
  '..DHDAAADAAAAAAAAAAAAHAD',
  '..DHDAAADAAACCCAAAAAAHAD',
  '..DHDDDDDAAACCCAAAAADHAD',
  '..DHAAWWAAAAAAAAAAAADHAD',
  '..DBAAAAABBBBBBBBBBADHAD',
  '...DBBAABBBBBBBBBBBADHAD',
  '....DDBBBBBBBBBBBBDD.DHD',
  '......DDBBBBBBBBDD....DD',
  '.........DDDDDD.........',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
], 4, 7)

// チーター：よこむき。体を ひくく 長くして ネコ科の シルエットに。
// （足が 長いと シカに 見えてしまう）
const CHEETAH: Art = withEye([
  '........................',
  '........................',
  '..DD....................',
  '.DHAD...................',
  '.DHAAD..................',
  'DHHAAAD.................',
  'DHAAAAD.........DDD.....',
  'DAWWAAD........DBBBD....',
  'DAWWAAADDDDDDDDBBBBD....',
  '.DDAAAAAAAAAAAAABBBD....',
  '..DHAAAAAAAAAAAAABBD....',
  '..DHAABAABAABAAAABDD....',
  '..DHAAAAAAAAAAAAAAD.....',
  '..DHAABAABAABAAAAD......',
  '..DBAAAAAAAAAAAAAD......',
  '..DBBAAAAAAAAAAAAD......',
  '..DHAADDDDDDDDHAAD......',
  '..DHAAD......DHAAD......',
  '..DBAAD......DBAAD......',
  '..DDDDD......DDDDD......',
  '........................',
  '........................',
  '........................',
  '........................',
], 2, 4)

// かめ：まん中に 頭、まわりに こうら。
// こうらは 板の わけめ(D)を 入れて ドームらしく 見せる。
const TURTLE: Art = withEyes(sym([
  '............',
  '............',
  '.......DDDDD',
  '.......DHHAA',
  '.......DHAAA',
  '.......DHAAA',
  '.....DDDHAAA',
  '...DDBBBHAAA',
  '..DBCCCCBDDD',
  '.DBCCCCCCCBB',
  'DBCCCDCCCDCB',
  'DBCCCDCCCDCB',
  'DBBDDDDDDDDB',
  'DBBCCCDCCCCB',
  'DBBCCCDCCCCB',
  '.DBBBBBBBBBB',
  '..DBBBBBBBBB',
  '...DDDDDDDDD',
  '....DHAD.DHA',
  '....DBAD.DBA',
  '....DDDD.DDD',
  '............',
  '............',
  '............',
]), 7, 3)

// カタツムリ：うずまきの から＋やわらかい からだ＋つの。
// （まえは カメの絵を つかっていて 名前と 合っていなかった）
const SNAIL: Art = withEye([
  '.C.........DDDDD........',
  'DC.......DDCCCCCDD......',
  '.DC.....DCCCCCCCCCD.....',
  '..DC...DCCCDDDDDCCCD....',
  '...DC..DCCDCCCCCDCCD....',
  '....D..DCCDCDDDCDCCD....',
  '.......DCCDCDCCDCCCD....',
  '.......DCCDCDDDDCCCD....',
  '.......DCCCDDDDDCCCD....',
  '.DDDD..DCCCCCCCCCCCD....',
  'DHHHHDDDCCCCCCCCCCD.....',
  'DHAAAAADDCCCCCCCCD......',
  'DHAAAAAAADDDDDDDD.......',
  '.DAAAAAAAAAAAAAAD.......',
  '..DHAAAAAAAAAAAAD.......',
  '..DBBBBBBBBBBBBBD.......',
  '...DDDDDDDDDDDDD........',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
], 1, 10)

// カエル：あたまの うえに とび出した 目＋よこに 大きい 口＋うしろ足
const FROG: Art = withEyes(sym([
  '............',
  '............',
  '.......DDDDD',
  '......DHHHAA',
  '.....DHHHHAA',
  '....DHHHHHAA',
  '...DHHHHAAAA',
  '..DHHHAAAAAA',
  '..DHHAAAAAAA',
  '..DHAAAAAAAA',
  '..DHAADDDDDD',
  '..DHAADWWWWW',
  '..DHAADDDDDD',
  '..DHAAAAAAAA',
  '.DHHAAAAAAAA',
  'DHHAAAAAAAAA',
  'DHAAAAAAAAAA',
  'DBAAAAAAAAAA',
  'DBBAAAAAAAAA',
  '.DBBBAAAAAAA',
  '..DDBBBBBBBB',
  'DHAD.DDDDDDD',
  'DHAD........',
  'DDDD........',
]), 5, 3)

// トカゲ：4本の あし＋ながく ほそく のびた しっぽ。
// （しっぽを ほそ長く しないと チーターと 見分けが つかない）
const LIZARD: Art = withEye([
  '........................',
  '........................',
  '........................',
  '........................',
  '..DDDD..................',
  '.DHHHAD.................',
  'DHHAAAAD................',
  'DAWWAAAAD...............',
  'DAAAAAAAADD.............',
  '.DDAAAAAAAADDD..........',
  '..DHAAAAAAAAAADDD.......',
  '..DHAACAACAACAAAADDD....',
  '..DBAAAAAAAAAAAAAAADD...',
  '...DBBAAAAAAAAAAAAAAD...',
  '....DDDBAAAAAAADDDDDD...',
  '.....DHAD..DHAD.........',
  '.....DHAD..DHAD.........',
  '.....DDDD..DDDD.........',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
], 3, 5)

// サソリ：まえに はさみ、うしろに ふしのある しっぽと どくばり。
// （カニの絵だと しっぽが なくて 見分けが つかない）
const SCORPION: Art = withEye([
  '........................',
  '........................',
  '.....................C..',
  '....................CD..',
  '...................DCD..',
  '..................DBBD..',
  '..................DBD...',
  'DD................DBD...',
  'DHAD.............DBBD...',
  'DHAAD...........DBBD....',
  '.DHAADDDDDDDDDDBBBD.....',
  '..DHHHHHAAAAAAAAAD......',
  '..DHHHHAAAAAAAAAAD......',
  'DD.DHHHAAAAAAAAAAD......',
  'DHAD.DHAAAAAAAAAAD......',
  'DHAAD.DDDDDDDDDDDD......',
  '.DHAD.D..D..D..D........',
  '..DD..D..D..D..D........',
  '......D..D..D..D........',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
], 5, 11)

// ---------------- 大ボス（左16ドット → 32×32） ----------------

// ドラゴン：よこむき。長い口先＋あけたアゴ＋ツノ＋つばさ＋しっぽ
const B_DRAGON: Art = withEye([
  '................................',
  '................................',
  '..................CCC...........',
  '.................CCC............',
  '................CCC.............',
  '...............CCC...........DD.',
  '.........DDDDDDDCC..........DHBD',
  '.......DDHHHHHHAAD.........DHHBD',
  '.....DDHHHHAAAAAAD........DHHBBD',
  '...DDHHHAADAAAAAAD.......DHHBBBD',
  '..DHHHAAAADAAAAAAD......DHCBBBBD',
  '..DWWWWWWWWWAAAAD......DHCBBBBBD',
  '...DDDDDDDDDDAAAD.....DHCBBBBBBD',
  '....DWWWWWWWDAAAD....DHCBBBBBBBD',
  '.....DHHAAAADAAAD...DHHCBBBBBBBD',
  '.......DDDDDDAAAD..DHHCBBBBBBBBD',
  '.............DHAAADDHHBBBBBBBBBD',
  '.............DHAAAADHHBBBBBBBBD.',
  '............DHHAAAAADHBBBBBBBD..',
  '...........DHHHAAAAAADBBBBBBD...',
  '..........DHHHAAAAAAAADBBBBD....',
  '..........DHHAAAAAAAAAD.........',
  '..........DHACCCCCCCAAD.DDDD....',
  '..........DHACCCCCCCAADDHHAD....',
  '...........DHACCCCCAADDHHAAAD...',
  '...........DHAAAAAAADDHHAAAAD...',
  '...........DHAAAAAAADDDDBBBD....',
  '...........DDDDDDDDDD...........',
  '............DHAD...DHAD.........',
  '............DBAD...DBAD.........',
  '...........DCAACD.DCAACD........',
  '...........DDDDDD.DDDDDD........',
], 10, 8, true)

// まおう（キング）：おうかん＋ひげ＋えり＋そとに ひろがる マント。
// 胴を しかくい かたまりに すると「顔＋ざぶとん」に 見えるので、
// マント(かげ色B)を 下に むかって ひろげ、
// えりの トリム(C)と りんかく(D)で うで・ローブ・マントを 切り分ける。
const B_KING: Art = withEyes(sym([
  '................',
  '................',
  '.......C...C...C',
  '.....DCCCCCCCCCC',
  '.....DHCCCCCCCCC',
  '.....DDDDDDDDDDD',
  '......DHHHAAAAAA',
  '......DHAAAAAAAA',
  '......DHAAAAAAAA',
  '......DHAAAAAAAA',
  '......DHAAAAAAAA',
  '......DHAAWWWWWW',
  '.......DHWWWWWWW',
  '.......DWWWWWWWW',
  '........DWWWWWWW',
  '......DDDDDDDDDD',
  '.....DCCCCCCCCCC',
  '....DDDDDDDDDDDD',
  '...DBBDHHHAAAAAA',
  '...DBBDHHAAAAAAA',
  '..DBBBDHAAACCCCC',
  '..DBBBDHAAACCCCC',
  '..DBBBDHAAAAAAAA',
  '.DBBBBDHAAAAAAAA',
  '.DBBBBDHHAAAAAAA',
  'DBBBBBDDHHAAAAAA',
  'DBBBBBBDHHHAAAAA',
  'DBBBBBBDDHHAAAAA',
  'DBBBBBBBDDAAAAAA',
  '.DBBBBBBBDAAAAAA',
  '..DDBBBBBBBAAAAA',
  '....DDDDDDDDDDDD',
]), 9, 7, true)

// まじん（デーモン）：大きなツノ＋きば＋つばさ
const B_DEMON: Art = withEyes(sym([
  '................',
  'CC..............',
  'CCC.............',
  '.CCC............',
  '..CCC...........',
  '...CCCDDDDDDDDDD',
  '....CCDHHHHHAAAA',
  '.....DHHHHAAAAAA',
  '.....DHHADDDDAAA',
  '.....DHHADAAAAAD',
  '.....DHAADAAAAAD',
  '.....DHAADDDDAAA',
  '.....DHAAAAAAAAA',
  '.....DHAWWWWWWWW',
  '.....DBAWWWWWWWW',
  '......DHAAAAAAAA',
  'DDD...DHHAAAAAAA',
  'DBBD..DHHAAAAAAA',
  'DBBBD.DHHAAAAAAA',
  'DBCBBDDHHAAAAAAA',
  'DBCBBBDHAAAAAAAA',
  'DBCBBBBDAAAAAAAA',
  '.DBBBBBDAAAAAAAA',
  '..DBBBBDAAAAAAAA',
  '...DBBBDAAAAAAAA',
  '....DBBDBAAAAAAA',
  '.....DDDBBAAAAAA',
  '.......DBBBAAAAA',
  '.......DHAADAAAA',
  '.......DBAAD....',
  '......DCAACD....',
  '......DDDDDD....',
]), 9, 8, true)

// クラーケン：とんがった あたま＋大きな目＋しょくしゅ
const B_KRAKEN: Art = withEyes(sym([
  '................',
  '..............DD',
  '............DDHH',
  '..........DDHHHA',
  '.........DHHHHAA',
  '........DHHHHAAA',
  '.......DHHHAAAAA',
  '......DHHHAAAAAA',
  '.....DHHHAAAAAAA',
  '....DHHHAAAAAAAA',
  '....DHHAAAAAAAAA',
  '....DHAAADDDDDDA',
  '....DHAAADAAAAAD',
  '....DHAAADAAAAAD',
  '....DHAAADDDDDDA',
  '....DHAAAAAAAAAA',
  '....DHAAAACCCCCC',
  '....DBAAAAAAAAAA',
  '....DBBBBBBBBBBB',
  '....DDDDDDDDDDDD',
  '..DHAD.DHAD.DHAD',
  '..DHAD.DHAD.DHAD',
  '.DHAD..DBAD..DBA',
  '.DHAD..DBAD..DBA',
  'DHAD...DBD...DBD',
  'DBAD...DBD...DDD',
  'DBD.....DD......',
  '.DD.............',
  '................',
  '................',
  '................',
  '................',
]), 9, 11, true)

// フクロウ：耳ばね＋大きな目＋くちばし
const B_OWL: Art = withEyes(sym([
  '................',
  '................',
  '...CC...........',
  '...CCC..........',
  '....DCCDDDDDDDDD',
  '....DHHHHHHAAAAA',
  '...DHHHHHAAAAAAA',
  '..DHHHHAAAAAAAAA',
  '..DHHDDDDDDAAAAA',
  '..DHDAAAAAAAAAAD',
  '..DHDAAAAAAAAAAD',
  '..DHDAAAAAAAAAAD',
  '..DHDDDDDDDCCCCC',
  '..DHAAAAAAADCCCC',
  '..DHAAAAAAAAAAAA',
  '..DHHAABBBBBBBBB',
  '..DHHAABBBBBBBBB',
  '..DHHAAABBBBBBBB',
  '...DHAABBBBBBBBB',
  '...DHAAABBBBBBBB',
  '....DHAAABBBBBBB',
  '.....DHAAAAAAAAA',
  '......DDHAAAAAAA',
  '........DDDDDDDD',
  '..........DCCD..',
  '..........DCCD..',
  '.........DDDDD..',
  '................',
  '................',
  '................',
  '................',
  '................',
]), 6, 8, true)

// ゴーレム：ごつごつした 岩の からだ＋光る目
const B_GOLEM: Art = withEyes(sym([
  '................',
  '................',
  '......DDDDDDDDDD',
  '......DHHHHAAAAA',
  '......DHDDDDDDAA',
  '......DHDAAAAAAD',
  '......DHDAAAAAAD',
  '......DHDDDDDDAA',
  '......DHAACCCCCC',
  '......DHAAAAAAAA',
  '......DDDDDDDDDD',
  '..DDDDDDDDDDDDDD',
  '..DHHADDHHHAAAAA',
  '..DHHADDHHAAAAAA',
  '..DHAADDHAACCCCC',
  '..DHAADDHAACCCCC',
  '..DBAADDHAAAAAAA',
  '..DBAADDBAAAAAAA',
  '..DBBADDBBAAAAAA',
  '..DDDDDDBBBBBBBB',
  '........DBBBBBBB',
  '........DHAAAAAA',
  '........DDDDDDDD',
  '.........DHAAD..',
  '.........DHAAD..',
  '.........DBAAD..',
  '........DDDDDD..',
  '................',
  '................',
  '................',
  '................',
  '................',
]), 9, 4, true)

// コブラ：ひろげた かさ＋とぐろ
const B_SERPENT: Art = withEyes(sym([
  '................',
  '................',
  '.........DDDDDDD',
  '........DHHHAAAA',
  '........DHDDDDDA',
  '........DHDAAAAD',
  '........DHDAAAAD',
  '........DHDDDDDA',
  '........DHAAWWWW',
  '.....DDDDHAAAAAA',
  '...DDHHHAAAAAAAA',
  '..DHHHAAAAAAAAAA',
  '..DHHAACCCCCCCCC',
  '..DHAAACCCCCCCCC',
  '..DHAAAACCCCCCCC',
  '...DBAAAAAAAAAAA',
  '.....DBBAAAAAAAA',
  '........DBBAAAAA',
  '..........DHAAAA',
  '..........DHAAAA',
  '.........DHHAAAA',
  '......DDDDHHAAAA',
  '...DDHHHHAAAAAAA',
  '..DHHHAAAAAAAAAA',
  '..DHAAAAAAAAAAAA',
  '..DHAABBBBBBBBBB',
  '..DBAABBBBBBBBBB',
  '..DBBAAAAAAAAAAA',
  '...DBBBBBBBBBBBB',
  '....DDDDDDDDDDDD',
  '................',
  '................',
]), 10, 4, true)

// 大けもの：たてがみ＋きば＋つめ
const B_BEAST: Art = withEyes(sym([
  '................',
  '..DDD...........',
  '..DHHD..........',
  '..DHHHD.........',
  '..DHHHHD........',
  '..DHHHAADDDDDDDD',
  '..DHHHAAAAAAAAAA',
  '..DHHAADDDDDAAAA',
  '..DHHAADAAAAAAAD',
  '..DHAAADAAAAAAAD',
  '..DHAAADDDDDDAAA',
  '..DHAAAAAAAAAAAA',
  '...DHAAAAAACCCCC',
  '....DHAAAAACCCCC',
  '.....DHAAAAWWWWW',
  '.....DHAAAAAAAAA',
  '....DHHAAAAAAAAA',
  '...DHHHAAAAAAAAA',
  '..DHHHAAAAAAAAAA',
  '..DHHAAAAAAAAAAA',
  '..DHAAAAAAAAAAAA',
  '..DBAAAAAAAAAAAA',
  '..DBBAAAAAAAAAAA',
  '..DBBBAAAAAAAAAA',
  '..DBBBBBBBBBBBBB',
  '..DHAADDDBAAAAAA',
  '..DHAAD.DHAAAAAA',
  '..DHAAD.DHAAAAAA',
  '..DCAACD.DCAACDD',
  '..DDDDDD.DDDDDDD',
  '................',
  '................',
]), 7, 7, true)

// クジラ：しおふき＋大きな からだ（よこむき）
const B_WHALE: Art = withEye([
  '................................',
  '..............CC................',
  '.............CCCC...............',
  '............CC..CC..............',
  '............C....C..............',
  '.......DDDDDDDDDDDDDDD..........',
  '.....DDHHHHHHHHHHAAAAADD........',
  '...DDHHHHHHHHAAAAAAAAAAADD......',
  '..DHHHHHHAAAAAAAAAAAAAAAAAD.....',
  '.DHHHDDDDAAAAAAAAAAAAAAAAAAD..DD',
  'DHHHDAAAADAAAAAAAAAAAAAAAAAAD.DH',
  'DHHDAAAAADAAAAAAAAAAAAAAAAAADDHA',
  'DHHDDDDDDAAAAAAAAAAAAAAAAAAADHAD',
  'DHAAWWWWAAAAAAAAAAAAAAAAAAAAAHAD',
  'DHAAAAAAABBBBBBBBBBBBBBBBBBBAHAD',
  'DBAABBBBBBBBBBBBBBBBBBBBBBBADHAD',
  '.DBBBBBBBBBBBBBBBBBBBBBBBBBD.DHD',
  '..DDBBBBBBBBBBBBBBBBBBBBBDD...DD',
  '....DDBBBBBBBBBBBBBBBBBDD.......',
  '.......DDDDDDDDDDDDDDDD.........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
], 4, 9, true)

// ワニ：よこむき。長い口＋ならんだ きば＋せなかの ぎざぎざ
const B_CROC: Art = withEye([
  '................................',
  '................................',
  '................................',
  '..............DDDDDDDD..........',
  '............DDHHHHHHAAD.........',
  '.........DDDDHHHHHAAAAD.........',
  '.....DDDDHHHHHHAAAAAAAD.........',
  '..DDDHHHHHHHHHAAAAAAAAD.........',
  'DDHHHHHHHHHHHAAAAAAAAAAD........',
  'DHHHHHHHHHHHAAAAAAAAAAAD........',
  'DAWAWAWAWAWAWAWAAAAAAAAD........',
  'DDDDDDDDDDDDDDDAAAAAAAADDD......',
  '.....DWAWAWAWAWAAAAAAAAAADDD....',
  '.....DDDDDDDDDDAAAAAAAAAAAADD...',
  '..........DDDDDAAAAAAAAAAAAAAD..',
  '...............DCCCCCCCCCCCCCAD.',
  '..............DHAAAAAAAAAAAAAAD.',
  '.............DHAAAAAAAAAAAAAAAD.',
  '.............DBAAAAAAAAAAAAAAD..',
  '.............DBBAAAAAAAAAAAAD...',
  '..............DDBBBBBBBBBBDD....',
  '...............DHAD...DHAD......',
  '...............DHAD...DHAD......',
  '..............DCAACD.DCAACD.....',
  '..............DDDDDD.DDDDDD.....',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
], 16, 6, true)

// キツネ：よこむき。とがった耳＋とがった 鼻づら＋大きな しっぽ
const B_FOX: Art = withEye([
  '................................',
  '.....DD.......DD................',
  '....DHAD.....DHAD...............',
  '....DHAAD...DHAAD...............',
  '....DHHAAD.DHHAAD...............',
  '.....DHHAADDHHAAD...............',
  '.....DHHHAAAAAAAD......DDDD.....',
  '....DHHHAAAAAAAAD....DDHHHHD....',
  '...DHHHAAAAAAAAAD..DDHHHHHHHD...',
  '..DHHAAAAAAAAAAAD.DHHHHHAAAAD...',
  '.DHHAAAAAAAAAAAAD.DHHHAAAAAAD...',
  'DHAAAAAAAAAAAAAADDDHHAAAAAAAD...',
  'DAWWAAAAAAAAAAAAAAAAAAAAAAAAD...',
  'DAWWAAAAAAAAAAAAAAAAAAAAAABBD...',
  '.DDAAAAAAAAAAAAAAAAAAAAAABBBD...',
  '...DDDHAAAAAAAAAAAAAAAABBBBD....',
  '......DHHAAAAAAAAAAAABBBBBD.....',
  '......DHHAAAAAAAAAAAABBBDD......',
  '......DBBAAAAAAAAAAAAADD........',
  '......DBBAAAAAAAAAAAAD..........',
  '......DBAAAAAAAAAAAAAD..........',
  '......DHADDDDDDDDDHAAD..........',
  '......DHAD.......DHAAD..........',
  '......DBAD.......DBAAD..........',
  '......DDDD.......DDDDD..........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
], 6, 7, true)

// サイ：鼻づらの 大きな つの＋ぶあつい からだ（よこむき）
const B_RHINO: Art = withEye([
  '................................',
  '................................',
  '................................',
  '.........C......................',
  '........CC......................',
  '.......CCC......................',
  '......DDCDDDDDDDD...............',
  '....DDHHHHHHHAAAAD..............',
  '..DDHHHHHHHAAAAAAD.......DD.....',
  '.DHHHHHHHHAAAAAAAD......DBBD....',
  'DHHHHHHHAAAAAAAAAD.....DBBBD....',
  'DAWWWWAAAAAAAAAAADDDDDDBBBBD....',
  'DAWWWWAAAAAAAAAAAAAAAABBBBD.....',
  '.DDAAAAAAAAAAAAAAAAAABBBBD......',
  '...DDDHHAAAAAAAAAAAABBBD........',
  '......DHHAAAAAAAAAAABDD.........',
  '......DHHAAAAAAAAAAAD...........',
  '......DBBAAAAAAAAAAAD...........',
  '......DBBAAAAAAAAAAAD...........',
  '......DBBAAAAAAAAAAAD...........',
  '......DHADDDDDDDDHAAD...........',
  '......DHAD.......DHAAD..........',
  '......DBAD.......DBAAD..........',
  '......DDDD.......DDDDD..........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
], 8, 9, true)

// クモ：まるい からだ＋8本の あし＋きば。
// ※絵を まん中に よせないと 目が からだの そとに 出てしまう
const B_SPIDER: Art = withEyes([
  '................................',
  '................................',
  '................................',
  '....D.....D..........D.....D....',
  '.....D...D............D...D.....',
  '.......D.D..............D.D.....',
  '.......DD................DD.....',
  '.......D..DDDDDDDDDDDD...D......',
  '.......D.DHHHHHHHAAAAAD..D......',
  '......DD.DHHHHHHAAAAAAD..DD.....',
  '.....D..DHHHHHHAAAAAAAAD..D.....',
  '.....D..DHHHHHAAAAAAAAAD..D.....',
  '......D.DHHHHAAAAAAAAAAD.D......',
  '.......DDHHHAAAAAAAAAAAD..D.....',
  '.......D.DHAAAAAAAAAAAAD.D......',
  '.......D.DHAAWWWWWWWWAAD.D......',
  '......DD.DHAAAAAAAAAAAAD.DD.....',
  '....D...DBAAAAAAAAAAAAD...D.....',
  '....D...DBBAAAAAAAAAABD...D.....',
  '......D..DBBBAAAAAAAABBD..D.....',
  '.......D..DDBBBBBBBBBBD..D......',
  '.......DD...DDDDDDDDDD..DD......',
  '.........D...............D......',
  '.......D.................D......',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
], 10, 11, true)

// ---------------- かたちと 色の わりあて ----------------

const SMALL: Record<string, Art> = { slime: SLIME, bug: BUG, bat: BAT, beast: BEAST, ghost: GHOST, snake: SNAKE, robot: ROBOT, bird: BIRD, crab: CRAB, turtle: TURTLE, mage: MAGE, fish: FISH, elephant: ELEPHANT, beaver: BEAVER, cheetah: CHEETAH, squirrel: SQUIRREL, snail: SNAIL, frog: FROG, lizard: LIZARD, scorpion: SCORPION, spark: SPARK, mirror: MIRROR }
const BIG: Record<string, Art> = { dragon: B_DRAGON, king: B_KING, demon: B_DEMON, kraken: B_KRAKEN, owl: B_OWL, whale: B_WHALE, golem: B_GOLEM, serpent: B_SERPENT, beast: B_BEAST, croc: B_CROC, fox: B_FOX, rhino: B_RHINO, spider: B_SPIDER }

// 色セット [ひかり, 本体, かげ, りんかく, アクセント]
// りんかくは まっ黒では なく その色を こくした 色に する（きつく 見えない ため）
const COLORS: Record<string, [string, string, string, string, string]> = {
  green: ['#96e86a', '#55bf46', '#2d8a37', '#17492a', '#ffe14a'],
  blue: ['#8fd0ff', '#4a8ee6', '#2a5cae', '#16305f', '#ffe14a'],
  red: ['#ffa07a', '#e2573f', '#a32f28', '#5c1418', '#ffd24a'],
  purple: ['#d0a6f5', '#9a63d8', '#663aa2', '#341a58', '#ffe14a'],
  gray: ['#dde2ea', '#a3abb8', '#6e7684', '#363c47', '#ffd24a'],
  brown: ['#e0aa72', '#a8763f', '#734c22', '#3a2410', '#ffe14a'],
  yellow: ['#fff0a0', '#e8c33f', '#a8871c', '#5a4508', '#ff7a4a'],
  pink: ['#ffc4de', '#ee7fae', '#b44e7f', '#5e2340', '#fff0a0'],
  cyan: ['#a8f5ef', '#48c9c2', '#22908c', '#0e4746', '#ffe14a'],
  white: ['#ffffff', '#dfe6f2', '#a3aec2', '#525b6d', '#7fc7e8'],
  dark: ['#9a8ec4', '#5d5480', '#3b3457', '#1b1730', '#ff5fa2'],
  orange: ['#ffcb8a', '#ef8f3d', '#b25c17', '#5e2e07', '#ffe14a'],
}

function palOf(c: string): Pal {
  const [H, A, B, D, C] = COLORS[c] ?? COLORS.green
  return {
    H, A, B, D, C,
    E: '#ffffff', // 白目
    P: '#241b30', // くろ目
    G: '#ffffff', // 目の ハイライト（これが あると 生きて 見える）
    W: '#fffdf2', // きば・歯
  }
}

// 各ステージの ザコ／大ボスの 見た目
const LOOK: Record<string, { s: [string, string]; b: [string, string] }> = {
  'keisan-1': { s: ['bug', 'green'], b: ['dragon', 'green'] },
  'keisan-2': { s: ['bat', 'purple'], b: ['king', 'yellow'] },
  'keisan-3': { s: ['beast', 'gray'], b: ['demon', 'red'] },
  'keisan-4': { s: ['ghost', 'white'], b: ['king', 'dark'] },
  'keisan-5': { s: ['snake', 'green'], b: ['kraken', 'purple'] },
  'keisan-6': { s: ['robot', 'cyan'], b: ['dragon', 'purple'] },
  'ryou-1': { s: ['snail', 'brown'], b: ['owl', 'brown'] },
  'ryou-2': { s: ['frog', 'green'], b: ['croc', 'green'] },
  'ryou-3': { s: ['elephant', 'gray'], b: ['rhino', 'gray'] },
  'ryou-4': { s: ['beaver', 'brown'], b: ['beast', 'brown'] },
  'ryou-5': { s: ['turtle', 'green'], b: ['whale', 'blue'] },
  'ryou-6': { s: ['cheetah', 'yellow'], b: ['owl', 'orange'] },
  'zukei-1': { s: ['robot', 'orange'], b: ['golem', 'gray'] },
  'zukei-2': { s: ['robot', 'yellow'], b: ['dragon', 'green'] },
  'zukei-3': { s: ['slime', 'blue'], b: ['kraken', 'red'] },
  'zukei-4': { s: ['scorpion', 'purple'], b: ['serpent', 'green'] },
  'zukei-5': { s: ['crab', 'red'], b: ['kraken', 'orange'] },
  'zukei-6': { s: ['mirror', 'cyan'], b: ['dragon', 'blue'] },
  'kankei-1': { s: ['squirrel', 'brown'], b: ['fox', 'orange'] },
  'kankei-2': { s: ['bug', 'yellow'], b: ['spider', 'dark'] },
  'kankei-3': { s: ['bird', 'green'], b: ['owl', 'blue'] },
  'kankei-4': { s: ['lizard', 'yellow'], b: ['dragon', 'red'] },
  'kankei-5': { s: ['mage', 'blue'], b: ['king', 'purple'] },
  'kankei-6': { s: ['spark', 'cyan'], b: ['demon', 'purple'] },
}

const FALLBACK = { s: ['slime', 'green'] as [string, string], b: ['dragon', 'red'] as [string, string] }

export function monsterArt(stageId: string, boss: boolean): { art: Art; pal: Pal; key: string } {
  const look = LOOK[stageId] ?? FALLBACK
  const [shape, color] = boss ? look.b : look.s
  const art = (boss ? BIG[shape] : SMALL[shape]) ?? SLIME
  return { art, pal: palOf(color), key: `${boss ? 'b' : 's'}:${shape}:${color}` }
}

// ドット絵の 大きさ（ザコ24ドット／大ボス32ドット）
export const monsterDots = (boss: boolean) => (boss ? 32 : 24)

// スプライト用の 画像URL（scale で 1ドットの ピクセル数を きめる。
// にじませない ために かならず 整数倍で 表示すること）
export function monsterUrl(stageId: string, boss: boolean, scale = 2): string {
  const { art, pal, key } = monsterArt(stageId, boss)
  return artUrl(`mon:${key}:${scale}`, art, pal, scale)
}

// ぜんぶの絵が 正方形（行数＝よこ幅）か たしかめる（テスト用）
export function allMonsterArts(): Record<string, Art> {
  return { ...Object.fromEntries(Object.entries(SMALL).map(([k, v]) => [`s:${k}`, v])), ...Object.fromEntries(Object.entries(BIG).map(([k, v]) => [`b:${k}`, v])) }
}
