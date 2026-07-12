# DEVELOPMENT.md — 開発引き継ぎ書

「つながる！さんすうクエスト」の保守・拡張のための技術メモ。
（AIアシスタント・人間どちらが読んでも作業に入れるように書いてある）

## コマンド

```bash
npm install
npm run dev        # http://localhost:5173（ローカル開発）
npx tsc -b         # 型チェック（strict / noUnusedLocals 有効）
npm run build      # 本番ビルド（tsc -b && vite build）
```

- デプロイ: `main` に push すると GitHub Actions（`.github/workflows/deploy.yml`）が
  自動で GitHub Pages へ公開する。公開URL: https://happy-field-edu.github.io/sansu-quest/
- `vite.config.ts` の `base` はビルド時のみ `/sansu-quest/`。ローカルは `/`。

## アーキテクチャ

```
src/
├── types.ts            # Slot / Item / Stage / Problem / SkillStat / SaveData
├── data/
│   ├── worlds.ts       # 4ワールド×6学年のステージ定義（敵名・ボス名・つながり文）
│   ├── items.ts        # 装備24種（atk=ボス問題数減 / def=ミス軽減 / hp）
│   └── generators.ts   # ★問題生成。SKILLS: 単元×技能（24単元・115技能）
├── game/
│   ├── logic.ts        # レベル曲線・playerStats・ボス必要問題数・skillLevelOf
│   ├── store.tsx       # セーブ（Context+Reducer+localStorage 'sansu-quest-save-v1'）
│   └── sound.ts        # WebAudio合成SFX（素材レス）。ミュートは localStorage
├── field/              # 3Dフィールド（React Three Fiber）
│   ├── config.ts       # ゾーン名・モンスターの見た目割当・ワールドテーマ・寸法定数
│   ├── bodies.tsx      # ★ボクセルモンスター工房（18アーキタイプ、箱のみで構成）
│   ├── gear.tsx        # 武器8種＋盾2種のボクセルモデル（itemIdで分岐）
│   ├── Hero.tsx        # 共有ゆうしゃ（swingSignal++で右腕を振る）
│   ├── Monster.tsx     # うろつきAI・ラベル距離カリング・ボス王冠
│   ├── Scene.tsx       # 地形・門・かんばん・衝突判定・カメラ追従・キーボード入力
│   ├── Field3D.tsx     # Canvas+HUD＋エンカウント演出＋ボス予習パネル
│   ├── TouchStick.tsx  # バーチャルスティック（input.ts の stick に書き込む）
│   ├── input.ts        # スティック入力の共有バッファ
│   └── HiddenPaneDriver.tsx  # 開発環境専用のフレーム駆動（後述の落とし穴参照）
├── screens/
│   ├── Title / WorldSelect / Equip / Records（きろく＝技能別正誤の一覧）
│   ├── Battle.tsx      # 出題・正誤記録・EXP・勝敗・攻撃演出のトリガ
│   └── BattleHero.tsx  # 戦闘画面のミニCanvas（VS構図のゆうしゃ）
└── components/
    ├── MemoPad.tsx     # 筆算用の手書きキャンバス（方眼・自動クリア）
    └── SoundToggle.tsx # 🔊/🔇
```

画面遷移は `App.tsx` の `Screen` 状態で行う（ルーターなし）。
`'map'` = 3Dフィールド。戦闘勝敗→`onExit`でフィールドへ戻る（Field3Dは再マウント）。

## コアの計算式（ゲームデザインの心臓部）

- `power = level + 装備atk合計`
- **ボス必要正解数 = max(25, 50 − power)** ← 「基礎をやり込むとボスが楽になる」の実装
- ミスダメージ = `max(1, 5 − floor(装備def/3))`、最大HP = `20 + (level−1)*3 + 装備hp`
- EXP: 正解+4 / 練習クリア+20 / ボス撃破+80。負け・逃げでも稼いだ分は保持
- 進級ロック: `stage.grade === 1 || cleared.includes(前学年)`（store.tsx `isUnlocked`）

## 問題システム（generators.ts）

