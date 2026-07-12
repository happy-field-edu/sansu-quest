import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Group, MathUtils, Vector3 } from 'three'
import type { SaveData, Stage, WorldId } from '../types'
import { WORLD_BY_ID } from '../data/worlds'
import Monster from './Monster'
import { HeroModel } from './Hero'
import {
  FIELD_HALF_W,
  FIELD_THEMES,
  PLAYER_SPEED,
  ZONE_LEN,
  ZONES,
  gateZ,
  seeded,
  zoneCenterZ,
} from './config'

// ---- 到達できる最大ゾーン（前の学年のボスをたおすと先へ進める） ----
export function maxZoneOf(save: SaveData, worldId: WorldId): number {
  let z = 1
  while (z < 6 && save.cleared.includes(`${worldId}-${z}`)) z++
  return z
}

// プレイヤーが近くにいるときだけ子要素（HTMLラベル）を表示する。
// 3Dメッシュは霧で自然に隠れるが、HTMLラベルは霧を無視するため距離で消す。
function NearLabel({
  playerRef,
  x,
  z,
  range = 24,
  children,
}: {
  playerRef: React.RefObject<Group | null>
  x: number
  z: number
  range?: number
  children: ReactNode
}) {
  const [show, setShow] = useState(false)
  const showRef = useRef(false)
  useFrame(() => {
    const p = playerRef.current
    if (!p) return
    const near = Math.hypot(p.position.x - x, p.position.z - z) < (showRef.current ? range + 4 : range)
    if (near !== showRef.current) {
      showRef.current = near
      setShow(near)
    }
  })
  return show ? <>{children}</> : null
}

// ---- こまごました風景パーツ ----
// マイクラの木：幹ブロック＋葉っぱキューブの段づみ
function Tree({ pos, foliage, s = 1 }: { pos: [number, number]; foliage: string; s?: number }) {
  return (
    <group position={[pos[0], 0, pos[1]]} scale={s}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.34, 1.1, 0.34]} />
        <meshStandardMaterial color="#7c5a3a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry args={[1.5, 0.9, 1.5]} />
        <meshStandardMaterial color={foliage} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[0.95, 0.6, 0.95]} />
        <meshStandardMaterial color={foliage} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[0.5, 0.4, 0.5]} />
        <meshStandardMaterial color={foliage} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Rock({ pos, s = 1 }: { pos: [number, number]; s?: number }) {
  return (
    <group position={[pos[0], 0, pos[1]]} scale={s}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.8, 0.5, 0.7]} />
        <meshStandardMaterial color="#8b98a5" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.6, -0.05]}>
        <boxGeometry args={[0.45, 0.35, 0.4]} />
        <meshStandardMaterial color="#a3aeba" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Crystal({ pos, color, s = 1 }: { pos: [number, number]; color: string; s?: number }) {
  return (
    <group position={[pos[0], 0, pos[1]]} scale={s}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.4, 1.0, 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.22, 0.3, 0.22]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.28, 0.3, 0.1]}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
    </group>
  )
}

// マイクラ風の家：箱＋だんだん屋根
function House({ pos, roof }: { pos: [number, number]; roof: string }) {
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2, 1.6, 2]} />
        <meshStandardMaterial color="#f1e4c8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <boxGeometry args={[2.4, 0.4, 2.4]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[1.6, 0.4, 1.6]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.8]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.45, 1.01]}>
        <boxGeometry args={[0.5, 0.9, 0.05]} />
        <meshStandardMaterial color="#7c5a3a" />
      </mesh>
      <mesh position={[0.55, 1.0, 1.01]}>
        <boxGeometry args={[0.4, 0.4, 0.04]} />
        <meshStandardMaterial color="#7dd3fc" />
      </mesh>
    </group>
  )
}

