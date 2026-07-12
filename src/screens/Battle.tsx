import { useRef, useState } from 'react'
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
import { genProblem } from '../data/generators'
import MemoPad from '../components/MemoPad'
import BattleHero from './BattleHero'
import SoundToggle from '../components/SoundToggle'
import { sfx } from '../game/sound'
import type { Item, Problem } from '../types'

type Phase = 'fight' | 'win' | 'lose'

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

  // バトル開始時のステータスで固定（とちゅうでそうびは変えられない）
  const [startStats] = useState(() => playerStats(save))
  const target = isBoss ? startStats.bossRequired : PRACTICE_HP

  const [hp, setHp] = useState(startStats.maxHp)
  const [progress, setProgress] = useState(0)
  // れんしゅうは苦手技能を優先出題、ボスは全技能を均等に（まとめテスト）
  const nextProblem = () => (isBoss ? genProblem(stageId) : genProblem(stageId, save.skillStats))
  const [problem, setProblem] = useState<Problem>(nextProblem)
  const [phase, setPhase] = useState<Phase>('fight')
  const [selected, setSelected] = useState<number | null>(null)
  const [fx, setFx] = useState<'none' | 'hit' | 'miss'>('none')
  const [swingId, setSwingId] = useState(0) // 増えるたびに3Dゆうしゃが武器を振る
  const expRef = useRef(0)
  const [expShown, setExpShown] = useState(0)
  const [result, setResult] = useState<{ levelBefore: number; levelAfter: number; exp: number; drop: Item | null }>({
    levelBefore: 1,
    levelAfter: 1,
    exp: 0,
    drop: null,
  })

  const remaining = target - progress

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
    setResult({ levelBefore, levelAfter, exp: totalExp, drop })
    setPhase(won ? 'win' : 'lose')
    if (won) {
      if (levelAfter > levelBefore) sfx.levelup()
      else sfx.victory()
      if (drop) sfx.drop()
    }
  }

  function answer(i: number) {
    if (selected !== null || phase !== 'fight') return
    setSelected(i)
    const correct = i === problem.answer
    setFx(correct ? 'hit' : 'miss')
    // 技能べつの正誤を記録（きろく画面・弱点優先出題のもと）
    if (problem.skillId) dispatch({ type: 'record-skill', stageId, skillId: problem.skillId, correct })
    if (correct) {
      sfx.correct()
      setSwingId((s) => s + 1)
      expRef.current += EXP_CORRECT
      setExpShown(expRef.current)
      const next = progress + 1
      window.setTimeout(() => {
        setProgress(next)
        if (next >= target) {
          finish(true)
        } else {
          setProblem(nextProblem())
          setSelected(null)
          setFx('none')
        }
      }, 650)
    } else {
      sfx.wrong()
      const newHp = hp - startStats.mistakeDamage
      window.setTimeout(() => {
        setHp(newHp)
        if (newHp <= 0) {
          finish(false)
        } else {
          setProblem(nextProblem())
          setSelected(null)
          setFx('none')
        }
      }, 900)
    }
  }

  function flee() {
    if (expRef.current > 0) dispatch({ type: 'gain-exp', amount: expRef.current })
    onExit()
  }

  return (
    <div className={`mx-auto flex min-h-screen max-w-xl flex-col px-4 py-4 ${fx === 'miss' ? 'anim-shake' : ''}`}>
      {/* 上部バー */}
      <div className="flex items-center justify-between">
        <button onClick={flee} className="text-sm text-slate-400 hover:text-slate-200">
          ◀ にげる
        </button>
        <span
          className={`font-dot rounded-full px-3 py-1 text-sm ${
            isBoss ? 'bg-red-600/80 text-white' : 'bg-emerald-600/80 text-white'
          }`}
        >
          {isBoss ? `👑 大ボスせん` : '⚔️ れんしゅうバトル'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-yellow-300">EXP +{expShown}</span>
          <SoundToggle />
        </div>
      </div>

      {/* ゆうしゃ vs てき */}
      <div className="mt-2 text-center">
        <p className="font-dot text-lg text-slate-200">
          {isBoss ? stage.bossName : stage.enemyName}
          <span className="ml-2 text-xs text-slate-400">（{stage.grade}年生・{stage.title}）</span>
        </p>
        <div className="flex items-end justify-center gap-1">
          {/* 3Dゆうしゃ（正解で武器を振る） */}
          <BattleHero weaponId={save.equipped['ぶき']} shieldId={save.equipped['たて']} swingSignal={swingId} />
          <div className="relative pb-4">
            <div className={`inline-block ${fx === 'hit' ? 'anim-hit' : 'anim-floaty'} ${isBoss ? 'text-8xl' : 'text-7xl'}`}>
              {isBoss ? stage.bossEmoji : stage.enemyEmoji}
            </div>
            {/* 斬撃エフェクト */}
            {fx === 'hit' && (
              <>
                <div className="anim-flashfx pointer-events-none absolute inset-0 rounded-full bg-white" />
                <div className="anim-slash pointer-events-none absolute top-1/2 left-1/2 h-2.5 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-white to-transparent" />
                <div
                  className="anim-slash pointer-events-none absolute top-1/2 left-1/2 h-1.5 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-yellow-200 to-transparent"
                  style={{ animationDelay: '0.08s' }}
                />
                <div className="anim-rise pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 text-3xl">💥</div>
              </>
            )}
          </div>
        </div>
        {fx === 'hit' && <div className="anim-rise font-dot text-2xl font-bold text-yellow-300">せいかい！ ⚡</div>}
        {fx === 'miss' && (
          <div className="anim-rise font-dot text-2xl font-bold text-red-400">ミス！ −{startStats.mistakeDamage} HP</div>
        )}

        {/* てきのHP（のこり問題数） */}
        <div className="mx-auto mt-1 max-w-sm">
          <p className="font-dot mb-1 text-xl text-yellow-300">あと {remaining} 問！</p>
          <div className="h-4 overflow-hidden rounded-full border border-slate-600 bg-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                isBoss ? 'from-red-500 to-rose-400' : 'from-emerald-500 to-lime-400'
              }`}
              style={{ width: `${(remaining / target) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* プレイヤーHP */}
      <div className="mx-auto mt-4 w-full max-w-sm">
        <div className="flex items-center justify-between text-sm">
          <span>🦸 ゆうしゃ Lv.{startStats.level}</span>
          <span>
            ❤️ {Math.max(0, hp)}／{startStats.maxHp}
          </span>
        </div>
        <div className="mt-1 h-3 overflow-hidden rounded-full border border-slate-600 bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-red-400 transition-all duration-500"
            style={{ width: `${(Math.max(0, hp) / startStats.maxHp) * 100}%` }}
          />
        </div>
      </div>

      {/* もんだいカード */}
      <div className="mt-5 flex-1">
        <div className="rounded-2xl border-2 border-indigo-400/50 bg-slate-900/90 p-5">
          {problem.skill && (
            <p className="mb-2 text-center">
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                🎯 めあて：{problem.skill}
              </span>
            </p>
          )}
          <p className="text-center text-xl leading-relaxed font-bold whitespace-pre-line">{problem.text}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {problem.choices.map((c, i) => {
            let style = 'bg-slate-800 border-slate-600 hover:border-indigo-400'
            if (selected !== null) {
              if (i === problem.answer) style = 'bg-emerald-600 border-emerald-300'
              else if (i === selected) style = 'bg-red-600 border-red-300'
              else style = 'bg-slate-800 border-slate-700 opacity-50'
            }
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={selected !== null}
                className={`btn-game rounded-2xl border-2 px-3 py-4 text-xl font-bold shadow-[0_4px_0_rgba(0,0,0,0.45)] ${style}`}
              >
                {c}
              </button>
            )
          })}
        </div>
        {/* 筆算用の手書きメモ（問題がかわると自動でリセット） */}
        <MemoPad resetKey={problem} />
        {isBoss && (
          <p className="mt-3 text-center text-xs text-slate-400">
            レベルとそうびのおかげで 50問 → {target}問 になっている！
          </p>
        )}
      </div>

      {/* しょうり／はいぼく */}
      {phase !== 'fight' && (
        <ResultOverlay
          phase={phase}
          isBoss={isBoss}
          stage={{ bossEmoji: stage.bossEmoji, enemyEmoji: stage.enemyEmoji, grade: stage.grade }}
          result={result}
          alreadyCleared={save.cleared.includes(stageId)}
          onExit={onExit}
          onBoss={onBoss}
        />
      )}
    </div>
  )
}

