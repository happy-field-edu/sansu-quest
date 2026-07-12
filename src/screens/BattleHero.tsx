import { Canvas } from '@react-three/fiber'
import HiddenPaneDriver, { useHiddenPaneResizeKick } from '../field/HiddenPaneDriver'
import { HeroModel } from '../field/Hero'

// 戦闘画面にうつる3Dゆうしゃ。正解すると武器を振る（swingSignalを増やす）。
export default function BattleHero({
  weaponId,
  shieldId,
  swingSignal,
}: {
  weaponId?: string
  shieldId?: string
  swingSignal: number
}) {
  useHiddenPaneResizeKick()
  return (
    <div className="h-36 w-32">
      <Canvas camera={{ position: [0.3, 0.6, 3.0], fov: 38 }} dpr={[1, 1.75]}>
        <HiddenPaneDriver />
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 5, 4]} intensity={1.3} />
        {/* ななめ右（てきの方向）をむいて立つ */}
        <group rotation={[0, 0.85, 0]} position={[0, -0.85, 0]}>
          <HeroModel weaponId={weaponId} shieldId={shieldId} swingSignal={swingSignal} />
        </group>
      </Canvas>
    </div>
  )
}
