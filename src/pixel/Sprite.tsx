import { TILE } from './px'

// ドット絵スプライト。16×16の絵を にじませずに 大きく 表示する
// （image-rendering: pixelated ＝ ドットが くっきり 四角のまま 拡大される）。
export default function Sprite({
  url,
  size = TILE,
  className = '',
  style,
}: {
  url: string
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${url})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  )
}
