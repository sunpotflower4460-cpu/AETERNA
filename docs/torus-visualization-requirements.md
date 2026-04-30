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

## 4.1 必須操作（U2 実装済み）

| 操作 | 要件 | 状態 |
|---|---|---|
| **drag rotate** | マウスドラッグ / タッチドラッグでトーラスを任意の角度に回転できる | ✅ U2 |
| **pinch / wheel zoom** | ピンチ操作またはホイールスクロールでズームできる | ✅ U2 |
| **pan** | 右クリックドラッグ / 中クリックドラッグでパンできる | ✅ U2 |
| **double tap reset view** | ダブルタップ / ダブルクリックでデフォルトビューに戻せる | ✅ U2 |
| **R key reset** | R キーでデフォルトビューに戻せる | ✅ U2 |
| **keyboard presets** | 1–7 キーで view preset に切り替えられる | ✅ U2 |
| **Space auto rotate** | Space キーで auto rotate を toggle できる | ✅ U2 |
| **mobile gesture support** | タッチデバイスでも回転・ズームが操作できる | ✅ U2 |
| **auto rotate** | オプションで自動回転を有効にできる（デフォルトは off） | ✅ U2 |
| **view presets** | 以下のプリセットビューを切り替えられる | ✅ U2 |
| **View / Touch mode** | View モードと Touch モードを切り替えられる | ✅ U2 |
| **Camera HUD** | 現在の view preset / zoom / auto rotate を HUD に表示 | ✅ U2 |

**view presets：**

| プリセット名 | キー | 説明 |
|---|---|---|
| Front | 1 | 正面から見たデフォルトビュー |
| Top | 2 | 上から見た俯瞰ビュー |
| Side | 3 | 横から見たビュー |
| Inside Rim | 4 | トーラスの内側リムから見たビュー |
| Energy Flow View | 5 | Energy Flow が見やすい角度 |
| Trace View | 6 | Trace / Residue が見やすい角度 |
| Closure View | 7 | Closure Match が見やすい角度 |
| Diagnostic View | — | 全体形状・coverage を確認しやすい遠景視点 |

**View / Touch Mode：**

| モード | 動作 |
|---|---|
| **View** | ドラッグ → camera orbit（デフォルト）|
| **Touch** | ドラッグ → camera orbit 無効（将来の torus perturbation input 用）|

どちらのモードでも、タップベースの torus perturbation 入力（既存挙動）は維持される。

**注記：**
- camera motion は observation aid であり、field dynamics ではない
- auto rotate は presentation control のみ（field が揺れているように見せるものではない）
- view presets は値を変更しない

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

## U3 実装済み（Scientific Torus Renderer）

U3 で以下の renderer 基盤が実装された。

### 実装済みファイル

| ファイル | 内容 |
|---|---|
| `src/types/torusRenderState.ts` | TorusRenderMode / TorusNormalizationMode / TorusPerformanceMode / TorusRenderState 型 |
| `src/ui/render/torusColorMap.ts` | 固定カラーマップ（観測値 → 色対応） |
| `src/ui/render/torusLayerRegistry.ts` | 観測レイヤー レジストリ（visible flag / color / valueType / label） |
| `src/ui/render/torusCoverageMetrics.ts` | coverage metrics 計算（activeRegionCount, inactiveRegionCount, activeCoverageRatio, activeRegionConcentration, visibleCoverageRatio） |
| `src/ui/render/torusDiagnosticWarnings.ts` | diagnostic warnings（NaN, Infinity, clipping, overbright, coverage_low, backside_hidden） |
| `src/ui/render/torusRenderModeManager.ts` | レンダーモード状態管理・DOM sync |
| `src/tests/ui/scientificTorusRenderer.test.ts` | U3 smoke tests（100件以上） |

### 実装済みレイヤー（layer registry）

| Layer ID | 説明 | valueType |
|---|---|---|
| energy | Energy / Activity | derived |
| trace | Trace / Residue | derived |
| actuationPulse | Actuation Pulse | raw |
| sensoryReturn | Sensory Return | raw |
| closureMatch | Closure Match | proxy |
| localExcitability | Local Excitability | derived |
| repeatedFlow | Repeated Flow Path | derived |
| protoNetwork | Proto-Network Candidate | proxy |

### Coverage Map metrics

| metrics | 説明 |
|---|---|
| `activeRegionCount` | activity がある region の数 |
| `inactiveRegionCount` | activity がない region の数 |
| `activeCoverageRatio` | 活動している region の割合 |
| `activeRegionConcentration` | 活動の集中度（0=均一、1=一点集中） |
| `visibleCoverageRatio` | カメラから見えている surface の推定割合（presentation metric） |
| `maxActivityRegionIndex` | 最も高い活動を持つ region の index |
| `meanActiveRegionActivity` | active region の平均活動値 |

### Diagnostic Warnings

| warning id | severity | 説明 |
|---|---|---|
| `nan` | error | NaN 値が field buffer に存在する |
| `infinity` | error | Infinity 値が field buffer に存在する |
| `clipping` | warn | clipping threshold を超えた値が存在する |
| `overbright` | info | overbright threshold を超えた値が存在する |
| `backside_hidden` | info | backside 表示が無効になっている |
| `coverage_low` | info | active coverage ratio が低い |

---

## 関連文書

- `docs/scientific-ui-ux-principles.md` — Scientific UI/UX 原則
- `docs/visualization-integrity-principles.md` — 可視化の整合性原則
- `docs/ui-information-architecture.md` — UI 情報アーキテクチャ
- `docs/ui-ux-roadmap.md` — U0〜U8 ロードマップ（U2, U3, U4 にて実装）
