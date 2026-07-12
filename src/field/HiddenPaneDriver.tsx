import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

// 開発環境かつタブ非表示のとき（rAFが止まる環境）だけ、MessageChannelで
// 手動フレーム駆動する。本番ビルドでは何もしない。
export default function HiddenPaneDriver() {
  const advance = useThree((s) => s.advance)
  const setFrameloop = useThree((s) => s.setFrameloop)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    let running = false
    let last = 0
    const ch = new MessageChannel()
    ch.port1.onmessage = () => {
      if (!running) return
      const now = performance.now()
      if (now - last >= 33) {
        last = now
        advance(now)
      }
      ch.port2.postMessage(0)
    }
    const apply = () => {
      if (document.visibilityState === 'hidden') {
        // 非表示ページではResizeObserverも配送されないため、計測を強制する
        window.dispatchEvent(new Event('resize'))
        if (!running) {
          running = true
          setFrameloop('never')
          ch.port2.postMessage(0)
        }
      } else if (running) {
        running = false
        setFrameloop('always')
      }
    }
    apply()
    document.addEventListener('visibilitychange', apply)
    return () => {
      running = false
      document.removeEventListener('visibilitychange', apply)
      setFrameloop('always')
      ch.port1.close()
    }
  }, [advance, setFrameloop])
  return null
}

// 非表示ページではResizeObserverが配送されず、Canvasの計測が始まらない。
// 開発時のみ、マウント直後にresizeを数回発火して計測を強制する（実ブラウザでは無害）。
export function useHiddenPaneResizeKick() {
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const kick = () => window.dispatchEvent(new Event('resize'))
    kick()
    const ids = [150, 400, 900, 1800].map((ms) => window.setTimeout(kick, ms))
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [])
}
