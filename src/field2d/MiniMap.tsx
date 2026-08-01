import { MAP_W, zoneRows, gradeOfRow, type WorldMap, type FieldMonster } from './map'

// 右上の ミニマップ：ひろいマップの どこに いるか、👑ボスが どこかを 見せる。
// マップ全体を 小さな ドットで えがき、ゆうしゃ＝白点滅、ボス＝金、モンスター＝赤。
export default function MiniMap({
  map,
  monsters,
  pos,
  cleared,
  worldId,
  viewW,
  viewH,
  camX,
  camY,
  tile,
}: {
  map: WorldMap
  monsters: FieldMonster[]
  pos: { x: number; y: number }
  cleared: string[]
  worldId: string
  viewW: number
  viewH: number
  camX: number
  camY: number
  tile: number
}) {
  const DOT = 2 // 1マス＝2px（マップが ひろくなったので 小さめに）
  // いま いる学年ゾーン（＋上下1行）だけを 切り出して 見せる（全体は たてに長すぎる）
  const grade = gradeOfRow(pos.y)
  const { top, bottom } = zoneRows(grade)
  const y0 = Math.max(0, top - 1)
  const y1 = bottom + 1
  const rows = y1 - y0 + 1
  const w = MAP_W * DOT
  const h = rows * DOT

  // 地形を 色分けして 見せる
  const walls: { x: number; y: number; c: string }[] = []
  for (let y = y0; y <= y1; y += 1) {
    for (let x = 0; x < MAP_W; x += 1) {
      const t = map.tiles[y]?.[x]
      if (!t) continue
      if (t === 'w') walls.push({ x, y, c: '#2b6cb0' }) // 川
      else if ('1234'.includes(t)) walls.push({ x, y, c: 'rgba(248,113,113,0.9)' }) // どうぐや
      else if ('HIJK'.includes(t)) walls.push({ x, y, c: 'rgba(255,255,255,0.75)' }) // 家
      else if (t === 'P') walls.push({ x, y, c: 'rgba(255,255,255,0.34)' }) // ひろば
      else if (t === 'L' || t === 'V' || t === 'B' || t === 'F') walls.push({ x, y, c: 'rgba(180,150,90,0.7)' })
      else if (t === 't' || t === 'r' || t === 'h') walls.push({ x, y, c: 'rgba(255,255,255,0.3)' })
      else if (t === 'f' || t === 'G') walls.push({ x, y, c: 'rgba(250,204,21,0.6)' }) // さく・もん
      else if (t === 'p') walls.push({ x, y, c: 'rgba(255,255,255,0.16)' }) // 道
    }
  }

  return (
    <div className="dq-win pointer-events-none absolute top-2 right-2 z-10 p-1">
      <div className="relative overflow-hidden" style={{ width: w, height: h, background: 'rgba(2,4,18,0.85)' }}>
        {/* 地形 */}
        {walls.map((s, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: s.x * DOT, top: (s.y - y0) * DOT, width: DOT, height: DOT, background: s.c }}
          />
        ))}
        {/* いま見えている はんい（ビューポート枠） */}
        <div
          className="absolute border border-white/60"
          style={{
            left: (camX / tile) * DOT,
            top: (camY / tile - y0) * DOT,
            width: (viewW / tile) * DOT,
            height: (viewH / tile) * DOT,
          }}
        />
        {/* モンスター（れんしゅう＝赤、ボス＝金の王冠色）※このゾーンのぶんだけ */}
        {monsters
          .filter((m) => m.y >= y0 && m.y <= y1)
          .map((m) => {
            const boss = m.kind === 'boss'
            const done = boss && cleared.includes(m.stageId)
            return (
              <div
                key={m.id}
                className={`absolute ${boss ? 'dq-cursor-blink' : ''}`}
                style={{
                  left: m.x * DOT - (boss ? 1 : 0),
                  top: (m.y - y0) * DOT - (boss ? 1 : 0),
                  width: boss ? DOT + 2 : DOT,
                  height: boss ? DOT + 2 : DOT,
                  background: boss ? (done ? '#fde047' : '#f59e0b') : 'rgba(248,113,113,0.9)',
                  borderRadius: boss ? 2 : 0,
                }}
              />
            )
          })}
        {/* ゆうしゃ（白く 点滅） */}
        <div
          className="dq-cursor-blink absolute"
          style={{ left: pos.x * DOT - 1, top: (pos.y - y0) * DOT - 1, width: DOT + 2, height: DOT + 2, background: '#ffffff', borderRadius: 2 }}
        />
      </div>
      <p className="font-dot mt-0.5 text-center text-[9px] leading-none text-slate-300">
        <span className="text-white">■</span>きみ <span className="text-amber-400">■</span>ボス{' '}
        <span className="text-red-400">■</span>てき
      </p>
      <p className="font-dot text-center text-[9px] leading-none text-slate-500">
        {grade}年 {worldId}
      </p>
    </div>
  )
}
