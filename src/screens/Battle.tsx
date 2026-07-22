import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/store'
import {
  playerStats,
  levelFromExp,
  PRACTICE_HP,
  EXP_CORRECT,
  EXP_PRACTICE_CLEAR,
  EXP_BOSS_CLEAR,
} from '../game/logic'
import { STAGE_BY_ID } from '../data/worlds'
import { ITEMS } from '../data/items'
import { genProblem, genBossProblem } from '../data/generators'
import MemoPad from '../components/MemoPad'
import SoundToggle from '../components/SoundToggle'
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
  const enemyName = isBoss ? stage.bossName : stage.enemyName
  const enemyEmoji = isBoss ? stage.bossEmoji : stage.enemyEmoji

  const [startStats] = useState(() => playerStats(save))
  const target = isBoss ? startStats.bossRequired : PRACTICE_HP

  const nextProblem = () => (isBoss ? genBossProblem(stageId) : genProblem(stageId, save.skillStats))
  const [hp, setHp] = useState(startStats.maxHp)
  const [progress, setProgress] = useState(0)
  const [problem, setProblem] = useState<Problem>(nextProblem)
  const [phase, setPhase] = useState<Phase>('intro')
  const [selected, setSelected] = useState<number | null>(null)
  const [fx, setFx] = useState<'none' | 'hit' | 'miss'>('none')
  const [msg, setMsg] = useState(`${enemyName}（${stage.title}）が あらわれた！`)
  const [memoOpen, setMemoOpen] = useState(false)
  const [numInput, setNumInput] = useState('') // テンキーの入力

  // こたえが ただの数（整数・小数）なら テンキーで直接入力するモード
  const correctAnswer = problem.choices[problem.answer]
  const numericMode = /^[0-9]+(\.[0-9]+)?$/.test(correctAnswer)
  const [endMsgs, setEndMsgs] = useState<string[]>([])
  const [endIdx, setEndIdx] = useState(0)
  const expRef = useRef(0)
  const [expShown, setExpShown] = useState(0)

  const remaining = target - progress

  // あらわれた！のあと、たたかいへ
  const introDone = () => {
    window.setTimeout(() => {
      setPhase((p) => {
        if (p === 'intro') {
          setMsg(isBoss ? `ぜんぶで ${target}問！ こたえを えらんで こうげきだ！` : 'こたえを えらんで こうげきだ！')
          return 'fight'
        }
        return p
      })
    }, 600)
  }

  function finish(won: boolean) {
    const clearBonus = won ? (isBoss ? EXP_BOSS_CLEAR : EXP_PRACTICE_CLEAR) : 0
    const totalExp = expRef.current + clearBonus
    const levelBefore = levelFromExp(save.exp).level
    const levelAfter = levelFromExp(save.exp + totalExp).level
    let drop: Item | null = null
    if (won) {
      if (!isBoss && !save.practiced.includes(stageId)) drop = ITEMS[stage.itemId]
      dispatch({ type: isBoss ? 'boss-clear' : 'practice-clear', stageId, exp: totalExp })
    } else {
      dispatch({ type: 'gain-exp', amount: totalExp })
    }
    const msgs = won
      ? [
          `${enemyName} を たおした！`,
          `けいけんち ${totalExp} かくとく！`,
          ...(drop ? [`そうび「${drop.emoji}${drop.name}」を てにいれた！`] : []),
          ...(levelAfter > levelBefore ? [`ゆうしゃは レベル${levelAfter}に あがった！`] : []),
          ...(won && isBoss ? [stage.grade < 6 ? `${stage.grade + 1}年生への もんが ひらいた！` : 'このワールドを せいはした！'] : []),
        ]
      : [`ゆうしゃは たおれてしまった…`, `でも けいけんち ${totalExp} は もらえた！ そうびを ととのえて もういちど！`]
    setEndMsgs(msgs)
    setEndIdx(0)
    setPhase(won ? 'win' : 'lose')
    if (won) {
      if (levelAfter > levelBefore) sfx.levelup()
      else sfx.victory()
      if (drop) sfx.drop()
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
      const next = progress + 1
      window.setTimeout(() => {
        setProgress(next)
        if (next >= target) finish(true)
        else goNext()
      }, 650)
    } else {
      sfx.wrong()
      setMsg(
        reveal
          ? `ミス！ こたえは「${reveal}」。${startStats.mistakeDamage}の ダメージ！`
          : `ミス！ ゆうしゃは ${startStats.mistakeDamage}の ダメージ！`,
      )
      const newHp = hp - startStats.mistakeDamage
      window.setTimeout(() => {
        setHp(newHp)
        if (newHp <= 0) finish(false)
        else goNext()
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
    if (expRef.current > 0) dispatch({ type: 'gain-exp', amount: expRef.current })
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
    <div className={`fixed inset-0 flex flex-col items-center bg-black ${fx === 'miss' ? 'anim-shake' : ''}`}>
      <div className="flex h-full w-full max-w-[520px] flex-col overflow-y-auto p-2">
        {/* ---- 敵エリア（フロントビュー） ---- */}
        <div className="dq-frame relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#050510]">
          {/* 戦闘背景（うずまく闇） */}
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 50% 40%, #24244a 0%, #050510 70%)' }} />
          <p className="font-dot z-10 text-sm text-slate-300">
            {isBoss ? '👑 大ボスせん' : '⚔️ たたかい'}　EXP＋{expShown}
          </p>
          <div className={`relative z-10 my-1 ${fx === 'hit' ? 'anim-hit' : 'anim-floaty'} ${isBoss ? 'text-[7rem]' : 'text-8xl'}`}>
            {enemyEmoji}
            {fx === 'hit' && (
              <>
                <div className="anim-flashfx pointer-events-none absolute inset-0 rounded-full bg-white" />
                <div className="anim-slash pointer-events-none absolute top-1/2 left-1/2 h-2 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-white to-transparent" />
              </>
            )}
          </div>
          {/* のこり問題ゲージ */}
          <div className="z-10 w-2/3">
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
        <div className="absolute top-3 right-3">
          <SoundToggle />
        </div>
      </div>
    </div>
  )
}
