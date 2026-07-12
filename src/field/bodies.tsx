import { useRef, type ReactElement, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'

// マインクラフト風：すべて「箱」だけで組み立てるボクセルモンスター工房。
// 各ビルダーは高さ 0.9〜1.6 くらいで作る（Monster側で全体スケールがかかる）。

export type Archetype =
  | 'slime'
  | 'snail'
  | 'worm'
  | 'snake'
  | 'bat'
  | 'beast'
  | 'frog'
  | 'bird'
  | 'ghost'
  | 'golem'
  | 'crab'
  | 'octopus'
  | 'turtle'
  | 'whale'
  | 'butterfly'
  | 'mage'
  | 'dragon'
  | 'spider'

export interface BodyProps {
  color: string
  accent: string
  boss: boolean
  opts: string[]
}

// ---- 基本ブロック ----
function B({
  p,
  s,
  c,
  e,
  o,
  r,
}: {
  p: [number, number, number]
  s: [number, number, number]
  c: string
  e?: string // 発光色
  o?: number // 不透明度
  r?: [number, number, number]
}) {
  return (
    <mesh position={p} rotation={r ?? [0, 0, 0]}>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={0.7}
        emissive={e ?? '#000000'}
        emissiveIntensity={e ? 0.55 : 0}
        transparent={o !== undefined}
        opacity={o ?? 1}
      />
    </mesh>
  )
}

// ドット絵風の目（白ブロック＋黒ピクセル）。angry でまゆげ
export function Eyes({
  y = 0.7,
  z = 0.45,
  spread = 0.2,
  size = 0.13,
  angry = false,
}: {
  y?: number
  z?: number
  spread?: number
  size?: number
  angry?: boolean
}) {
  return (
    <group position={[0, y, z]}>
      {[-spread, spread].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <B p={[0, 0, 0]} s={[size, size, 0.05]} c="#ffffff" />
          <B p={[0, -size * 0.1, 0.035]} s={[size * 0.55, size * 0.55, 0.05]} c="#1e293b" />
          {angry && (
            <B p={[x < 0 ? size * 0.15 : -size * 0.15, size * 0.85, 0.02]} s={[size * 1.4, size * 0.4, 0.05]} c="#1e293b" r={[0, 0, x < 0 ? -0.45 : 0.45]} />
          )}
        </group>
      ))}
    </group>
  )
}

// はばたき・ゆらゆら用ラッパー
function Flap({
  amp = 0.45,
  speed = 6,
  phase = 0,
  base = 0.25,
  mirror = false,
  position,
  children,
}: {
  amp?: number
  speed?: number
  phase?: number
  base?: number
  mirror?: boolean
  position: [number, number, number]
  children: ReactNode
}) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const v = base + Math.sin(clock.elapsedTime * speed + phase) * amp
      ref.current.rotation.z = mirror ? -v : v
    }
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

// カクカクの羽（板ブロック2まいの階段シルエット）
function BlockWing({ c, size = 0.7, mirror = false }: { c: string; size?: number; mirror?: boolean }) {
  const m = mirror ? -1 : 1
  return (
    <group>
      <B p={[m * size * 0.35, 0, 0]} s={[size * 0.7, size * 0.55, 0.08]} c={c} />
      <B p={[m * size * 0.75, size * 0.12, 0]} s={[size * 0.45, size * 0.35, 0.08]} c={c} />
    </group>
  )
}

// ---- ビルダーたち ----

function Slime({ color, boss }: BodyProps) {
  return (
    <group>
      <B p={[0, 0.3, 0]} s={[1.0, 0.55, 0.95]} c={color} />
      <B p={[0, 0.72, 0]} s={[0.78, 0.35, 0.74]} c={color} />
      <B p={[0, 0.97, 0]} s={[0.4, 0.18, 0.38]} c={color} />
      <B p={[0, 1.12, 0]} s={[0.16, 0.16, 0.16]} c={color} />
      <Eyes y={0.55} z={0.5} spread={0.24} angry={boss} />
    </group>
  )
}