- `SKILLS: Record<stageId, Skill[]>`。Skill = `{ id, name, gen }`。
- `genProblem(stageId)` → 均等抽選（ボス戦用）。
- `genProblem(stageId, save.skillStats)` → **苦手優先**の重み付き抽選（練習用）。
  重み = `1 + まちがい率 × 2.5`（未挑戦は率0.5扱い）。
- 正誤は Battle が `record-skill` を dispatch → `skillStats["stageId:skillId"] = {o, x}`。
- 習熟度: `skillLevelOf`（3問未満=none / 正答率80%↑=good / 60%↑=mid / 未満=weak）。
  チップの色分け（Field3D の SkillChips）と きろく画面（Records.tsx）が使う。
- **新しい技能の追加**: SKILLS の該当ステージ配列に `S('id', '表示名', genFn)` を足すだけ。
  4択は `mc(text, answer, wrongCandidates)`（重複除去・不足時は数字でパディング）。

## モンスター・装備の追加方法

- モンスター: `bodies.tsx` にアーキタイプ追加（箱ブロック `B` ヘルパーで組む）→
  `config.ts` の `ZONES[stageId].look / bossLook` に割当。opts 配列でバリエーション
  （pointears / horn / trunk / hood / tophat / nowings / mini / bee / sting / bigclaw / fan / bigtail）。
- 武器・盾: `gear.tsx` の switch に itemId を追加。原点=握り、刃は+Y方向、高さ0.6〜1.0目安。
- 王冠の高さはアーキタイプ別に `Monster.tsx` の `CROWN_Y` で調整。

## ⚠️ 落とし穴（すでに踏んだ地雷）

1. **drei の `<Sky>` は three r185 と組むと画面全体が描画不能**（真っ黒）。
   使わず `<color attach="background">`＋`<fog>` で空を表現している。戻さないこと。
2. **Claude のブラウザペイン（開発検証環境）は document.visibilityState='hidden'**。
   rAF と ResizeObserver が発火せず R3F が完全停止する。対策が
   `HiddenPaneDriver`（MessageChannel で advance() を30fps駆動）と
   `useHiddenPaneResizeKick`（resizeイベント強制発火で canvas 計測を起動）。
   **どちらも `import.meta.env.DEV` 限定**。本番の実ブラウザでは素の rAF で動く。
   新しい Canvas を追加したら、この2つを必ず入れること（BattleHero.tsx が例）。
3. **forwardRef にコールバックrefを渡すと、子の中で `ref.current` は読めない**。
   Monster.tsx は内部 `root` ref とマージしている。同じパターンを踏襲すること。
4. **練習勝利→ボス直行時、Battle に `key={stageId-mode}` が必須**（App.tsx）。
   ないと勝利状態が次の戦闘に引き継がれる。
5. **時限演出（0.3〜1秒）の動作確認をスクリーンショットで行う場合**、
   ツール往復が8秒を超えるため、アニメ時間を一時的に20〜30秒へスローモーション化
   してから撮影し、終わったら必ず戻す。
6. troika-text（drei `<Text>`）はこの環境でフォントロードが刺さるため未使用。
   3D内の文字はすべて drei `<Html>`（zIndexRange=[8,0] でHUDの下に敷く）。
7. エンカウント直後の再突入防止: プレイヤーが動き出すまで＋1.2秒は衝突判定をスキップ
   （Scene.tsx `hasMoved` / `bornAt`）。モンスターの徘徊範囲はゾーン入口から z で 5.5
   以上離す（`zBounds`）。

## セーブデータ

- localStorage キー `sansu-quest-save-v1`。`load()` は `{ ...initialSave, ...parsed }`
  でマージするため、**フィールド追加は initialSave にデフォルトを足すだけで後方互換**。
- 破壊的変更をする場合はキーを `-v2` に上げて移行コードを書くこと。

## 未着手のアイデア（優先度順の提案）

1. ミス時にモンスターの反撃アニメ（体当たり＋ゆうしゃがのけぞる）
2. ボス戦の中断セーブ（44問は長い。進捗を save に持たせる）
3. 歩行時の腕振り・足踏みアニメ
4. 地面のブロックタイル化（今は平面プレーン）
5. きろく画面のCSV書き出し（先生が成績参考資料に使える）
