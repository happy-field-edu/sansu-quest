import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { BossProgress, SaveData, WorldId } from '../types'
import { ITEMS } from '../data/items'
import { STAGE_BY_ID } from '../data/worlds'

const SAVE_KEY = 'sansu-quest-save-v1'

const initialSave: SaveData = {
  exp: 0,
  items: [],
  equipped: {},
  practiced: [],
  cleared: [],
  skillStats: {},
  openedChests: [],
  lastPos: {},
  bossProgress: null,
}

export type Action =
  | { type: 'gain-exp'; amount: number }
  | { type: 'practice-clear'; stageId: string; exp: number }
  | { type: 'boss-clear'; stageId: string; exp: number }
  | { type: 'equip'; itemId: string }
  | { type: 'unequip'; slot: keyof SaveData['equipped'] }
  | { type: 'record-skill'; stageId: string; skillId: string; correct: boolean }
  // ---- オートセーブ ----
  | { type: 'save-pos'; worldId: WorldId; x: number; y: number } // 立ち位置
  | { type: 'open-chest'; chestId: string; itemId: string } // 宝箱をあける
  | { type: 'boss-progress'; progress: BossProgress | null } // ボス戦の とちゅう記録
  | { type: 'reset' }

function reducer(s: SaveData, a: Action): SaveData {
  switch (a.type) {
    case 'gain-exp':
      return { ...s, exp: s.exp + a.amount }
    case 'practice-clear': {
      const exp = s.exp + a.exp
      if (s.practiced.includes(a.stageId)) return { ...s, exp }
      const item = ITEMS[STAGE_BY_ID[a.stageId].itemId]
      const equipped = { ...s.equipped }
      // 空きスロットなら自動そうび
      if (!equipped[item.slot]) equipped[item.slot] = item.id
      return {
        ...s,
        exp,
        practiced: [...s.practiced, a.stageId],
        items: s.items.includes(item.id) ? s.items : [...s.items, item.id],
        equipped,
      }
    }
    case 'boss-clear': {
      const exp = s.exp + a.exp
      if (s.cleared.includes(a.stageId)) return { ...s, exp }
      return { ...s, exp, cleared: [...s.cleared, a.stageId] }
    }
    case 'equip': {
      const item = ITEMS[a.itemId]
      if (!item || !s.items.includes(a.itemId)) return s
      return { ...s, equipped: { ...s.equipped, [item.slot]: a.itemId } }
    }
    case 'unequip': {
      const equipped = { ...s.equipped }
      delete equipped[a.slot]
      return { ...s, equipped }
    }
    case 'save-pos':
      return { ...s, lastWorld: a.worldId, lastPos: { ...(s.lastPos ?? {}), [a.worldId]: { x: a.x, y: a.y } } }
    case 'open-chest': {
      if (s.openedChests.includes(a.chestId)) return s
      const item = ITEMS[a.itemId]
      const equipped = { ...s.equipped }
      // 空きスロットなら 自動そうび（すぐ ちからが 上がるように）
      if (item && !equipped[item.slot]) equipped[item.slot] = item.id
      return {
        ...s,
        openedChests: [...s.openedChests, a.chestId],
        items: item && !s.items.includes(item.id) ? [...s.items, item.id] : s.items,
        equipped,
      }
    }
    case 'boss-progress':
      return { ...s, bossProgress: a.progress }
    case 'record-skill': {
      // 技能ごとの正誤を記録（弱点の可視化・優先出題に使う）
      const key = `${a.stageId}:${a.skillId}`
      const cur = s.skillStats[key] ?? { o: 0, x: 0 }
      const next = a.correct ? { ...cur, o: cur.o + 1 } : { ...cur, x: cur.x + 1 }
      return { ...s, skillStats: { ...s.skillStats, [key]: next } }
    }
    case 'reset':
      return initialSave
    default:
      return s
  }
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) return { ...initialSave, ...JSON.parse(raw) }
  } catch {
    // こわれたセーブデータは無視して最初から
  }
  return initialSave
}

const GameContext = createContext<{ save: SaveData; dispatch: (a: Action) => void }>({
  save: initialSave,
  dispatch: () => {},
})

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  }, [save])
  return <GameContext.Provider value={{ save, dispatch }}>{children}</GameContext.Provider>
}

export const useGame = () => useContext(GameContext)

// ステージ解放判定: 1年生 or 前の学年のボスをたおしている
export function isUnlocked(save: SaveData, stageId: string): boolean {
  const stage = STAGE_BY_ID[stageId]
  if (!stage) return false
  if (stage.grade === 1) return true
  return save.cleared.includes(`${stage.worldId}-${stage.grade - 1}`)
}