function Snail({ color, accent, boss }: BodyProps) {
  return (
    <group>
      <B p={[0, 0.22, 0.2]} s={[0.62, 0.4, 1.05]} c={color} />
      {/* から */}
      <B p={[0, 0.75, -0.22]} s={[0.6, 0.66, 0.66]} c={accent} />
      <B p={[0, 0.75, -0.22]} s={[0.68, 0.3, 0.3]} c={color} />
      {/* つの */}
      {[-0.16, 0.16].map((x) => (
        <group key={x}>
          <B p={[x, 0.66, 0.62]} s={[0.07, 0.32, 0.07]} c={color} />
          <B p={[x, 0.86, 0.62]} s={[0.12, 0.12, 0.12]} c={color} />
        </group>
      ))}
      <Eyes y={0.42} z={0.73} spread={0.16} size={0.1} angry={boss} />
    </group>
  )
}

// いもむし・へび共用のからだアニメーション（箱の列）
function Segments({
  count,
  gap,
  size,
  color,
  slither,
}: {
  count: number
  gap: number
  size: number
  color: string
  slither: boolean
}) {
  const refs = useRef<(Group | null)[]>([])
  useFrame(({ clock }) => {
    refs.current.forEach((g, i) => {
      if (!g) return
      const t = clock.elapsedTime * 4 + i * 0.9
      if (slither) g.position.x = Math.sin(t) * 0.1
      else g.position.y = Math.abs(Math.sin(t)) * 0.1
    })
  })
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const s = size * (1 - i * 0.14)
        return (
          <group
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            position={[0, 0, gap * i]}
          >
            <B p={[0, s * 0.7, 0]} s={[s, s, s]} c={color} />
          </group>
        )
      })}
    </>
  )
}

function Worm({ color, boss }: BodyProps) {
  return (
    <group position={[0, 0, -0.35]}>
      <B p={[0, 0.42, 0.18]} s={[0.62, 0.62, 0.55]} c={color} />
      {[-0.16, 0.16].map((x) => (
        <group key={x}>
          <B p={[x, 0.85, 0.18]} s={[0.06, 0.24, 0.06]} c={color} />
          <B p={[x, 1.0, 0.18]} s={[0.11, 0.11, 0.11]} c={color} />
        </group>
      ))}
      <Segments count={3} gap={-0.48} size={0.55} color={color} slither={false} />
      <Eyes y={0.5} z={0.47} spread={0.17} size={0.11} angry={boss} />
    </group>
  )
}

function Snake({ color, accent, boss, opts }: BodyProps) {
  const hood = opts.includes('hood')
  return (
    <group position={[0, 0, -0.4]}>
      <B p={[0, 0.95, 0.3]} s={[0.44, 0.42, 0.5]} c={color} />
      {hood && <B p={[0, 0.95, 0.12]} s={[0.85, 0.6, 0.14]} c={accent} />}
      {/* した */}
      <B p={[0, 0.85, 0.62]} s={[0.06, 0.04, 0.2]} c="#ef4444" />
      <B p={[0, 0.5, 0.28]} s={[0.34, 0.5, 0.34]} c={color} />
      <Segments count={3} gap={-0.42} size={0.44} color={color} slither />
      <Eyes y={1.0} z={0.56} spread={0.13} size={0.1} angry={boss} />
    </group>
  )
}

function Bat({ color, accent, boss, opts }: BodyProps) {
  const bee = opts.includes('bee')
  return (
    <group position={[0, 0.35, 0]}>
      <B p={[0, 0.5, 0]} s={bee ? [0.6, 0.55, 0.85] : [0.66, 0.66, 0.6]} c={color} />
      {bee ? (
        <>
          {[0.05, -0.25].map((z) => (
            <B key={z} p={[0, 0.5, z]} s={[0.62, 0.57, 0.14]} c="#1e293b" />
          ))}
          <B p={[0, 0.5, -0.5]} s={[0.1, 0.1, 0.18]} c="#1e293b" />
        </>
      ) : (
        <>
          {/* みみ ＋ きば */}
          {[-0.2, 0.2].map((x) => (
            <B key={x} p={[x, 0.92, 0]} s={[0.14, 0.24, 0.1]} c={color} />
          ))}
          {[-0.12, 0.12].map((x) => (
            <B key={x} p={[x, 0.28, 0.28]} s={[0.07, 0.12, 0.06]} c="#ffffff" />
          ))}
        </>
      )}
      <Flap position={[0.33, 0.6, 0]} speed={bee ? 14 : 8} amp={0.5}>
        <BlockWing c={bee ? '#e0f2fe' : accent} size={bee ? 0.5 : 0.72} />
      </Flap>
      <Flap position={[-0.33, 0.6, 0]} speed={bee ? 14 : 8} amp={0.5} mirror>
        <BlockWing c={bee ? '#e0f2fe' : accent} size={bee ? 0.5 : 0.72} mirror />
      </Flap>
      <Eyes y={0.58} z={bee ? 0.44 : 0.31} spread={0.17} size={0.12} angry={boss} />
    </group>
  )
}

