// そうび（ぶき・たて）のボクセル3Dモデル工房。
// 原点＝にぎる位置、刃は +Y 方向にのびる。勇者の手にアタッチされる。

function B({
  p,
  s,
  c,
  e,
}: {
  p: [number, number, number]
  s: [number, number, number]
  c: string
  e?: string
}) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={0.5}
        metalness={e ? 0.2 : 0.4}
        emissive={e ?? '#000000'}
        emissiveIntensity={e ? 0.6 : 0}
      />
    </mesh>
  )
}

const Grip = ({ c = '#92400e' }: { c?: string }) => <B p={[0, 0, 0]} s={[0.07, 0.24, 0.07]} c={c} />

// ---- ぶき ----
function Stick() {
  return (
    <group>
      <B p={[0, 0.24, 0]} s={[0.08, 0.7, 0.08]} c="#a16207" />
      <B p={[0, 0.62, 0]} s={[0.11, 0.11, 0.11]} c="#854d0e" />
    </group>
  )
}

// たしざんの剣：＋の形のつばがトレードマーク
function PlusSword() {
  return (
    <group>
      <Grip />
      <B p={[0, 0.2, 0]} s={[0.26, 0.08, 0.08]} c="#f59e0b" />
      <B p={[0, 0.2, 0]} s={[0.08, 0.26, 0.08]} c="#f59e0b" />
      <B p={[0, 0.52, 0]} s={[0.1, 0.55, 0.05]} c="#e2e8f0" />
      <B p={[0, 0.82, 0]} s={[0.07, 0.12, 0.05]} c="#e2e8f0" />
    </group>
  )
}

// 九九の大剣：はばひろの大剣
function GreatSword() {
  return (
    <group>
      <Grip />
      <B p={[0, 0.18, 0]} s={[0.32, 0.09, 0.09]} c="#b45309" />
      <B p={[0, 0.58, 0]} s={[0.18, 0.72, 0.06]} c="#e2e8f0" />
      <B p={[0, 0.58, 0]} s={[0.06, 0.66, 0.07]} c="#ef4444" />
      <B p={[0, 0.98, 0]} s={[0.12, 0.14, 0.06]} c="#e2e8f0" />
    </group>
  )
}

// わり算の宝刀：おの型
function DivAxe() {
  return (
    <group>
      <B p={[0, 0.3, 0]} s={[0.08, 0.85, 0.08]} c="#a16207" />
      <B p={[0.16, 0.62, 0]} s={[0.26, 0.3, 0.07]} c="#dc2626" />
      <B p={[0.3, 0.62, 0]} s={[0.06, 0.42, 0.08]} c="#e2e8f0" />
    </group>
  )
}

// 小数の魔法剣：むらさきの刃＋うかぶ小数点
function DecimalSword() {
  return (
    <group>
      <Grip c="#4c1d95" />
      <B p={[0, 0.18, 0]} s={[0.24, 0.08, 0.08]} c="#a78bfa" />
      <B p={[0, 0.52, 0]} s={[0.1, 0.55, 0.05]} c="#d946ef" e="#d946ef" />
      <B p={[0.14, 0.36, 0]} s={[0.07, 0.07, 0.07]} c="#f0abfc" e="#f0abfc" />
      <B p={[-0.14, 0.62, 0]} s={[0.07, 0.07, 0.07]} c="#f0abfc" e="#f0abfc" />
    </group>
  )
}

// 文字式の聖剣：金色にかがやく
function HolySword() {
  return (
    <group>
      <Grip c="#78350f" />
      <B p={[0, 0.2, 0]} s={[0.34, 0.09, 0.09]} c="#f59e0b" e="#f59e0b" />
      <B p={[0, 0.6, 0]} s={[0.12, 0.65, 0.06]} c="#fde047" e="#f59e0b" />
      <B p={[0, 0.6, 0]} s={[0.05, 0.58, 0.07]} c="#ffffff" />
      <B p={[0, 0.98, 0]} s={[0.09, 0.14, 0.06]} c="#fde047" e="#f59e0b" />
    </group>
  )
}

