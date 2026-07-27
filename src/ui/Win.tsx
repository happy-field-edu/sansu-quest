import { useEffect, useRef, useState, type ReactNode } from 'react'
import { onTick } from '../lib/ticker'

// ドラクエ風UIキット：黒背景×白ワク×ピクセルフォントのウィンドウ、
// ▶カーソルの縦コマンド、1文字ずつのタイプライター表示。

export function Win({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`dq-win font-dot ${className}`}>{children}</div>
}

export interface Command {
  label: string
  value: string
  note?: string // 右側にそえる小さな情報（「44もん」など）
  disabled?: boolean
}

// 縦ならびのコマンドウィンドウ。クリック／タップと、↑↓＋Enter の両対応。
export function CommandList({
  items,
  onSelect,
  onCursor,
  active = true,
}: {
  items: Command[]
  onSelect: (value: string) => void
  onCursor?: (value: string, index: number) => void // カーソルが うごいたら（せつめい窓の こうしんに つかう）
  active?: boolean
}) {
  const [cursor, setCursor] = useState(0)
  // いまの カーソル位置。キー操作の ときに 最新の いちを 読むために ref にも もつ
  // （親が 再レンダリングされないと keydown の クロージャが 古くなるため）
  const cursorRef = useRef(0)
  cursorRef.current = cursor

  // カーソルの いちを 親に つたえる（items は 毎回 作りなおされるので cursor だけを 見る）
  const cursorCb = useRef(onCursor)
  cursorCb.current = onCursor
  const itemsRef = useRef(items)
  itemsRef.current = items
  useEffect(() => {
    const it = itemsRef.current[cursor]
    if (it) cursorCb.current?.(it.value, cursor)
  }, [cursor])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => (c + items.length - 1) % items.length)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => (c + 1) % items.length)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        // setCursor の 更新関数の中で onSelect を よぶと、レンダリング中に
        // 親の state を かえてしまう（React の警告＋2重実行の原因）。ref から よむ。
        const it = items[cursorRef.current]
        if (it && !it.disabled) onSelect(it.value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, items, onSelect])

  return (
    <div className="flex flex-col">
      {items.map((it, i) => (
        <button
          key={it.value}
          disabled={it.disabled}
          onClick={() => !it.disabled && onSelect(it.value)}
          onMouseEnter={() => setCursor(i)}
          className={`flex items-center gap-1 px-1 py-1 text-left text-base leading-tight ${
            it.disabled ? 'text-slate-500' : 'text-white hover:text-yellow-200'
          }`}
        >
          {/* えらんでいる行だけ ▶が 点めつする（点めつアニメは opacity-0 より つよいので クラスごと 切りかえる） */}
          <span className={`w-4 ${cursor === i && !it.disabled ? 'dq-cursor-blink' : 'opacity-0'}`}>▶</span>
          <span className="flex-1">{it.label}</span>
          {it.note && <span className="text-xs text-slate-300">{it.note}</span>}
        </button>
      ))}
    </div>
  )
}

// 1文字ずつ表示するテキスト（ドラクエのメッセージ風）
export function Typewriter({
  text,
  speed = 28, // 1文字あたりのミリ秒
  onDone,
  className = '',
}: {
  text: string
  speed?: number
  onDone?: () => void
  className?: string
}) {
  const [shown, setShown] = useState(0)
  const acc = useRef(0)
  const doneRef = useRef(false)

  useEffect(() => {
    setShown(0)
    acc.current = 0
    doneRef.current = false
    const off = onTick((dt) => {
      acc.current += dt * 1000
      const n = Math.min(text.length, Math.floor(acc.current / speed))
      setShown((prev) => (n !== prev ? n : prev))
      if (n >= text.length && !doneRef.current) {
        doneRef.current = true
        onDone?.()
        off()
      }
    })
    return off
    // onDoneは最新を使わなくてよい（メッセージ切替はtext変更で行う）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed])

  return (
    <span className={`whitespace-pre-line ${className}`}>
      {text.slice(0, shown)}
      {shown < text.length && <span className="opacity-70">▌</span>}
    </span>
  )
}
