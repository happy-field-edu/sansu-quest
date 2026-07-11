import { useGame } from '../game/store'
import { playerStats } from '../game/logic'

export default function Title({ onStart }: { onStart: () => void }) {
  const { save, dispatch } = useGame()
  const stats = playerStats(save)
  const hasSave = save.exp > 0 || save.cleared.length > 0

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <div className="flex gap-5 text-5xl">
        <span className="anim-floaty">🔥</span>
        <span className="anim-floaty" style={{ animationDelay: '0.3s' }}>🌲</span>
        <span className="anim-floaty" style={{ animationDelay: '0.6s' }}>💎</span>
        <span className="anim-floaty" style={{ animationDelay: '0.9s' }}>🔮</span>
      </div>

      <div>
        <p className="font-dot mb-2 text-lg tracking-widest text-yellow-300">🗡️ さんすう RPG 🛡️</p>
        <h1 className="font-dot bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600 bg-clip-text text-5xl leading-tight font-bold text-transparent drop-shadow-[0_4px_0_rgba(0,0,0,0.6)] sm:text-6xl">
          つながる！
          <br />
          さんすうクエスト
        </h1>
      </div>

      <p className="max-w-md text-base leading-relaxed text-slate-300">
        1年生の「たしざん」は、6年生の「分数」をたおす<span className="font-bold text-yellow-300">でんせつのぶき</span>になる。
        <br />
        4つのワールドをぼうけんして、6年間のさんすうの力をぜんぶつなげよう！
      </p>

      <button
        onClick={onStart}
        className="btn-game font-dot rounded-2xl bg-gradient-to-b from-yellow-400 to-amber-500 px-12 py-4 text-2xl font-bold text-slate-900 shadow-[0_6px_0_#92400e]"
      >
        {hasSave ? '▶ つづきから' : '▶ ぼうけんに でる！'}
      </button>

      {hasSave && (
        <div className="text-sm text-slate-400">
          <p>
            Lv.{stats.level}　👑 たおしたボス: {save.cleared.length}／24
          </p>
          <button
            onClick={() => {
              if (window.confirm('セーブデータをけして、さいしょからはじめる？')) dispatch({ type: 'reset' })
            }}
            className="mt-2 underline hover:text-slate-200"
          >
            さいしょから はじめる
          </button>
        </div>
      )}
    </div>
  )
}
