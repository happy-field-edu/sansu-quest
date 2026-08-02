import { useEffect, useMemo, useRef, useState } from 'react'
import type { Item, WorldId } from '../types'
import { useGame } from '../game/store'
import {
  playerStats,
  skillLevelOf,
  bossBaseOf,
  bossRequiredFor,
  bossMistakeDamage,
  bossMistakesLeft,
  type SkillLevel,
} from '../game/logic'
import { WORLD_BY_ID, STAGE_BY_ID } from '../data/worlds'
import { SKILLS } from '../data/generators'
import { ITEMS } from '../data/items'
import { sfx } from '../game/sound'
import { onTick } from '../lib/ticker'
import FieldMenu from './FieldMenu'
import MiniMap from './MiniMap'
import Records from '../screens/Records'
import Shop from '../screens/Shop'
import { Win, CommandList, Typewriter } from '../ui/Win'
import { ZONE_NAMES } from './config2d'
import { buildWorldMap, isWalkable, startPos, gradeOfRow, MAP_W, MAP_H, type FieldMonster, type Chest } from './map'
import MapCanvas from './MapCanvas'
import { TILE, DOT } from '../pixel/px'
import Sprite from '../pixel/Sprite'
import { heroUrl, npcUrl, chestUrl, coinUrl } from '../pixel/chars'
import { heroLookOf } from '../pixel/heroLook'
import { monsterUrl, monsterDots } from '../pixel/monsters'

// 画面に見える マス数。1マスが 48pxに 大きくなったので マス数は へらす
// ＝ 俯瞰の カメラが 主人公に ぐっと 近づいて 見える。
const VIEW_W = 10
const VIEW_H = 9

type Dir = 'up' | 'down' | 'left' | 'right'
const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

