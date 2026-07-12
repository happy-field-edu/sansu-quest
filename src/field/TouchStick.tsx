import { useRef, useState } from 'react'
import { stick } from './input'

const R = 44 // スティックの可動半径(px)

// iPad・スマホ用のバーチャルスティック（マウスでもつかえる）
export default function TouchStick() {
  const [knob, setKnob] = useState<[number, number]>([0, 0])
  const dragging = useRef(false)

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    let dx = e.clientX - (rect.left + rect.width / 2)
    let dy = e.clientY - (rect.top + rect.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > R) {
      dx = (dx / len) * R
      dy = (dy / len) * R
    }
    stick.x = dx / R
    stick.z = dy / R
    setKnob([dx, dy])
  }

  const stop = () => {
    dragging.current = false
    stick.x = 0
    stick.z = 0
    setKnob([0, 0])
  }

  return (
    <div
      className="pointer-events-auto relative h-28 w-28 rounded-full border-2 border-slate-400/40 bg-slate-900/40 backdrop-blur"
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        dragging.current = true
        move(e)
      }}
      onPointerMove={(e) => {
        if (dragging.current) move(e)
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
    >
      <div
        className="absolute top-1/2 left-1/2 h-12 w-12 rounded-full bg-slate-200/80 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob[0]}px), calc(-50% + ${knob[1]}px))` }}
      />
      <p className="absolute -top-5 w-full text-center text-[10px] font-bold text-slate-300">🕹️ うごく</p>
    </div>
  )
}
