# Visualization Integrity Principles

## 目的

AETERNA の可視化が「嘘の生命感」にならないようにするための原則を固定する。

Visualization must not create phenomena that are not present in the underlying field or observation state.

---

## 2.1 fake visual 禁止

### 禁止例

```
addFakeEnergy()
addOrganicWobble()
addLifeLikeSparkle()
forceBeautifulFlow()
randomGlowWhenQuiet()
```

これらは、実際の field 状態に存在しない現象を視覚的に作り出すものである。  
AETERNA は Scientific Visualization であり、観測値の翻訳のみを行う。

### 推奨例

```
mapFieldValueToColor()
mapTraceResidueToOpacity()
mapReturnInfluenceToLine()
mapClosureMatchToArc()
mapLocalExcitabilityToSurfaceHeat()
```

これらは、実際の観測値を視覚形式へ翻訳するものである。

---

## 2.2 Raw / Smoothed / Presentation 切り替え原則

以下の表示モードを用意する方針とする：

| モード | 説明 |
|---|---|
| **Raw** | 実値に最も近い表示。荒くてもよい。 |
| **Scientific Smooth** | 観測しやすくするために補間・平滑化した表示。 |
| **Layer Overlay** | Energy + Trace, Return + Closure など複数観測レイヤーを重ねる表示。 |
| **Diagnostic** | region id, raw packet, NaN, saturation, coverage を確認する表示。 |

切り替え時は、現在どのモードで表示しているかを UI 上に明示する。

---

## 2.3 値と色の対応

色は意味や感情ではなく、観測値に対応させる。

### 推奨カラーパレット

| 色 | 対応する観測値 |
|---|---|
| Blue / Cyan | flow / ongoing activity |
| Green | recovery / viability range |
| White | high coherent activity |
| Purple | trace / residue |
| Orange | return / echo |
| Red | saturation / overload risk のみ |
| Dark | low activity / low return |

### 注意

- 赤黒い印象になりすぎないよう、通常状態は青・緑・白・紫を基調にする
- 赤は危険や飽和の限定表示に留める
- 色は意味や感情ではなく観測値に対応する
- 同じ色が複数の意味を持たないよう整理する

---

## 2.4 表示ラベルと用語の原則

UI に表示するラベルは以下の基準に従う：

- consciousness / self-awareness / emotion / feeling / desire / will を用語として使わない
- activity / flow / trace / return / closure / excitability / residue / echo など観測語を優先する
- raw / derived / proxy / smoothed の区分をラベルに含める（可能な場合）
- 「生きている」「感じている」「考えている」のような断定文を使わない

---

## 2.5 presentation smoothing の明記義務

presentation smoothing / interpolation を使用する場合は、以下のいずれかで明示する：

- UI 上に `[smoothed]` / `[S]` などのラベルを添える
- Raw モードへの切り替えボタンを提供する
- Diagnostic モードでは必ず raw 値を確認できるようにする

---

---

## 2.6 U3: Scientific Torus Renderer 実装方針（✅ 完了）

U3 では以下の原則をコードとして実装した：

### 実装済みファイル

| ファイル | 役割 |
|---|---|
| `src/types/torusRenderState.ts` | Renderer state 型（TorusRenderMode / TorusNormalizationMode / TorusPerformanceMode / TorusRenderState / TorusCoverageMetrics / TorusDiagnosticWarnings） |
| `src/ui/render/torusColorMap.ts` | 色と観測値の固定マッピング（Blue/Cyan=flow, Green=recovery, White=coherent, Purple=trace, Orange=return, Red=saturation のみ） |
| `src/ui/render/torusLayerRegistry.ts` | 観測レイヤーレジストリ（8 layers, visibility flags, value type labels） |
| `src/ui/render/TorusRenderModeToggle.ts` | Raw / Smooth[S] / Overlay / Diagnostic モード切り替え UI helper |
| `src/ui/render/TorusLayerLegend.ts` | 色とレイヤーの対応を示す legend UI helper |
| `src/ui/render/TorusCoveragePanel.ts` | Coverage metrics（activeRegionCount / activeCoverageRatio / concentration / visibleCoverageRatio）|
| `src/ui/render/TorusDiagnosticOverlay.ts` | Diagnostic warnings（NaN / Infinity / clipping / overbright / backside / coverage）|
| `src/ui/render/TorusPerformanceSelector.ts` | Performance mode（High / Balanced / Battery / Diagnostic）|
| `src/tests/ui/scientificTorusRenderer.test.ts` | Smoke tests（fake visual なし / runtime 未変更 / semantic claim なし 確認含む）|

### 主要方針

- Raw / Smooth[S] / Overlay / Diagnostic の 4 mode が定義された
- Smooth mode は `[S]` マーカーで presentation smoothing を明記
- Local normalization は `[L]` マーカーで presentation aid であることを明記
- inactive surface は faint に残す（COLOR_INACTIVE_DARK, inactiveSurfaceOpacity）
- Coverage map で「実際の field 偏り」と「表示上の偏り」を区別できる
- Diagnostic warnings で NaN / Infinity / clipping / overbright を検出する
- Red は saturation / overload risk 専用（通常状態では使わない）
- fake visual 関数（fakeEnergy / fakeFlow / fakeTrace / artificialFluctuation 等）は追加していない
- runtime dynamics / field calculation / energy / trace / return は変更していない

---

## 関連文書

- `docs/scientific-ui-ux-principles.md` — Scientific UI/UX 原則
- `docs/ui-information-architecture.md` — UI 情報アーキテクチャ
- `docs/torus-visualization-requirements.md` — トーラス表示要件
- `docs/natural-emergence-principles.md` — Natural Emergence 原則
- `docs/implementation-language-guardrails.md` — 実装言語の禁止事項
