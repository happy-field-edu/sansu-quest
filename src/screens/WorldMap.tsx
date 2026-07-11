import { useState } from 'react'
import { isUnlocked, useGame } from '../game/store'
import { playerStats, BOSS_BASE, BOSS_MIN } from '../game/logic'
import { WORLD_BY_ID } from '../data/worlds'
import { ITEMS } from '../data/items'
import type { Stage, WorldId } from '../types'

export default function WorldMap({
  worldId,
  onBack,
  onEquip,
  onBattle,
}: {
  worldId: WorldId
  onBack: () => void
  onEquip: () => void
  onBattle: (stageId: string, mode: 'practice' | 'boss') => void
}) {
  const { save } = useGame()
  const stats = playerStats(save)
  const world = WORLD_BY_ID[worldId]
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected: Stage | null = world.stages.find((s) => s.id === selectedId) ?? null

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-40">
      {/* ヘッダー */}
      <div className="mb-2 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
          ◀ ワールドマップ
        </button>
        <button
          onClick={onEquip}
          className="btn-game rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-bold shadow-[0_3px_0_#312e81]"
        >
          🎒 そうび
        </button>
      </div>
      <h1 className={`font-dot bg-gradient-to-r ${world.gradient} bg-clip-text text-center text-2xl font-bold text-transparent`}>
        {world.emoji} {world.name}
      </h1>
      <p className="mt-1 mb-6 text-center text-xs text-slate-400">{world.desc}</p>

      {/* ステージツリー（1年生から6年生へのぼっていく） */}
      <div className="relative">
        <div className="absolute top-4 bottom-4 left-1/2 w-1 -translate-x-1/2 border-l-4 border-dashed border-slate-700" />
        <div className="relative flex flex-col gap-5">
          {world.stages.map((stage, idx) => {
            const unlocked = isUnlocked(save, stage.id)
            const cleared = save.cleared.includes(stage.id)
            const practiced = save.practiced.includes(stage.id)
            const side = idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
            return (
              <div key={stage.id} className={`flex ${side} items-center gap-3`}>
                <div className="w-1/2 px-1 text-center">
                  <button
                    disabled={!unlocked}
                    onClick={() => setSelectedId(stage.id)}
                    className={`btn-game w-full rounded-2xl border-2 p-3 text-left ${
                      selectedId === stage.id ? `ring-4 ${world.ring}` : ''
                    } ${
                      cleared
                        ? 'border-yellow-400/70 bg-gradient-to-br from-amber-500/25 to-yellow-600/10'
                        : unlocked
                          ? `anim-glow border-slate-500 bg-slate-800/90`
                          : 'border-slate-700 bg-slate-900/60 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{unlocked ? stage.enemyEmoji : '🔒'}</span>
                      <div className="min-w-0">
                        <p className="font-dot text-sm text-yellow-200">
                          {stage.grade}年生 {cleared && '👑'}
                          {!cleared && practiced && ' ⭐'}
                        </p>
                        <p className="truncate text-sm font-bold">{unlocked ? stage.title : '？？？'}</p>
                      </div>
                    </div>
                  </button>
                </div>
                {/* 中央のふしめ */}
                <div
                  className={`font-dot z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    cleared
                      ? 'border-yellow-300 bg-yellow-400 text-slate-900'
                      : unlocked
                        ? 'border-slate-400 bg-slate-700 text-white'
                        : 'border-slate-700 bg-slate-900 text-slate-600'
                  }`}
                >
                  {stage.grade}
                </div>
                <div className="w-1/2" />
              </div>
            )
          })}
        </div>
      </div>

      {/* えらんだステージのパネル */}
      {selected && (
        <StagePanel
          stage={selected}
          practiced={save.practiced.includes(selected.id)}
          cleared={save.cleared.includes(selected.id)}
          stats={stats}
          onClose={() => setSelectedId(null)}
          onBattle={onBattle}
        />
      )}
    </div>
  )
}

function StagePanel({
  stage,
  practiced,
  cleared,
  stats,
  onClose,
  onBattle,
}: {
  stage: Stage
  practiced: boolean
  cleared: boolean
  stats: ReturnType<typeof playerStats>
  onClose: () => void
  onBattle: (stageId: string, mode: 'practice' | 'boss') => void
}) {
  const item = ITEMS[stage.itemId]
  const reduced = BOSS_BASE - stats.bossRequired
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center">
      <div className="anim-pop w-full max-w-xl rounded-t-3xl border-2 border-b-0 border-indigo-400/50 bg-slate-900/95 p-5 shadow-[0_-8px_40px_rgba(79,70,229,0.35)] backdrop-blur">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-dot text-sm text-yellow-300">{stage.grade}年生のステージ</p>
            <h2 className="text-xl font-bold">{stage.title}</h2>
            <p className="mt-1 text-sm text-slate-300">{stage.desc}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600">
            ✕
          </button>
        </div>

        {/* つながり（系統性）の表示 */}
        <div className="mt-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm">
          <span className="font-bold text-cyan-300">🔗 つながり：</span>
          <span className="text-slate-200">{stage.link}</span>
        </div>

        {/* ドロップとボス情報 */}
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-800 p-3">
            <p className="text-xs text-slate-400">たおすとドロップ</p>
            <p className="mt-1 font-bold">
              {item.emoji} {practiced ? item.name : '？？？'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-800 p-3">
            <p className="text-xs text-slate-400">大ボス</p>
            <p className="mt-1 font-bold">
              {stage.bossEmoji} {stage.bossName} {cleared && '👑ずみ'}
            </p>
          </div>
        </div>

        {/* ボス必要問題数のけいさん（このゲームの心ぞう部） */}
        <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-center">
          <p className="text-xs text-slate-300">
            ボスをたおすのにひつような正解数（きほん{BOSS_BASE}問・さいてい{BOSS_MIN}問）
          </p>
          <p className="font-dot mt-1 text-lg">
            <span className="text-slate-400 line-through">{BOSS_BASE}問</span>
            <span className="mx-2 text-slate-300">−</span>
            <span className="text-cyan-300">Lv {stats.level}</span>
            <span className="mx-1 text-slate-300">−</span>
            <span className="text-red-300">そうび {stats.atk}</span>
            <span className="mx-2 text-slate-300">＝</span>
            <span className="text-3xl font-bold text-yellow-300">{stats.bossRequired}問</span>
          </p>
          {reduced > 0 && (
            <p className="mt-1 text-xs text-emerald-300">これまでのがんばりで {reduced}問 へった！</p>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onBattle(stage.id, 'practice')}
            className="btn-game flex-1 rounded-2xl bg-gradient-to-b from-emerald-400 to-green-600 px-4 py-3 text-lg font-bold text-slate-900 shadow-[0_5px_0_#14532d]"
          >
            ⚔️ れんしゅうバトル
          </button>
          <button
            onClick={() => onBattle(stage.id, 'boss')}
            disabled={!practiced}
            className={`btn-game flex-1 rounded-2xl px-4 py-3 text-lg font-bold shadow-[0_5px_0_#7f1d1d] ${
              practiced
                ? 'bg-gradient-to-b from-red-400 to-red-600 text-white'
                : 'cursor-not-allowed bg-slate-700 text-slate-500 shadow-[0_5px_0_#1e293b]'
            }`}
          >
            {stage.bossEmoji} 大ボスせん
          </button>
        </div>
        {!practiced && (
          <p className="mt-2 text-center text-xs text-slate-400">まず れんしゅうバトルにかって そうびを手にいれよう！</p>
        )}
      </div>
    </div>
  )
}