function Beast({ color, accent, boss, opts }: BodyProps) {
  const point = opts.includes('pointears')
  const horn = opts.includes('horn')
  const trunk = opts.includes('trunk')
  const snout = opts.includes('longsnout')
  const bigtail = opts.includes('bigtail')
  return (
    <group>
      {/* どう */}
      <B p={[0, 0.55, -0.12]} s={[0.72, 0.6, 1.1]} c={color} />
      {/* あたま */}
      <B p={[0, 0.98, 0.42]} s={[0.58, 0.52, 0.52]} c={color} />
      {/* みみ */}
      {[-0.19, 0.19].map((x) =>
        point ? (
          <B key={x} p={[x, 1.36, 0.42]} s={[0.14, 0.26, 0.1]} c={color} />
        ) : (
          <B key={x} p={[x, 1.3, 0.42]} s={[0.18, 0.16, 0.1]} c={color} />
        ),
      )}
      {trunk && (
        <>
          <B p={[0, 0.78, 0.74]} s={[0.18, 0.3, 0.16]} c={color} />
          <B p={[0, 0.56, 0.8]} s={[0.16, 0.24, 0.14]} c={color} />
        </>
      )}
      {horn && <B p={[0, 1.16, 0.72]} s={[0.12, 0.26, 0.12]} c={accent} />}
      {snout && <B p={[0, 0.85, 0.78]} s={[0.34, 0.22, 0.5]} c={color} />}
      {/* あし */}
      {[
        [-0.24, 0.22],
        [0.24, 0.22],
        [-0.24, -0.46],
        [0.24, -0.46],
      ].map(([x, z], i) => (
        <B key={i} p={[x, 0.16, z]} s={[0.2, 0.34, 0.2]} c={color} />
      ))}
      {/* しっぽ */}
      {bigtail ? (
        <>
          <B p={[0, 0.75, -0.78]} s={[0.34, 0.7, 0.3]} c={accent} />
          <B p={[0, 1.15, -0.78]} s={[0.26, 0.2, 0.24]} c={accent} />
        </>
      ) : (
        <B p={[0, 0.72, -0.76]} s={[0.14, 0.14, 0.34]} c={color} />
      )}
      <Eyes y={1.04} z={0.69} spread={0.15} size={0.11} angry={boss} />
    </group>
  )
}

function Frog({ color, boss }: BodyProps) {
  return (
    <group>
      <B p={[0, 0.4, 0]} s={[1.0, 0.6, 0.9]} c={color} />
      {/* とびでた目 */}
      {[-0.28, 0.28].map((x) => (
        <group key={x} position={[x, 0.82, 0.16]}>
          <B p={[0, 0, 0]} s={[0.26, 0.26, 0.26]} c="#ffffff" />
          <B p={[0, 0, 0.12]} s={[0.12, 0.12, 0.08]} c="#1e293b" />
          {boss && <B p={[x < 0 ? 0.04 : -0.04, 0.18, 0.08]} s={[0.28, 0.08, 0.06]} c="#1e293b" r={[0, 0, x < 0 ? -0.4 : 0.4]} />}
        </group>
      ))}
      {/* まえあし */}
      {[-0.34, 0.34].map((x) => (
        <B key={x} p={[x, 0.12, 0.32]} s={[0.24, 0.16, 0.34]} c={color} />
      ))}
      {/* くち */}
      <B p={[0, 0.34, 0.46]} s={[0.4, 0.05, 0.05]} c="#1e293b" />
    </group>
  )
}

