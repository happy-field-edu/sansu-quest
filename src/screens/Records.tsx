import { useGame } from '../game/store'
import { skillLevelOf, type SkillLevel } from '../game/logic'
import { WORLDS } from '../data/worlds'
import { SKILLS } from '../data/generators'

const LEVEL_CLS: Record<SkillLevel, string> = {
  none: 'bg-slate-700/60 text-slate-400',
  good: 'bg-emerald-500/20 text-emerald-300',
  mid: 'bg-amber-500/20 text-amber-300',
  weak: 'bg-red-500/25 text-red-300',
}

// 技能べつの正誤きろく（ミニ通知表）。弱点がひと目でわかる。
export default function Records({ onClose }: { onClose: () => void }) {
  const { save } = useGame()
  const stats = save.skillStats

  let totalO = 0
  let totalX = 0
  for (const st of Object.values(stats)) {
    totalO += st.o
    totalX += st.x
  }
  const total = totalO + totalX

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/90 backdrop-blur">
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-dot text-xl text-yellow-300">📊 きろく</h1>
          <button onClick={onClose} className="rounded-full bg-slate-700 px-4 py-1.5 text-sm font-bold hover:bg-slate-600">
            ✕ とじる
          </button>
        </div>

        {/* ぜんたいのまとめ */}
        <div className="mb-4 rounded-2xl border border-indigo-500/40 bg-slate-900/80 p-4 text-center">
          {total === 0 ? (
            <p className="text-sm text-slate-300">まだ きろくが ないよ。モンスターと たたかうと ここに たまっていく！</p>
          ) : (
            <p className="text-sm text-slate-200">
              こたえた もんだい <span className="font-dot text-2xl font-bold text-cyan-300">{total}</span> 問　せいかいりつ{' '}
              <span className="font-dot text-2xl font-bold text-yellow-300">{Math.round((totalO / total) * 100)}%</span>
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            ✓みどり＝とくい　黄＝もうすこし　⚠️赤＝にがて（れんしゅうすると 赤い技能が でやすくなるよ）
          </p>
        </div>

        {/* ワールド×単元×技能 */}
        {WORLDS.map((w) => {
          const stages = w.stages.filter((st) =>
            (SKILLS[st.id] ?? []).some((s) => (stats[`${st.id}:${s.id}`]?.o ?? 0) + (stats[`${st.id}:${s.id}`]?.x ?? 0) > 0),
          )
          if (stages.length === 0) return null
          return (
            <div key={w.id} className="mb-4">
              <h2 className="font-dot mb-2 text-sm font-bold text-slate-200">
                {w.emoji} {w.name}
              </h2>
              {stages.map((st) => (
                <div key={st.id} className="mb-2 rounded-xl bg-slate-900/80 p-3">
                  <p className="text-xs font-bold text-slate-300">
                    {st.grade}年生・{st.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(SKILLS[st.id] ?? []).map((s) => {
                      const { level, o, x } = skillLevelOf(stats, st.id, s.id)
                      const n = o + x
                      return (
                        <span key={s.id} className={`rounded px-2 py-1 text-xs font-bold ${LEVEL_CLS[level]}`}>
                          {level === 'weak' ? '⚠️' : level === 'good' ? '✓' : ''}
                          {s.name}
                          {n > 0 && <span className="ml-1 opacity-75">{Math.round((o / n) * 100)}%</span>}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
