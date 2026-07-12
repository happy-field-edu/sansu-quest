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

export const sfx = {
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