function Bird({ color, accent, boss, opts }: BodyProps) {
  const fan = opts.includes('fan')
  return (
    <group>
      <B p={[0, 0.6, 0]} s={[0.68, 0.85, 0.62]} c={color} />
      {/* おなか */}
      <B p={[0, 0.5, 0.28]} s={[0.46, 0.55, 0.12]} c={accent} />
      {/* くちばし */}
      <B p={[0, 0.72, 0.42]} s={[0.16, 0.12, 0.24]} c="#f59e0b" />
      {/* つばさ */}
      <Flap position={[0.36, 0.72, 0]} speed={5} amp={0.3} base={0.4}>
        <BlockWing c={color} size={0.55} />
      </Flap>
      <Flap position={[-0.36, 0.72, 0]} speed={5} amp={0.3} base={0.4} mirror>
        <BlockWing c={color} size={0.55} mirror />
      </Flap>
      {/* おうぎのしっぽ（クジャク） */}
      {fan &&
        [-0.44, -0.22, 0, 0.22, 0.44].map((x, i) => (
          <B key={x} p={[x, 1.1 + (i === 2 ? 0.16 : i === 1 || i === 3 ? 0.08 : 0), -0.34]} s={[0.18, 0.7, 0.1]} c={accent} />
        ))}
      {/* あし */}
      {[-0.16, 0.16].map((x) => (
        <B key={x} p={[x, 0.1, 0.04]} s={[0.12, 0.2, 0.12]} c="#f59e0b" />
      ))}
      <Eyes y={0.88} z={0.32} spread={0.18} size={0.12} angry={boss} />
    </group>
  )
}

function Ghost({ color, boss }: BodyProps) {
  return (
    <group position={[0, 0.25, 0]}>
      <B p={[0, 0.72, 0]} s={[0.8, 0.75, 0.7]} c={color} o={0.88} />
      {/* ぎざぎざの すそ */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <B key={x} p={[x, i % 2 === 0 ? 0.28 : 0.2, 0]} s={[0.2, i % 2 === 0 ? 0.24 : 0.4, 0.66]} c={color} o={0.88} />
      ))}
      {/* おばけの手 */}
      {[-0.52, 0.52].map((x) => (
        <B key={x} p={[x, 0.72, 0.08]} s={[0.22, 0.34, 0.22]} c={color} o={0.88} />
      ))}
      <Eyes y={0.82} z={0.37} spread={0.19} size={0.12} angry={boss} />
      {/* くち */}
      <B p={[0, 0.52, 0.36]} s={[0.14, 0.18, 0.05]} c="#1e293b" />
    </group>
  )
}

function Golem({ color, accent, boss, opts }: BodyProps) {
  const mini = opts.includes('mini')
  const s = mini ? 0.72 : 1
  return (
    <group scale={s}>
      <B p={[0, 0.55, 0]} s={[0.85, 0.7, 0.6]} c={color} />
      <B p={[0, 1.15, 0]} s={[0.6, 0.5, 0.55]} c={color} />
      {/* ひかる目 */}
      {[-0.15, 0.15].map((x) => (
        <B key={x} p={[x, 1.18, 0.29]} s={[0.13, boss ? 0.09 : 0.13, 0.05]} c={accent} e={accent} />
      ))}
      {opts.includes('antenna') && (
        <group position={[0, 1.5, 0]}>
          <B p={[0, 0.08, 0]} s={[0.05, 0.18, 0.05]} c="#94a3b8" />
          <B p={[0, 0.22, 0]} s={[0.11, 0.11, 0.11]} c={accent} e={accent} />
        </group>
      )}
      <Flap position={[0.55, 0.75, 0]} speed={2.4} amp={0.15} base={0.1}>
        <B p={[0.05, -0.3, 0]} s={[0.22, 0.55, 0.25]} c={color} />
      </Flap>
      <Flap position={[-0.55, 0.75, 0]} speed={2.4} amp={0.15} base={0.1} mirror>
        <B p={[-0.05, -0.3, 0]} s={[0.22, 0.55, 0.25]} c={color} />
      </Flap>
      {[-0.25, 0.25].map((x) => (
        <B key={x} p={[x, 0.1, 0]} s={[0.26, 0.2, 0.35]} c={color} />
      ))}
    </group>
  )
}

