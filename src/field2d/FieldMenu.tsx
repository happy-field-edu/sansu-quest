import { useGame } from '../game/store'
import { playerStats, bossBaseOf, bossRequiredFor, bossMistakeDamage, bossMistakesLeft } from '../game/logic'
import { ITEMS } from '../data/items'
import { SLOTS } from '../types'
import { STAGE_BY_ID } from '../data/worlds'
import { ZONE_NAMES } from './config2d'
import { Win, CommandList } from '../ui/Win'
import Sprite from '../pixel/Sprite'
import { heroUrl } from '../pixel/chars'
import { heroLookOf } from '../pixel/heroLook'

// ドラクエ風のメニューウィンドウ（Xキー／メニューボタンで開閉）。
// レベル・HP・そうび一覧と、「そうびで ボスの問題数が へる」しくみを見せる。
export default function FieldMenu({
  stageId,
  onClose,
  onEquip,
  onRecords,
  onWorldMap,
}: {
  stageId: string // いま いる村（ボスの必要数を 見せるため）
  onClose: () => void
  onEquip: () => void
  onRecords: () => void
  onWorldMap: () => void
}) {
  const { save } = useGame()
  const stats = playerStats(save)
  const look = heroLookOf(save) // そうびが 見た目に 出る
  const stage = STAGE_BY_ID[stageId]
  const base = bossBaseOf(stageId)
  const required = bossRequiredFor(stageId, stats.power)
  const dmg = bossMistakeDamage(stageId, stats.def, stats.maxHp, required)
  const left = bossMistakesLeft(stats.maxHp, dmg)

  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/75 p-2" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* ---- ゆうしゃの ステータス ---- */}
        <Win className="p-3">
          <div className="flex items-center justify-between border-b-2 border-white/60 pb-1">
            <span className="flex items-center gap-2 text-yellow-200">
              <Sprite url={heroUrl('down', 0, look)} size={48} />
              ゆうしゃ
            </span>
            <span className="text-sm">Lv.{stats.level}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <p>
              HP <span className="text-yellow-200">{stats.maxHp}</span>
            </p>
            <p>
              EXP {stats.into}/{stats.need}
            </p>
            <p>
              こうげき <span className="text-yellow-200">{stats.atk}</span>
            </p>
            <p>
              まもり <span className="text-yellow-200">{stats.def}</span>
            </p>
          </div>
          {/* ---- もっている コイン ---- */}
          <div className="mt-2 flex items-center justify-between border-t-2 border-white/60 pt-2">
            <span className="text-xs text-slate-300">もっている コイン</span>
            <span className="font-dot text-xl text-yellow-200">🪙 {save.coins}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            モンスターを たおすと もらえる。🏪どうぐやで そうびが かえるよ。
          </p>

          {/* ---- そうびで ボスが よわくなる しくみ ---- */}
          <div className="mt-2 border-t-2 border-white/60 pt-2">
            <p className="text-xs text-slate-300">
              ちから（レベル＋こうげき）＝
              <span className="font-dot mx-1 text-lg text-yellow-200">{stats.power}</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              いまの村「{ZONE_NAMES[stageId]}」の 大ボスは{' '}
              <span className="text-slate-400 line-through">{base}問</span>
              <span className="font-dot mx-1 text-lg text-yellow-200">→ {required}問</span>
              で たおせる！
            </p>
            {/* 大ボスの こうげき力（防具なしは 一撃で やられる） */}
            {stats.def <= 0 ? (
              <p className="mt-1 text-[11px] text-red-300">
                ⚠️ ぼうぐを つけていない！ このままでは 大ボスの こうげきを 1回 くらっただけで やられる。
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-300">
                この村の 大ボスの こうげき：HP−<span className="text-red-300">{dmg}</span>（まもり{stats.def}）→ ミスできるのは{' '}
                <span className="text-yellow-200">{left}回</span>まで
              </p>
            )}
            <p className="mt-1 text-[11px] text-emerald-300">
              つよい そうびを つけると ちからが 上がり、ボスの ひつような もんだいが もっと へるぞ！
              ぼうぐを つけると ミスできる 回数が ふえる。
            </p>
          </div>
        </Win>

        {/* ---- そうび一覧 ---- */}
        <Win className="mt-2 p-3">
          <p className="mb-1 border-b-2 border-white/60 pb-1 text-yellow-200">そうび</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {SLOTS.map((slot) => {
              const id = save.equipped[slot]
              const item = id ? ITEMS[id] : null
              return (
                <p key={slot} className={item ? '' : 'text-slate-500'}>
                  <span className="text-slate-300">{slot}：</span>
                  {item ? (
                    <>
                      {item.emoji}
                      {item.name}
                      {item.atk > 0 && <span className="ml-1 text-emerald-300">(ボス−{item.atk})</span>}
                    </>
                  ) : (
                    'なし'
                  )}
                </p>
              )
            })}
          </div>
          <p className="mt-1.5 border-t-2 border-white/60 pt-1.5 text-[11px] text-slate-300">
            もちもの {save.items.length}こ　｜　たおしたボス {save.cleared.length}／24
          </p>
        </Win>

        {/* ---- コマンド ---- */}
        <Win className="mt-2 px-2 py-1">
          <CommandList
            items={[
              { label: 'そうびを かえる', value: 'equip' },
              { label: 'きろくを 見る', value: 'records' },
              { label: 'ワールドマップへ', value: 'world' },
              { label: 'とじる（Xキー）', value: 'close' },
            ]}
            onSelect={(v) => {
              if (v === 'equip') onEquip()
              else if (v === 'records') onRecords()
              else if (v === 'world') onWorldMap()
              else onClose()
            }}
          />
        </Win>

        <p className="font-dot mt-1 text-center text-[11px] text-slate-400">
          {stage.grade}年生・{ZONE_NAMES[stageId]}／{stage.title}
        </p>
      </div>
    </div>
  )
}