// 三角コンパスの剣：三角の刃
function TriSword() {
  return (
    <group>
      <Grip />
      <B p={[0, 0.18, 0]} s={[0.24, 0.08, 0.08]} c="#0369a1" />
      <B p={[0, 0.36, 0]} s={[0.22, 0.28, 0.05]} c="#38bdf8" />
      <B p={[0, 0.6, 0]} s={[0.15, 0.2, 0.05]} c="#38bdf8" />
      <B p={[0, 0.78, 0]} s={[0.08, 0.16, 0.05]} c="#7dd3fc" />
    </group>
  )
}

// 角度のオノ：90度のL字ヘッド
function AngleAxe() {
  return (
    <group>
      <B p={[0, 0.3, 0]} s={[0.08, 0.85, 0.08]} c="#78350f" />
      <B p={[0.14, 0.68, 0]} s={[0.28, 0.09, 0.08]} c="#f97316" />
      <B p={[0.24, 0.5, 0]} s={[0.09, 0.28, 0.08]} c="#f97316" />
      <B p={[0.05, 0.68, 0]} s={[0.07, 0.07, 0.09]} c="#fdba74" />
    </group>
  )
}

// めもりの槍：ものさしもよう
function RulerSpear() {
  return (
    <group>
      <B p={[0, 0.35, 0]} s={[0.07, 1.0, 0.07]} c="#fbbf24" />
      {[0.1, 0.3, 0.5, 0.7].map((y) => (
        <B key={y} p={[0, y, 0]} s={[0.09, 0.04, 0.09]} c="#78350f" />
      ))}
      <B p={[0, 0.92, 0]} s={[0.11, 0.16, 0.05]} c="#e2e8f0" />
      <B p={[0, 1.04, 0]} s={[0.07, 0.1, 0.05]} c="#e2e8f0" />
    </group>
  )
}

// ---- たて ----
// ぶんすうの盾：分数の横線もよう
function FracShield() {
  return (
    <group>
      <B p={[0, 0, 0]} s={[0.4, 0.52, 0.06]} c="#1d4ed8" />
      <B p={[0, 0, 0.035]} s={[0.3, 0.06, 0.03]} c="#ffffff" />
      <B p={[0, 0.14, 0.035]} s={[0.09, 0.09, 0.03]} c="#ffffff" />
      <B p={[0, -0.15, 0.035]} s={[0.09, 0.09, 0.03]} c="#ffffff" />
      <B p={[0, 0.29, 0]} s={[0.44, 0.06, 0.07]} c="#fbbf24" />
      <B p={[0, -0.29, 0]} s={[0.44, 0.06, 0.07]} c="#fbbf24" />
    </group>
  )
}

// えんばんの盾：まるい（だんだん）盾
function RoundShield() {
  return (
    <group>
      <B p={[0, 0, 0]} s={[0.42, 0.42, 0.05]} c="#06b6d4" />
      <B p={[0, 0, -0.01]} s={[0.52, 0.26, 0.05]} c="#06b6d4" />
      <B p={[0, 0, -0.01]} s={[0.26, 0.52, 0.05]} c="#06b6d4" />
      <B p={[0, 0, 0.03]} s={[0.14, 0.14, 0.04]} c="#fde047" />
    </group>
  )
}

export function WeaponModel({ itemId }: { itemId?: string }) {
  switch (itemId) {
    case 'k1':
      return <PlusSword />
    case 'k2':
      return <GreatSword />
    case 'k3':
      return <DivAxe />
    case 'k4':
      return <DecimalSword />
    case 'k6':
      return <HolySword />
    case 'z2':
      return <TriSword />
    case 'z4':
      return <AngleAxe />
    case 's3':
      return <RulerSpear />
    default:
      return <Stick /> // まだ武器がないときは ひのきのぼう
  }
}

export function ShieldModel({ itemId }: { itemId?: string }) {
  switch (itemId) {
    case 'k5':
      return <FracShield />
    case 'z3':
      return <RoundShield />
    default:
      return null
  }
}
