import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/store'
import {
  playerStats,
  levelFromExp,
  bossRequiredFor,
  bossMistakeDamage,
  bossMistakesLeft,
  PRACTICE_HP,
  EXP_CORRECT,
  EXP_PRACTICE_CLEAR,
  EXP_BOSS_CLEAR,
  COIN_CORRECT,
  coinClearBonus,
} from '../game/logic'
import { STAGE_BY_ID } from '../data/worlds'
import { ITEMS } from '../data/items'
import { genProblem, genBossProblem } from '../data/generators'
import MemoPad from '../components/MemoPad'
import Sprite from '../pixel/Sprite'
import { monsterUrl, monsterDots } from '../pixel/monsters'
import { heroUrl } from '../pixel/chars'
import { heroLookOf } from '../pixel/heroLook'
import { PIX_THEME } from '../pixel/theme'
import { sfx } from '../game/sound'
import { Win, CommandList, Typewriter } from '../ui/Win'
import type { Item, Problem } from '../types'

type Phase = 'intro' | 'fight' | 'win' | 'lose'

// ドラクエ風フロントビュー戦闘：敵が中央に大きく、下にステータス＋コマンド＋問題。
export default function Battle({
  stageId,
  mode,
  onExit,
  onBoss,
}: {
  stageId: string
  mode: 'practice' | 'boss'
  onExit: () => void
  onBoss: () => void
}) {
  const { save, dispatch } = useGame()
  const stage = STAGE_BY_ID[stageId]
  const isBoss = mode === 'boss'
  const battleTheme = PIX_THEME[stage.worldId]
  const look = heroLookOf(save) // そうびを ゆうしゃの 見た目に 反映
  const enemyName = isBoss ? stage.bossName : stage.enemyName

  const [startStats] = useState(() => playerStats(save))
  // ボス戦は とちゅうで やめても つづきから（オートセーブ）。
  // 前回の記録が このボスのものなら 引きつぐ。
  const saved = isBoss && save.bossProgress?.stageId === stageId ? save.bossProgress : null
  const target = isBoss ? (saved?.target ?? bossRequiredFor(stageId, startStats.power)) : PRACTICE_HP

  // ミスしたときの ダメージ。大ボスは 村が おくに いくほど 強く、
  // 防具（まもり）が 0 なら 一撃で やられる。
  const missDamage = isBoss
    ? bossMistakeDamage(stageId, startStats.def, startStats.maxHp, target)
    : startStats.mistakeDamage
  const oneShot = isBoss && startStats.def <= 0 // 防具なし＝一撃死

  const nextProblem = () => (isBoss ? genBossProblem(stageId) : genProblem(stageId, save.skillStats))
  const [hp, setHp] = useState(saved?.hp ?? startStats.maxHp)
  const [progress, setProgress] = useState(saved?.answered ?? 0)
  const [resumed] = useState(Boolean(saved))
  const [problem, setProblem] = useState<Problem>(nextProblem)
  const [phase, setPhase] = useState<Phase>('intro')
  const [selected, setSelected] = useState<number | null>(null)
  const [fx, setFx] = useState<'none' | 'hit' | 'miss'>('none')
  const [msg, setMsg] = useState(
    saved
      ? `${enemyName}との たたかいの つづきだ！（あと ${target - (saved.answered ?? 0)}問）`
      : `${enemyName}（${stage.title}）が あらわれた！`,
  )
  const [memoOpen, setMemoOpen] = useState(false)
  const [numInput, setNumInput] = useState('') // テンキーの入力

  // こたえが ただの数（整数・小数）なら テンキーで直接入力するモード
  const correctAnswer = problem.choices[problem.answer]
  const numericMode = /^[0-9]+(\.[0-9]+)?$/.test(correctAnswer)
  const [endMsgs, setEndMsgs] = useState<string[]>([])
  const [endIdx, setEndIdx] = useState(0)
  const expRef = useRef(0)
  const [expShown, setExpShown] = useState(0)
  // コイン：1問 せいかいするたび たまる（まけても せいかいぶんは もらえる）
  const coinRef = useRef(0)
  const [coinShown, setCoinShown] = useState(0)

  const remaining = target - progress

  // あらわれた！のあと、たたかいへ
  const introDone = () => {
    window.setTimeout(() => {
      setPhase((p) => {
        if (p === 'intro') {
          setMsg(
            isBoss
              ? oneShot
                ? `ぜんぶで ${target}問！\n⚠️ぼうぐが ないと 1回でも ミスすると やられる！`
                : `ぜんぶで ${target}問！ ミスは HP−${missDamage}。あと ${bossMistakesLeft(hp, missDamage)}回まで！`
              : 'こたえを えらんで こうげきだ！',
          )
          return 'fight'
        }
        return p
      })
    }, 600)
  }

  function finish(won: boolean) {
    const clearBonus = won ? (isBoss ? EXP_BOSS_CLEAR : EXP_PRACTICE_CLEAR) : 0
    const totalExp = expRef.current + clearBonus
    // コイン：せいかいぶん ＋ たおしたときの ボーナス
    const totalCoins = coinRef.current + (won ? coinClearBonus(stageId, isBoss) : 0)
    const levelBefore = levelFromExp(save.exp).level
    const levelAfter = levelFromExp(save.exp + totalExp).level
    // 大ボスに はじめて かつと、その村の そうびが ごほうびで もらえる
    let drop: Item | null = null
    if (won) {
      if (isBoss && !save.cleared.includes(stageId)) drop = ITEMS[stage.itemId]
      dispatch({ type: isBoss ? 'boss-clear' : 'practice-clear', stageId, exp: totalExp, coins: totalCoins })
    } else {
      dispatch({ type: 'gain-exp', amount: totalExp, coins: totalCoins })
    }
    // たたかいが おわったら とちゅう記録は けす
    if (isBoss) dispatch({ type: 'boss-progress', progress: null })
    const msgs = won
      ? [
          `${enemyName} を たおした！`,
          `けいけんち ${totalExp} かくとく！`,
          `🪙 コインを ${totalCoins}まい てにいれた！`,
          ...(drop ? [`そうび「${drop.emoji}${drop.name}」を てにいれた！`] : []),
          ...(levelAfter > levelBefore ? [`ゆうしゃは レベル${levelAfter}に あがった！`] : []),
          ...(won && isBoss ? [stage.grade < 6 ? `${stage.grade + 1}年生への もんが ひらいた！` : 'このワールドを せいはした！'] : []),
        ]
      : [
          `ゆうしゃは たおれてしまった…`,
          `でも けいけんち ${totalExp} と 🪙コイン ${totalCoins}まいは もらえた！`,
          `🏪どうぐやで そうびを ととのえて もういちど！`,
        ]
    setEndMsgs(msgs)
    setEndIdx(0)
    setPhase(won ? 'win' : 'lose')
    if (won) {
      if (levelAfter > levelBefore) sfx.levelup()
      else sfx.victory()
      if (drop) sfx.drop()
      else window.setTimeout(() => sfx.coin(), 260)
    }
  }

  // 正誤が きまったあとの 共通処理（4択・テンキー共用）
  function resolve(correct: boolean, reveal?: string) {
    setFx(correct ? 'hit' : 'miss')
    if (problem.skillId) dispatch({ type: 'record-skill', stageId, skillId: problem.skillId, correct })
    const goNext = () => {
      setProblem(nextProblem())
      setSelected(null)
      setNumInput('')
      setFx('none')
    }
    if (correct) {
      sfx.correct()
      setMsg(`せいかい！ ${enemyName}に こうげき！`)
      expRef.current += EXP_CORRECT
      setExpShown(expRef.current)
      coinRef.current += COIN_CORRECT
      setCoinShown(coinRef.current)
      const next = progress + 1
      window.setTimeout(() => {
        setProgress(next)
        if (next >= target) finish(true)
        else {
          // ボス戦は 1問ごとに とちゅう記録を のこす（長いので 中断できる）
          if (isBoss) dispatch({ type: 'boss-progress', progress: { stageId, answered: next, target, hp } })
          goNext()
        }
      }, 650)
    } else {
      sfx.wrong()
      setMsg(
        reveal
          ? `ミス！ こたえは「${reveal}」。${missDamage}の ダメージ！`
          : `ミス！ ゆうしゃは ${missDamage}の ダメージ！`,
      )
      const newHp = hp - missDamage
      window.setTimeout(() => {
        setHp(newHp)
        if (newHp <= 0) finish(false)
        else {
          if (isBoss) dispatch({ type: 'boss-progress', progress: { stageId, answered: progress, target, hp: newHp } })
          goNext()
        }
      }, 1100)
    }
  }

  function answer(i: number) {
    if (selected !== null || phase !== 'fight') return
    setSelected(i)
    resolve(i === problem.answer)
  }

  // テンキー入力
  function pressKey(k: string) {
    if (selected !== null || phase !== 'fight') return
    if (k === 'del') setNumInput((s) => s.slice(0, -1))
    else if (k === 'clear') setNumInput('')
    else if (k === '.') setNumInput((s) => (s === '' || s.includes('.') || s.length >= 6 ? s : s + '.'))
    else setNumInput((s) => (s.length >= 6 ? s : s + k))
  }

  function submitNum() {
    if (selected !== null || phase !== 'fight' || numInput === '' || numInput === '.') return
    setSelected(-1) // 入力をロック
    const correct = Number(numInput) === Number(correctAnswer)
    resolve(correct, correct ? undefined : correctAnswer)
  }

  function flee() {
    // にげても、せいかいした ぶんの けいけんち と コインは もらえる
    if (expRef.current > 0 || coinRef.current > 0)
      dispatch({ type: 'gain-exp', amount: expRef.current, coins: coinRef.current })
    onExit()
  }

  // パソコンの数字キーでも テンキー入力できる（OSキーボードは出さない）
  useEffect(() => {
    if (phase !== 'fight' || !numericMode) return
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault()
        pressKey(e.key)
      } else if (e.key === '.') {
        e.preventDefault()
        pressKey('.')
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        pressKey('del')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        submitNum()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // 勝敗メッセージを 1つずつ すすめる
  const endMsgDone = () => {
    window.setTimeout(() => setEndIdx((i) => i + 1), 550)
  }
  const endTextDone = endIdx >= endMsgs.length

  return (
    <div className={`fixed inset-0 flex flex-col items-center bg-black ${fx === 'miss' ? 'anim-shake-hard' : ''}`}>
      {/* ミスのとき 画面を あかく つつむ */}
      {fx === 'miss' && (
        <div
          className="anim-hurt-flash pointer-events-none fixed inset-0 z-50"
          style={{ boxShadow: 'inset 0 0 120px 40px rgba(220,38,38,0.9)' }}
        />
      )}
      <div className="flex h-full w-full max-w-[520px] flex-col overflow-y-auto p-2">
        {/* ---- 敵エリア（フロントビュー） ---- */}
        <div
          className={`dq-frame relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#050510] ${
            fx === 'miss' ? 'anim-shake-hard' : ''
          }`}
          /* ゆうしゃと モンスターが きちんと 入る 高さを かくほ する */
          style={{ minHeight: isBoss ? 300 : 260 }}
        >
          {/* 戦闘背景：よぞらと 地面（ワールドの 色に あわせる） */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{ background: `radial-gradient(circle at 50% 35%, ${battleTheme.grass[1]} 0%, #05050f 72%)` }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: '28%',
              background: `linear-gradient(${battleTheme.grass[1]} 0 3px, ${battleTheme.grass[0]} 3px)`,
              opacity: 0.55,
            }}
          />
          {/* ---- ゆうしゃ（そうびが 見た目に 出る） ----
              せいかいで ふみこんで 切りつけ、ミスで のけぞる */}
          <Sprite
            url={heroUrl('right', fx === 'hit' ? 1 : 0, look)}
            size={96}
            className={`absolute bottom-1 left-1 z-20 ${
              fx === 'hit' ? 'anim-hero-lunge' : fx === 'miss' ? 'anim-hero-hurt' : ''
            }`}
            style={{ filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,0.55))' }}
          />
          <p className="font-dot z-10 text-sm text-slate-300">
            {isBoss ? '👑 大ボスせん' : '⚔️ たたかい'}　EXP＋{expShown}　<span className="text-yellow-200">🪙＋{coinShown}</span>
            {resumed && <span className="ml-2 text-yellow-200">▶つづきから</span>}
          </p>
          <div className="relative z-10 my-1 ml-16">
            {/* モンスター本体（せいかいで 白く点滅しながら のけぞる） */}
            <Sprite
              url={monsterUrl(stageId, isBoss)}
              size={monsterDots(isBoss) * 7}
              className={`inline-block ${fx === 'hit' ? 'anim-damaged' : 'anim-floaty'}`}
              style={{ filter: 'drop-shadow(3px 5px 0 rgba(0,0,0,0.5))' }}
            />
            {/* 斬撃エフェクト */}
            {fx === 'hit' && (
              <>
                <div className="anim-flashfx pointer-events-none absolute inset-0 rounded-full bg-white" />
                {/* 1本目の 斬撃 */}
                <div
                  className="anim-slash-line pointer-events-none absolute top-1/2 left-1/2 h-2.5 w-48 rounded-full bg-gradient-to-r from-transparent via-white to-transparent"
                  style={{ ['--slash-rot' as string]: '-35deg', filter: 'drop-shadow(0 0 8px #fff)' }}
                />
                {/* 2本目（すこし おくれて 反対むき） */}
                <div
                  className="anim-slash-line pointer-events-none absolute top-1/2 left-1/2 h-2 w-40 rounded-full bg-gradient-to-r from-transparent via-yellow-200 to-transparent"
                  style={{ ['--slash-rot' as string]: '28deg', animationDelay: '0.1s', filter: 'drop-shadow(0 0 8px #fde047)' }}
                />
                {/* きらめき */}
                <div
                  className="anim-slash-burst pointer-events-none absolute top-1/2 left-1/2 h-24 w-24"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(253,224,71,0.5) 35%, transparent 70%)',
                  }}
                />
                {/* ダメージ表示 */}
                <div className="anim-popup pointer-events-none absolute -top-2 left-1/2 text-2xl">💥</div>
              </>
            )}
            {/* ミスのとき ゆうしゃが ダメージ */}
            {fx === 'miss' && (
              <div className="anim-popup font-dot pointer-events-none absolute -top-2 left-1/2 text-xl whitespace-nowrap text-red-400">
                −{missDamage}
              </div>
            )}
          </div>
          {/* のこり問題ゲージ */}
          <div className="z-10 ml-16 w-1/2">
            <div className="h-2.5 overflow-hidden rounded-full border border-white/50 bg-slate-900">
              <div
                className={`h-full transition-all duration-500 ${isBoss ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${(remaining / target) * 100}%` }}
              />
            </div>
            <p className="font-dot mt-0.5 text-center text-xs text-yellow-200">あと {remaining} 問</p>
          </div>
        </div>

        {/* ---- メッセージウィンドウ ---- */}
        <Win className="mt-2 min-h-[3.4rem] px-3 py-2 text-base leading-relaxed">
          {phase === 'intro' ? (
            <Typewriter text={msg} onDone={introDone} />
          ) : phase === 'fight' ? (
            <Typewriter key={msg} text={msg} speed={16} />
          ) : endIdx < endMsgs.length ? (
            <Typewriter key={endIdx} text={endMsgs[endIdx]} onDone={endMsgDone} />
          ) : (
            <span className="whitespace-pre-line">{endMsgs[endMsgs.length - 1]}</span>
          )}
        </Win>

        {/* ---- もんだい＋こたえ ---- */}
        {phase === 'fight' && (
          <>
            <Win className="mt-2 px-3 py-2">
              {problem.skill && <p className="mb-1 text-xs text-cyan-300">🎯 めあて：{problem.skill}</p>}
              <p className="text-lg leading-relaxed whitespace-pre-line">{problem.text}</p>
            </Win>
            {numericMode ? (
              /* インゲーム・テンキー（OSのキーボードは ひらかない） */
              <div className="mt-2" style={{ touchAction: 'manipulation' }}>
                <div
                  className={`dq-win min-h-[3.2rem] px-4 py-2 text-right font-dot text-3xl ${
                    selected !== null ? (fx === 'hit' ? 'bg-emerald-800' : 'bg-red-900') : ''
                  }`}
                >
                  {numInput !== '' ? numInput : <span className="text-base opacity-40">こたえを いれてね</span>}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'del'].map((k) => (
                    <button
                      key={k}
                      onClick={() => pressKey(k)}
                      disabled={selected !== null}
                      className="dq-win font-dot py-3 text-2xl text-white active:translate-y-0.5 active:bg-slate-700 disabled:text-slate-600"
                    >
                      {k === 'del' ? '⌫' : k}
                    </button>
                  ))}
                </div>
                <button
                  onClick={submitNum}
                  disabled={selected !== null || numInput === ''}
                  className="dq-win font-dot mt-2 w-full py-3 text-2xl text-yellow-200 active:translate-y-0.5 active:bg-slate-700 disabled:text-slate-600"
                >
                  ▶ けってい
                </button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {problem.choices.map((c, i) => {
                  let cls = 'text-white hover:text-yellow-200'
                  if (selected !== null) {
                    if (i === problem.answer) cls = 'bg-emerald-700 text-white'
                    else if (i === selected) cls = 'bg-red-800 text-white'
                    else cls = 'text-slate-500'
                  }
                  return (
                    <button key={i} onClick={() => answer(i)} disabled={selected !== null} className={`dq-win font-dot px-2 py-2.5 text-lg ${cls}`}>
                      {c}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ---- けいさんメモ（どうぐ） ---- */}
        {phase === 'fight' && memoOpen && <MemoPad resetKey={problem} />}

        {/* ---- ステータス＋コマンド ---- */}
        {(phase === 'fight' || phase === 'intro') && (
          <div className="mt-2 flex gap-2">
            <Win className="flex-1 px-3 py-2 text-sm leading-relaxed">
              <p className="text-yellow-200">ゆうしゃ　Lv.{startStats.level}</p>
              <p>
                HP {Math.max(0, hp)}／{startStats.maxHp}
              </p>
              <div className="mt-1 h-2 overflow-hidden rounded-full border border-white/50 bg-slate-900">
                <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${(Math.max(0, hp) / startStats.maxHp) * 100}%` }} />
              </div>
              {/* 大ボス戦：あと何回 ミスできるか（0なら つぎのミスで やられる） */}
              {isBoss && (
                <p className="mt-1 text-xs">
                  {oneShot ? (
                    <span className="dq-cursor-blink text-red-400">⚠️ ぼうぐなし！1ミスで やられる</span>
                  ) : bossMistakesLeft(hp, missDamage) === 0 ? (
                    <span className="dq-cursor-blink text-red-400">⚠️ あとがない！つぎ ミスしたら やられる</span>
                  ) : (
                    <span className="text-slate-300">
                      ミス−{missDamage}／あと{' '}
                      <span className="text-yellow-200">{bossMistakesLeft(hp, missDamage)}</span> 回まで
                    </span>
                  )}
                </p>
              )}
            </Win>
            <Win className="w-40 px-2 py-1">
              <CommandList
                active={phase === 'fight' && !numericMode}
                items={[
                  { label: 'たたかう', value: 'fight' },
                  { label: 'どうぐ（メモ）', value: 'memo', note: memoOpen ? '▲' : '▼' },
                  { label: 'にげる', value: 'flee' },
                ]}
                onSelect={(v) => {
                  if (v === 'memo') setMemoOpen((o) => !o)
                  else if (v === 'flee') flee()
                  else setMsg('こたえを えらんで こうげきだ！')
                }}
              />
            </Win>
          </div>
        )}

        {/* ---- 勝敗コマンド ---- */}
        {(phase === 'win' || phase === 'lose') && endTextDone && (
          <div className="mt-2 flex justify-end">
            <Win className="w-56 px-2 py-1">
              <CommandList
                items={[
                  ...(phase === 'win' && !isBoss && !save.cleared.includes(stageId)
                    ? [{ label: '大ボスに いどむ！', value: 'boss' }]
                    : []),
                  { label: 'マップへ もどる', value: 'exit' },
                ]}
                onSelect={(v) => (v === 'boss' ? onBoss() : onExit())}
              />
            </Win>
          </div>
        )}
      </div>
    </div>
  )
}
