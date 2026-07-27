import { useEffect, useState } from 'react'
import type { Item } from '../types'
import { useGame } from '../game/store'
import { playerStats, bossRequiredFor } from '../game/logic'
import { ITEMS } from '../data/items'
import { shopStock, isUpgrade } from '../data/shop'
import { sfx } from '../game/sound'
import { ZONE_NAMES } from '../field2d/config2d'
import { Win, CommandList, Typewriter } from '../ui/Win'

type Step = 'list' | 'confirm' | 'result'

// ドラクエ風の どうぐや。ひらがな・カタカナ中心で、
// 「かう」「やめる」の 2つだけで かいものが できる。
export default function Shop({ stageId, grade, onClose }: { stageId: string; grade: number; onClose: () => void }) {
  const { save, dispatch } = useGame()
  const stats = playerStats(save)
  const stock = shopStock(grade, stageId)

  const [step, setStep] = useState<Step>('list')
  const [cursorId, setCursorId] = useState(stock[0]?.id ?? '')
  const [target, setTarget] = useState<Item | null>(null) // かおうと している そうび
  const [result, setResult] = useState<string[]>([]) // かったあとの メッセージ

  const shown = ITEMS[cursorId] ?? stock[0]
  const owned = (id: string) => save.items.includes(id)

  // Escキー・Xキーで とじる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'x') {
        e.preventDefault()
        e.stopPropagation()
        if (step === 'list') onClose()
        else {
          setStep('list')
          setTarget(null)
        }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [step, onClose])

  // そのそうびを かったら ステータスが どうなるか（さきに 見せてあげる）
  const preview = (item: Item) => {
    const cur = save.equipped[item.slot] ? ITEMS[save.equipped[item.slot]!] : undefined
    const willEquip = isUpgrade(item, cur)
    const eq = { ...save.equipped }
    if (willEquip) eq[item.slot] = item.id
    const after = playerStats({ ...save, items: [...save.items, item.id], equipped: eq })
    return {
      cur,
      willEquip,
      after,
      bossNow: bossRequiredFor(stageId, stats.power),
      bossAfter: bossRequiredFor(stageId, after.power),
    }
  }

  // 「かう」を えらんだとき
  const buy = (item: Item) => {
    if (owned(item.id)) return
    if (save.coins < item.price) {
      sfx.nope()
      setResult([
        `ごめんね、コインが ${item.price - save.coins}まい たりないんだ。`,
        'モンスターを たおすと コインが もらえるよ。\nまた 来てね！',
      ])
      setStep('result')
      return
    }
    const p = preview(item)
    dispatch({ type: 'buy-item', itemId: item.id, price: item.price })
    sfx.buy()
    setResult([
      `${item.emoji}「${item.name}」を かった！`,
      p.willEquip
        ? `${item.emoji}${item.name}を そうびした！\n${statLine(item)}`
        : `もちものに いれたよ。\n（メニューの「そうびを かえる」で つけられる）`,
      ...(p.willEquip && p.bossAfter < p.bossNow
        ? [`つよくなった！ この村の 大ボスは\n${p.bossNow}問 → ${p.bossAfter}問 で たおせるように なった！`]
        : []),
      ...(p.willEquip && item.def > 0 && stats.def <= 0
        ? ['これで まもりが ついた！\n大ボスの こうげきで 1回で やられなく なったよ。']
        : []),
    ])
    setStep('result')
  }

  const p = shown ? preview(shown) : null
  const canAfford = shown ? save.coins >= shown.price : false

  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/75 p-2">
      <div className="w-full max-w-md">
        {/* ---- おみせの ひと ---- */}
        <Win className="p-3">
          <p className="mb-1 text-xs text-yellow-200">🧙‍♀️ どうぐやの おねえさん</p>
          <p className="min-h-[2.6rem] text-sm leading-relaxed">
            {step === 'result' ? (
              <span className="whitespace-pre-line">{result.join('\n')}</span>
            ) : step === 'confirm' && target ? (
              <Typewriter
                key={`c${target.id}`}
                text={`${target.emoji}「${target.name}」は 🪙${target.price}コイン。\nかいますか？`}
                speed={18}
              />
            ) : (
              <Typewriter key="hello" text={`いらっしゃい！ ここは ${ZONE_NAMES[stageId]}の どうぐや。\nどれに する？`} speed={18} />
            )}
          </p>
        </Win>

        {/* ---- もっている コイン ---- */}
        <Win className="mt-2 flex items-center justify-between px-3 py-1.5 text-sm">
          <span className="text-slate-300">もっている コイン</span>
          <span className="font-dot text-xl text-yellow-200">🪙 {save.coins}</span>
        </Win>

        {step === 'list' && (
          <>
            {/* ---- しなもの ---- */}
            <Win className="mt-2 px-2 py-1">
              <p className="mb-1 border-b-2 border-white/60 px-1 pb-1 text-xs text-yellow-200">しなもの</p>
              <CommandList
                items={[
                  ...stock.map((it) => ({
                    label: `${it.emoji}${it.name}`,
                    value: it.id,
                    note: owned(it.id) ? 'もっている' : `🪙${it.price}`,
                    disabled: owned(it.id),
                  })),
                  { label: 'やめる', value: '__close' },
                ]}
                onCursor={(v) => {
                  if (v !== '__close') setCursorId(v)
                }}
                onSelect={(v) => {
                  if (v === '__close') {
                    onClose()
                    return
                  }
                  const it = ITEMS[v]
                  if (!it || owned(it.id)) return
                  setTarget(it)
                  setStep('confirm')
                }}
              />
            </Win>

            {/* ---- せつめい（カーソルの そうび） ---- */}
            {shown && p && (
              <Win className="mt-2 p-3 text-xs leading-relaxed">
                <p className="text-yellow-200">
                  {shown.emoji}
                  {shown.name}
                  <span className="ml-1 text-slate-300">（{shown.slot}）</span>
                </p>
                <p className="mt-1 text-emerald-300">{statLine(shown)}</p>
                <p className="mt-1 text-slate-300">{shown.desc}</p>
                <p className="mt-1 border-t-2 border-white/60 pt-1 text-slate-300">
                  いまの {shown.slot}：{p.cur ? `${p.cur.emoji}${p.cur.name}` : 'なし'}
                  {p.willEquip ? <span className="ml-1 text-emerald-300">→ かうと つよくなる！</span> : <span className="ml-1 text-slate-400">（いまの ほうが つよい）</span>}
                </p>
                {p.willEquip && p.bossAfter < p.bossNow && (
                  <p className="mt-1 text-emerald-300">
                    ⚔️ この村の 大ボス：{p.bossNow}問 → <span className="text-yellow-200">{p.bossAfter}問</span> に へる！
                  </p>
                )}
                {owned(shown.id) ? (
                  <p className="mt-1 text-slate-400">もう もっているよ。</p>
                ) : canAfford ? (
                  <p className="mt-1 text-yellow-200">🪙{shown.price} — かえるよ！</p>
                ) : (
                  <p className="mt-1 text-amber-300">🪙{shown.price} — あと {shown.price - save.coins}まい たりないよ</p>
                )}
              </Win>
            )}
            <p className="font-dot mt-1 text-center text-[11px] text-slate-400">
              ↑↓で えらんで Enter／タップ　｜　Xキーで とじる
            </p>
          </>
        )}

        {/* ---- かう？ やめる？ ---- */}
        {step === 'confirm' && target && (
          <>
            <Win className="mt-2 p-3 text-xs leading-relaxed">
              <p className="text-emerald-300">{statLine(target)}</p>
              {save.coins >= target.price ? (
                <p className="mt-1 text-slate-300">
                  もっている コイン 🪙{save.coins} → かうと 🪙{save.coins - target.price}
                </p>
              ) : (
                <p className="mt-1 text-amber-300">
                  コインが あと {target.price - save.coins}まい たりないよ（もっている 🪙{save.coins}）
                </p>
              )}
            </Win>
            <Win className="mt-2 px-2 py-1">
              <CommandList
                items={[
                  { label: 'かう', value: 'yes' },
                  { label: 'やめる', value: 'no' },
                ]}
                onSelect={(v) => {
                  if (v === 'yes') buy(target)
                  else {
                    setTarget(null)
                    setStep('list')
                  }
                }}
              />
            </Win>
          </>
        )}

        {/* ---- かったあと ---- */}
        {step === 'result' && (
          <Win className="mt-2 px-2 py-1">
            <CommandList
              items={[
                { label: 'まだ かいものを する', value: 'more' },
                { label: 'おみせを 出る', value: 'close' },
              ]}
              onSelect={(v) => {
                setTarget(null)
                setResult([])
                if (v === 'more') setStep('list')
                else onClose()
              }}
            />
          </Win>
        )}
      </div>
    </div>
  )
}

// そうびの こうかを 1行で（子どもにも わかる ことばで）
function statLine(i: Item): string {
  const parts: string[] = []
  if (i.atk > 0) parts.push(`⚔️ ボスの もんだい −${i.atk}問`)
  if (i.def > 0) parts.push(`🛡️ まもり ＋${i.def}`)
  if (i.hp > 0) parts.push(`❤️ HP ＋${i.hp}`)
  return parts.join('　')
}
