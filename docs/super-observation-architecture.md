# AETERNA-NATURAL v1.6 Super Observation Architecture

## 概要

v1.6 Super Observation Architecture は、AETERNA 内部で起きていることを  
**セル単位・metric 単位・レイヤー単位・時間単位・質問単位で観測できる基盤**を確立する。

今回は新しい dynamics を追加せず、観測基盤のデータモデルと UI foundation のみを実装した。

---

## 実装ファイル

### 型定義

| ファイル | 内容 |
|---|---|
| `src/types/cellObservation.ts` | `CellObservation` / `CellObservationInput` / `CellRegionLabel` 型定義 |

### 観測ロジック

| ファイル | 内容 |
|---|---|
| `src/observation/deriveCellObservation.ts` | セル単位統合観測データを組み立てる純関数 + `cellRegionIdFromIndex` |

### UI Foundation

| ファイル | 内容 |
|---|---|
| `src/ui/inspector/cellInspectorState.ts` | selected cell / selected metric / active lens の UI state と transitions |
| `src/ui/lens/metricLensRegistry.ts` | Metric Visual Lens レジストリ（17 lenses, 5 groups） |
| `src/ui/lens/lensContextPacket.ts` | `LensContextPacket` 型 + `buildLensContextPacket()` |
| `src/ui/inspector/aiGuideContextInterface.ts` | `AiGuideContext` 型 + `buildAiGuideContext()` (LLM 呼び出しなし) |

### テスト

| ファイル | 内容 |
|---|---|
| `src/tests/observation/deriveCellObservation.test.ts` | deriveCellObservation の単体テスト |
| `src/tests/ui/cellInspector.test.ts` | Inspector state / Lens registry / Context packet / Guide context の単体テスト |

---

## CellObservation データモデル

`CellObservation` は 1 セルの統合観測レコードで、以下のグループで構成される：

```
geometry   — i, j, majorAngle, minorAngle, regionLabel, areaElement, gaussianCurvature, meanCurvature, innerOuterBias
field      — amplitude, phase, phaseCoherenceLocal, flowContinuityLocal, energyThroughputLocal
vortex     — candidateConfidence, topologicalCharge, phaseWinding, amplitudeMinimum, nearestCandidateId
membrane   — deformation, permeability, tension, actuationImprint, returnImprint, twoSidedness
plasticity — accumulatedTrace, vortexTrace, repeatedFlowTrace, localExcitabilityTrace, membraneTrace, resistanceScale, runtimeApplied
ratios     — involvedObservedRatioIds, strongestReferenceMatchLabel, strongestMatchStrength
events     — recentEventIds, recentEventCount, lastEventTick
diagnostics — valueKinds (per group), missingFieldCount, hasUnavailableSource
```

### CellRegionLabel

`minorAngle (v)` から純粋幾何学的に導出される：

| ラベル | 条件 |
|---|---|
| `outerRim` | cos(v) > 0.5 |
| `innerRim` | cos(v) < −0.5 |
| `upperRim` | sin(v) > 0.5 |
| `lowerRim` | sin(v) < −0.5 |
| `neutral`  | それ以外 |

---

## CellInspectorState

```
selectedCellIndex  : number | null   — 選択セル（null = 未選択）
selectedMetricId   : string | null   — 選択 metric path（null = 全体概観）
activeLensId       : MetricLensId | null — アクティブ Visual Lens
panelOpen          : boolean         — パネル開閉
lastChangedAt      : number          — 最終更新タイムスタンプ
```

State transitions は pure function として実装：

- `selectCell(state, cellIndex)` — セル選択
- `selectMetric(state, metricId, lensId?)` — metric 選択 + lens 連動
- `activateLens(state, lensId)` — Lens 切り替え
- `toggleInspectorPanel(state)` — パネル開閉
- `resetCellInspector(state)` — リセット

---

## Metric Visual Lens Registry

17 種類の Metric Visual Lens を定義：

| グループ | Lens ID |
|---|---|
| geometry | gaussianCurvature, areaElement, innerOuterBias |
| field | fieldAmplitude, fieldPhase, phaseCoherence, flowContinuity, energyThroughput |
| vortex | vortexConfidence, topologicalCharge |
| membrane | membraneDeformation, membraneTension, membranePermeability, twoSidedness |
| plasticity | plasticityTrace, resistanceScale |
| ratios | observedRatioMatch |

