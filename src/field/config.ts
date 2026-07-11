import type { WorldId } from '../types'

// ---- 3Dフィールドの寸法 ----
export const ZONE_LEN = 18 // 1学年ゾーンの奥行き
export const FIELD_HALF_W = 12 // フィールドの横はば（±）
export const PLAYER_SPEED = 7

// 学年 g のゾーン: z ∈ [-g*ZONE_LEN, -(g-1)*ZONE_LEN]
export const zoneCenterZ = (grade: number) => -(grade - 0.5) * ZONE_LEN
export const gateZ = (grade: number) => -grade * ZONE_LEN

// ---- モンスターの見た目 ----
export interface MonsterLook {
  body: 'blob' | 'box' | 'cone' | 'sphere' | 'crystal' | 'torus' | 'cylinder'
  color: string
  symbol?: string // 体の上にうかぶ記号（数・計算記号など）
}

export interface ZoneConfig {
  name: string // ドラクエ風の地名
  look: MonsterLook
}

export const ZONES: Record<string, ZoneConfig> = {
  // 数と計算
  'keisan-1': { name: 'たしざんの村', look: { body: 'blob', color: '#f97316', symbol: '+' } },
  'keisan-2': { name: '九九の草原', look: { body: 'blob', color: '#ef4444', symbol: '×' } },
  'keisan-3': { name: 'わり算のとうげ', look: { body: 'blob', color: '#dc2626', symbol: '÷' } },
  'keisan-4': { name: '小数の湖', look: { body: 'blob', color: '#fb7185', symbol: '0.1' } },
  'keisan-5': { name: '分数の森', look: { body: 'blob', color: '#e11d48', symbol: '1/2' } },
  'keisan-6': { name: '文字式の城', look: { body: 'crystal', color: '#f59e0b', symbol: 'x' } },
  // 量と測定
  'ryou-1': { name: 'とけいの村', look: { body: 'cylinder', color: '#84cc16', symbol: '3:00' } },
  'ryou-2': { name: 'ながさの牧場', look: { body: 'box', color: '#22c55e', symbol: 'cm' } },
  'ryou-3': { name: 'おもさの岩山', look: { body: 'sphere', color: '#16a34a', symbol: 'kg' } },
  'ryou-4': { name: '面積の畑', look: { body: 'box', color: '#10b981', symbol: 'cm²' } },
  'ryou-5': { name: '体積の谷', look: { body: 'box', color: '#059669', symbol: 'm³' } },
  'ryou-6': { name: '速さの街道', look: { body: 'cone', color: '#34d399', symbol: 'km/h' } },
  // 図形
  'zukei-1': { name: 'かたちの村', look: { body: 'cone', color: '#38bdf8' } },
  'zukei-2': { name: 'さんかくの丘', look: { body: 'cone', color: '#0ea5e9' } },
  'zukei-3': { name: 'まんまるの泉', look: { body: 'sphere', color: '#06b6d4' } },
  'zukei-4': { name: '角度の砂漠', look: { body: 'crystal', color: '#0284c7', symbol: '90°' } },
  'zukei-5': { name: '合同の神殿', look: { body: 'box', color: '#22d3ee', symbol: '180°' } },
  'zukei-6': { name: '対称の宮殿', look: { body: 'torus', color: '#38bdf8', symbol: '3.14' } },
  // 数量関係
  'kankei-1': { name: 'ならびの村', look: { body: 'crystal', color: '#c084fc', symbol: '123' } },
  'kankei-2': { name: 'ひょうの花畑', look: { body: 'blob', color: '#a855f7', symbol: 'ooo' } },
  'kankei-3': { name: 'グラフの高原', look: { body: 'box', color: '#9333ea', symbol: '||||' } },
  'kankei-4': { name: '変わり方の風の谷', look: { body: 'crystal', color: '#d946ef', symbol: '→' } },
  'kankei-5': { name: '割合の市場', look: { body: 'blob', color: '#c026d3', symbol: '%' } },
  'kankei-6': { name: '比例の星空', look: { body: 'crystal', color: '#e879f9', symbol: 'y=ax' } },
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