const CHIP_CLS: Record<SkillLevel, string> = {
  none: 'text-cyan-300',
  good: 'text-emerald-300',
  mid: 'text-amber-300',
  weak: 'text-red-300',
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
  const { save, dispatch } = useGame()
  const stats = playerStats(save)
  const world = WORLD_BY_ID[worldId]
  const map = useMemo(() => buildWorldMap(worldId), [worldId])
  // ひらいた もんの 行（マップを えがきなおす きっかけに つかう）
  const openGates = useMemo(
    () => map.gateRows.filter((g) => save.cleared.includes(`${worldId}-${g.grade}`)).map((g) => g.row).join(','),
    [map, save.cleared, worldId],
  )

  // 立ち位置：まえに このワールドで いた場所から さいかいする（オートセーブ）
  const [pos, setPos] = useState(() => {
    const saved = save.lastPos?.[worldId]
    if (saved && isWalkable(map, save, worldId, saved.x, saved.y)) return saved
    return startPos(save, worldId)
  })
  const [facing, setFacing] = useState<Dir>('up')
  const facingRef = useRef<Dir>('up')
  facingRef.current = facing
  const [walk, setWalk] = useState<0 | 1>(0) // あるく コマ（1歩ごとに 入れかわる）
  // そうびを 見た目に 反映する（ぶき・たて・よろい・かぶと・くつ・おまもり）
  const look = useMemo(() => heroLookOf(save), [save.equipped])
  const [monsters, setMonsters] = useState<FieldMonster[]>(map.monsters)
  const [encounterFx, setEncounterFx] = useState<{ stageId: string; mode: 'practice' | 'boss' } | null>(null)
  const [prep, setPrep] = useState<string | null>(null) // ボス前ウィンドウ
  const [banner, setBanner] = useState<string | null>(null)
  // 会話ウィンドウ（NPC・立て札）
  const [dialog, setDialog] = useState<{ emoji: string; name: string; lines: string[] } | null>(null)
  const [dlgIdx, setDlgIdx] = useState(0)
  const dialogRef = useRef(dialog)
  dialogRef.current = dialog
  const dlgIdxRef = useRef(0)
  // メニューウィンドウ（Xキー／メニューボタン）
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(false)
  menuRef.current = menuOpen
  const [records, setRecords] = useState(false)
  // どうぐや（ショップ）
  const [shop, setShop] = useState<{ stageId: string; grade: number } | null>(null)
  const shopRef = useRef(shop)
  shopRef.current = shop
  // 宝箱の 獲得演出
  const [treasure, setTreasure] = useState<{ item: Item; already: boolean } | null>(null)
  const treasureRef = useRef(treasure)
  treasureRef.current = treasure

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

  // 立ち位置の オートセーブ（歩くたびに 記録。つぎに ひらいたとき ここから）
  useEffect(() => {
    dispatch({ type: 'save-pos', worldId, x: pos.x, y: pos.y })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.x, pos.y, worldId])

  // エンカウント演出（フラッシュ）が おわったら 戦闘へ
  useEffect(() => {
    if (!encounterFx) return
    const t = window.setTimeout(() => onBattle(encounterFx.stageId, encounterFx.mode), 800)
    return () => window.clearTimeout(t)
  }, [encounterFx, onBattle])

  // NPC・立て札の 会話をひらく
  const openTalkAt = (x: number, y: number): boolean => {
    // どうぐやの 入口：会話ではなく ショップウィンドウを ひらく
    const door = map.shops.find((s) => s.x === x && s.y === y)
    if (door) {
      sfx.chestOpen()
      setShop({ stageId: door.stageId, grade: STAGE_BY_ID[door.stageId].grade })
      return true
    }
    const npc = map.npcs.find((n) => n.x === x && n.y === y)
    if (npc) {
      dlgIdxRef.current = 0
      setDlgIdx(0)
      setDialog({ emoji: npc.emoji, name: npc.name, lines: npc.lines })
      return true
    }
    if (map.tiles[y]?.[x] === 's') {
      const sign = map.signs.find((s) => s.x === x && s.y === y)
      if (sign) {
        const st = STAGE_BY_ID[sign.stageId]
        const skills = (SKILLS[sign.stageId] ?? []).map((s) => s.name).join('・')
        dlgIdxRef.current = 0
        setDlgIdx(0)
        setDialog({
          emoji: '🪧',
          name: 'たてふだ',
          lines: [
            `【${st.grade}年生・${ZONE_NAMES[sign.stageId]}】\n「${st.title}」の もんだいが でる エリアだ。`,
            `みがく力：${skills}`,
          ],
        })
        return true
      }
    }
    return false
  }

  const advanceDialog = () => {
    const d = dialogRef.current
    if (!d) return
    if (dlgIdxRef.current < d.lines.length - 1) {
      dlgIdxRef.current += 1
      setDlgIdx(dlgIdxRef.current)
    } else {
      dlgIdxRef.current = 0
      setDlgIdx(0)
      setDialog(null)
    }
  }

  // むいている ほうこうを しらべる（Ⓐボタン）
  const doAction = () => {
    if (lockRef.current || prep || menuRef.current || shopRef.current) return
    if (treasureRef.current) {
      setTreasure(null) // 宝箱の 演出を とじる
      return
    }
    if (dialogRef.current) {
      advanceDialog()
      return
    }
    const [dx, dy] = DELTA[facingRef.current]
    openTalkAt(posRef.current.x + dx, posRef.current.y + dy)
  }

  // 宝箱を あける：カチッ→ファンファーレ→「〇〇をてにいれた！」
  const openChest = (chest: Chest) => {
    const item = ITEMS[chest.itemId]
    if (!item) return
    const already = save.items.includes(item.id) // もう持っている そうびか
    sfx.chestOpen()
    window.setTimeout(() => sfx.fanfare(), 180)
    dispatch({ type: 'open-chest', chestId: chest.id, itemId: chest.itemId })
    setTreasure({ item, already })
  }

  // メニューの 開閉（Xキー・メニューボタン）
  const toggleMenu = () => {
    if (lockRef.current || prep || shopRef.current) return
    if (dialogRef.current) return // 会話ちゅうは ひらかない
    setMenuOpen((o) => !o)
  }

  const tryStep = (dir: Dir) => {
    if (lockRef.current || prep || dialogRef.current || menuRef.current || treasureRef.current || shopRef.current) return
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
    // 宝箱に ぶつかった → あける
    const chest = map.chests.find((c) => c.x === nx && c.y === ny)
    if (chest) {
      if (save.openedChests.includes(chest.id)) {
        setBanner('からっぽの たからばこだ…')
        bannerTimer.current = 1.8
      } else {
        openChest(chest)
      }
      return
    }
    // むらびと・立て札に ぶつかった → 会話
    if (openTalkAt(nx, ny)) return
    if (!isWalkable(map, save, worldId, nx, ny)) {
      // とじた もんに ぶつかった
      if (map.tiles[ny]?.[nx] === 'G') {
        setBanner('🔒 大ボスを たおすと もんが ひらく！')
        bannerTimer.current = 2.2
      }
      return
    }
    sfx.step() // あるく音
    setWalk((w) => (w === 0 ? 1 : 0)) // 足を 入れかえる
    setPos({ x: nx, y: ny })
  }

  // キーボード
  useEffect(() => {
    const keyDir = (k: string): Dir | null =>
      k === 'arrowup' || k === 'w' ? 'up' : k === 'arrowdown' || k === 's' ? 'down' : k === 'arrowleft' || k === 'a' ? 'left' : k === 'arrowright' || k === 'd' ? 'right' : null
    const down = (e: KeyboardEvent) => {
      // Xキー：メニューの開閉。Escでも とじられる
      if (e.key.toLowerCase() === 'x') {
        e.preventDefault()
        toggleMenu()
        return
      }
      if (e.key === 'Escape' && menuRef.current) {
        e.preventDefault()
        setMenuOpen(false)
        return
      }
      // メニュー・どうぐや中は 移動・しらべるを うけつけない（コマンドは CommandList が うけとる）
      if (menuRef.current || shopRef.current) return
      // Ⓐボタン（しらべる・会話をすすめる）
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        doAction()
        return
      }
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
      if (!started.current || lockRef.current || prep || dialogRef.current || menuRef.current || shopRef.current) return
      let moved = false
      // 同じマスに 2ひき 入らないように、うごくたびに 占有マスを こうしんする
      const occ = new Set(monstersRef.current.map((o) => `${o.x},${o.y}`))
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
        if (occ.has(`${nx},${ny}`)) return m
        // プレイヤーに とびかかった！
        if (nx === posRef.current.x && ny === posRef.current.y) {
          triggerEncounter(m.stageId, 'practice')
          return m
        }
        occ.delete(`${m.x},${m.y}`)
        occ.add(`${nx},${ny}`)
        moved = true
        return { ...m, x: nx, y: ny }
      })
      if (moved) setMonsters(next)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, prep])

  // ---- カメラ追従（2軸スクロール＋クランプ） ----
  // ゆうしゃが つねに 画面の まん中あたりに くるように カメラを うごかし、
  // マップの はしでは マップの そとが 見えないよう カメラを とめる（クランプ）。
  const viewW = VIEW_W * TILE
  const viewH = VIEW_H * TILE
  const mapPxW = MAP_W * TILE
  const mapPxH = MAP_H * TILE
  const clamp = (v: number, min: number, max: number) => (max < min ? min : Math.max(min, Math.min(max, v)))
  // ゆうしゃの 中心が ビューの 中心に くる位置 → はしで クランプ
  const camX = clamp(pos.x * TILE + TILE / 2 - viewW / 2, 0, mapPxW - viewW)
  const camY = clamp(pos.y * TILE + TILE / 2 - viewH / 2, 0, mapPxH - viewH)
  const prepStage = prep ? STAGE_BY_ID[prep] : null

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black">
      {/* ---- フィールド（ビューポート） ---- */}
      <div
        className="dq-frame relative overflow-hidden"
        style={{ width: viewW, height: viewH, maxWidth: '100vw' }}
      >
        {/* 地形も ゆうしゃも おなじ「うごく入れもの」に入れて いっしょに うごかす。
            （地形だけ 先に とぶと、ゆうしゃが 1歩ごとに はねて 見えてしまう） */}
        <div
          className="absolute top-0 left-0 transition-transform duration-150 ease-linear"
          style={{ width: mapPxW, height: mapPxH, transform: `translate(${-camX}px, ${-camY}px)` }}
        >
          {/* 地形（見えている ところ＋まわり2マスだけ canvas に えがく） */}
          <MapCanvas worldId={worldId} map={map} openGates={openGates} camX={camX} camY={camY} viewW={viewW} viewH={viewH} />
          {/* どうぐやの めじるし（赤い屋根の たてものの うえに コイン） */}
          {/* ※ anim-floaty は transform を つかうので、
              いちの transform は かならず 外がわの div に かく */}
          {map.shops.map((s) => (
            <div
              key={`shop-${s.x},${s.y}`}
              className="absolute top-0 left-0"
              style={{ transform: `translate(${(s.x - 1) * TILE}px, ${(s.y - 2) * TILE}px)` }}
            >
              <Sprite url={coinUrl()} className="anim-floaty" />
            </div>
          ))}
          {/* 宝箱（あけると あいた箱に なる） */}
          {map.chests.map((c) => {
            const opened = save.openedChests.includes(c.id)
            return (
              <div
                key={c.id}
                className="absolute top-0 left-0"
                style={{ transform: `translate(${c.x * TILE}px, ${c.y * TILE}px)` }}
              >
                <Sprite
                  url={chestUrl(opened)}
                  className={opened ? 'opacity-70' : 'anim-floaty'}
                  style={{ filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.35))' }}
                />
              </div>
            )
          })}
          {/* むらびと（NPC） */}
          {map.npcs.map((n) => (
            <Sprite
              key={`${n.x},${n.y}`}
              url={npcUrl(n.emoji)}
              className="absolute top-0 left-0"
              style={{ transform: `translate(${n.x * TILE}px, ${n.y * TILE}px)`, filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.35))' }}
            />
          ))}
          {/* モンスター（ドットの 整数倍で 表示：ザコ24×3=72px／大ボス32×3=96px） */}
          {monsters.map((m) => {
            const boss = m.kind === 'boss'
            const size = monsterDots(boss) * DOT
            const off = (TILE - size) / 2
            return (
              <div
                key={m.id}
                className="absolute top-0 left-0 transition-transform duration-200 ease-linear"
                style={{ width: TILE, height: TILE, transform: `translate(${m.x * TILE}px, ${m.y * TILE}px)`, zIndex: boss ? 2 : 1 }}
              >
                <Sprite
                  url={monsterUrl(m.stageId, boss, DOT)}
                  size={size}
                  className={boss ? 'anim-floaty' : ''}
                  style={{ position: 'absolute', left: off, top: off - (boss ? 14 : 6), filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.4))' }}
                />
              </div>
            )
          })}
          {/* ゆうしゃ */}
          <Sprite
            url={heroUrl(facing, walk, look)}
            className="absolute top-0 left-0 transition-transform duration-150 ease-linear"
            style={{ transform: `translate(${pos.x * TILE}px, ${pos.y * TILE}px)`, zIndex: 3, filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.4))' }}
          />
        </div>

        {/* ミニマップ（右上） */}
        {!dialog && !menuOpen && !shop && (
          <MiniMap
            map={map}
            monsters={monsters}
            pos={pos}
            cleared={save.cleared}
            worldId={world.name}
            viewW={viewW}
            viewH={viewH}
            camX={camX}
            camY={camY}
            tile={TILE}
          />
        )}

        {/* 地名バナー */}
        {banner && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            <Win className="px-4 py-1 text-sm">{banner}</Win>
          </div>
        )}

        {/* 会話ウィンドウ（NPC・立て札） */}
        {dialog && (
          <div className="absolute inset-x-2 bottom-2 z-10" onClick={advanceDialog}>
            <Win className="cursor-pointer px-3 py-2">
              <p className="mb-1 text-xs text-yellow-200">
                {dialog.emoji} {dialog.name}
              </p>
              <p className="min-h-[3.2rem] text-sm leading-relaxed">
                <Typewriter key={dlgIdx} text={dialog.lines[dlgIdx]} speed={22} />
              </p>
              <p className="dq-cursor-blink text-right text-xs">
                {dlgIdx < dialog.lines.length - 1 ? '▼ タップで つづく' : '▼ タップで とじる'}
              </p>
            </Win>
          </div>
        )}

        {/* 宝箱の 獲得演出 */}
        {treasure && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-3"
            onClick={() => setTreasure(null)}
          >
            <Win className="anim-pop w-full max-w-sm p-4 text-center">
              <div className="anim-floaty text-5xl">🎁</div>
              <p className="mt-2 text-base leading-relaxed">
                <Typewriter
                  key={treasure.item.id}
                  text={`たからばこを あけた！\n${treasure.item.emoji}「${treasure.item.name}」を てにいれた！`}
                  speed={26}
                />
              </p>
              <div className="mt-2 border-t-2 border-white/60 pt-2 text-xs leading-relaxed text-slate-200">
                <p>{treasure.item.desc}</p>
                <p className="mt-1 text-emerald-300">
                  {treasure.item.atk > 0 && `⚔️ ボスの問題数 −${treasure.item.atk}　`}
                  {treasure.item.def > 0 && `🛡️ まもり ＋${treasure.item.def}　`}
                  {treasure.item.hp > 0 && `❤️ HP ＋${treasure.item.hp}`}
                </p>
                {treasure.already && <p className="mt-1 text-slate-400">（おなじ そうびを もう もっていた）</p>}
              </div>
              <p className="dq-cursor-blink mt-2 text-xs">▼ タップで とじる</p>
            </Win>
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
            Lv.{stats.level}　<span className="text-yellow-200">🪙{save.coins}</span>　ボス{' '}
            <span className="line-through">{bossBaseOf(zoneStage.id)}</span>→
            <span className="text-yellow-200">{bossRequiredFor(zoneStage.id, stats.power)}問</span>
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
          <button
            onClick={doAction}
            className="dq-win flex items-center justify-center text-sm font-bold text-yellow-200 active:bg-slate-700"
            style={{ touchAction: 'manipulation' }}
            title="はなす・しらべる"
          >
            Ⓐ
          </button>
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
          {/* メニュー（タブレットは タップ、パソコンは Xキー） */}
          <button
            onClick={toggleMenu}
            className="dq-win font-dot px-4 py-1.5 text-sm text-yellow-200 hover:text-white active:translate-y-0.5"
            style={{ touchAction: 'manipulation' }}
          >
            ☰ メニュー<span className="ml-1 text-[10px] text-slate-400">(X)</span>
          </button>
        </div>
      </div>

      {/* ---- メニューウィンドウ ---- */}
      {menuOpen && !encounterFx && (
        <FieldMenu
          stageId={zoneStage.id}
          onClose={() => setMenuOpen(false)}
          onEquip={() => {
            setMenuOpen(false)
            onEquip()
          }}
          onRecords={() => setRecords(true)}
          onWorldMap={() => {
            setMenuOpen(false)
            onBack()
          }}
        />
      )}
      {records && <Records onClose={() => setRecords(false)} />}

      {/* ---- どうぐや（ショップ） ---- */}
      {shop && !encounterFx && <Shop stageId={shop.stageId} grade={shop.grade} onClose={() => setShop(null)} />}

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
                  {bossBaseOf(prepStage.id)}−Lv{stats.level}−そうび{stats.atk}＝{bossRequiredFor(prepStage.id, stats.power)}問
                </span>{' '}
                せいかい！
              </p>
              {/* 大ボスの こうげき力（防具なしは 一撃で やられる） */}
              {(() => {
                const dmg = bossMistakeDamage(prepStage.id, stats.def, stats.maxHp)
                const left = bossMistakesLeft(stats.maxHp, dmg)
                return stats.def <= 0 ? (
                  <p className="mt-1 text-red-300">
                    ⚠️ この大ボスの こうげきは はげしい！ ぼうぐが ないと{' '}
                    <span className="dq-cursor-blink text-red-400">1回の ミスで やられる</span>。
                    まず ぼうぐを そうびしよう！
                  </p>
                ) : (
                  <p className="mt-1">
                    ミスすると HP−<span className="text-red-300">{dmg}</span>（HP{stats.maxHp}／まもり{stats.def}）→ ミスできるのは{' '}
                    <span className="text-yellow-200">{left}回</span>まで。
                  </p>
                )
              })()}
              <p className="mt-1">
                かった あかしに{' '}
                <span className="text-yellow-200">
                  {ITEMS[prepStage.itemId].emoji}
                  {save.practiced.includes(prepStage.id) ? ITEMS[prepStage.itemId].name : '？？？'}
                </span>
                が もらえる。
              </p>
              <p className="mt-1 text-emerald-300">
                🪙 よしゅうバトルで コインを あつめて、🏪どうぐやで そうびを かうと ボスが よわくなるぞ！
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
                    note: `${bossRequiredFor(prepStage.id, stats.power)}もん`,
                    disabled: !save.practiced.includes(prepStage.id),
                  },
                  { label: 'よしゅうする', value: 'practice', note: '5もん・🪙コイン' },
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