各 Lens は以下を持つ：
- `observationPath` : CellObservation のフィールドパス
- `valueKind` : measured / derived / proxy
- `disclaimer` : 科学的注意書き
- `displayRange` : 表示スケール範囲
- `colorHex` : 表示色（TORUS_COLOR_MAP 規約に準拠）

---

## LensContextPacket

セル + Lens が選択されたときに生成されるコンテキストバンドル：

```
timestamp           : number
tick?               : number
cellObservation     : CellObservation
activeLens          : MetricLens | null
highlightedMetricValue : number | string | null | undefined
contextSummary      : string   (例: "cell (i=1, j=1) — Gaussian Curvature: 0.100000 m⁻²")
epistemicNote       : string   (lens の disclaimer から)
```

---

## AI Guide Context Interface

`AiGuideContext` は将来の v1.9 AI Guide 統合に向けたインターフェース定義。  
**v1.6 では LLM / 外部 API 呼び出しは一切行わない。**

```
implicitQuestion   : string   ("What is the X at this cell?")
cellIndex          : number
cellPosition       : { i, j } | null
metricEntries      : AiGuideMetricEntry[]
activeLensDescription : string | null
primaryMetric      : AiGuideMetricEntry | null
epistemicGuard     : string   (FIXED — consciousness / life proof 禁止文)
completeness       : 'complete' | 'partial' | 'minimal'
```

### EPISTEMIC_GUARD

すべての AiGuideContext に固定テキストとして含まれる：

> All values are observer-side measurements, derived proxies, or observer estimates from the  
> AETERNA torus field simulation. High values are NOT proof of life, consciousness, emotion,  
> intelligence, meaning, or self-awareness. Low values are NOT failures.  
> Interpret all metrics as field physics / geometry observations only.

---

## 設計方針

### runtime 変更なし

- `deriveCellObservation` は純関数 (no side effects)
- `CellInspectorState` は UI-only state
- Lens 切り替えは visual presentation のみを変更
- dynamics を変更しない

### Fake visual なし

- `candidateConfidence` は VortexObservationState の実値から導出
- `phaseCoherenceLocal` は実際の phase buffer の cos 距離平均
- 欠損データは `undefined`、invented value は一切なし

### Epistemic status 明示

- すべての CellObservation グループに `valueKinds` として  
  `measured | derived | proxy | unavailable` を記録
- 各 Lens に `valueKind` と `disclaimer` を持たせる
- AiGuideContext に `EPISTEMIC_GUARD` を常に含める

### regionId 規約

- `u{i}-v{j}` を全体で統一 (WeakPlasticity / VortexCandidate 等と同一規約)
- `cellRegionIdFromIndex(index, segments)` で一元管理

---

## 完了条件

- [x] `CellObservation` 型がある
- [x] `CellObservationInput` 型がある
- [x] `deriveCellObservation` がある（純関数）
- [x] geometry / field / vortex / membrane / plasticity / ratios / events が統合される
- [x] `CellInspectorState` がある
- [x] `selectCell` / `selectMetric` / `activateLens` / `toggleInspectorPanel` / `resetCellInspector` がある
- [x] `MetricLensRegistry` がある（17 lenses）
- [x] `LensContextPacket` 型がある
- [x] `buildLensContextPacket` がある
- [x] `AiGuideContext` 型がある
- [x] `buildAiGuideContext` がある
- [x] `EPISTEMIC_GUARD` が含まれる
- [x] LLM / 外部 API 呼び出しなし
- [x] fake visual / fake glow / fake vortex なし
- [x] semantic / consciousness / mystical proof claim なし
- [x] runtime dynamics を変更していない
- [x] テストがある（deriveCellObservation + cellInspector）
- [x] build が通る

---

## 次のステップ

- v1.7 Deep Inspector / Time Replay: Cell Inspector の時系列表示、tick ごとの観測記録
- v1.8 Causal Trace / Layer Correlation: セル間の因果関係トレース、レイヤー相関
- v1.9 Lens-aware AI Guide: LensContextPacket を使った実際のガイド表示
- v2.0 Observation UX Final Polish: タップ → セル選択 → 全 metric 表示の完全 UX
