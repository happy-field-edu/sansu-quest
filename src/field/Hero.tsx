import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { WeaponModel, ShieldModel } from './gear'

// マイクラ風ボクセルゆうしゃ（フィールドと戦闘画面で共用）。
// weaponId / shieldId: そうび中のアイテムIDを渡すと手に3Dモデルが出る。
// swingSignal: 数値を増やすたびに右うでが武器を振りおろす。
export function HeroModel({
  innerRef,
  weaponId,
  shieldId,
  swingSignal = 0,
}: {
  innerRef?: React.RefObject<Group | null>
  weaponId?: string
  shieldId?: string
  swingSignal?: number
}) {
  const armR = useRef<Group>(null)
  const swingStart = useRef(-1)
  const lastSignal = useRef(swingSignal)

  useFrame(({ clock }) => {
    if (swingSignal !== lastSignal.current) {
      lastSignal.current = swingSignal
      swingStart.current = clock.elapsedTime
    }
    const arm = armR.current
    if (!arm) return
    if (swingStart.current >= 0) {
      const p = (clock.elapsedTime - swingStart.current) / 0.38
      if (p >= 1) {
        swingStart.current = -1
        arm.rotation.x = 0
      } else {
        // ふりかぶって → ふりおろす
        arm.rotation.x = -Math.sin(p * Math.PI) * 2.1
      }
    }
  })

  return (
    <group ref={innerRef}>
      {/* あし */}
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.19, 0]}>
          <boxGeometry args={[0.18, 0.38, 0.2]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.7} />
        </mesh>
      ))}
      {/* どう（服） */}
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.3]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.7} />
      </mesh>
      {/* ベルト */}
      <mesh position={[0, 0.41, 0]}>
        <boxGeometry args={[0.52, 0.08, 0.32]} />
        <meshStandardMaterial color="#92400e" roughness={0.7} />
      </mesh>
      {/* 左うで＋て（たてを持つ） */}
      <group position={[-0.34, 0.85, 0]}>
        <mesh position={[0, -0.23, 0]}>
          <boxGeometry args={[0.16, 0.46, 0.18]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.49, 0]}>
          <boxGeometry args={[0.16, 0.12, 0.18]} />
          <meshStandardMaterial color="#ffdfba" roughness={0.7} />
        </mesh>
        {shieldId && (
          <group position={[-0.12, -0.4, 0.06]} rotation={[0, 0.15, 0]}>
            <ShieldModel itemId={shieldId} />
          </group>
        )}
      </group>
      {/* 右うで＋て＋ぶき（かたを支点に振れる） */}
      <group ref={armR} position={[0.34, 0.85, 0]}>
        <mesh position={[0, -0.23, 0.04]}>
          <boxGeometry args={[0.16, 0.46, 0.18]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.49, 0.06]}>
          <boxGeometry args={[0.16, 0.12, 0.18]} />
          <meshStandardMaterial color="#ffdfba" roughness={0.7} />
        </mesh>
        <group position={[0.05, -0.5, 0.12]} rotation={[0, 0, -0.25]}>
          <WeaponModel itemId={weaponId} />
        </group>
      </group>
      {/* あたま */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[0.52, 0.5, 0.5]} />
        <meshStandardMaterial color="#ffdfba" roughness={0.7} />
      </mesh>
      {/* ぼうし */}
      <mesh position={[0, 1.4, -0.04]}>
        <boxGeometry args={[0.56, 0.16, 0.46]} />
        <meshStandardMaterial color="#ef4444" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.52, -0.06]}>
        <boxGeometry args={[0.34, 0.14, 0.3]} />
        <meshStandardMaterial color="#ef4444" roughness={0.7} />
      </mesh>
      {/* 目（ドット） */}
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 1.14, 0.26]}>
          <boxGeometry args={[0.09, 0.09, 0.03]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}
    </group>
  )
}
