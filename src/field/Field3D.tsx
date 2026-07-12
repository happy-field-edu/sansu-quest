import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import HiddenPaneDriver, { useHiddenPaneResizeKick } from './HiddenPaneDriver'
import type { WorldId } from '../types'
import { useGame } from '../game/store'
import { playerStats, BOSS_BASE, BOSS_MIN } from '../game/logic'
import { WORLD_BY_ID, STAGE_BY_ID } from '../data/worlds'
import { ITEMS } from '../data/items'
import { skillNames } from '../data/generators'
import { ZONES } from './config'
import Scene, { maxZoneOf } from './Scene'

interface Encounter {
  stageId: string
  mode: 'practice' | 'boss'
}


export default function Field3D({
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
  const [zone, setZone] = useState(() => maxZoneOf(save, worldId))
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [bossPrep, setBossPrep] = useState<string | null>(null) // 予習パネルをひらいているボスのstageId

  useHiddenPaneResizeKick()

  // エンカウント演出のあと戦闘画面へ
  useEffect(() => {
    if (!encounter) return
    const t = window.setTimeout(() => onBattle(encounter.stageId, encounter.mode), 1150)
    return () => window.clearTimeout(t)
  }, [encounter, onBattle])

  const zoneStage = world.stages[zone - 1]
  const zoneInfo = ZONES[zoneStage.id]
  const encounterStage = encounter ? STAGE_BY_ID[encounter.stageId] : null
  const prepStage = bossPrep ? STAGE_BY_ID[bossPrep] : null

  return (
    <div className="fixed inset-0">
      <Canvas camera={{ position: [0, 9, 8], fov: 50 }} dpr={[1, 1.75]}>
        <HiddenPaneDriver />
        <Scene
          worldId={worldId}
          save={save}
          paused={encounter !== null || bossPrep !== null}
          onEncounter={(stageId, mode) => setEncounter({ stageId, mode })}
          onBossContact={(stageId) => setBossPrep(stageId)}
          onZoneChange={setZone}
        />
      </Canvas>

      {/* ---- HUD ---- */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="flex items-start justify-between p-3">
          <button
            onClick={onBack}
            className="pointer-events-auto rounded-xl bg-slate-900/80 px-3 py-2 text-sm font-bold text-slate-200 backdrop-blur hover:bg-slate-800"
          >
            ◀ ワールドマップ
          </button>
          <div className="rounded-2xl bg-slate-900/80 px-4 py-2 text-center backdrop-blur">
            <p className="font-dot text-base font-bold text-yellow-300">
              {world.emoji} {world.name}
            </p>
            <p className="text-xs text-slate-300">
              Lv.{stats.level}　ボス: <span className="line-through">{BOSS_BASE}問</span>
              <span className="font-bold text-yellow-300"> → {stats.bossRequired}問</span>
            </p>
          </div>
          <button
            onClick={onEquip}
            className="btn-game pointer-events-auto rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold shadow-[0_3px_0_#312e81]"
          >
            🎒 そうび
          </button>
        </div>

        {/* いまいるゾーンの情報（予習パネル表示中はかくす） */}
        {!bossPrep && (
          <div className="absolute bottom-3 left-3 max-w-sm rounded-2xl border border-cyan-400/40 bg-slate-900/85 p-3 backdrop-blur">
            <p className="font-dot text-sm font-bold text-yellow-300">
              {zoneStage.grade}年生・{zoneInfo.name}
            </p>
            <p className="text-sm font-bold text-slate-100">{zoneStage.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-cyan-200">🔗 {zoneStage.link}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {skillNames(zoneStage.id).map((n) => (
                <span key={n} className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* そうさ方法 */}
        {!bossPrep && (
          <div className="absolute right-3 bottom-3 rounded-2xl bg-slate-900/85 px-3 py-2 text-xs text-slate-300 backdrop-blur">
            <p className="font-bold text-slate-100">🎮 そうさ</p>
            <p>WASD / 矢印キー … あるく</p>
            <p>モンスターに ぶつかると たたかい！</p>
          </div>
        )}
      </div>

      {/* ---- ボスの予習パネル（ボスに触れるとひらく） ---- */}
      {prepStage && !encounter && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center">
          <div className="anim-pop w-full max-w-xl rounded-t-3xl border-2 border-b-0 border-red-400/60 bg-slate-900/95 p-5 shadow-[0_-8px_40px_rgba(239,68,68,0.3)] backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-dot text-sm text-red-300">{prepStage.grade}年生の 大ボス</p>
                <h2 className="text-xl font-bold">
                  {prepStage.bossEmoji} {prepStage.bossName}
                  {save.cleared.includes(prepStage.id) && <span className="ml-2 text-sm text-yellow-300">👑 とうばつずみ</span>}
                </h2>
                <p className="mt-1 text-sm text-slate-300">「{prepStage.title}」の もんだいで しょうぶだ！</p>
              </div>
              <button
                onClick={() => setBossPrep(null)}
                className="rounded-full bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
              >
                ✕
              </button>
            </div>

            {/* 必要問題数のけいさん */}
            <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-center">
              <p className="text-xs text-slate-300">
                たおすのに ひつような正解数（きほん{BOSS_BASE}問・さいてい{BOSS_MIN}問）　ミスすると HP −{stats.mistakeDamage}
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
            </div>

            {/* テストにでる技能（ミニ評価基準表） */}
            <div className="mt-3 rounded-xl bg-slate-800 p-3">
              <p className="text-xs text-slate-400">📋 ボステストに でる力（ぜんぶ まぜて 出題されるよ）</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {skillNames(prepStage.id).map((n) => (
                  <span key={n} className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* 予習のヒント */}
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-800 p-3">
                <p className="text-xs text-slate-400">ドロップ</p>
                <p className="mt-1 font-bold">
                  {ITEMS[prepStage.itemId].emoji}{' '}
                  {save.practiced.includes(prepStage.id) ? ITEMS[prepStage.itemId].name : '？？？'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-800 p-3">
                <p className="text-xs text-slate-400">🔗 つながり</p>
                <p className="mt-1 text-xs leading-snug text-cyan-200">{prepStage.link}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setBossPrep(null)
                  setEncounter({ stageId: prepStage.id, mode: 'practice' })
                }}
                className="btn-game flex-1 rounded-2xl bg-gradient-to-b from-emerald-400 to-green-600 px-3 py-3 text-base font-bold text-slate-900 shadow-[0_5px_0_#14532d]"
              >
                ⚔️ よしゅうバトル（5問）
              </button>
              <button
                onClick={() => {
                  setBossPrep(null)
                  setEncounter({ stageId: prepStage.id, mode: 'boss' })
                }}
                disabled={!save.practiced.includes(prepStage.id)}
                className={`btn-game flex-1 rounded-2xl px-3 py-3 text-base font-bold ${
                  save.practiced.includes(prepStage.id)
                    ? 'bg-gradient-to-b from-red-400 to-red-600 text-white shadow-[0_5px_0_#7f1d1d]'
                    : 'cursor-not-allowed bg-slate-700 text-slate-500 shadow-[0_5px_0_#1e293b]'
                }`}
              >
                👑 いどむ！（{stats.bossRequired}問）
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button onClick={onEquip} className="pointer-events-auto text-sm text-indigo-300 underline hover:text-indigo-200">
                🎒 そうびを ととのえる
              </button>
              {!save.practiced.includes(prepStage.id) && (
                <p className="text-xs text-amber-300">よしゅうバトルに かつと いどめる！そうびも ドロップ！</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- エンカウント演出（フラッシュ＋渦） ---- */}
      {encounter && encounterStage && (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          <div className="anim-enc-flash absolute inset-0 bg-white" />
          <div
            className="anim-enc-swirl absolute inset-0"
            style={{
              background:
                'repeating-conic-gradient(from 0deg at 50% 50%, #020617 0deg 24deg, transparent 24deg 48deg)',
            }}
          />
          <div className="anim-enc-fade absolute inset-0 bg-slate-950" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="anim-pop text-8xl" style={{ animationDelay: '0.35s' }}>
              {encounter.mode === 'boss' ? encounterStage.bossEmoji : encounterStage.enemyEmoji}
            </div>
            <p
              className="anim-pop font-dot mt-4 text-2xl font-bold text-yellow-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]"
              style={{ animationDelay: '0.45s' }}
            >
              {encounter.mode === 'boss'
                ? `大ボス ${encounterStage.bossName} が あらわれた！！`
                : `${encounterStage.enemyName} が あらわれた！`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
