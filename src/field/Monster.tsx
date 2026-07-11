import { forwardRef, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Group, MathUtils, Vector3 } from 'three'
import type { MonsterLook } from './config'
import { FIELD_HALF_W, seeded } from './config'

// モンスターの体（単元に対応した記号・図形の形）
function Body({ look, boss }: { look: MonsterLook; boss: boolean }) {
  const color = boss ? '#facc15' : look.color
  switch (look.body) {
    case 'box':
      return (
        <mesh castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      )
    case 'cone':
      return (
        <mesh castShadow position={[0, 0.65, 0]}>
          <coneGeometry args={[0.7, 1.2, 24]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      )
    case 'sphere':
      return (
        <mesh castShadow position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.65, 24, 24]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      )
    case 'crystal':
      return (
        <mesh castShadow position={[0, 0.75, 0]}>
          <octahedronGeometry args={[0.7]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
        </mesh>
      )
    case 'torus':
      return (
        <mesh castShadow position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.22, 16, 32]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      )
    case 'cylinder':
      return (
        <mesh castShadow position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 1, 24]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      )
    default: // blob（スライム風）
      return (
        <mesh castShadow position={[0, 0.5, 0]} scale={[1, 0.85, 1]}>
          <sphereGeometry args={[0.7, 24, 24]} />
          <meshStandardMaterial color={color} roughness={0.35} />
        </mesh>
      )
  }
}

// 白目＋黒目でかわいくする
function Eyes({ y }: { y: number }) {
  return (
    <group position={[0, y, 0.52]}>
      {[-0.22, 0.22].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, 0, 0.09]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}
    </group>
  )
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
}

// フィールドを自律的にうろつくモンスターシンボル
const Monster = forwardRef<Group, MonsterProps>(function Monster(
  { home, look, emoji, name, kind, cleared = false, seed, paused },
  ref,
) {
  const inner = useRef<Group>(null)
  const boss = kind === 'boss'
  const state = useMemo(() => {
    const rand = seeded(seed)
    return {
      rand,
      target: new Vector3(home[0], 0, home[1]),
      phase: rand() * Math.PI * 2,
      speed: boss ? 0 : 1.2 + rand() * 1.2, // ボスは門番なのでその場にいる
    }
  }, [seed, home, boss])

  useFrame(({ clock }, rawDt) => {
    const g = (ref as React.RefObject<Group | null>).current
    if (!g) return
    const dt = Math.min(rawDt, 0.05) // フレーム落ち時のワープ防止
    const t = clock.elapsedTime + state.phase

    // ぷよぷよ浮きはねアニメーション
    if (inner.current) {
      inner.current.position.y = Math.abs(Math.sin(t * (boss ? 2 : 3.2))) * (boss ? 0.35 : 0.22)
      inner.current.rotation.y = boss ? Math.sin(t * 0.8) * 0.4 : inner.current.rotation.y
    }

    if (paused || boss) return

    // うろつきAI: 目標地点へ歩き、近づいたら次のランダム地点へ
    const pos = g.position
    const dx = state.target.x - pos.x
    const dz = state.target.z - pos.z
    const dist = Math.hypot(dx, dz)
    if (dist < 0.3) {
      const nx = MathUtils.clamp(home[0] + (state.rand() - 0.5) * 9, -FIELD_HALF_W + 1.5, FIELD_HALF_W - 1.5)
      const nz = home[1] + (state.rand() - 0.5) * 7
      state.target.set(nx, 0, nz)
    } else {
      pos.x += (dx / dist) * state.speed * dt
      pos.z += (dz / dist) * state.speed * dt
      if (inner.current) inner.current.rotation.y = Math.atan2(dx, dz)
    }
  })

  const scale = boss ? 1.9 : 1
  return (
    <group ref={ref} position={[home[0], 0, home[1]]} scale={scale}>
      <group ref={inner}>
        <Body look={look} boss={boss} />
        <Eyes y={look.body === 'crystal' ? 0.85 : 0.7} />
        {/* ボスは王冠つき */}
        {boss && (
          <mesh castShadow position={[0, look.body === 'crystal' ? 1.6 : 1.35, 0]}>
            <coneGeometry args={[0.3, 0.4, 6]} />
            <meshStandardMaterial color={cleared ? '#fde047' : '#b45309'} metalness={0.6} roughness={0.3} />
          </mesh>
        )}
        {/* 敵の顔（戦闘画面と同じ絵文字）＋単元に対応した記号 */}
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
      </group>
      {/* 足もとのかげ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.6, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  )
})

export default Monster