function Crab({ color, boss, opts }: BodyProps) {
  const sting = opts.includes('sting')
  const big = opts.includes('bigclaw')
  const cs = big ? 1.35 : 1
  return (
    <group>
      <B p={[0, 0.4, 0]} s={[1.05, 0.5, 0.8]} c={color} />
      {/* ハサミ */}
      {[-1, 1].map((sx) => (
        <Flap key={sx} position={[sx * 0.6, 0.45, 0.25]} speed={3} amp={0.12} base={sx * 0.15} mirror={sx < 0}>
          <B p={[sx * 0.1, 0, 0.1]} s={[0.3 * cs, 0.3 * cs, 0.3 * cs]} c={color} />
          <B p={[sx * 0.16, 0.12, 0.3]} s={[0.12 * cs, 0.14 * cs, 0.24 * cs]} c={color} />
          <B p={[sx * 0.04, -0.02, 0.3]} s={[0.12 * cs, 0.1 * cs, 0.24 * cs]} c={color} />
        </Flap>
      ))}
      {/* あし（カクカクのL字） */}
      {[0.14, -0.12].map((z) =>
        [-1, 1].map((sx) => (
          <group key={`${z}${sx}`}>
            <B p={[sx * 0.6, 0.32, z]} s={[0.28, 0.08, 0.08]} c={color} />
            <B p={[sx * 0.74, 0.16, z]} s={[0.08, 0.28, 0.08]} c={color} />
          </group>
        )),
      )}
      {/* サソリのどくばり */}
      {sting && (
        <group>
          <B p={[0, 0.62, -0.48]} s={[0.22, 0.22, 0.22]} c={color} />
          <B p={[0, 0.86, -0.6]} s={[0.18, 0.26, 0.18]} c={color} />
          <B p={[0, 1.1, -0.52]} s={[0.14, 0.24, 0.14]} c={color} />
          <B p={[0, 1.28, -0.44]} s={[0.1, 0.18, 0.1]} c="#1e293b" />
        </group>
      )}
      {/* めだま（つきでた） */}
      {[-0.2, 0.2].map((x) => (
        <group key={x} position={[x, 0.75, 0.28]}>
          <B p={[0, -0.1, 0]} s={[0.07, 0.2, 0.07]} c={color} />
          <B p={[0, 0.04, 0]} s={[0.16, 0.16, 0.16]} c="#ffffff" />
          <B p={[0, 0.02, 0.08]} s={[0.08, 0.08, 0.05]} c="#1e293b" />
          {boss && <B p={[x < 0 ? 0.03 : -0.03, 0.16, 0.04]} s={[0.18, 0.06, 0.04]} c="#1e293b" r={[0, 0, x < 0 ? -0.4 : 0.4]} />}
        </group>
      ))}
    </group>
  )
}

function Octopus({ color, boss }: BodyProps) {
  return (
    <group>
      <B p={[0, 0.8, 0]} s={[0.85, 0.75, 0.8]} c={color} />
      <B p={[0, 1.24, 0]} s={[0.6, 0.16, 0.56]} c={color} />
      {/* あし8ほん（L字ブロック） */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        const x = Math.cos(a) * 0.34
        const z = Math.sin(a) * 0.3
        return (
          <Flap key={i} position={[x, 0.4, z]} speed={3} amp={0.15} phase={i} base={0}>
            <B p={[x * 0.5, -0.14, z * 0.5]} s={[0.13, 0.3, 0.13]} c={color} />
            <B p={[x * 0.9, -0.32, z * 0.9]} s={[0.13, 0.16, 0.13]} c={color} />
          </Flap>
        )
      })}
      {/* くち */}
      <B p={[0, 0.62, 0.42]} s={[0.12, 0.12, 0.05]} c="#1e293b" />
      <Eyes y={0.9} z={0.41} spread={0.22} size={0.13} angry={boss} />
    </group>
  )
}

function Turtle({ color, accent, boss }: BodyProps) {
  return (
    <group>
      {/* こうら（だんだん） */}
      <B p={[0, 0.42, 0]} s={[0.95, 0.3, 1.05]} c={color} />
      <B p={[0, 0.62, 0]} s={[0.7, 0.24, 0.8]} c={accent} />
      <B p={[0, 0.78, 0]} s={[0.4, 0.14, 0.5]} c={accent} />
      {/* あたま */}
      <B p={[0, 0.45, 0.68]} s={[0.36, 0.34, 0.34]} c={color} />
      {/* ひれあし */}
      {[
        [-0.52, 0.32],
        [0.52, 0.32],
        [-0.52, -0.38],
        [0.52, -0.38],
      ].map(([x, z], i) => (
        <B key={i} p={[x, 0.18, z]} s={[0.3, 0.14, 0.3]} c={color} />
      ))}
      <Eyes y={0.52} z={0.86} spread={0.1} size={0.08} angry={boss} />
    </group>
  )
}

