import { useGame } from '../game/store'
import { playerStats } from '../game/logic'
import { ITEMS } from '../data/items'
import { SLOTS } from '../types'

export default function Equip({ onBack }: { onBack: () => void }) {
  const { save, dispatch } = useGame()
  const stats = playerStats(save)

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
          ◀ もどる
        </button>
        <h1 className="font-dot text-xl text-yellow-300">🎒 そうび</h1>
        <div className="w-14" />
      </div>

      {/* ステータス（そうびを変えるとリアルタイムで変わる） */}
      <div className="rounded-2xl border-2 border-indigo-500/40 bg-slate-900/80 p-4">
        <div className="flex items-center justify-around text-center">
          <div className="text-5xl">🦸</div>
          <div>
            <p className="text-xs text-slate-400">レベル</p>
            <p className="font-dot text-2xl font-bold text-cyan-300">Lv.{stats.level}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">❤️ HP</p>
            <p className="font-dot text-2xl font-bold">{stats.maxHp}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">⚔️ こうげき</p>
            <p className="font-dot text-2xl font-bold text-red-300">{stats.atk}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">🛡️ まもり</p>
            <p className="font-dot text-2xl font-bold text-emerald-300">{stats.def}</p>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 px-3 py-2 text-center text-sm">
          ちから（レベル＋こうげき）＝<span className="font-dot mx-1 text-2xl font-bold text-yellow-300">{stats.power}</span>
          <span className="text-slate-300"> → どの村でも ボスの ひつよう問題数を −{stats.power}！</span>
        </div>
      </div>

      {/* そうびスロット */}
      <h2 className="font-dot mt-5 mb-2 text-sm text-slate-300">そうびちゅう（タップではずす）</h2>
      <div className="grid grid-cols-3 gap-2">
        {SLOTS.map((slot) => {
          const itemId = save.equipped[slot]
          const item = itemId ? ITEMS[itemId] : null
          return (
            <button
              key={slot}
              disabled={!item}
              onClick={() => dispatch({ type: 'unequip', slot })}
              className={`btn-game rounded-2xl border-2 p-3 text-center ${
                item ? 'border-yellow-400/70 bg-slate-800' : 'border-dashed border-slate-700 bg-slate-900/60'
              }`}
            >
              <p className="text-xs text-slate-400">{slot}</p>
              {item ? (
                <>
                  <p className="text-2xl">{item.emoji}</p>
                  <p className="truncate text-xs font-bold">{item.name}</p>
                </>
              ) : (
                <p className="py-2 text-lg text-slate-600">−</p>
              )}
            </button>
          )
        })}
      </div>

      {/* もちもの */}
      <h2 className="font-dot mt-5 mb-2 text-sm text-slate-300">
        もちもの（{save.items.length}／24）　タップでそうびする
      </h2>
      {save.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
          ステージのモンスターをたおすと そうびが手にはいるよ！
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {save.items.map((id) => {
            const item = ITEMS[id]
            const equipped = save.equipped[item.slot] === id
            return (
              <button
                key={id}
                onClick={() => dispatch({ type: 'equip', itemId: id })}
                className={`btn-game flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${
                  equipped ? 'border-yellow-400 bg-amber-500/15' : 'border-slate-700 bg-slate-800/80'
                }`}
              >
                <span className="text-3xl">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {item.name}
                    <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">{item.slot}</span>
                    {equipped && <span className="ml-2 text-xs text-yellow-300">✔ そうびちゅう</span>}
                  </p>
                  <p className="truncate text-xs text-slate-400">{item.desc}</p>
                  <p className="mt-0.5 text-xs font-bold text-emerald-300">
                    {item.atk > 0 && `⚔️ ボス問題数 −${item.atk}　`}
                    {item.def > 0 && `🛡️ まもり ＋${item.def}　`}
                    {item.hp > 0 && `❤️ HP ＋${item.hp}`}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
