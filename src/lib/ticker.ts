// ゲーム全体で共有する軽量ティッカー（タイプライター・モンスター移動・長押し移動に使う）。
// 通常は requestAnimationFrame 駆動。開発環境かつタブ非表示（rAFが止まる環境）では
// MessageChannel で 30fps 駆動する（本番ビルドの実ブラウザでは常に rAF）。

type Cb = (dt: number) => void

const subs = new Set<Cb>()
let running = false

function start() {
  if (running) return
  running = true
  let last = performance.now()
  const step = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    subs.forEach((cb) => cb(dt))
  }
  if (import.meta.env.DEV && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    const ch = new MessageChannel()
    let lastT = 0
    ch.port1.onmessage = () => {
      const now = performance.now()
      if (now - lastT >= 33) {
        lastT = now
        step(now)
      }
      ch.port2.postMessage(0)
    }
    ch.port2.postMessage(0)
  } else {
    const loop = (now: number) => {
      step(now)
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }
}

export function onTick(cb: Cb): () => void {
  subs.add(cb)
  start()
  return () => {
    subs.delete(cb)
  }
}