function Whale({ color, accent, boss }: BodyProps) {
  return (
    <group>
      <B p={[0, 0.62, 0.1]} s={[1.0, 0.8, 1.3]} c={color} />
      <B p={[0, 0.5, 0.72]} s={[0.8, 0.5, 0.2]} c={color} />
      {/* おなか */}
      <B p={[0, 0.32, 0.3]} s={[0.84, 0.24, 1.0]} c={accent} />
      {/* しっぽ */}
      <Flap position={[0, 0.7, -0.75]} speed={2.5} amp={0.18} base={0}>
        <B p={[0, 0, -0.15]} s={[0.24, 0.16, 0.3]} c={color} />
        {[-0.28, 0.28].map((x) => (
          <B key={x} p={[x, 0.05, -0.3]} s={[0.36, 0.12, 0.3]} c={color} />
        ))}
      </Flap>
      {/* しおふき */}
      <B p={[0, 1.12, 0.3]} s={[0.1, 0.22, 0.1]} c="#bae6fd" />
      <Eyes y={0.72} z={0.83} spread={0.26} size={0.1} angry={boss} />
    </group>
  )
}

function Butterfly({ color, accent, boss }: BodyProps) {
  return (
    <group position={[0, 0.45, 0]}>
      <B p={[0, 0.5, 0]} s={[0.2, 0.7, 0.24]} c={color} />
      <B p={[0, 0.95, 0]} s={[0.26, 0.26, 0.26]} c={color} />
      {[-0.09, 0.09].map((x) => (
        <B key={x} p={[x * 1.6, 1.16, 0]} s={[0.05, 0.18, 0.05]} c={color} r={[0, 0, x * 4]} />
      ))}
      {/* 左右たいしょうの羽 */}
      <Flap position={[0.12, 0.7, 0]} speed={4.5} amp={0.5} base={0.35}>
        <BlockWing c={accent} size={0.7} />
        <group position={[0, -0.42, 0]} scale={0.6}>
          <BlockWing c={accent} size={0.7} />
        </group>
      </Flap>
      <Flap position={[-0.12, 0.7, 0]} speed={4.5} amp={0.5} base={0.35} mirror>
        <BlockWing c={accent} size={0.7} mirror />
        <group position={[0, -0.42, 0]} scale={0.6}>
          <BlockWing c={accent} size={0.7} mirror />
        </group>
      </Flap>
      <Eyes y={0.98} z={0.14} spread={0.08} size={0.07} angry={boss} />
    </group>
  )
}

function Mage({ color, accent, boss, opts }: BodyProps) {
  const tophat = opts.includes('tophat')
  return (
    <group>
      {/* ローブ（だんだん） */}
      <B p={[0, 0.3, 0]} s={[0.8, 0.6, 0.7]} c={color} />
      <B p={[0, 0.75, 0]} s={[0.55, 0.4, 0.5]} c={color} />
      {/* あたま */}
      <B p={[0, 1.1, 0]} s={[0.44, 0.4, 0.42]} c="#fcd9b8" />
      {/* ぼうし */}
      {tophat ? (
        <group position={[0, 1.34, 0]}>
          <B p={[0, 0.06, 0]} s={[0.62, 0.08, 0.6]} c="#1e293b" />
          <B p={[0, 0.32, 0]} s={[0.4, 0.44, 0.38]} c="#1e293b" />
          <B p={[0, 0.14, 0]} s={[0.42, 0.12, 0.4]} c={accent} />
        </group>
      ) : (
        <group position={[0, 1.32, 0]}>
          <B p={[0, 0.03, 0]} s={[0.7, 0.08, 0.66]} c={color} />
          <B p={[0, 0.2, 0]} s={[0.42, 0.28, 0.4]} c={color} />
          <B p={[0, 0.44, 0]} s={[0.24, 0.22, 0.22]} c={color} />
        </group>
      )}
      {/* つえ（ひかる玉つき） */}
      <group position={[0.5, 0.6, 0.12]}>
        <B p={[0, 0, 0]} s={[0.08, 1.05, 0.08]} c="#8a6a45" />
        <B p={[0, 0.6, 0]} s={[0.2, 0.2, 0.2]} c={accent} e={accent} />
      </group>
      <Eyes y={1.12} z={0.22} spread={0.11} size={0.09} angry={boss} />
    </group>
  )
}

