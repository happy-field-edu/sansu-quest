// ============================================================
// ドット絵エンジン
// 16×16 の「文字の絵」を パレットで 色づけして canvas に えがく。
// ゼルダ／ドラクエのような 16ビット風の 世界を つくるための どだい。
//   '.' = とうめい / それいがいの 1文字 = パレットの色
// できた絵は キャッシュして 使いまわす（毎フレーム 描きなおさない）。
// ============================================================

export type Art = string[] // 1行 = 1ドット行
export type Pal = Record<string, string> // 文字 → 色

// 1ドットを 何ピクセルで えがくか（3 なら 16×16 の絵が 48×48 になる）
// ＝ 画面が 主人公に ぐっと 近づく（俯瞰の たかさが 下がる）
export const DOT = 3
export const TILE = 16 * DOT // マップ1マスの 大きさ（px）= 48

// art の 1文字ずつを 四角で ぬる
export function drawArt(ctx: CanvasRenderingContext2D, art: Art, pal: Pal, ox = 0, oy = 0, scale = DOT) {
  for (let y = 0; y < art.length; y++) {
    const row = art[y]
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch === '.' || ch === ' ') continue
      const c = pal[ch]
      if (!c) continue
      ctx.fillStyle = c
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale)
    }
  }
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  return cv
}

// 絵を canvas に 1回だけ えがいて キャッシュする
const canvasCache = new Map<string, HTMLCanvasElement>()

export function artCanvas(key: string, art: Art, pal: Pal, scale = DOT): HTMLCanvasElement {
  const hit = canvasCache.get(key)
  if (hit) return hit
  const w = Math.max(...art.map((r) => r.length)) * scale
  const h = art.length * scale
  const cv = makeCanvas(w, h)
  const ctx = cv.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  drawArt(ctx, art, pal, 0, 0, scale)
  canvasCache.set(key, cv)
  return cv
}

// 自分で えがく タイル（草・水など、となりのマスを 見て かたちが かわるもの）用。
// key ごとに 1回だけ draw をよんで キャッシュする。
export function cachedTile(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const hit = canvasCache.get(key)
  if (hit) return hit
  const cv = makeCanvas(w, h)
  const ctx = cv.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  draw(ctx)
  canvasCache.set(key, cv)
  return cv
}

// スプライトを CSS の background-image で つかうための data URL（これも キャッシュ）
const urlCache = new Map<string, string>()

export function artUrl(key: string, art: Art, pal: Pal, scale = DOT): string {
  const hit = urlCache.get(key)
  if (hit) return hit
  const url = artCanvas(`u:${key}`, art, pal, scale).toDataURL()
  urlCache.set(key, url)
  return url
}

// 1マスぶんの ドット（scale倍）を ぬる ヘルパー
export function px(ctx: CanvasRenderingContext2D, x: number, y: number, c: string, scale = DOT) {
  ctx.fillStyle = c
  ctx.fillRect(x * scale, y * scale, scale, scale)
}

// マップの ばしょごとに いつも おなじ「ばらつき」を つくる ハッシュ
export function hash2(x: number, y: number, seed = 0): number {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