// 学年ゾーンのあいだの門（ロック中はとおれない）
function Gate({
  grade,
  open,
  playerRef,
}: {
  grade: number
  open: boolean
  playerRef: React.RefObject<Group | null>
}) {
  const z = gateZ(grade)
  const posts: number[] = []
  for (let x = -FIELD_HALF_W; x <= FIELD_HALF_W; x += 2) {
    if (Math.abs(x) < 2.5) continue
    posts.push(x)
  }
  return (
    <group position={[0, 0, z]}>
      {posts.map((x) => (
        <mesh key={x} position={[x, 0.55, 0]}>
          <boxGeometry args={[0.22, 1.1, 0.22]} />
          <meshStandardMaterial color="#8a6a45" />
        </mesh>
      ))}
      <mesh position={[-(FIELD_HALF_W + 2.5) / 2 - 1.25, 0.85, 0]}>
        <boxGeometry args={[FIELD_HALF_W - 2.5, 0.14, 0.14]} />
        <meshStandardMaterial color="#8a6a45" />
      </mesh>
      <mesh position={[(FIELD_HALF_W + 2.5) / 2 + 1.25, 0.85, 0]}>
        <boxGeometry args={[FIELD_HALF_W - 2.5, 0.14, 0.14]} />
        <meshStandardMaterial color="#8a6a45" />
      </mesh>
      {open ? (
        // ひらいた門: 金のアーチ
        <group>
          {[-2.2, 2.2].map((x) => (
            <mesh key={x} position={[x, 1.4, 0]}>
              <boxGeometry args={[0.35, 2.8, 0.35]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[0, 2.9, 0]}>
            <boxGeometry args={[4.9, 0.4, 0.4]} />
            <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      ) : (
        // とじた門: 黒い柵
        <group>
          {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => (
            <mesh key={x} position={[x, 1.1, 0]}>
              <boxGeometry args={[0.18, 2.2, 0.18]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 1.9, 0]}>
            <boxGeometry args={[3.6, 0.25, 0.25]} />
            <meshStandardMaterial color="#334155" metalness={0.6} />
          </mesh>
          <NearLabel playerRef={playerRef} x={0} z={z} range={26}>
            <Html center position={[0, 2.8, 0]} distanceFactor={14} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fca5a5',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}
              >
                🔒 大ボスをたおすと ひらく
              </div>
            </Html>
          </NearLabel>
        </group>
      )}
    </group>
  )
}

// ゾーンの入口かんばん
function ZoneSign({ stage, playerRef }: { stage: Stage; playerRef: React.RefObject<Group | null> }) {
  const zone = ZONES[stage.id]
  const sz = -(stage.grade - 1) * ZONE_LEN - 2.5
  return (
    <group position={[-4.2, 0, sz]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 1.2, 8]} />
        <meshStandardMaterial color="#7c5a3a" />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[1.6, 0.7, 0.1]} />
        <meshStandardMaterial color="#a97e50" />
      </mesh>
      <NearLabel playerRef={playerRef} x={-4.2} z={sz} range={20}>
        <Html center position={[0, 1.15, 0.08]} distanceFactor={11} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#3b2a18' }}>
              {stage.grade}年生・{zone.name}
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#5c452c' }}>{stage.title}</div>
          </div>
        </Html>
      </NearLabel>
    </group>
  )
}

export interface SceneProps {
  worldId: WorldId
  save: SaveData
  paused: boolean
  onEncounter: (stageId: string, mode: 'practice' | 'boss') => void
  onBossContact: (stageId: string) => void // ボスに触れたら予習パネルをひらく
  onZoneChange: (grade: number) => void
}

export const PRACTICE_PER_ZONE = 3 // 各ゾーンをうろつく練習モンスターの数

export default function Scene({ worldId, save, paused, onEncounter, onBossContact, onZoneChange }: SceneProps) {
  const world = WORLD_BY_ID[worldId]
  const theme = FIELD_THEMES[worldId]
  const maxZone = maxZoneOf(save, worldId)

  const playerRef = useRef<Group>(null)
  const playerInner = useRef<Group>(null)
  const monsterRefs = useRef<Record<string, Group | null>>({})
  const keys = useRef<Set<string>>(new Set())
  const lastZone = useRef(0)
  const lastKnock = useRef(0)
  const triggered = useRef(false)
  const bornAt = useRef<number | null>(null) // フィールドに出た直後のエンカウント猶予用
  const hasMoved = useRef(false) // 動き出すまではエンカウントしない
  const camera = useThree((s) => s.camera)

  // 開始位置: いちばん進んだゾーンの入口
  const startZ = -(maxZone - 1) * ZONE_LEN - 3

  useEffect(() => {
    triggered.current = false
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault()
      keys.current.add(k)
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // モンスターのホーム位置（シード付きで毎回おなじ配置）
  const homes = useMemo(() => {
    const map: Record<string, [number, number]> = {}
    world.stages.forEach((stage, i) => {
      const rand = seeded(i * 977 + 13)
      for (let k = 0; k < PRACTICE_PER_ZONE; k++) {
        map[`${stage.id}-p${k}`] = [
          MathUtils.clamp((rand() - 0.5) * 17, -FIELD_HALF_W + 2, FIELD_HALF_W - 2),
          // ゾーン入口（スポーン地帯）と門の前をさけて配置
          MathUtils.clamp(
            zoneCenterZ(stage.grade) + (rand() - 0.5) * 9,
            gateZ(stage.grade) + 3,
            -(stage.grade - 1) * ZONE_LEN - 6,
          ),
        ]
      }
      map[`${stage.id}-b`] = [0, gateZ(stage.grade) + 2.4]
    })
    return map
  }, [world])

  // 風景の配置（シード付き）
  const deco = useMemo(() => {
    const rand = seeded(worldId.length * 7919 + 31)
    const items: { kind: 'tree' | 'rock' | 'crystal'; pos: [number, number]; s: number }[] = []
    for (let g = 1; g <= 6; g++) {
      for (let i = 0; i < 9; i++) {
        const side = rand() < 0.5 ? -1 : 1
        const x = side * (4.5 + rand() * (FIELD_HALF_W - 5.5))
        const z = -(g - 1) * ZONE_LEN - 1.5 - rand() * (ZONE_LEN - 4)
        const r = rand()
        const kind =
          theme.deco === 'forest'
            ? r < 0.75
              ? 'tree'
              : 'rock'
            : theme.deco === 'crystal'
              ? r < 0.5
                ? 'crystal'
                : 'rock'
              : theme.deco === 'magic'
                ? r < 0.6
                  ? 'crystal'
                  : 'tree'
                : r < 0.55
                  ? 'tree'
                  : 'rock'
        items.push({ kind, pos: [x, z], s: 0.7 + rand() * 0.7 })
      }
    }
    return items
  }, [worldId, theme])

  useFrame(({ clock }, rawDt) => {
    const player = playerRef.current
    if (!player) return
    const dt = Math.min(rawDt, 0.05) // フレーム落ち時のワープ防止
    const pos = player.position

    // ---- 移動入力（WASD / 矢印キー） ----
    if (!paused && !triggered.current) {
      let dx = 0
      let dz = 0
      const k = keys.current
      if (k.has('w') || k.has('arrowup')) dz -= 1
      if (k.has('s') || k.has('arrowdown')) dz += 1
      if (k.has('a') || k.has('arrowleft')) dx -= 1
      if (k.has('d') || k.has('arrowright')) dx += 1
      const len = Math.hypot(dx, dz)
      if (len > 0) {
        hasMoved.current = true
        dx /= len
        dz /= len
        pos.x += dx * PLAYER_SPEED * dt
        pos.z += dz * PLAYER_SPEED * dt
        if (playerInner.current) {
          playerInner.current.rotation.y = Math.atan2(dx, dz)
          playerInner.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 9)) * 0.12
        }
      } else if (playerInner.current) {
        playerInner.current.position.y *= 0.8
      }
      // フィールドの外＆とじた門はとおれない
      pos.x = MathUtils.clamp(pos.x, -FIELD_HALF_W + 0.8, FIELD_HALF_W - 0.8)
      pos.z = MathUtils.clamp(pos.z, gateZ(maxZone) + 1.1, -1.2)
    }

    // ---- カメラ追従（低めのアングルで奥行きを出す） ----
    const camTarget = new Vector3(pos.x * 0.6, 6.5, pos.z + 9)
    camera.position.lerp(camTarget, 1 - Math.pow(0.0001, dt))
    camera.lookAt(pos.x * 0.7, 1.4, pos.z - 6)

    // ---- いまいるゾーンをHUDへ ----
    const zone = MathUtils.clamp(Math.floor(-pos.z / ZONE_LEN) + 1, 1, 6)
    if (zone !== lastZone.current) {
      lastZone.current = zone
      onZoneChange(zone)
    }

    // ---- 衝突判定 → エンカウント ----
    if (paused || triggered.current) return
    // 戦闘から戻った直後は、プレイヤーが動き出すまで＋1.2秒間は無敵
    if (bornAt.current === null) bornAt.current = clock.elapsedTime
    if (!hasMoved.current || clock.elapsedTime - bornAt.current < 1.2) return
    for (const stage of world.stages) {
      if (stage.grade > maxZone) continue
      for (let k = 0; k < PRACTICE_PER_ZONE; k++) {
        const pm = monsterRefs.current[`${stage.id}-p${k}`]
        if (pm) {
          const d = Math.hypot(pm.position.x - pos.x, pm.position.z - pos.z)
          if (d < 1.5) {
            triggered.current = true
            onEncounter(stage.id, 'practice')
            return
          }
        }
      }
      // ボスに触れると即バトルではなく「じゅんびパネル」がひらく（予習できる）
      const bm = monsterRefs.current[`${stage.id}-b`]
      if (bm) {
        const d = Math.hypot(bm.position.x - pos.x, bm.position.z - pos.z)
        if (d < 2.6 && clock.elapsedTime - lastKnock.current > 1.2) {
          lastKnock.current = clock.elapsedTime
          pos.z += 3 // すこし はじきかえして連続発動を防ぐ
          onBossContact(stage.id)
          return
        }
      }
    }
  })

  return (
    <>
      {/* 霧を手前に寄せて、次の学年ゾーンは見えすぎないように（奥行き感） */}
      <color attach="background" args={[theme.fog]} />
      <fog attach="fog" args={[theme.fog, 15, 40]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[12, 20, -6]} intensity={1.3} />
      <hemisphereLight args={['#ffffff', theme.ground[0], 0.5]} />

      {/* 地面（学年ゾーンごとに色がかわる） */}
      {[1, 2, 3, 4, 5, 6].map((g) => (
        <mesh key={g} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zoneCenterZ(g)]}>
          <planeGeometry args={[FIELD_HALF_W * 2 + 14, ZONE_LEN]} />
          <meshStandardMaterial color={theme.ground[g % 2]} />
        </mesh>
      ))}
      {/* まんなかの道 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -ZONE_LEN * 3]}>
        <planeGeometry args={[3.4, ZONE_LEN * 6 + 4]} />
        <meshStandardMaterial color={theme.path} />
      </mesh>

      {/* 風景 */}
      {deco.map((d, i) =>
        d.kind === 'tree' ? (
          <Tree key={i} pos={d.pos} s={d.s} foliage={theme.deco === 'warm' ? '#5f8c3a' : '#3f7d44'} />
        ) : d.kind === 'rock' ? (
          <Rock key={i} pos={d.pos} s={d.s} />
        ) : (
          <Crystal key={i} pos={d.pos} s={d.s} color={theme.accent} />
        ),
      )}
      {/* 1年生ゾーンは村 */}
      <House pos={[-8, -4]} roof={theme.accent} />
      <House pos={[8.5, -7]} roof={theme.accent} />
      <House pos={[-7.5, -12]} roof={theme.accent} />

      {/* かんばん・門 */}
      {world.stages.map((stage) => (
        <ZoneSign key={stage.id} stage={stage} playerRef={playerRef} />
      ))}
      {[1, 2, 3, 4, 5].map((g) => (
        <Gate key={g} grade={g} open={save.cleared.includes(`${worldId}-${g}`)} playerRef={playerRef} />
      ))}

      {/* モンスターシンボル（各ゾーンに練習3体＋門番ボス1体） */}
      {world.stages.map((stage) => (
        <group key={stage.id}>
          {Array.from({ length: PRACTICE_PER_ZONE }, (_, k) => (
            <Monster
              key={k}
              ref={(el) => {
                monsterRefs.current[`${stage.id}-p${k}`] = el
              }}
              home={homes[`${stage.id}-p${k}`]}
              look={ZONES[stage.id].look}
              emoji={stage.enemyEmoji}
              name={stage.enemyName}
              kind="practice"
              seed={stage.grade * 131 + k * 47 + worldId.length}
              paused={paused}
              playerRef={playerRef}
              zBounds={[-(stage.grade - 1) * ZONE_LEN - 5.5, gateZ(stage.grade) + 3]}
            />
          ))}
          <Monster
            ref={(el) => {
              monsterRefs.current[`${stage.id}-b`] = el
            }}
            home={homes[`${stage.id}-b`]}
            look={ZONES[stage.id].bossLook}
            emoji={stage.bossEmoji}
            name={stage.bossName}
            kind="boss"
            cleared={save.cleared.includes(stage.id)}
            seed={stage.grade * 733 + 7}
            paused={paused}
            playerRef={playerRef}
          />
        </group>
      ))}

      {/* ゆうしゃ */}
      <group ref={playerRef} position={[0, 0, startZ]}>
        <HeroModel innerRef={playerInner} weaponId={save.equipped['ぶき']} shieldId={save.equipped['たて']} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.5, 20]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.25} />
        </mesh>
      </group>
    </>
  )
}
