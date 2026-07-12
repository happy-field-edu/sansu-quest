import type { WorldId } from '../types'

// ---- 3Dフィールドの寸法 ----
export const ZONE_LEN = 18 // 1学年ゾーンの奥行き
export const FIELD_HALF_W = 12 // フィールドの横はば（±）
export const PLAYER_SPEED = 7

// 学年 g のゾーン: z ∈ [-g*ZONE_LEN, -(g-1)*ZONE_LEN]
export const zoneCenterZ = (grade: number) => -(grade - 0.5) * ZONE_LEN
export const gateZ = (grade: number) => -grade * ZONE_LEN

// ---- モンスターの見た目 ----
// 敵キャラの名前（かずむし・くくコウモリ…）に合わせたアーキタイプを bodies.tsx の工房で組み立てる
import type { Archetype } from './bodies'

export interface MonsterLook {
  archetype: Archetype
  color: string
  accent?: string // 羽・こうら・ツノなどのさし色
  symbol?: string // 体の上にうかぶ記号（数・計算記号など）
  opts?: string[] // アーキタイプごとのバリエーション（pointears, hood, tophat...）
}

export interface ZoneConfig {
  name: string // ドラクエ風の地名
  look: MonsterLook // 練習モンスター
  bossLook: MonsterLook // 門番の大ボス
}

export const ZONES: Record<string, ZoneConfig> = {
  // ===== 数と計算 =====
  'keisan-1': {
    name: 'たしざんの村',
    look: { archetype: 'worm', color: '#f97316', symbol: '+' },
    bossLook: { archetype: 'dragon', color: '#16a34a', accent: '#facc15' },
  },
  'keisan-2': {
    name: '九九の草原',
    look: { archetype: 'bat', color: '#7c3aed', accent: '#a78bfa', symbol: '×' },
    bossLook: { archetype: 'slime', color: '#eab308' },
  },
  'keisan-3': {
    name: 'わり算のとうげ',
    look: { archetype: 'beast', color: '#6b7280', opts: ['pointears'], symbol: '÷' },
    bossLook: { archetype: 'ghost', color: '#b91c1c' },
  },
  'keisan-4': {
    name: '小数の湖',
    look: { archetype: 'ghost', color: '#cbd5e1', symbol: '0.1' },
    bossLook: { archetype: 'bat', color: '#4c1d95', accent: '#7c3aed' },
  },
  'keisan-5': {
    name: '分数の森',
    look: { archetype: 'snake', color: '#10b981', symbol: '1/2' },
    bossLook: { archetype: 'octopus', color: '#7c3aed' },
  },
  'keisan-6': {
    name: '文字式の城',
    look: { archetype: 'golem', color: '#94a3b8', accent: '#22d3ee', opts: ['antenna'], symbol: 'x' },
    bossLook: { archetype: 'dragon', color: '#7f1d1d', accent: '#f59e0b' },
  },
  // ===== 量と測定 =====
  'ryou-1': {
    name: 'とけいの村',
    look: { archetype: 'snail', color: '#84cc16', accent: '#d97706', symbol: '3:00' },
    bossLook: { archetype: 'bird', color: '#92400e', accent: '#fcd34d' },
  },
  'ryou-2': {
    name: 'ながさの牧場',
    look: { archetype: 'frog', color: '#22c55e', symbol: 'cm' },
    bossLook: { archetype: 'beast', color: '#16a34a', opts: ['longsnout'] },
  },
  'ryou-3': {
    name: 'おもさの岩山',
    look: { archetype: 'beast', color: '#94a3b8', opts: ['trunk'], symbol: 'kg' },
    bossLook: { archetype: 'beast', color: '#6b7280', accent: '#e5e7eb', opts: ['horn'] },
  },
  'ryou-4': {
    name: '面積の畑',
    look: { archetype: 'beast', color: '#a16207', symbol: 'cm²' },
    bossLook: { archetype: 'beast', color: '#78350f' },
  },
  'ryou-5': {
    name: '体積の谷',
    look: { archetype: 'turtle', color: '#16a34a', accent: '#3f6212', symbol: 'm³' },
    bossLook: { archetype: 'whale', color: '#0ea5e9', accent: '#e0f2fe' },
  },
  'ryou-6': {
    name: '速さの街道',
    look: { archetype: 'beast', color: '#f59e0b', opts: ['pointears'], symbol: 'km/h' },
    bossLook: { archetype: 'bird', color: '#b45309', accent: '#fef3c7' },
  },
  // ===== 図形 =====
  'zukei-1': {
    name: 'かたちの村',
    look: { archetype: 'golem', color: '#38bdf8', accent: '#fde047', opts: ['mini'] },
    bossLook: { archetype: 'golem', color: '#64748b', accent: '#f97316' },
  },
  'zukei-2': {
    name: 'さんかくの丘',
    look: { archetype: 'butterfly', color: '#0ea5e9', accent: '#7dd3fc' },
    bossLook: { archetype: 'dragon', color: '#16a34a', accent: '#86efac', opts: ['nowings'] },
  },
  'zukei-3': {
    name: 'まんまるの泉',
    look: { archetype: 'slime', color: '#06b6d4' },
    bossLook: { archetype: 'octopus', color: '#ef4444' },
  },
  'zukei-4': {
    name: '角度の砂漠',
    look: { archetype: 'crab', color: '#d97706', opts: ['sting'], symbol: '90°' },
    bossLook: { archetype: 'snake', color: '#16a34a', accent: '#a3e635', opts: ['hood'] },
  },
  'zukei-5': {
    name: '合同の神殿',
    look: { archetype: 'crab', color: '#f97316', symbol: '180°' },
    bossLook: { archetype: 'crab', color: '#dc2626', opts: ['bigclaw'] },
  },
  'zukei-6': {
    name: '対称の宮殿',
    look: { archetype: 'butterfly', color: '#22d3ee', accent: '#a5f3fc', symbol: '3.14' },
    bossLook: { archetype: 'dragon', color: '#3b82f6', accent: '#93c5fd' },
  },
  // ===== 数量関係 =====
  'kankei-1': {
    name: 'ならびの村',
    look: { archetype: 'beast', color: '#ea580c', accent: '#fdba74', opts: ['bigtail'], symbol: '123' },
    bossLook: { archetype: 'beast', color: '#f97316', accent: '#fed7aa', opts: ['pointears', 'bigtail'] },
  },
  'kankei-2': {
    name: 'ひょうの花畑',
    look: { archetype: 'bat', color: '#facc15', opts: ['bee'], symbol: 'ooo' },
    bossLook: { archetype: 'spider', color: '#44403c', accent: '#ef4444' },
  },
  'kankei-3': {
    name: 'グラフの高原',
    look: { archetype: 'bird', color: '#22c55e', accent: '#fef08a', symbol: '||||' },
    bossLook: { archetype: 'bird', color: '#0ea5e9', accent: '#22d3ee', opts: ['fan'] },
  },
  'kankei-4': {
    name: '変わり方の風の谷',
    look: { archetype: 'beast', color: '#65a30d', symbol: '→' },
    bossLook: { archetype: 'dragon', color: '#d946ef', accent: '#f0abfc' },
  },
  'kankei-5': {
    name: '割合の市場',
    look: { archetype: 'mage', color: '#a855f7', accent: '#fde047', symbol: '%' },
    bossLook: { archetype: 'mage', color: '#334155', accent: '#f43f5e', opts: ['tophat'] },
  },
  'kankei-6': {
    name: '比例の星空',
    look: { archetype: 'beast', color: '#eab308', accent: '#fde047', opts: ['pointears'], symbol: 'y=ax' },
    bossLook: { archetype: 'slime', color: '#7c3aed' },
  },
}