function ResultOverlay({
  phase,
  isBoss,
  stage,
  result,
  alreadyCleared,
  onExit,
  onBoss,
}: {
  phase: 'win' | 'lose'
  isBoss: boolean
  stage: { bossEmoji: string; enemyEmoji: string; grade: number }
  result: { levelBefore: number; levelAfter: number; exp: number; drop: Item | null }
  alreadyCleared: boolean
  onExit: () => void
  onBoss: () => void
}) {
  const win = phase === 'win'
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="anim-pop w-full max-w-md rounded-3xl border-2 border-yellow-400/60 bg-slate-900 p-6 text-center">
        <div className="text-6xl">{win ? (isBoss ? '👑' : '🎉') : '😵'}</div>
        <h2 className="font-dot mt-2 text-2xl font-bold text-yellow-300">
          {win ? (isBoss ? `${stage.bossEmoji} 大ボスをたおした！` : 'モンスターをたおした！') : 'やられてしまった…'}
        </h2>

        <p className="mt-3 text-lg">
          けいけんち <span className="font-dot font-bold text-cyan-300">＋{result.exp} EXP</span>
          {!win && <span className="block text-sm text-slate-400">（まけても がんばったぶんは もらえる！）</span>}
        </p>

        {result.levelAfter > result.levelBefore && (
          <div className="anim-pop mt-3 rounded-2xl bg-gradient-to-r from-cyan-500/25 to-blue-500/25 py-3">
            <p className="font-dot text-2xl font-bold text-cyan-300">
              ⬆ レベルアップ！ Lv.{result.levelBefore} → Lv.{result.levelAfter}
            </p>
            <p className="mt-1 text-xs text-slate-300">レベルが上がると ボスにひつような問題数が へるよ！</p>
          </div>
        )}

        {result.drop && (
          <div className="relative mt-4 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-500/25 to-yellow-600/10 p-4">
            <span className="anim-sparkle absolute -top-3 -left-3 text-2xl">✨</span>
            <span className="anim-sparkle absolute -top-3 -right-3 text-2xl" style={{ animationDelay: '0.7s' }}>
              ✨
            </span>
            <p className="text-sm text-amber-200">そうびを 手にいれた！</p>
            <p className="font-dot mt-1 text-xl font-bold">
              {result.drop.emoji} {result.drop.name}
            </p>
            <p className="mt-1 text-xs text-slate-300">{result.drop.desc}</p>
            <p className="mt-2 text-xs font-bold text-emerald-300">
              {result.drop.atk > 0 && `⚔️ ボスの問題数 −${result.drop.atk}　`}
              {result.drop.def > 0 && `🛡️ まもり ＋${result.drop.def}　`}
              {result.drop.hp > 0 && `❤️ HP ＋${result.drop.hp}`}
            </p>
          </div>
        )}

        {win && isBoss && (
          <p className="mt-3 text-sm text-emerald-300">
            {stage.grade < 6 ? `🗺️ ${stage.grade + 1}年生への道が ひらいた！` : '🏆 このワールドを せいはした！'}
          </p>
        )}
        {!win && <p className="mt-2 text-sm text-slate-300">そうびを ととのえて もういちど ちょうせんしよう！</p>}

        <div className="mt-5 flex flex-col gap-2">
          {win && !isBoss && !alreadyCleared && (
            <button
              onClick={onBoss}
              className="btn-game rounded-2xl bg-gradient-to-b from-red-400 to-red-600 px-4 py-3 text-lg font-bold text-white shadow-[0_5px_0_#7f1d1d]"
            >
              {stage.bossEmoji} このまま 大ボスに ちょうせん！
            </button>
          )}
          <button
            onClick={onExit}
            className="btn-game rounded-2xl bg-slate-700 px-4 py-3 font-bold shadow-[0_5px_0_#1e293b]"
          >
            🗺️ マップに もどる
          </button>
        </div>
      </div>
    </div>
  )
}
