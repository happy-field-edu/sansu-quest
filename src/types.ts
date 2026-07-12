export type Slot = 'ぶき' | 'たて' | 'よろい' | 'かぶと' | 'くつ' | 'おまもり'

export const SLOTS: Slot[] = ['ぶき', 'たて', 'よろい', 'かぶと', 'くつ', 'おまもり']

export interface Item {
  id: string
  name: string
  emoji: string
  slot: Slot
  atk: number // ボスをたおすのに必要な問題数を減らす
  def: number // まちがえたときのダメージを減らす
  hp: number // さいだいHPを増やす
  desc: string
}

export type WorldId = 'keisan' | 'ryou' | 'zukei' | 'kankei'

export interface Stage {
  id: string
  worldId: WorldId
  grade: number // 1〜6年生
  title: string // 単元名
  desc: string
  enemyName: string
  enemyEmoji: string
  bossName: string
  bossEmoji: string
  itemId: string
  link: string // 系統性（この単元がどこにつながるか）
}

export interface World {
  id: WorldId
  name: string
  emoji: string
  gradient: string // Tailwind gradient クラス
  ring: string
  desc: string
  stages: Stage[]
}

export interface Problem {
  text: string
  choices: string[]
  answer: number // 正解の choices インデックス
  skill?: string // この問題がみがく技能名（数直線・大小くらべ など）
  skillId?: string // 正誤記録用の技能ID
}

// 技能ごとの正誤記録（o=正解数, x=まちがい数）。キーは `${stageId}:${skillId}`
export interface SkillStat {
  o: number
  x: number
}

export interface SaveData {
  exp: number
  items: string[] // 手に入れた装備の id
  equipped: Partial<Record<Slot, string>>
  practiced: string[] // れんしゅうバトルをクリアしたステージ（装備入手ずみ）
  cleared: string[] // ボスをたおしたステージ
  skillStats: Record<string, SkillStat> // 技能べつの正誤記録
}
