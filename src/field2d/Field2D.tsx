import { useEffect, useMemo, useRef, useState } from 'react'
import type { WorldId } from '../types'
import { useGame } from '../game/store'
import { playerStats, skillLevelOf, BOSS_BASE, type SkillLevel } from '../game/logic'
import { WORLD_BY_ID, STAGE_BY_ID } from '../data/worlds'
import { SKILLS } from '../data/generators'
import { ITEMS } from '../data/items'
import { sfx } from '../game/sound'
import { onTick } from '../lib/ticker'
import SoundToggle from '../components/SoundToggle'
import { Win, CommandList, Typewriter } from '../ui/Win'
import { THEMES_2D, ZONE_NAMES } from './config2d'
import { buildWorldMap, isWalkable, startPos, gradeOfRow, MAP_W, MAP_H, type FieldMonster } from './map'

const TILE = 32
const VIEW_H = 13 // 表示するたてマス数

type Dir = 'up' | 'down' | 'left' | 'right'
const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

const CHIP_CLS: Record<SkillLevel, string> = {
  none: 'text-cyan-300',
  good: 'text-emerald-300',
  mid: 'text-amber-300',
  weak: 'text-red-300',
}

// ドット絵風のゆうしゃ（CSSかさねがき）
function HeroSprite({ facing }: { facing: Dir }) {
  return (
    <div className="relative h-8 w-8">
      {/* ぼうし */}
      <div className="absolute top-[2px] left-[7px] h-[7px] w-[18px] rounded-sm bg-red-500" />
      <div className="absolute top-0 left-[10px] h-[4px] w-[12px] rounded-sm bg-red-600" />
      {/* かお */}
      <div className="absolute top-[9px] left-[8px] h-[8px] w-[16px] rounded-sm bg-[#ffdfba]" />
      {facing !== 'up' && (
        <>
          {(facing === 'down' || facing === 'left') && (
            <div className="absolute top-[12px] left-[10px] h-[3px] w-[3px] bg-slate-900" />
          )}
          {(facing === 'down' || facing === 'right') && (
            <div className="absolute top-[12px] left-[19px] h-[3px] w-[3px] bg-slate-900" />
          )}
        </>
      )}
      {/* からだ */}
      <div className="absolute top-[17px] left-[9px] h-[10px] w-[14px] rounded-sm bg-blue-500" />
      {/* あし */}
      <div className="absolute top-[27px] left-[10px] h-[4px] w-[5px] bg-blue-800" />
      <div className="absolute top-[27px] left-[17px] h-[4px] w-[5px] bg-blue-800" />
    </div>
  )
}