// ---- ワールドごとの3Dテーマ ----
export interface FieldTheme {
  ground: [string, string] // ゾーンごとに交互になる地面の色
  path: string
  fog: string
  accent: string // 水晶・屋根などのアクセント色
  sun: [number, number, number]
  deco: 'warm' | 'forest' | 'crystal' | 'magic'
}

export const FIELD_THEMES: Record<WorldId, FieldTheme> = {
  keisan: {
    ground: ['#7c9a4e', '#8aa757'],
    path: '#d6b98c',
    fog: '#ffd9a0',
    accent: '#f97316',
    sun: [60, 30, -100],
    deco: 'warm',
  },
  ryou: {
    ground: ['#4e8a52', '#5c975f'],
    path: '#c9b285',
    fog: '#bfe8c8',
    accent: '#16a34a',
    sun: [-40, 40, -80],
    deco: 'forest',
  },
  zukei: {
    ground: ['#5f7f9e', '#6c8cab'],
    path: '#cfd8e3',
    fog: '#bcd8f0',
    accent: '#22d3ee',
    sun: [0, 50, -120],
    deco: 'crystal',
  },
  kankei: {
    ground: ['#6b5a95', '#7766a3'],
    path: '#c9b8e8',
    fog: '#d9c5f5',
    accent: '#d946ef',
    sun: [-70, 20, -60],
    deco: 'magic',
  },
}

// 位置決め用のシード付き乱数（毎回同じ配置になる）
export function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
