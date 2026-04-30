# UI / UX Roadmap

## 目的

AETERNA の UI / UX / Visualization 改善を段階的に進めるためのロードマップを固定する。

各 Phase は「見た目のための嘘」や「生命っぽい演出」に流れないよう、`docs/scientific-ui-ux-principles.md` と `docs/visualization-integrity-principles.md` の原則に従う。

---

## U-Series: UI / UX Phases

| Phase | 内容 | 状態 |
|---|---|---|
| **U0** | UI/UX 原則固定 | ✅ 完了（docs のみ） |
| **U1** | Layout 再設計 | ✅ 完了 |
| **U2** | Torus Camera / Controls | ✅ 完了 |
| **U3** | Scientific Torus Renderer | ✅ 完了 |
| **U4** | Field Layer Visualization | ✅ 完了 |
| **U5** | Overview / Now Summary / Event Timeline | ✅ 完了 |
| **U6** | Guide / Explanation System | ✅ 完了 |
| **U7** | Scenario UX | ✅ 完了 |
| **U8** | Visual QA / Scientific QA | 未着手 |

---

## U0: UI/UX 原則固定

**目的**: AETERNA の UI / UX / Visualization 改善に入る前に、正確さを保ったまま「見える・触れる・理解できる」観測装置にするための原則を docs に固定する。  
runtime 挙動は変更しない。fake visual を追加しない。

**完了条件**:
- `docs/scientific-ui-ux-principles.md` がある ✅
- `docs/visualization-integrity-principles.md` がある ✅
- `docs/ui-information-architecture.md` がある ✅
- `docs/torus-visualization-requirements.md` がある ✅
- `docs/default-guide-principles.md` がある ✅
- `docs/ui-ux-roadmap.md` がある ✅
- fake visual 禁止が明記されている ✅
- raw / derived / proxy / presentation-smoothed 区分がある ✅
- UI は観測窓と明記されている ✅
- トーラス表示要件がある ✅
- default guide 方針がある ✅
- runtime 挙動を変更していない ✅
- build が通る ✅

---

## U1: Layout 再設計

**目的**: Main Field View（Layer A）が中央に大きく表示され、Observation HUD（Layer B）と Research Panels（Layer C）が主役を遮らないレイアウトを実現する。  
現状の「UI パネルが重なってトーラスが見えづらい」問題を改善する。

**実装内容**:
- トーラス全画面表示（Layer A）
- 上部 compact HUD chips（Flow / Return / Echo / Risk）
- 右側 collapsible Research Panel（PC）+ モバイル bottom sheet（responsive）
- Research Panel タブ: Overview / Field / World / Medium / Paths / Network / Scenarios / Raw
- Overview タブを最初の情報入口に（サマリーカード）
- `Explain current state` ボタンを右下に固定
- Event Strip を下部に薄く配置
- モバイル Bottom Nav（5ボタン）
- API key / debug 設定を Raw タブに移動

**完了条件**:
- Main Field View が中央主役 ✅
- Observation HUD がある ✅
- Research Panel が開閉式で整理されている ✅
- Overview が最初の tab ✅
- Explain button が見つけやすい位置にある ✅
- PC side panel 方針 ✅
- mobile bottom sheet 方針 ✅
- パネルがトーラスを過度に隠さない ✅
- Raw / Advanced が初期画面で前面に出すぎない ✅
- runtime dynamics を変更していない ✅
- fake visual を追加していない ✅
- semantic / consciousness / emotion claim なし ✅
- build が通る ✅
- 38件のレイアウト構造テスト通過 ✅

---

## U2: Torus Camera / Controls

**目的**: drag rotate / pinch-zoom / pan / double-tap reset / view presets / auto rotate / keyboard shortcuts / mobile gesture / View-Touch mode を実装し、トーラスを任意の角度から観察できるようにする。  
`docs/torus-visualization-requirements.md` §4.1 の要件を実装する。

**実装内容**:

