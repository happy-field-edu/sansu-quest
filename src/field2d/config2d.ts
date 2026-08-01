// 2Dフィールドの設定：ゾーン名（ドラクエ風の地名）
// ※ワールドごとの色は ドット絵パレット（src/pixel/theme.ts）に うつした

export const ZONE_NAMES: Record<string, string> = {
  'keisan-1': 'たしざんの村',
  'keisan-2': '九九の草原',
  'keisan-3': 'わり算のとうげ',
  'keisan-4': '小数の湖',
  'keisan-5': '分数の森',
  'keisan-6': '文字式の城',
  'ryou-1': 'とけいの村',
  'ryou-2': 'ながさの牧場',
  'ryou-3': 'おもさの岩山',
  'ryou-4': '面積の畑',
  'ryou-5': '体積の谷',
  'ryou-6': '速さの街道',
  'zukei-1': 'かたちの村',
  'zukei-2': 'さんかくの丘',
  'zukei-3': 'まんまるの泉',
  'zukei-4': '角度の砂漠',
  'zukei-5': '合同の神殿',
  'zukei-6': '対称の宮殿',
  'kankei-1': 'ならびの村',
  'kankei-2': 'ひょうの花畑',
  'kankei-3': 'グラフの高原',
  'kankei-4': '変わり方の風の谷',
  'kankei-5': '割合の市場',
  'kankei-6': '比例の星空',
}

// シード付き乱数（マップ・モンスター配置を毎回おなじにする）
export function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
