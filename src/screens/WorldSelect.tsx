import { useGame } from '../game/store'
import { playerStats, BOSS_BASE } from '../game/logic'
import { WORLDS } from '../data/worlds'
import type { WorldId } from '../types'

export default function WorldSelect({
  onSelectWorld,
  onEquip,
  onTitle,
}: {
  onSelectWorld: (id: WorldId) => void
  onEquip: () => void
  onTitle: () => void
}) {
  const { save } = useGame()
  const stats = playerStats(save)

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onTitle} className="text-sm text-slate-400 hover:text-slate-200">
          ◀ タイトル
        </button>
        <h1 className="font-dot text-xl text-yellow-300">ワールドマップ</h1>
        <button
          onClick={onEquip}
          className="btn-game rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-bold shadow-[0_3px_0_#312e81]"
        >
          🎒 そうび
        </button>
      </div>

      {/* ゆうしゃステータスカード */}
      <div className="mb-6 rounded-2xl border-2 border-indigo-500/40 bg-slate-900/80 p-4">
        <div className="flex items-center gap-4">
          <div className="anim-floaty text-5xl">🦸</div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="font-dot text-lg text-yellow-300">ゆうしゃ Lv.{stats.level}</p>
              <p className="text-xs text-slate-400">
                EXP {stats.into}/{stats.need}
              </p>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                style={{ width: `${(stats.into / stats.need) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>❤️ HP {stats.maxHp}</span>
              <span>⚔️ こうげき {stats.atk}</span>
              <span>🛡️ まもり {stats.def}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 px-3 py-2 text-center text-sm">
          <span className="text-slate-300">いまのきみなら ボスは </span>
          <span className="text-slate-400 line-through">{BOSS_BASE}問</span>
          <span className="font-dot mx-1 text-xl font-bold text-yellow-300">→ {stats.bossRequired}問</span>
          <span className="text-slate-300">でたおせる！</span>
        </div>
      </div>

      {/* 4つのワールド */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {WORLDS.map((w) => {
          const clearedCount = w.stages.filter((s) => save.cleared.includes(s.id)).length
          return (
            <button
              key={w.id}
              onClick={() => onSelectWorld(w.id)}
              className={`btn-game rounded-2xl bg-gradient-to-br ${w.gradient} p-[3px] text-left shadow-[0_5px_0_rgba(0,0,0,0.5)]`}
            >
              <div className="rounded-[13px] bg-slate-900/90 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{w.emoji}</span>
                  <div>
                    <p className="font-dot text-lg font-bold">{w.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{w.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1">
                    {w.stages.map((s) => (
                      <span key={s.id} className={save.cleared.includes(s.id) ? '' : 'opacity-25 grayscale'}>
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">{clearedCount}／6 クリア</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        1年生 → 6年生へ。まえの学年をクリアすると つぎの学年への道がひらくよ
      </p>
    </div>
  )
}