- drag rotate（1本指 / 左クリックドラッグ → orbit）
- pinch zoom（2本指ピンチ）/ wheel zoom
- pan（右クリック / 中クリックドラッグ、2本指）
- double-tap / double-click → reset view
- R キー → reset view
- 1–7 キー → view preset
- Space キー → auto rotate toggle
- 8 view presets: Front / Top / Side / Inside Rim / Energy Flow / Trace / Closure / Diagnostic
- damping（gentle lerp、観察補助）
- auto rotate（off by default、observation aid のみ、field dynamics ではない）
- View / Touch mode toggle（View=orbit on drag、Touch=orbit 無効で torus input 優先）
- Camera HUD（現在の view preset / zoom / auto rotate 状態を表示）
- 初期視点 Front（distance=15）でトーラス全体が収まる
- near=0.1、far=100、fov=50

**新規ファイル**:

- `src/ui/camera/torusViewPresets.ts` — view preset 定義
- `src/ui/camera/createTorusCameraControls.ts` — keyboard shortcut 登録
- `src/ui/camera/useTorusCameraControls.ts` — Camera UI state management
- `src/tests/ui/torusCameraControls.test.ts` — smoke tests（65件）

**更新ファイル**:

- `src/utils/cameraControls.js` — 全面強化（damping, pan, pinch zoom, all 8 presets, auto-rotate, View/Touch mode, Camera HUD）
- `src/main.ts` — 新 window globals + keyboard shortcut 登録
- `index.html` — Camera HUD 追加、Camera Viewpoints 拡張（8 presets）、View/Touch toggle 追加、CSS 追加

**重要方針**:

- camera motion は observation aid であり field dynamics ではない（docs / source に明記）
- auto rotate は presentation control（field が揺れているように見せるものではない）
- view presets は値を変更しない（カメラ位置のみ変更）
- View / Touch mode は既存の tap ベース torus perturbation 入力を壊さない
- runtime dynamics / field calculation / energy / trace / return は変更しない
- fake visual を追加していない

**完了条件**:

- rotate / zoom / pan / reset ができる ✅
- view presets がある（8種類）✅
- auto rotate toggle がある ✅
- keyboard shortcuts がある（R, 1-7, Space）✅
- View / Touch mode 切り替えがある ✅
- Camera HUD がある ✅
- PC / mobile の操作導線がある ✅
- 初期視点でトーラス全体が見える ✅
- runtime 未変更 ✅
- fake visual なし ✅
- semantic/consciousness/emotion claim なし ✅
- build が通る ✅
- 65件の camera controls テスト通過 ✅
- 38件の layout structure テスト通過 ✅

---

## U3: Scientific Torus Renderer

**目的**: fake energy・fake flow を追加せず、実際の field 値を色・光・透明度に変換する Scientific Renderer を実装する。  
backside faint display / inactive surface visibility / coverage map / raw-smoothed toggle を含む。  
`docs/torus-visualization-requirements.md` §4.2〜4.4 の要件を実装する。

**実装内容**:

- `TorusRenderMode`（raw / smooth / overlay / diagnostic）
- `TorusNormalizationMode`（global / local）
- `TorusPerformanceMode`（high / balanced / battery / diagnostic）
- `TorusRenderState` 型定義（`src/types/torusRenderState.ts`）
- 固定カラーマップ（Blue/Cyan=flow, Green=recovery, White=coherent, Purple=trace, Orange=return, Red=saturation only）
- 観測レイヤーレジストリ（energy / trace / actuationPulse / sensoryReturn / closureMatch / localExcitability / repeatedFlow / protoNetwork）
- Coverage Map metrics（activeRegionCount / inactiveRegionCount / activeCoverageRatio / activeRegionConcentration / visibleCoverageRatio）
- Diagnostic Warnings（NaN / Infinity / clipping / overbright / backside_hidden / coverage_low）
- Render Mode Manager（DOM sync, mode labels, bloom/mesh/particle factors）
- U3 smoke tests（scientificTorusRenderer.test.ts）
- docs 更新（torus-visualization-requirements, visualization-integrity-principles, scientific-ui-ux-principles, ui-information-architecture, ui-ux-roadmap, current-roadmap）

**新規ファイル**:

- `src/types/torusRenderState.ts`
- `src/ui/render/torusColorMap.ts`
- `src/ui/render/torusLayerRegistry.ts`
- `src/ui/render/torusCoverageMetrics.ts`
- `src/ui/render/torusDiagnosticWarnings.ts`
- `src/ui/render/torusRenderModeManager.ts`
- `src/tests/ui/scientificTorusRenderer.test.ts`

