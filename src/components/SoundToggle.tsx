import { useState } from 'react'
import { isMuted, toggleMuted, sfx } from '../game/sound'

// 効果音のオン・オフ（授業中はミュートにできる）。
// fixed=true にすると 画面の 右下に つねに ういている ボタンに なる。
export default function SoundToggle({ fixed = false }: { fixed?: boolean }) {
  const [muted, setMuted] = useState(isMuted())
  const onClick = () => {
    const next = toggleMuted()
    setMuted(next)
    if (!next) sfx.correct() // 音を もどしたとき、聞こえることが わかるように 1回 鳴らす
  }
  if (fixed) {
    return (
      <button
        onClick={onClick}
        className="dq-win font-dot fixed right-3 bottom-3 z-50 px-3 py-2 text-lg text-white hover:text-yellow-200 active:translate-y-0.5"
        style={{ touchAction: 'manipulation' }}
        title={muted ? '音を出す' : 'ミュートする'}
        aria-label={muted ? '音を出す' : 'ミュートする'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="pointer-events-auto rounded-xl bg-slate-900/80 px-2.5 py-2 text-sm backdrop-blur hover:bg-slate-800"
      title={muted ? '音を出す' : 'ミュートする'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
