import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import type { WorldId } from '../types'
import { useGame } from '../game/store'
import { playerStats, BOSS_BASE } from '../game/logic'
import { WORLD_BY_ID, STAGE_BY_ID } from '../data/worlds'
import { ZONES } from './config'
import Scene, { maxZoneOf } from './Scene'

interface Encounter {
  stageId: string
  mode: 'practice' | 'boss'
}

// 開発環境かつタブ非表示のとき（rAFが止まる環境）だけ、MessageChannelで
// 手動フレーム駆動する。本番ビルドでは何もしない。
function HiddenPaneDriver() {
  const advance = useThree((s) => s.advance)
  const setFrameloop = useThree((s) => s.setFrameloop)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    let running = false
    let last = 0
    const ch = new MessageChannel()
    ch.port1.onmessage = () => {
      if (!running) return
      const now = performance.now()
      if (now - last >= 33) {
        last = now
        advance(now)
      }
      ch.port2.postMessage(0)
    }
    const apply = () => {
      if (document.visibilityState === 'hidden') {
        // 非表示ページではResizeObserverも配送されないため、計測を強制する
        window.dispatchEvent(new Event('resize'))
        if (!running) {
          running = true
          setFrameloop('never')
          ch.port2.postMessage(0)
        }
      } else if (running) {
        running = false
        setFrameloop('always')
      }
    }
    apply()
    document.addEventListener('visibilitychange', apply)
    return () => {
      running = false
      document.removeEventListener('visibilitychange', apply)
      setFrameloop('always')
      ch.port1.close()
    }
  }, [advance, setFrameloop])
  return null
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
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  // 非表示ページではResizeObserverが配送されず、Canvasの計測が始まらない。
  // 開発時のみ、マウント直後にresizeを数回発火して計測を強制する（実ブラウザでは無害）。
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const kick = () => window.dispatchEvent(new Event('resize'))
    kick()
    const ids = [150, 400, 900, 1800].map((ms) => window.setTimeout(kick, ms))
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [])

  // エンカウント演出のあと戦闘画面へ
  useEffect(() => {
    if (!encounter) return
    const t = window.setTimeout(() => onBattle(encounter.stageId, encounter.mode), 1150)
    return () => window.clearTimeout(t)
  }, [encounter, onBattle])

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }

  const zoneStage = world.stages[zone - 1]
  const zoneInfo = ZONES[zoneStage.id]
  const encounterStage = encounter ? STAGE_BY_ID[encounter.stageId] : null

  return (
    <div className="fixed inset-0">
      <Canvas camera={{ position: [0, 9, 8], fov: 50 }} dpr={[1, 1.75]}>
        <HiddenPaneDriver />
        <Scene
          worldId={worldId}
          save={save}
          paused={encounter !== null}
          onEncounter={(stageId, mode) => setEncounter({ stageId, mode })}
          onLockedBoss={(stageId) =>
            showToast(`${STAGE_BY_ID[stageId].bossName}「まずは この地の モンスターを たおしてこい！」`)
          }
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

        {/* いまいるゾーンの情報 */}
        <div className="absolute bottom-3 left-3 max-w-sm rounded-2xl border border-cyan-400/40 bg-slate-900/85 p-3 backdrop-blur">
          <p className="font-dot text-sm font-bold text-yellow-300">
            {zoneStage.grade}年生・{zoneInfo.name}
          </p>
          <p className="text-sm font-bold text-slate-100">{zoneStage.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-cyan-200">🔗 {zoneStage.link}</p>
        </div>

        {/* そうさ方法 */}
        <div className="absolute right-3 bottom-3 rounded-2xl bg-slate-900/85 px-3 py-2 text-xs text-slate-300 backdrop-blur">
          <p className="font-bold text-slate-100">🎮 そうさ</p>
          <p>WASD / 矢印キー … あるく</p>
          <p>モンスターに ぶつかると たたかい！</p>
        </div>

        {/* ボス門番のせりふ */}
        {toast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2">
            <div className="anim-pop rounded-2xl border-2 border-red-400/70 bg-slate-900/95 px-4 py-2 text-sm font-bold text-red-200 shadow-lg">
              {toast}
            </div>
          </div>
        )}
      </div>

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
