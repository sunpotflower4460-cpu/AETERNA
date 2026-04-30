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

## 2.6 U3 Scientific Torus Renderer — 実装原則補足

U3 で導入した renderer modules に適用される原則を補足する。

### renderer module 一覧（U3 新規）

| ファイル | 役割 |
|---|---|
| `src/types/torusRenderState.ts` | レンダー状態型定義 |
| `src/ui/render/torusColorMap.ts` | 色と観測値の対応（固定） |
| `src/ui/render/torusLayerRegistry.ts` | 観測レイヤーレジストリ |
| `src/ui/render/torusCoverageMetrics.ts` | coverage metrics 計算 |
| `src/ui/render/torusDiagnosticWarnings.ts` | diagnostic warnings 計算 |
| `src/ui/render/torusRenderModeManager.ts` | レンダーモード状態管理・DOM sync |

### renderer modes

| モード | 説明 |
|---|---|
| **raw** | 実値に最も近い表示。smoothing 最小。 |
| **smooth** | presentation smoothing 適用（`[S]` と明記）。 |
| **overlay** | 複数観測レイヤーを重ねる表示。値を混ぜない。 |
| **diagnostic** | grid, coverage, NaN/Infinity/clipping 警告を表示。 |

### normalization modes

| モード | 説明 |
|---|---|
| **global** | 全体の最大値を基準にスケール。全体比較向き。 |
| **local** | 表示中の最大値を基準にスケール。`[local norm]` と明記。presentation aid のみ。raw value を変えない。 |

### performance modes

| モード | 説明 |
|---|---|
| **high** | メッシュ・パーティクル・glow を高める。 |
| **balanced** | 標準。 |
| **battery** | particle / bloom / resolution を抑える。 |
| **diagnostic** | 値の確認を優先。bloom = 0。 |

performance mode は表示品質のみを制御する。field dynamics / simulation tick は変更しない。

---

## 2.7 U4 Field Layer Visualization — 実装原則補足

U4 で導入した field layer visualization modules に適用される原則を補足する。

### field layer registry modules（U4 新規）

| ファイル | 役割 |
|---|---|
| `src/ui/render/fieldLayerRegistry.ts` | Field Layer Registry（FieldLayerDefinition / FieldLayerId / FieldLayerValueKind） |
| `src/ui/render/fieldLayerOverlayRules.ts` | Overlay composition rules（maxOpacity / priority / blendMode） |
| `src/ui/render/fieldLayerSummaries.ts` | Per-layer status summaries（U5 Now Summary 接続準備） |

### FieldLayerValueKind

| valueKind | 定義 |
|---|---|
| **measured** | field buffer またはパケットから直接読んだ値（変換なし） |
| **derived** | 1つ以上の raw 値から計算された値 |
| **proxy** | 直接測れない概念の代理指標 |
| **presentation-smoothed** | 表示用に時間的・空間的に平滑化した値（`[S]` と明記必須） |

### Layer Overlay Rules

各 layer は以下の overlay rule を持つ：

| field | 説明 |
|---|---|
| `maxOpacity` | overlay mode での最大透明度（0–1） |
| `priority` | z-order（高いほど前面） |
| `defaultBlendMode` | normal / additive / screen / multiply |
| `maxSimultaneousLayers` | 同時表示推奨上限（超えると opacity 削減） |

- riskOverlay: priority 最高（常に前面）
- protoNetworkCandidate: maxOpacity 最低（non-semantic proxy は目立たせない）
- additive blend は energyActivity / actuationPulse / localExcitability のみ
- 複数 additive 同時 ON で overbright が検出可能（`detectOverbright()` 関数）

### Semantic Disclaimer 義務

closureMatch / traceResidue / localExcitability / repeatedFlowPath / protoNetworkCandidate / actuationPulse は各 layer 定義の `disclaimer` フィールドに semantic disclaimer を持つ。tooltip でも表示すること。

### Proto-Network Candidate layer の禁止事項

- runtime graph / network edge を作成しない
- semantic network / knowledge graph として描かない
- region ID を semantic label として扱わない
- pathCandidateId を semantic relation として扱わない

---

## 関連文書

- `docs/scientific-ui-ux-principles.md` — Scientific UI/UX 原則
- `docs/ui-information-architecture.md` — UI 情報アーキテクチャ
- `docs/torus-visualization-requirements.md` — トーラス表示要件
- `docs/natural-emergence-principles.md` — Natural Emergence 原則
- `docs/implementation-language-guardrails.md` — 実装言語の禁止事項