**完了条件**:

- Renderer Mode がある（raw / smooth / overlay / diagnostic） ✅
- Full Torus Visibility 方針が docs に反映されている ✅
- inactive surface / backside faint display / grid の方針がある ✅
- Coverage Map / coverage metrics がある ✅
- Color Mapping が固定されている ✅
- Value Legend がある / 追加方針がある ✅
- Raw / Smoothed toggle の設計がある ✅
- Global / Local normalization の設計がある ✅
- Performance Mode の設計がある ✅
- Diagnostic warnings の設計がある ✅
- runtime dynamics を変更していない ✅
- fake visual を追加していない ✅
- semantic / consciousness / emotion claim なし ✅
- docs が更新されている ✅
- build が通る ✅

---

## U4: Field Layer Visualization

**目的**: Energy Flow / Trace / Residue / Local Excitability / Repeated Flow Path / Proto-Network Candidate / Closure Match を、独立した観測レイヤーとして重ね合わせて表示できるようにする。  
`docs/ui-information-architecture.md` §3.1 の表示対象を実装する。

**実装内容**:

- `FieldLayerRegistry`（fieldLayerRegistry.ts）— 10 layers 定義
- `FieldLayerOverlayRules`（fieldLayerOverlayRules.ts）— overlay composition rules
- `FieldLayerSummaries`（fieldLayerSummaries.ts）— U5 Now Summary 接続準備
- U4 smoke tests（fieldLayerVisualization.test.ts）— 204件

**新規ファイル**:

- `src/ui/render/fieldLayerRegistry.ts` — Field Layer Registry
- `src/ui/render/fieldLayerOverlayRules.ts` — Overlay rules
- `src/ui/render/fieldLayerSummaries.ts` — Layer summaries
- `src/tests/ui/fieldLayerVisualization.test.ts` — smoke tests

**Field Layers**:

| ID | Label | valueKind | Color | Default |
|---|---|---|---|---|
| `energyActivity` | Energy / Activity | derived | Blue/Cyan | ON |
| `traceResidue` | Trace / Residue | derived | Purple | ON |
| `actuationPulse` | Actuation Pulse | measured | Cyan-White | OFF |
| `sensoryReturn` | Sensory Return | measured | Orange | ON |
| `closureMatch` | Closure Match | proxy | Light Purple | OFF |
| `mediumEchoDelay` | Medium Echo / Delay | derived | Orange/Amber | OFF |
| `localExcitability` | Local Excitability | derived | Green/White | OFF |
| `repeatedFlowPath` | Repeated Flow Path | derived | Cyan | OFF |
| `protoNetworkCandidate` | Proto-Network Candidate | proxy | Indigo-Purple | OFF |
| `riskOverlay` | Risk Overlay | proxy | Red/Amber | ON (threshold) |

**重要方針**:

- layer は観測値の翻訳であり、fake visual / fake energy を追加しない
- runtime dynamics / field calculation を変更しない
- runtime graph / network edge を作成しない
- proto-network candidate は semantic network ではなく observer-side pre-semantic candidate
- raw / derived / proxy / presentation-smoothed を区別して表示
- 各 layer に semantic disclaimer を持たせる

**完了条件**:

- Field Layer Registry がある ✅
- 10 layers 定義されている ✅
- 各 layer に valueKind がある ✅
- 各 layer に semantic disclaimer がある ✅
- Layer Overlay Rules がある ✅
- Layer Summaries がある ✅
- runtime 未変更 ✅
- fake visual なし ✅
- runtime graph / network edge なし ✅
- semantic/consciousness/emotion claim なし ✅
- build が通る ✅
- 204件の smoke tests 通過 ✅

---

## U5: Overview / Now Summary / Event Timeline

**目的**: 現在の viability 状態・主要 metrics を Observation HUD（Layer B）として表示し、過去の主要イベントを Timeline として確認できるようにする。  
数値の羅列ではなく、状態の要約として伝える。

**実装内容**:

