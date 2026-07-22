import { useState } from 'react'
import { useGame } from '../game/store'
import { playerStats } from '../game/logic'
import { WORLDS } from '../data/worlds'
import Records from './Records'
import SoundToggle from '../components/SoundToggle'
import { Win, CommandList, Typewriter } from '../ui/Win'
import type { WorldId } from '../types'

// ドラクエ風のワールド選択：「どこへ ゆく？」コマンドウィンドウ
export default function WorldSelect({
  onSelectWorld,
  onEquip,
  onTitle,
}: {
  onSelectWorld: (id: WorldId) => void
  onEquip: () => void
  onTitle: () => void
}) {
  const { save } = useGame()
  const stats = playerStats(save)
  const [showRecords, setShowRecords] = useState(false)

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-black p-3">
      {showRecords && <Records onClose={() => setShowRecords(false)} />}

      {/* ゆうしゃのステータス */}
      <Win className="w-full max-w-md px-4 py-2 text-sm leading-relaxed">
        <div className="flex items-center justify-between">
          <span className="text-yellow-200">ゆうしゃ</span>
          <span>Lv.{stats.level}</span>
          <span>HP {stats.maxHp}</span>
          <span>
            EXP {stats.into}/{stats.need}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-300">
          こうげき {stats.atk}　まもり {stats.def}　ちから <span className="text-yellow-200">{stats.power}</span>
          （ボスの ひつよう問題数を −{stats.power}）
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">※大ボスは 村が おくに いくほど、ワールドによっても つよくなる</p>
      </Win>

      {/* どこへゆく？ */}
      <Win className="w-full max-w-md p-4">
        <p className="mb-2 text-base">
          <Typewriter text="ゆうしゃよ、どこへ ゆくのじゃ？" speed={22} />
        </p>
        <div className="border-t-2 border-white/60 pt-2">
          <CommandList
            items={[
              ...WORLDS.map((w) => ({
                label: `${w.emoji} ${w.name}`,
                value: w.id,
                note: `👑${w.stages.filter((s) => save.cleared.includes(s.id)).length}/6`,
              })),
              { label: '🎒 そうびを ととのえる', value: '_equip' },
              { label: '📊 きろくを 見る', value: '_records' },
              { label: '🏠 タイトルへ もどる', value: '_title' },
            ]}
            onSelect={(v) => {
              if (v === '_equip') onEquip()
              else if (v === '_records') setShowRecords(true)
              else if (v === '_title') onTitle()
              else onSelectWorld(v as WorldId)
            }}
          />
        </div>
      </Win>

      <div className="flex w-full max-w-md items-center justify-between">
        <p className="font-dot text-xs text-slate-400">1年生→6年生へ。まえの学年の 大ボスを たおすと 先へ すすめる</p>
        <SoundToggle />
      </div>
    </div>
  )
}
