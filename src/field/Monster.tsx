import { forwardRef, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Group, MathUtils, Vector3 } from 'three'
import type { MonsterLook } from './config'
import { FIELD_HALF_W, seeded } from './config'
import { BODIES, type Archetype } from './bodies'

// アーキタイプごとの頭の高さ（ボスの王冠をのせる位置）
const CROWN_Y: Partial<Record<Archetype, number>> = {
  dragon: 1.95,
  golem: 1.75,
  mage: 1.9,
  bird: 1.5,
  octopus: 1.5,
  ghost: 1.45,
  bat: 1.45,
  beast: 1.5,
  whale: 1.35,
  snake: 1.45,
  butterfly: 1.3,
  slime: 1.35,
  crab: 1.1,
  spider: 1.05,
  turtle: 1.0,
  worm: 1.05,
  snail: 1.25,
  frog: 1.1,
}

export interface MonsterProps {
  home: [number, number] // XZ平面のホーム位置
  look: MonsterLook
  emoji: string
  name: string
  kind: 'practice' | 'boss'
  cleared?: boolean
  seed: number
  paused: boolean
  playerRef: React.RefObject<Group | null> // ラベルの距離カリング用
  zBounds?: [number, number] // うろつき範囲のZ制限 [手前, 奥]（スポーン地帯に入らないように）
}

// フィールドを自律的にうろつくモンスターシンボル
const Monster = forwardRef<Group, MonsterProps>(function Monster(
  { home, look, emoji, name, kind, cleared = false, seed, paused, playerRef, zBounds },
  ref,
) {
  const inner = useRef<Group>(null)
  const root = useRef<Group | null>(null) // コールバックrefでも自分の位置を読めるように内部refを持つ
  const boss = kind === 'boss'
  const [showLabel, setShowLabel] = useState(false)
  const labelRef = useRef(false)
  const state = useMemo(() => {
    const rand = seeded(seed)
    return {
      rand,
      target: new Vector3(home[0], 0, home[1]),
      phase: rand() * Math.PI * 2,
      speed: boss ? 0 : 1.2 + rand() * 1.2, // ボスは門番なのでその場にいる
      size: boss ? 1.9 : 0.8 + rand() * 0.4, // 個体差でにぎやかに
    }
  }, [seed, home, boss])

  useFrame(({ clock }, rawDt) => {
    const g = root.current
    if (!g) return
    const dt = Math.min(rawDt, 0.05) // フレーム落ち時のワープ防止
    const t = clock.elapsedTime + state.phase

    // ぷよぷよ浮きはねアニメーション
    if (inner.current) {
      inner.current.position.y = Math.abs(Math.sin(t * (boss ? 2 : 3.2))) * (boss ? 0.35 : 0.22)
      inner.current.rotation.y = boss ? Math.sin(t * 0.8) * 0.4 : inner.current.rotation.y
    }

    // ラベルは近くにいるときだけ表示（霧の向こうの学年を見せない）
    const pp = playerRef.current
    if (pp) {
      const dp = Math.hypot(pp.position.x - g.position.x, pp.position.z - g.position.z)
      const near = dp < (labelRef.current ? 27 : 23) // ヒステリシスでちらつき防止
      if (near !== labelRef.current) {
        labelRef.current = near
        setShowLabel(near)
      }
    }

    if (paused || boss) return

    // うろつきAI: 目標地点へ歩き、近づいたら次のランダム地点へ
    const pos = g.position
    const dx = state.target.x - pos.x
    const dz = state.target.z - pos.z
    const dist = Math.hypot(dx, dz)
    if (dist < 0.3) {
      const nx = MathUtils.clamp(home[0] + (state.rand() - 0.5) * 9, -FIELD_HALF_W + 1.5, FIELD_HALF_W - 1.5)
      let nz = home[1] + (state.rand() - 0.5) * 7
      if (zBounds) nz = MathUtils.clamp(nz, zBounds[1], zBounds[0]) // 奥（負）〜手前（正）
      state.target.set(nx, 0, nz)
    } else {
      pos.x += (dx / dist) * state.speed * dt
      pos.z += (dz / dist) * state.speed * dt
      if (inner.current) inner.current.rotation.y = Math.atan2(dx, dz)
    }
  })

  return (
    <group
      ref={(el) => {
        root.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
      }}
      position={[home[0], 0, home[1]]}
      scale={state.size}
    >
      <group ref={inner}>
        <BodyByArchetype look={look} boss={boss} />
        {/* ボスは王冠つき（ブロックの冠） */}
        {boss && (
          <group position={[0, CROWN_Y[look.archetype] ?? 1.4, 0]}>
            <mesh position={[0, 0.06, 0]}>
              <boxGeometry args={[0.44, 0.14, 0.44]} />
              <meshStandardMaterial color={cleared ? '#fde047' : '#b45309'} metalness={0.6} roughness={0.3} />
            </mesh>
            {[
              [-0.15, -0.15],
              [0.15, -0.15],
              [-0.15, 0.15],
              [0.15, 0.15],
              [0, 0],
            ].map(([x, z], i) => (
              <mesh key={i} position={[x, 0.2, z]}>
                <boxGeometry args={[0.12, i === 4 ? 0.22 : 0.14, 0.12]} />
                <meshStandardMaterial color={cleared ? '#fde047' : '#b45309'} metalness={0.6} roughness={0.3} />
              </mesh>
            ))}
          </group>
        )}
        {/* 敵の顔（戦闘画面と同じ絵文字）＋単元に対応した記号。近くにいるときだけ表示 */}
        {showLabel && (
        <Html
          center
          position={[0, boss ? 2.6 : 2.0, 0]}
          distanceFactor={14}
          zIndexRange={[8, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none', textAlign: 'center' }}
        >
          {look.symbol && (
            <div
              style={{
                fontSize: 15,
                fontWeight: 900,
                color: 'white',
                textShadow: '0 1px 4px rgba(0,0,0,0.95)',
                lineHeight: 1,
              }}
            >
              {look.symbol}
            </div>
          )}
          <div style={{ fontSize: 26, lineHeight: 1.15 }}>{cleared ? '👑' : emoji}</div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'white',
              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap',
              marginTop: 2,
            }}
          >
            {boss ? `👑 ${name}` : name}
          </div>
        </Html>
        )}
      </group>
      {/* 足もとのかげ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.6, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  )
})

function BodyByArchetype({ look, boss }: { look: MonsterLook; boss: boolean }) {
  const Builder = BODIES[look.archetype]
  return <Builder color={look.color} accent={look.accent ?? look.color} boss={boss} opts={look.opts ?? []} />
}

export default Monster