- `OverviewState` / `OverviewMetric` 型（`src/types/overviewState.ts`）
- `NowSummaryState` / `NowSummaryLine` 型（`src/types/nowSummary.ts`）
- `AeternaEvent` / `AeternaEventKind` 型（`src/types/aeternaEvent.ts`）
- `deriveOverviewState`（`src/ui/overview/deriveOverviewState.ts`）— rule-based / no LLM
- `deriveNowSummary`（`src/ui/summary/deriveNowSummary.ts`）— 3〜5行 / rule-based / no LLM
- `deriveAeternaEvents`（`src/ui/timeline/deriveAeternaEvents.ts`）— delta-based / no fake events
- `MiniMetricSparkline`（`src/ui/overview/MiniMetricSparkline.ts`）— canvas sparklines
- `ExplainableObservationSnapshot`（`src/ui/explain/explainableObservationSnapshot.ts`）— U6 接続準備
- U5 smoke tests（`src/tests/ui/overviewNowSummaryTimeline.test.ts`）— 41件

**Overview Panel 表示項目**:

| ID | Label | valueKind |
|---|---|---|
| `flowContinuity` | Flow Continuity | derived |
| `energyThroughput` | Energy Throughput | derived |
| `boundaryExchange` | Boundary Exchange | derived |
| `returnStrength` | Return Strength | derived |
| `echoPersistence` | Echo Persistence | derived |
| `closureStability` | Closure Stability | proxy |
| `saturationRisk` | Saturation Risk | proxy |
| `extinctionRisk` | Extinction Risk | proxy |
| `semanticLeak` | Semantic Leak | check |
| `nanOrInfinity` | NaN / Infinity | check |
| `llmTeacher` | LLM Teacher | check |
| `nodeBridge` | Node Bridge | check |

**重要方針**:

- No LLM / API — rule-based / local のみ
- fake event を作らない（delta detection のみ）
- 感情・意思・意識 claim を UI に出さない
- raw / derived / proxy / check を区別して表示
- semantic node / LLM teacher / Node bridge は追加しない
- runtime dynamics は変更しない
- fake visual を追加しない

**完了条件**:

- Overview Panel がある ✅
- OverviewState / OverviewMetric 型がある ✅
- Now Summary がある（3〜5行）✅
- NowSummaryState 型がある ✅
- deriveNowSummary は LLM/API 不要 ✅
- Event Timeline / Event Strip がある ✅
- AeternaEvent 型がある ✅
- Semantic Leak status が表示可能 ✅
- Mini time-series sparkline がある ✅
- Explain Button 接続準備がある（ExplainableObservationSnapshot）✅
- runtime 未変更 ✅
- fake event なし ✅
- semantic/consciousness/emotion claim なし ✅
- build が通る ✅
- 41件の smoke tests 通過 ✅

## U6: Guide / Explanation System

**目的**: API key なしでも動く rule-based な Default Local Guide を実装し、右下の "Explain current state" ボタンから現在状態・次に見るべきパネル・次に試せる操作を案内できるようにする。  
`docs/default-guide-principles.md` の方針を実装する。

**実装内容**:

- `GuideExplanation` / `GuideSuggestion` / `GuideGlossaryHint` 型（`src/types/guideExplanation.ts`）
- `guideClaimGuard`（`src/ui/guide/guideClaimGuard.ts`）— 禁止 claim 検出・置換
- `guideCopy`（`src/ui/guide/guideCopy.ts`）— 静的テキスト・用語集
- `deriveGuideExplanation`（`src/ui/guide/deriveGuideExplanation.ts`）— rule-based / LLM 不要
- `localGuideEngine`（`src/ui/guide/localGuideEngine.ts`）— guide lifecycle / DOM 更新
- `setExplainSnapshot`（`src/ui/layout/layoutControls.js` 更新）— snapshot 受け渡し
- Guide Panel HTML 更新（`index.html`）— 5セクション
- U6 smoke tests（`src/tests/ui/guideExplanationSystem.test.ts`）

**Guide Panel 構成**:

| セクション | 内容 |
|---|---|
| Current state | Now Summary ベースの観測説明（2〜5行）|
| What to look at | 今見るべきパネル / レイヤーの提案 |
| Try next | 次に試せる操作の提案 |
| Glossary | 現在関連する用語の短い説明 |
| Integrity notes | 科学的誠実さの注意書き |