function Dragon({ color, accent, boss, opts }: BodyProps) {
  const wings = !opts.includes('nowings')
  return (
    <group>
      {/* どう */}
      <B p={[0, 0.6, 0]} s={[0.8, 0.95, 0.7]} c={color} />
      {/* おなか */}
      <B p={[0, 0.55, 0.32]} s={[0.5, 0.7, 0.12]} c={accent} />
      {/* あたま＋くち */}
      <B p={[0, 1.28, 0.12]} s={[0.58, 0.5, 0.5]} c={color} />
      <B p={[0, 1.16, 0.48]} s={[0.4, 0.22, 0.3]} c={color} />
      {[-0.09, 0.09].map((x) => (
        <B key={x} p={[x, 1.22, 0.64]} s={[0.06, 0.06, 0.05]} c="#1e293b" />
      ))}
      {/* ツノ */}
      {[-0.18, 0.18].map((x) => (
        <group key={x}>
          <B p={[x, 1.6, 0.02]} s={[0.12, 0.2, 0.12]} c="#fef3c7" />
          <B p={[x, 1.74, -0.02]} s={[0.09, 0.14, 0.09]} c="#fef3c7" />
        </group>
      ))}
      {/* せなかのトゲ */}
      {[1.0, 0.66, 0.32].map((y, i) => (
        <B key={y} p={[0, y, -0.4 - i * 0.04]} s={[0.12, 0.2, 0.14]} c={accent} />
      ))}
      {/* つばさ */}
      {wings && (
        <>
          <Flap position={[0.42, 0.95, -0.18]} speed={4} amp={0.3} base={0.5}>
            <BlockWing c={accent} size={0.85} />
          </Flap>
          <Flap position={[-0.42, 0.95, -0.18]} speed={4} amp={0.3} base={0.5} mirror>
            <BlockWing c={accent} size={0.85} mirror />
          </Flap>
        </>
      )}
      {/* しっぽ */}
      <B p={[0, 0.28, -0.52]} s={[0.24, 0.24, 0.4]} c={color} />
      <B p={[0, 0.36, -0.82]} s={[0.16, 0.16, 0.3]} c={color} />
      <B p={[0, 0.44, -1.02]} s={[0.12, 0.18, 0.12]} c={accent} />
      {/* あし */}
      {[-0.26, 0.26].map((x) => (
        <B key={x} p={[x, 0.1, 0.08]} s={[0.28, 0.24, 0.32]} c={color} />
      ))}
      <Eyes y={1.38} z={0.38} spread={0.16} size={0.11} angry={boss} />
    </group>
  )
}

function Spider({ color, accent, boss }: BodyProps) {
  return (
    <group>
      <B p={[0, 0.58, -0.14]} s={[0.7, 0.6, 0.7]} c={color} />
      {/* もよう */}
      <B p={[0, 0.9, -0.14]} s={[0.3, 0.08, 0.3]} c={accent} />
      {/* あたま */}
      <B p={[0, 0.45, 0.36]} s={[0.44, 0.4, 0.36]} c={color} />
      {/* あし8ほん（L字ブロック） */}
      {[0.26, 0.06, -0.16, -0.36].map((z) =>
        [-1, 1].map((sx) => (
          <group key={`${z}${sx}`}>
            <B p={[sx * 0.52, 0.62, z]} s={[0.34, 0.07, 0.07]} c={color} />
            <B p={[sx * 0.72, 0.36, z]} s={[0.07, 0.5, 0.07]} c={color} />
          </group>
        )),
      )}
      {/* めが4つ */}
      {[-0.14, -0.05, 0.05, 0.14].map((x, i) => (
        <B
          key={x}
          p={[x, 0.5 + (i === 1 || i === 2 ? 0.08 : 0), 0.55]}
          s={i === 1 || i === 2 ? [0.09, 0.09, 0.04] : [0.06, 0.06, 0.04]}
          c={boss ? '#ef4444' : '#1e293b'}
          e={boss ? '#ef4444' : undefined}
        />
      ))}
    </group>
  )
}

export const BODIES: Record<Archetype, (p: BodyProps) => ReactElement> = {
  slime: Slime,
  snail: Snail,
  worm: Worm,
  snake: Snake,
  bat: Bat,
  beast: Beast,
  frog: Frog,
  bird: Bird,
  ghost: Ghost,
  golem: Golem,
  crab: Crab,
  octopus: Octopus,
  turtle: Turtle,
  whale: Whale,
  butterfly: Butterfly,
  mage: Mage,
  dragon: Dragon,
  spider: Spider,
}
