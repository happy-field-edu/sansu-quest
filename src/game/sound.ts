// WebAudioで合成するレトロ効果音。素材ファイル不要・オフライン動作。
// iOS対策: AudioContextはユーザー操作（ボタンクリック）の中で遅延生成する。

let ctx: AudioContext | null = null
let muted = typeof localStorage !== 'undefined' && localStorage.getItem('sansu-quest-muted') === '1'

export const isMuted = () => muted

export function toggleMuted(): boolean {
  muted = !muted
  try {
    localStorage.setItem('sansu-quest-muted', muted ? '1' : '0')
  } catch {
    // プライベートモード等で保存できなくても動作は続ける
  }
  return muted
}

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

// 単音を鳴らす（t0秒後から dur 秒、slide で音程をすべらせる）
function tone(freq: number, t0: number, dur: number, type: OscillatorType = 'square', vol = 0.12, slide = 0) {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  const start = c.currentTime + t0
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  if (slide !== 0) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), start + dur)
  g.gain.setValueAtTime(vol, start)
  g.gain.exponentialRampToValueAtTime(0.001, start + dur)
  o.connect(g)
  g.connect(c.destination)
  o.start(start)
  o.stop(start + dur + 0.02)
}

// 歩く音が 鳴りっぱなしに ならないよう、まえの音から すこし 間をあける
let lastStep = 0
// 歩くたびに 音の高さを すこし かえる（トコ・トコと 交互になる）
let stepAlt = false

export const sfx = {
  // あるく：トコッ（みじかい 低い音）
  step() {
    if (muted) return
    const now = performance.now()
    if (now - lastStep < 90) return // 連打で 音が かさならないように
    lastStep = now
    stepAlt = !stepAlt
    tone(stepAlt ? 180 : 150, 0, 0.05, 'square', 0.045, -40)
  },
  // 宝箱：カチッ（ふたを あける音）
  chestOpen() {
    if (muted) return
    tone(520, 0, 0.05, 'square', 0.07)
    tone(700, 0.05, 0.06, 'square', 0.06)
  },
  // アイテム獲得：ドラクエ風の ファンファーレ（ちょっと 長め）
  fanfare() {
    if (muted) return
    const notes: [number, number, number][] = [
      // [しゅうはすう, はじまり(秒), ながさ(秒)]
      [523, 0, 0.13],
      [523, 0.14, 0.11],
      [523, 0.26, 0.11],
      [523, 0.38, 0.22],
      [415, 0.62, 0.22],
      [466, 0.86, 0.22],
      [523, 1.1, 0.16],
      [466, 1.28, 0.12],
      [523, 1.42, 0.5],
    ]
    notes.forEach(([f, t, d]) => {
      tone(f, t, d, 'square', 0.1)
      tone(f * 2, t, d, 'triangle', 0.05) // うわもの（きらびやか）
    })
  },
  // 正解：ピロリン↑
  correct() {
    if (muted) return
    tone(660, 0, 0.09)
    tone(990, 0.08, 0.16)
  },
  // まちがい：ブブー↓
  wrong() {
    if (muted) return
    tone(180, 0, 0.28, 'sawtooth', 0.11, -70)
    tone(120, 0.05, 0.25, 'square', 0.08, -40)
  },
  // エンカウント：ジャキーン
  encounter() {
    if (muted) return
    tone(160, 0, 0.32, 'sawtooth', 0.1, 520)
    tone(240, 0.1, 0.28, 'square', 0.08, 420)
  },
  // しょうり：ファンファーレ
  victory() {
    if (muted) return
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.18))
  },
  // レベルアップ：長めのファンファーレ
  levelup() {
    if (muted) return
    ;[392, 523, 659, 784, 659, 1047].forEach((f, i) => tone(f, i * 0.1, 0.16))
  },
  // そうびドロップ：キラキラ
  drop() {
    if (muted) return
    ;[784, 988, 1319, 1568].forEach((f, i) => tone(f, i * 0.07, 0.12, 'triangle', 0.12))
  },
}
