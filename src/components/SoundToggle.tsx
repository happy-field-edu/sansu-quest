import { useState } from 'react'
import { isMuted, toggleMuted } from '../game/sound'

// 効果音のオン・オフ（授業中はミュートにできる）
export default function SoundToggle() {
  const [muted, setMuted] = useState(isMuted())
  return (
    <button
      onClick={() => setMuted(toggleMuted())}
      className="pointer-events-auto rounded-xl bg-slate-900/80 px-2.5 py-2 text-sm backdrop-blur hover:bg-slate-800"
      title={muted ? '音を出す' : 'ミュートする'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
