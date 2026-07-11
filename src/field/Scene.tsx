import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Group, MathUtils, Vector3 } from 'three'
import type { SaveData, Stage, WorldId } from '../types'
import { WORLD_BY_ID } from '../data/worlds'
import Monster from './Monster'
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

// ---- こまごました風景パーツ ----
function Tree({ pos, foliage, s = 1 }: { pos: [number, number]; foliage: string; s?: number }) {
  return (
    <group position={[pos[0], 0, pos[1]]} scale={s}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.14, 0.2, 1, 8]} />
        <meshStandardMaterial color="#7c5a3a" />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <coneGeometry args={[0.85, 1.5, 10]} />
        <meshStandardMaterial color={foliage} />
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <coneGeometry args={[0.55, 1.1, 10]} />
        <meshStandardMaterial color={foliage} />
      </mesh>
    </group>
  )
}

function Rock({ pos, s = 1 }: { pos: [number, number]; s?: number }) {
  return (
    <mesh position={[pos[0], 0.3 * s, pos[1]]} scale={s} rotation={[0.3, pos[0], 0.1]}>
      <dodecahedronGeometry args={[0.45]} />
      <meshStandardMaterial color="#8b98a5" roughness={0.9} />
    </mesh>
  )
}

function Crystal({ pos, color, s = 1 }: { pos: [number, number]; color: string; s?: number }) {
  return (
    <mesh position={[pos[0], 0.6 * s, pos[1]]} scale={s} rotation={[0, pos[1], 0]}>
      <octahedronGeometry args={[0.5]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.2} />
    </mesh>
  )
}

function House({ pos, roof }: { pos: [number, number]; roof: string }) {
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2, 1.6, 2]} />
        <meshStandardMaterial color="#f1e4c8" />
      </mesh>
      <mesh position={[0, 2.1, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.8, 1.2, 4]} />
        <meshStandardMaterial color={roof} />
      </mesh>
      <mesh position={[0, 0.45, 1.01]}>
        <boxGeometry args={[0.5, 0.9, 0.05]} />
        <meshStandardMaterial color="#7c5a3a" />
      </mesh>
    </group>
  )
}

// 学年ゾーンのあいだの門（ロック中はとおれない）
function Gate({ grade, open }: { grade: number; open: boolean }) {
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
        </group>
      )}
    </group>
  )
}

// ゾーンの入口かんばん
function ZoneSign({ stage }: { stage: Stage }) {
  const zone = ZONES[stage.id]
  return (
    <group position={[-4.2, 0, -(stage.grade - 1) * ZONE_LEN - 2.5]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 1.2, 8]} />
        <meshStandardMaterial color="#7c5a3a" />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[1.6, 0.7, 0.1]} />
        <meshStandardMaterial color="#a97e50" />
      </mesh>
      <Html center position={[0, 1.15, 0.08]} distanceFactor={11} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#3b2a18' }}>
            {stage.grade}年生・{zone.name}
          </div>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#5c452c' }}>{stage.title}</div>
        </div>
      </Html>
    </group>
  )
}

// ---- プレイヤー（ゆうしゃ） ----
function PlayerAvatar({ innerRef }: { innerRef: React.RefObject<Group | null> }) {
  return (
    <group ref={innerRef}>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.3, 0.38, 0.75, 12]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#ffdfba" />
      </mesh>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, 1.32, 0.28]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}
      <mesh position={[0, 1.62, 0]}>
        <coneGeometry args={[0.3, 0.45, 12]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      {/* つるぎ */}
      <group position={[0.42, 0.8, 0]} rotation={[0, 0, -0.5]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.08, 0.6, 0.02]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.22, 0.07, 0.06]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
      </group>
    </group>
  )
}

export interface SceneProps {
  worldId: WorldId
  save: SaveData
  paused: boolean
  onEncounter: (stageId: string, mode: 'practice' | 'boss') => void
  onLockedBoss: (stageId: string) => void
  onZoneChange: (grade: number) => void
}

export default function Scene({ worldId, save, paused, onEncounter, onLockedBoss, onZoneChange }: SceneProps) {
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
      map[`${stage.id}-p`] = [
        MathUtils.clamp((rand() - 0.5) * 14, -FIELD_HALF_W + 2, FIELD_HALF_W - 2),
        zoneCenterZ(stage.grade) + (rand() - 0.5) * 7,
      ]
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

    // ---- カメラ追従（ドラクエ風の見下ろし視点） ----
    const camTarget = new Vector3(pos.x * 0.6, 8.5, pos.z + 11)
    camera.position.lerp(camTarget, 1 - Math.pow(0.0001, dt))
    camera.lookAt(pos.x * 0.7, 1, pos.z - 2)

    // ---- いまいるゾーンをHUDへ ----
    const zone = MathUtils.clamp(Math.floor(-pos.z / ZONE_LEN) + 1, 1, 6)
    if (zone !== lastZone.current) {
      lastZone.current = zone
      onZoneChange(zone)
    }

    // ---- 衝突判定 → エンカウント ----
    if (paused || triggered.current) return
    for (const stage of world.stages) {
      if (stage.grade > maxZone) continue
      const pm = monsterRefs.current[`${stage.id}-p`]
      if (pm) {
        const d = Math.hypot(pm.position.x - pos.x, pm.position.z - pos.z)
        if (d < 1.5) {
          triggered.current = true
          onEncounter(stage.id, 'practice')
          return
        }
      }
      const bm = monsterRefs.current[`${stage.id}-b`]
      if (bm) {
        const d = Math.hypot(bm.position.x - pos.x, bm.position.z - pos.z)
        if (d < 2.6) {
          if (save.practiced.includes(stage.id)) {
            triggered.current = true
            onEncounter(stage.id, 'boss')
          } else if (clock.elapsedTime - lastKnock.current > 1.2) {
            // まだ練習していない → はじきかえす
            lastKnock.current = clock.elapsedTime
            pos.z += 3
            onLockedBoss(stage.id)
          }
          return
        }
      }
    }
  })

  return (
    <>
      <color attach="background" args={[theme.fog]} />
      <fog attach="fog" args={[theme.fog, 26, 62]} />
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
        <ZoneSign key={stage.id} stage={stage} />
      ))}
      {[1, 2, 3, 4, 5].map((g) => (
        <Gate key={g} grade={g} open={save.cleared.includes(`${worldId}-${g}`)} />
      ))}

      {/* モンスターシンボル */}
      {world.stages.map((stage) => (
        <group key={stage.id}>
          <Monster
            ref={(el) => {
              monsterRefs.current[`${stage.id}-p`] = el
            }}
            home={homes[`${stage.id}-p`]}
            look={ZONES[stage.id].look}
            emoji={stage.enemyEmoji}
            name={stage.enemyName}
            kind="practice"
            seed={stage.grade * 131 + worldId.length}
            paused={paused}
          />
          <Monster
            ref={(el) => {
              monsterRefs.current[`${stage.id}-b`] = el
            }}
            home={homes[`${stage.id}-b`]}
            look={ZONES[stage.id].look}
            emoji={stage.bossEmoji}
            name={stage.bossName}
            kind="boss"
            cleared={save.cleared.includes(stage.id)}
            seed={stage.grade * 733 + 7}
            paused={paused}
          />
        </group>
      ))}

      {/* ゆうしゃ */}
      <group ref={playerRef} position={[0, 0, startZ]}>
        <PlayerAvatar innerRef={playerInner} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.5, 20]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.25} />
        </mesh>
      </group>
    </>
  )
}
