# Torus Visualization Requirements

## 目的

トーラスを本当にトーラスとして見せ、一部だけに energy が通っているように誤解されない表示を実現するための要件を固定する。

---

## U1 レイアウト要件（Layer A: Main Field View）

U1 では以下のレイアウト要件を実装した：

| 要件 | 状態 |
|---|---|
| トーラス表示領域を最大化する | ✅ 全画面 canvas-container |
| 初期表示でトーラス全体が見える | ✅ パネル初期折りたたみ |
| パネルが閉じている時、トーラスが画面の大半を占める | ✅ Research Panel は折りたたみ |
| パネル表示中でも、トーラスが完全に隠れない | ✅ PC: 右サイドパネル / Mobile: 下シート |
| background は深い宇宙系の暗色 | ✅ #010205 |

---

## 4.1 必須操作

| 操作 | 要件 |
|---|---|
| **drag rotate** | マウスドラッグ / タッチドラッグでトーラスを任意の角度に回転できる |
| **pinch / wheel zoom** | ピンチ操作またはホイールスクロールでズームできる |
| **double tap reset view** | ダブルタップ / ダブルクリックでデフォルトビューに戻せる |
| **mobile gesture support** | タッチデバイスでも回転・ズームが操作できる |
| **auto rotate** | オプションで自動回転を有効にできる（デフォルトは off） |
| **view presets** | 以下のプリセットビューを切り替えられる |

**view presets：**

| プリセット名 | 説明 |
|---|---|
| Front | 正面から見たデフォルトビュー |
| Top | 上から見た俯瞰ビュー |
| Side | 横から見たビュー |
| Inside Rim | トーラスの内側リムから見たビュー |
| Energy Flow View | Energy Flow が見やすい角度・色設定 |
| Trace View | Trace / Residue が見やすい角度・色設定 |
| Closure View | Closure Match が見やすい角度・色設定 |
| Diagnostic View | region id, coverage, raw intensity を確認するビュー |

---

## 4.2 Full Torus Visibility

一部だけに見える問題を避けるために、以下を要件とする：

| 要件 | 説明 |
|---|---|
| **full torus surface visibility** | トーラスの全表面が表示される（裏側含む） |
| **backside faint display** | カメラから見えない裏側は faint（薄い半透明）で表示する |
| **subtle torus grid** | 薄いグリッドでトーラスの形状を把握しやすくする |
| **inactive surface faintly visible** | activity がゼロに近い領域も faint で表示し、全体の形が分かるようにする |
| **activity coverage map** | どの領域に activity があるかを一覧できる coverage map を提供する |
| **global / local normalization toggle** | global normalization（全領域の最大値基準）と local normalization（各領域の最大値基準）を切り替えられる |
| **raw / smoothed toggle** | raw 表示と presentation-smoothed 表示を切り替えられる |

---

## 4.3 一部だけ流れて見える問題の診断

一部だけに energy が見える場合、以下の2種類を区別する：

### A. 実際に一部だけ活動している

field 状態として、一部領域にしか activity がない場合。

**表示すべきもの：**

- active region concentration（活動領域の集中度）
- inactive region count（活動のない領域の数）
- local excitability map（局所励起性マップ）
- return influence overlay（戻りの影響分布）

### B. 表示上、一部だけに見えている

実際は全体に activity があるが、表示設定により一部だけに見える場合。

**確認すべき項目：**

- camera angle（角度による遮蔽）
- mesh density（メッシュ密度の偏り）
- particle sampling（サンプリング密度の偏り）
- shader intensity scale（輝度スケールの偏り）
- bloom intensity（bloom が局所的に強すぎる）
- depth sorting（奥行き処理の問題）
- alpha blending（透明度の処理問題）
- color range clipping（色域のクリッピング）
- hidden backside visibility（裏面が非表示になっていないか）

---

## 4.4 Scientific Renderer 設計方針

トーラスレンダラーは以下の方針で設計する：

- **fake energy を追加しない**: 値のない場所を光らせない
- **fake flow を描かない**: field に存在しない流れを線で描かない
- **presentation smoothing は明示する**: smoothing を使う場合は `[S]` などで UI に示す
- **raw / smoothed を切り替えられる**: Diagnostic モードでは常に raw に戻せる
- **coverage を確認できる**: どの領域が描画されているかを確認できる Diagnostic ビューを持つ

---

## 関連文書

- `docs/scientific-ui-ux-principles.md` — Scientific UI/UX 原則
- `docs/visualization-integrity-principles.md` — 可視化の整合性原則
- `docs/ui-information-architecture.md` — UI 情報アーキテクチャ
- `docs/ui-ux-roadmap.md` — U0〜U8 ロードマップ（U2, U3, U4 にて実装）
