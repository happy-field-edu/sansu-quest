import type { WorldId } from '../types'

// ワールドごとの ドット絵パレット。
// おなじ かたちの タイルでも、色を かえるだけで 世界の ふんいきが かわる
// （ドラクエ／ゼルダの 地方ごとの 色ちがいと おなじ かんがえ方）。
export interface PixTheme {
  grass: [string, string, string] // 地面ベース／こい草／うすい草
  dirt: [string, string, string] // 道ベース／道のふち／砂つぶ
  water: [string, string, string] // 水ベース／ふかい水／なみのしぶき
  leaf: [string, string, string] // 木の葉 うすい／なか／こい
  trunk: [string, string] // みき／みきのかげ
  rock: [string, string, string, string] // ハイライト／なか／こい／かげ
  wall: [string, string, string] // 家のかべ／まど／かべのかげ
  roof: [string, string] // やね／やねのふち
  deco: [string, string] // かざり（花・水晶）の色／しん
}

export const PIX_THEME: Record<WorldId, PixTheme> = {
  // 数と計算：あかるい みどりの 草原
  keisan: {
    grass: ['#5c9e40', '#4a8434', '#7bbd55'],
    dirt: ['#d6b177', '#b08a55', '#e7c993'],
    water: ['#3f83d4', '#2b60a8', '#8fc0f0'],
    leaf: ['#7cc356', '#4f9337', '#356b26'],
    trunk: ['#7c5430', '#573921'],
    rock: ['#b3aea4', '#8a857c', '#615d56', '#43403b'],
    wall: ['#e8d8b4', '#7fc7e8', '#c2ab82'],
    roof: ['#c05a4a', '#8e3c30'],
    deco: ['#f4d94e', '#e88fb0'],
  },
  // 量と測定：まきばと 岩山（黄みどり＋針葉樹）
  ryou: {
    grass: ['#66a447', '#54893a', '#87c25f'],
    dirt: ['#cba76e', '#a5804f', '#e0c08c'],
    water: ['#3d8fc4', '#2a6a96', '#8fcde8'],
    leaf: ['#5cae5f', '#327c3d', '#1f5a2b'],
    trunk: ['#6f4b2c', '#4e341e'],
    rock: ['#bab2a3', '#918a7c', '#67615a', '#464139'],
    wall: ['#efe0bb', '#8fd2c0', '#c9b287'],
    roof: ['#a8763f', '#7a5228'],
    deco: ['#f2b33e', '#ffe9a8'],
  },
  // 図形：青みどりの 高原と 石の神殿
  zukei: {
    grass: ['#4f9382', '#3f7c6d', '#72b19d'],
    dirt: ['#c4ccd7', '#98a3b2', '#dee5ee'],
    water: ['#3f9fd4', '#2a76a8', '#96d6f0'],
    leaf: ['#5fb096', '#3b8a72', '#276353'],
    trunk: ['#6d5a44', '#4c3e2e'],
    rock: ['#c6ccd4', '#9aa2ad', '#6f7783', '#4b515a'],
    wall: ['#e6ecf2', '#79c8dd', '#b9c3cf'],
    roof: ['#5b86b5', '#3d5f86'],
    deco: ['#7fe3ff', '#c8f5ff'],
  },
  // 数量関係：むらさきの 魔法平原と 星空
  kankei: {
    grass: ['#6a5a9e', '#57478a', '#8a78bd'],
    dirt: ['#c0b0dd', '#9787b6', '#ded2f0'],
    water: ['#5f6fd0', '#4550a5', '#a9b3f0'],
    leaf: ['#8f7ac4', '#6a58a0', '#4b3d78'],
    trunk: ['#6b5240', '#4a382c'],
    rock: ['#b6aecb', '#8d85a4', '#655e79', '#453f55'],
    wall: ['#ece2f5', '#c79cf0', '#c0b2d3'],
    roof: ['#7a5fbe', '#553f8c'],
    deco: ['#ffd75e', '#b98cff'],
  },
}
