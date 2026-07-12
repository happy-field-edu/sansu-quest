import { useCallback, useEffect, useRef } from 'react'

// 筆算用の手書きメモ欄。指（タッチ）・ペン・マウスで書ける。
// さんすうノート風の方眼つき。問題が変わると自動でまっさらになる。
export default function MemoPad({ resetKey }: { resetKey: unknown }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<[number, number] | null>(null)

  const clear = useCallback(() => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    // 方眼
    const step = Math.max(28, Math.floor(c.width / 16))
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
    ctx.lineWidth = 1
    for (let x = step; x < c.width; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, c.height)
      ctx.stroke()
    }
    for (let y = step; y < c.height; y += step) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(c.width, y)
      ctx.stroke()
    }
  }, [])

  // キャンバスの実ピクセルサイズを表示サイズ×dprに合わせる
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = Math.floor(c.clientWidth * dpr)
    c.height = Math.floor(c.clientHeight * dpr)
    clear()
  }, [clear])

  // 新しい問題になったらメモを消す
  useEffect(() => {
    clear()
  }, [resetKey, clear])

  const pos = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height]
  }

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = pos(e)
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const p = pos(e)
    ctx.strokeStyle = '#f8fafc'
    ctx.lineWidth = 3.5 * (c.width / c.clientWidth)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(last.current[0], last.current[1])
    ctx.lineTo(p[0], p[1])
    ctx.stroke()
    last.current = p
  }

  const up = () => {
    drawing.current = false
    last.current = null
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-600 bg-slate-900/80 p-2">
      <div className="flex items-center justify-between px-1 pb-1">
        <p className="text-xs font-bold text-slate-300">✏️ けいさんメモ（ゆびで かけるよ）</p>
        <button
          onClick={clear}
          className="btn-game rounded-lg bg-slate-700 px-3 py-1 text-xs font-bold text-slate-200 shadow-[0_2px_0_#1e293b]"
        >
          🧽 ぜんぶけす
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="h-44 w-full rounded-xl bg-slate-950/60"
        style={{ touchAction: 'none' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
    </div>
  )
}