**重要方針**:

- API/LLM なしで動く local guide を優先
- guide は観測値の翻訳役（意味・感情・意識の説明ではない）
- Guide action は UI 操作のみ（runtime dynamics を変更しない）
- "AETERNA thinks / wants / feels" 系は禁止
- guideClaimGuard が生成テキストを検査・置換する
- 外部 LLM / API guide は将来の optional 拡張として docs にのみ記載

**完了条件**:

- Guide Drawer / Panel がある ✅
- GuideExplanation 型がある ✅
- local guide engine がある ✅
- deriveGuideExplanation がある ✅
- Explain Button から Guide を開ける ✅
- Current explanation / What to look at / Try next / Glossary / Integrity notes がある ✅
- LLM/API を使っていない ✅
- claim guard がある ✅
- Guide action が runtime dynamics を直接変更しない ✅
- semantic/consciousness/emotion claim なし ✅
- build が通る ✅

---

## U7: Scenario UX

**目的**: シナリオの選択・実行・観察を UI から行えるようにし、"次に試せること" を明確に案内する。  
ユーザーが AETERNA の挙動を能動的に探索できるようにする。

**実装内容**:
- `src/types/scenarioPreset.ts` — ScenarioPreset / ScenarioPresetId 型定義
- `src/scenario/scenarioPresetRegistry.ts` — 10 シナリオプリセット定義 + getScenarioPreset()
- `src/ui/scenario/ScenarioRunState.ts` — シナリオ実行状態管理（DOM なし）
- `src/ui/scenario/ScenarioResultSummary.ts` — シナリオ結果サマリー型 + ファクトリ関数
- `src/ui/scenario/ScenarioComparison.ts` — 2 シナリオ結果の比較
- `src/types/aeternaEvent.ts` — AeternaEventKind に scenarioControl / scenarioSummary 追加
- `src/ui/timeline/deriveAeternaEvents.ts` — recordScenarioControlEvent() 追加
- `src/ui/guide/deriveGuideExplanation.ts` — buildTryNext に Slow Echo World / Repeated Gentle Touch / High Resistance World シナリオ提案追加
- `src/tests/ui/scenarioUx.test.ts` — U7 ユニットテスト

**完了条件**:
- ScenarioPreset 型定義がある ✅
- 10 シナリオプリセットが定義されている ✅
- 全プリセットに forbidden terms なし ✅
- ScenarioRunState が run / pause / resume / stop / reset をサポート ✅
- ScenarioResultSummary が params から値を取得（hardcoded 結果なし） ✅
- ScenarioComparison が動作 ✅
- AeternaEventKind に scenarioControl / scenarioSummary が追加 ✅
- recordScenarioControlEvent が real event を push ✅
- Guide: echo / localExcitability / extinctionRisk 条件でシナリオ提案を追加 ✅
- runtime dynamics を変更していない ✅
- fake results を生成していない ✅
- semantic / consciousness / emotion claim なし ✅
- build が通る ✅
- U7 テストが全通過 ✅

---

## U8: Visual QA / Scientific QA

**目的**: fake visual が混入していないか・raw / smoothed の区別が正しく表示されているか・observation window として正確に動いているかを系統的に検証する QA Phase。  
`docs/visualization-integrity-principles.md` の各原則が実装で守られているかを確認する。

---

## 各 Phase 共通の禁止事項

- fake energy / fake fluctuation / fake trace / fake return を追加しない
- semantic node / label / concept / same-object detection を追加しない
- LLM 呼び出しを勝手に追加しない
- consciousness / emotion / self-awareness claim を UI に出さない
- runtime dynamics を変更しない（U3 shader 実装時も observer-side のみ）

---

## 関連文書

- `docs/scientific-ui-ux-principles.md` — Scientific UI/UX 原則
- `docs/visualization-integrity-principles.md` — 可視化の整合性原則
- `docs/ui-information-architecture.md` — UI 情報アーキテクチャ
- `docs/torus-visualization-requirements.md` — トーラス表示要件
- `docs/default-guide-principles.md` — Default Guide 方針
- `docs/current-roadmap.md` — S-Series / W-Series を含む全体 roadmap