export default function Field2D({
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
  const theme = THEMES_2D[worldId]
  const map = useMemo(() => buildWorldMap(worldId), [worldId])

  const [pos, setPos] = useState(() => startPos(save, worldId))
  const [facing, setFacing] = useState<Dir>('up')
  const [monsters, setMonsters] = useState<FieldMonster[]>(map.monsters)
  const [encounterFx, setEncounterFx] = useState<{ stageId: string; mode: 'practice' | 'boss' } | null>(null)
  const [prep, setPrep] = useState<string | null>(null) // ボス前ウィンドウ
  const [banner, setBanner] = useState<string | null>(null)

  const posRef = useRef(pos)
  posRef.current = pos
  const monstersRef = useRef(monsters)
  monstersRef.current = monsters
  const heldDir = useRef<Dir | null>(null)
  const stepTimer = useRef(0)
  const wanderTimers = useRef<Record<string, number>>({})
  const started = useRef(false) // 一歩あるくまでモンスターは動かない
  const lockRef = useRef(false) // エンカウント演出中は入力停止
  const bannerTimer = useRef(0)
  const lastZone = useRef(0)

  const zoneGrade = gradeOfRow(pos.y)
  const zoneStage = world.stages[zoneGrade - 1]

  // ゾーンが かわったら 地名バナー
  useEffect(() => {
    if (zoneGrade !== lastZone.current) {
      lastZone.current = zoneGrade
      setBanner(`〜 ${zoneGrade}年生・${ZONE_NAMES[zoneStage.id]} 〜`)
      bannerTimer.current = 2.6
    }
  }, [zoneGrade, zoneStage.id])

  const triggerEncounter = (stageId: string, mode: 'practice' | 'boss') => {
    if (lockRef.current) return
    lockRef.current = true
    sfx.encounter()
    setEncounterFx({ stageId, mode })
  }

  // エンカウント演出（フラッシュ）が おわったら 戦闘へ
  useEffect(() => {
    if (!encounterFx) return
    const t = window.setTimeout(() => onBattle(encounterFx.stageId, encounterFx.mode), 800)
    return () => window.clearTimeout(t)
  }, [encounterFx, onBattle])

  const tryStep = (dir: Dir) => {
    if (lockRef.current || prep) return
    setFacing(dir)
    const [dx, dy] = DELTA[dir]
    const nx = posRef.current.x + dx
    const ny = posRef.current.y + dy
    started.current = true
    // モンスターに ぶつかった？
    const hit = monstersRef.current.find((m) => m.x === nx && m.y === ny)
    if (hit) {
      if (hit.kind === 'boss') setPrep(hit.stageId)
      else triggerEncounter(hit.stageId, 'practice')
      return
    }
    if (!isWalkable(map, save, worldId, nx, ny)) {
      // とじた もんに ぶつかった
      if (map.tiles[ny]?.[nx] === 'G') {
        setBanner('🔒 大ボスを たおすと もんが ひらく！')
        bannerTimer.current = 2.2
      }
      return
    }
    setPos({ x: nx, y: ny })
  }

  // キーボード
  useEffect(() => {
    const keyDir = (k: string): Dir | null =>
      k === 'arrowup' || k === 'w' ? 'up' : k === 'arrowdown' || k === 's' ? 'down' : k === 'arrowleft' || k === 'a' ? 'left' : k === 'arrowright' || k === 'd' ? 'right' : null
    const down = (e: KeyboardEvent) => {
      const d = keyDir(e.key.toLowerCase())
      if (!d) return
      e.preventDefault()
      if (heldDir.current !== d) {
        heldDir.current = d
        stepTimer.current = 0
        tryStep(d)
      }
    }
    const up = (e: KeyboardEvent) => {
      const d = keyDir(e.key.toLowerCase())
      if (d && heldDir.current === d) heldDir.current = null
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, prep])

  // ゲームループ：長押し移動・モンスターのうろつき・バナー消し
  useEffect(() => {
    return onTick((dt) => {
      // 長押しで 1マスずつ すすむ
      if (heldDir.current) {
        stepTimer.current += dt
        if (stepTimer.current >= 0.17) {
          stepTimer.current = 0
          tryStep(heldDir.current)
        }
      }
      // バナー
      if (bannerTimer.current > 0) {
        bannerTimer.current -= dt
        if (bannerTimer.current <= 0) setBanner(null)
      }
      // モンスターのうろつき（1マスずつ ランダム歩き）
      if (!started.current || lockRef.current || prep) return
      let moved = false
      const next = monstersRef.current.map((m) => {
        if (m.kind === 'boss') return m
        const t = (wanderTimers.current[m.id] ?? Math.random() * 1.2) - dt
        if (t > 0) {
          wanderTimers.current[m.id] = t
          return m
        }
        wanderTimers.current[m.id] = 0.9 + Math.random() * 0.9
        const dirs: Dir[] = ['up', 'down', 'left', 'right']
        const d = dirs[Math.floor(Math.random() * 4)]
        const [dx, dy] = DELTA[d]
        const nx = m.x + dx
        const ny = m.y + dy
        if (ny < m.zoneTop || ny > m.zoneBottom) return m
        if (!isWalkable(map, save, worldId, nx, ny)) return m
        if (monstersRef.current.some((o) => o !== m && o.x === nx && o.y === ny)) return m
        // プレイヤーに とびかかった！
        if (nx === posRef.current.x && ny === posRef.current.y) {
          triggerEncounter(m.stageId, 'practice')
          return m
        }
        moved = true
        return { ...m, x: nx, y: ny }
      })
      if (moved) setMonsters(next)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, prep])

  // タイルの見た目
  const tileFace = (t: string): { bg?: string; icon?: string } => {
    switch (t) {
      case 'p':
        return { bg: theme.path }
      case 't':
        return { icon: theme.tree }
      case 'r':
        return { icon: '🪨' }
      case 'h':
        return { icon: '🏠' }
      case 's':
        return { icon: '🪧' }
      case 'f':
        return { icon: '🚧' }
      case 'G':
        return { icon: '⛩️' }
      case 'd':
        return { icon: theme.deco }
      default:
        return {}
    }
  }

  const viewH = VIEW_H * TILE
  const camY = Math.max(0, Math.min(MAP_H * TILE - viewH, pos.y * TILE - viewH / 2))
  const prepStage = prep ? STAGE_BY_ID[prep] : null

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black">
      {/* ---- フィールド（ビューポート） ---- */}
      <div
        className="dq-frame relative overflow-hidden"
        style={{ width: MAP_W * TILE, height: viewH, maxWidth: '100vw' }}
      >
        <div
          className="absolute top-0 left-0 transition-transform duration-150 ease-linear"
          style={{ width: MAP_W * TILE, height: MAP_H * TILE, transform: `translateY(${-camY}px)` }}
        >
          {/* タイル */}
          {map.tiles.map((row, y) => (
            <div key={y} className="flex">
              {row.map((t, x) => {
                const f = tileFace(t)
                const gateOpen = t === 'G' && isWalkable(map, save, worldId, x, y)
                return (
                  <div
                    key={x}
                    className="flex items-center justify-center text-xl leading-none select-none"
                    style={{
                      width: TILE,
                      height: TILE,
                      background: f.bg ?? ((x + y) % 2 === 0 ? theme.grass : theme.grass2),
                    }}
                  >
                    {t === 'G' ? (gateOpen ? '⛩️' : '🚪') : f.icon}
                  </div>
                )
              })}
            </div>
          ))}
          {/* モンスター */}
          {monsters.map((m) => {
            const stage = STAGE_BY_ID[m.stageId]
            const boss = m.kind === 'boss'
            return (
              <div
                key={m.id}
                className="absolute top-0 left-0 flex items-center justify-center transition-transform duration-200 ease-linear"
                style={{ width: TILE, height: TILE, transform: `translate(${m.x * TILE}px, ${m.y * TILE}px)` }}
              >
                <span className={boss ? 'text-3xl' : 'text-2xl'} style={{ filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.4))' }}>
                  {boss ? stage.bossEmoji : stage.enemyEmoji}
                </span>
                {boss && <span className="absolute -top-2 text-xs">👑</span>}
              </div>
            )
          })}
          {/* ゆうしゃ */}
          <div
            className="absolute top-0 left-0 transition-transform duration-150 ease-linear"
            style={{ width: TILE, height: TILE, transform: `translate(${pos.x * TILE}px, ${pos.y * TILE}px)` }}
          >
            <HeroSprite facing={facing} />
          </div>
        </div>

        {/* 地名バナー */}
        {banner && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            <Win className="px-4 py-1 text-sm">{banner}</Win>
          </div>
        )}

        {/* エンカウントのフラッシュ */}
        {encounterFx && <div className="dq-encounter absolute inset-0" />}
      </div>

      {/* ---- HUD ---- */}
      <div className="mt-2 flex w-full max-w-[480px] items-stretch gap-2 px-2">
        <Win className="flex-1 px-3 py-2 text-xs leading-relaxed">
          <p className="text-yellow-200">
            {zoneGrade}年生・{ZONE_NAMES[zoneStage.id]}｜{zoneStage.title}
          </p>
          <p className="text-[11px] text-slate-300">
            Lv.{stats.level}　ボス <span className="line-through">{BOSS_BASE}</span>→
            <span className="text-yellow-200">{stats.bossRequired}問</span>
            {(SKILLS[zoneStage.id] ?? []).map((s) => {
              const { level } = skillLevelOf(save.skillStats, zoneStage.id, s.id)
              return (
                <span key={s.id} className={`mr-1 ${CHIP_CLS[level]}`}>
                  {level === 'weak' ? '⚠️' : level === 'good' ? '✓' : '・'}
                  {s.name}
                </span>
              )
            })}
          </p>
        </Win>
        {/* 十字ボタン */}
        <div className="grid shrink-0 grid-cols-3 grid-rows-3" style={{ width: 108, height: 108 }}>
          <span />
          <DirBtn dir="up" label="▲" onStep={tryStep} heldDir={heldDir} />
          <span />
          <DirBtn dir="left" label="◀" onStep={tryStep} heldDir={heldDir} />
          <span className="flex items-center justify-center text-slate-600">・</span>
          <DirBtn dir="right" label="▶" onStep={tryStep} heldDir={heldDir} />
          <span />
          <DirBtn dir="down" label="▼" onStep={tryStep} heldDir={heldDir} />
          <span />
        </div>
      </div>
      <div className="mt-1 flex w-full max-w-[480px] items-center justify-between px-2">
        <button onClick={onBack} className="font-dot text-xs text-slate-400 hover:text-white">
          ◀ ワールドマップへ
        </button>
        <div className="flex items-center gap-2">
          <SoundToggle />
          <button onClick={onEquip} className="dq-win font-dot px-3 py-1 text-xs text-white hover:text-yellow-200">
            そうび
          </button>
        </div>
      </div>

      {/* ---- ボス前ウィンドウ（ドラクエ風コマンド） ---- */}
      {prepStage && !encounterFx && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-3">
          <Win className="w-full max-w-md p-4">
            <p className="text-base leading-relaxed text-white">
              <Typewriter text={`${prepStage.bossEmoji} 大ボス「${prepStage.bossName}」が\nゆくてを ふさいでいる！`} speed={20} />
            </p>
            <div className="mt-2 border-t-2 border-white/60 pt-2 text-xs leading-relaxed text-slate-200">
              <p>
                たおすには 「{prepStage.title}」の もんだいに{' '}
                <span className="text-yellow-200">
                  {BOSS_BASE}−Lv{stats.level}−そうび{stats.atk}＝{stats.bossRequired}問
                </span>{' '}
                せいかい！　ミスすると HP−{stats.mistakeDamage}。
              </p>
              <p className="mt-1">
                かった あかしに{' '}
                <span className="text-yellow-200">
                  {ITEMS[prepStage.itemId].emoji}
                  {save.practiced.includes(prepStage.id) ? ITEMS[prepStage.itemId].name : '？？？'}
                </span>
                {!save.practiced.includes(prepStage.id) && '（よしゅうで ドロップ）'}
              </p>
              {(() => {
                const weak = (SKILLS[prepStage.id] ?? []).filter(
                  (s) => skillLevelOf(save.skillStats, prepStage.id, s.id).level === 'weak',
                )
                return weak.length > 0 ? (
                  <p className="mt-1 text-red-300">⚠️ にがて：{weak.map((s) => s.name).join('・')}</p>
                ) : null
              })()}
            </div>
            <div className="mt-2 border-t-2 border-white/60 pt-1">
              <CommandList
                items={[
                  {
                    label: 'たたかう',
                    value: 'fight',
                    note: `${stats.bossRequired}もん`,
                    disabled: !save.practiced.includes(prepStage.id),
                  },
                  { label: 'よしゅうする', value: 'practice', note: '5もん・そうびドロップ' },
                  { label: 'そうびを みる', value: 'equip' },
                  { label: 'にげる', value: 'close' },
                ]}
                onSelect={(v) => {
                  if (v === 'fight') {
                    setPrep(null)
                    triggerEncounter(prepStage.id, 'boss')
                  } else if (v === 'practice') {
                    setPrep(null)
                    triggerEncounter(prepStage.id, 'practice')
                  } else if (v === 'equip') onEquip()
                  else setPrep(null)
                }}
              />
              {!save.practiced.includes(prepStage.id) && (
                <p className="mt-1 text-[11px] text-amber-300">※「よしゅうする」に かつと たたかえる！</p>
              )}
            </div>
          </Win>
        </div>
      )}
    </div>
  )
}

// 十字キーの1ボタン（押しっぱなしで あるき つづける）
function DirBtn({
  dir,
  label,
  onStep,
  heldDir,
}: {
  dir: Dir
  label: string
  onStep: (d: Dir) => void
  heldDir: React.RefObject<Dir | null>
}) {
  return (
    <button
      className="dq-win flex items-center justify-center text-lg text-white active:bg-slate-700"
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        heldDir.current = dir
        onStep(dir)
      }}
      onPointerUp={() => {
        if (heldDir.current === dir) heldDir.current = null
      }}
      onPointerCancel={() => {
        if (heldDir.current === dir) heldDir.current = null
      }}
    >
      {label}
    </button>
  )
}
