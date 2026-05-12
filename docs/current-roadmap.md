# Current Roadmap

- PR1 repo hygiene
- PR2 baseline
- PR3 local prediction
- PR4 touch prediction error
- PR5 bridge
- PR6 metrics/tests
- PR7 touch pattern
- PR8-B proto-meaning bridge
- PR8-A structured prior rewrite
- PR9-A mode
- PR10-C state architecture
- PR11 minimal survival + action loop
- N1 curved torus metric baseline
- N2 complex scalar field observer
- N0–N7 + v1.0 Stabilization ✅ 完了 (2026-05-01)
- AETERNA-NATURAL v1.1 Observation UX Polish ✅ 完了 (2026-05-02)
- AETERNA-NATURAL v1.3 Research Scenarios / Preset Experiments ✅ 完了 (2026-05-05)
- AETERNA-NATURAL v1.5 App Packaging / Deployment Readiness ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v1.6 Super Observation Architecture ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v1.7 Deep Inspector / Time Replay ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v1.8 Causal Trace / Layer Correlation ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v1.9 Lens-aware AI Guide ✅ 完了 (2026-05-07)
- AETERNA-NATURAL v2.0 Observation UX Final Polish ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v2.1 Final QA / Release Audit ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v2.2 Public Demo Polish / Landing Copy ✅ 完了 (2026-05-07)
- AETERNA-NATURAL v2.6.5 Current State Audit / Core Boundary Freeze ✅ 完了 (2026-05-07)
- AETERNA-NATURAL v2.7 今起きていること要約パネル / Now Summary Panel ✅ 完了 (2026-05-08)
- AETERNA-NATURAL v3.8 Membrane→Internal 境界 (zero step) ✅ 完了 (2026-05-11)
- AETERNA-NATURAL v3.9 Chain integration test (External→Medium→Membrane→Substrate) ✅ 完了 (2026-05-11)
- AETERNA-NATURAL v4.0 cell-granularity 保存観測面 / Conservation chain section ✅ 完了 (2026-05-11)
- AETERNA-NATURAL v4.1 curvature-weighted exchange (structure / mean = 1) ✅ 完了 (2026-05-11)
- AETERNA-NATURAL v4.2 curvature-weighted exchange (drive / globalGain) ✅ 完了 (2026-05-11)
- AETERNA-NATURAL v4.3-a dynamicCore shadow ledger (observer-only) ✅ 完了 (2026-05-11)
- AETERNA-NATURAL v4.3-b 散逸先を名指す (numeric-invariant) ✅ 完了 (2026-05-11)
- AETERNA-NATURAL v4.3-c substrate-backed currentBuffer injection ✅ 完了 (2026-05-11)
- AETERNA-NATURAL v4.4 baseline oscillator 解体 ✅ 完了 (2026-05-11)

## Planned Observation Maturity Phases

- v2.4 Japanese-first UI / Terminology — planned (not yet implemented)
- v2.5 First-time Onboarding / Observation Route — planned (not yet implemented)
- v2.6 Lens Explanations / Glossary Enhancement — planned (not yet implemented)
- v2.6.5 Current State Audit / Core Boundary Freeze — ✅ complete (2026-05-07)
- v2.7 Now Summary Panel — next
- v2.8 Vital Stem Mode — planned
- v2.9 Signal Handshake Observatory — planned
- v3.0 Consciousness-Candidate Protocol Suite — planned

## Phase 1: 持続する生命場の再確認と安定化

**目的**: AETERNAが外部刺激なしでも消えずに動き続ける生命場として成立しているかを確認し、必要なら最小修正で安定化する。

**位置づけ**: 意味形成・proto-point・Node bridge より前に、ongoingness (持続性) を最優先とする段階。

**Phase 1 の完了条件**:
- no-input 長時間シナリオ (5000 tick 以上) がある
- collapse しないことを確認できる (collapseRate < 5%)
- saturation しないことを確認できる (saturationRate < 2%)
- ongoingness 指標が整理されている
- quiet baseline floor が確認または安定化されている
- observer / scenario / docs に反映されている
- build が通る
- organism core の意味を壊していない

**優先方針**:
- no behavior break
- semantic 機能を足さない
- baseline を派手にしすぎない
- quiet 時の消失と long-run の暴走を避ける
- observer は研究用であり、本体因果を壊さない

## U-Series: UI / UX Phases

AETERNA の UI / UX / Visualization 改善を段階的に進める。
各 Phase は `docs/scientific-ui-ux-principles.md` の原則に従い、fake visual・演出的揺らぎを追加しない。

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
| **U8** | Visual QA / Scientific QA | ✅ 完了 |

詳細は `docs/ui-ux-roadmap.md` を参照。

### U0 完了条件

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

## S-Series: Natural Emergence Phases

AETERNA の次段階（W-Series の後）では、自然発生原則に基づく条件実装を進める。
揺らぎ・安定・proto-neuron / proto-network は、条件から自然に観測される結果として扱う。

| Phase | 内容 | 状態 |
|---|---|---|
| **S0** | Natural Emergence Principles 固定 | ✅ 完了（docs のみ） |
| **S1** | Flow / Resistance / Dissipation Audit | ✅ 完了（2026-04-27） |
| **S2** | Dynamic Viability State | ✅ 完了（2026-04-27） |
| **S3** | Minimal Natural Feedback | ✅ 完了（2026-04-27） |
| **S4** | Delay / Echo / Resistance Profile | ✅ 完了（2026-04-28） |
| **S5** | Local Excitability Field | ✅ 完了（2026-04-28） |
| **S6** | Path Formation by Repeated Flow | ✅ 完了（2026-04-28） |
| **S7** | Proto-Network Candidate Observation | ✅ 完了 |
| **S8** | Long-Run Natural Emergence Scenarios | ✅ 完了 |

### S0 完了条件

- natural-emergence-principles.md がある ✅
- world-loop-dynamic-viability.md がある ✅
- proto-network-natural-observation.md がある ✅
- implementation-language-guardrails.md がある ✅
- roadmap に S0〜S8 が追加されている ✅
- 「揺らぎを直接足さない」原則が明記されている ✅
- 「安定化を命令として実装しない」原則が明記されている ✅
- proto-neuron / proto-network は observer-side candidate と明記されている ✅
- semantic leak 禁止が維持されている ✅
- runtime 挙動を変更していない ✅

### S1 完了条件

- flow-resistance-dissipation-audit.md がある ✅
- W0〜W8 の各層について flow/resistance/dissipation/delay/boundary/local coupling/threshold/trace の監査がある ✅
- artificial fluctuation risk が確認されている ✅
- command-style stabilization risk が確認されている ✅
- semantic leak risk が確認されている ✅
- naturalEmergenceAudit.test.ts がある ✅
- language guardrails が更新されている（S1 追記） ✅
- immediate minimal fixes / next-phase candidates が整理されている ✅
- runtime 挙動を大きく変えていない ✅
- build が通る ✅（予定）

### S2 完了条件

- `DynamicViabilityState` 型がある ✅
- `deriveDynamicViabilityState` がある ✅
- `flowContinuity / energyThroughput / dissipationBalance / resistanceBalance / delayCoherence / boundaryExchange` が導出される ✅
- `underCouplingRisk / overCouplingRisk / saturationRisk / extinctionRisk / viabilityConfidence` が導出される ✅
- observer / scenario / metrics / docs に反映されている ✅
- command-style stabilization を追加していない ✅
- semantic leak がない ✅
- runtime loop を直接 feedback で変更していない ✅
- build が通る ✅（要確認）

### S3 完了条件

- `NaturalFeedbackAdjustment` 型がある ✅
- `deriveMinimalNaturalFeedback(...)` がある ✅
- adjustment が微弱範囲に clamp されている ✅
- over / under coupling / delay / dissipation imbalance から adjustment が導出される ✅
- 適用先が `World Medium` / `Sensory Return` / `Actuation Pulse` / `Body Surface` / `Trace` に限定されている ✅
- ablation flag がある ✅
- observer / metrics / scenario / docs に反映されている ✅
- command-style stabilization を追加していない ✅
- artificial fluctuation を追加していない ✅
- semantic leak がない ✅
- build が通る ✅

### S4 完了条件

- `DelayProfileState` / `EchoProfileState` / `ResistanceProfileState` がある ✅
- `MediumProfileState` と `deriveMediumProfileState(...)` がある ✅
- `deriveDelayProfile(...)` / `deriveEchoProfile(...)` / `deriveResistanceProfile(...)` がある ✅
- observer / metrics / scenario / docs に反映されている ✅
- S3 feedback へ直接強く接続していない ✅
- command-style stabilization を追加していない ✅
- artificial fluctuation を追加していない ✅
- semantic leak がない ✅
- build が通る ✅

### S5 完了条件

- `LocalExcitabilityCell` / `LocalExcitabilityFieldState` 型がある ✅
- `deriveLocalExcitabilityField(...)` がある ✅
- excitability / thresholdProximity / refractoryDepth / recoveryProgress / traceResidue / returnInfluence / propagationTendency / localResistance / localDissipation が導出される ✅
- observer / metrics / scenario / docs に反映されている ✅
- S6 Path Formation の前段として位置づけられている ✅
- runtime neuron node を配置していない ✅
- semantic leak がない ✅
- build が通る ✅

### S6 完了条件

- `RepeatedFlowPathCandidate` 型がある ✅
- `RepeatedFlowPathObservationState` 型がある ✅
- `deriveRepeatedFlowPaths(...)` がある ✅
- sequential activation / repeated occurrence / delay consistency / trace support / replay affinity / closure coupling が導出される ✅
- observer / metrics に Repeated Flow Path が表示される ✅
- scenario / behavioral test がある ✅
- docs に S6 の位置づけが追記されている ✅
- runtime edge を作っていない ✅
- path weight 強化を実装していない ✅
- semantic leak がない ✅
- build が通る ✅


### U8 完了条件

- `docs/visual-qa-checklist.md` がある ✅
- `docs/scientific-qa-checklist.md` がある ✅
- `docs/language-claim-qa.md` がある ✅
- `docs/performance-qa-notes.md` がある ✅
- `docs/manual-visual-baseline-checklist.md` がある ✅
- `docs/ui-ux-qa-report.md` がある ✅
- `src/tests/ui/languageClaimGuard.test.ts` がある ✅
- `src/tests/ui/fakeVisualGuard.test.ts` がある ✅
- `src/tests/ui/rawSmoothDiagnosticMode.test.ts` がある ✅
- runtime dynamics を変更していない ✅
- fake visual / fake event を追加していない ✅
- semantic / consciousness / emotion claim を UI copy から除去 ✅
- build が通る ✅

---

## W-Series: Body-World Closure Phases

AETERNA を「内側で生きるトーラス場」から「世界と閉じて呼吸するトーラス生命場」へ進めるための段階。
意味形成は行わない。proto-neuron は自然発生する観測候補として扱う。

| Phase | 内容 | 状態 |
|---|---|---|
| **W0** | Body-World Closure 原則固定 | ✅ 完了（docs のみ） |
| **W1** | Body Surface 導入 | ✅ 完了 (`src/body/deriveBodySurfaceState.ts`, `src/types/bodySurfaceState.ts`) |
| **W2** | Actuation Pulse 導入 | ✅ 完了 (`src/actuation/deriveActuationPulse.ts`, `src/types/actuationPulse.ts`) |
| **W3** | Simulated World Medium 導入 | ✅ 完了 (`src/world/updateWorldMedium.ts`, `src/types/worldMediumState.ts`; v3.x `src/world/spatialWorldMedium.ts` は並列) |
| **W4** | Sensory Return 導入 | ✅ 完了 (`src/perception/deriveSensoryReturn.ts`, `src/perception/sensoryReturnToPerturbation.ts`, `src/types/sensoryReturnPacket.ts`) |
| **W5** | Reafference Comparison 導入 | ✅ 完了 (`src/closure/deriveReafferenceComparison.ts`, `src/types/reafferenceComparisonState.ts`) |
| **W6** | Body-World Closure Metrics | ✅ 完了 (`src/closure/deriveBodyWorldClosureState.ts`, `src/types/bodyWorldClosureState.ts`) |
| **W7** | Emergent Proto-Neuron Observation | ✅ observer-side candidate observation |
| **W8** | Closed-Loop Scenario Tests | ✅ scenario / behavioral tests / docs |

W1–W6 はもともと W7/W8 を支える前段として早期に実装されていたが、roadmap の status marker が `未着手` のままだった (stale marker)。D1 でマーカーを更新し、`docs/w-series-implementation-summary.md` に W1–W8 の types / derivers / tests を一覧した。outflow chain (Buffer → Actuation → World → Sensory → Membrane) の pair-ledger 規律は v3.8 → v4.4 の inflow chain と並列に D2 以降で land する。

### W0 完了条件

- body-world-closure-principles.md がある ✅
- emergent-proto-neuron-principles.md がある ✅
- world-medium-spec.md / actuation-pulse-spec.md / reafference-comparison-spec.md / body-world-closure-metrics.md がある ✅
- roadmap に W0〜W8 が追記されている ✅
- AETERNA は意味ノードを先に持たないことが明記されている ✅
- proto-neuron は自然発生する観測候補であると明記されている ✅
- runtime 挙動を変えていない ✅

---

## Phase 2: 外乱受容と prediction mismatch の純化

**目的**: 入力を生命場を開始するトリガーではなく、すでに流れている場を乱す perturbation として整理し、prediction mismatch を state-dependent に立てられるようにする。

**Phase 2 の完了条件**:
- PerturbationEvent 型がある
- PredictionMismatchState 型がある
- perturbation 導出 helper がある
- mismatch 導出 helper がある
- same touch, different state の最小差が確認できる
- scenario / observer / metrics / docs に反映されている
- build が通る
- organism core の意味を壊していない

**優先方針**:
- no behavior break
- touch pipeline を全面置換しない
- input は ongoing baseline に重なる perturbation
- mismatch は state-dependent
- semantic interpretation に進まない


### W7 完了条件

- `ProtoNeuronCandidate` / `ProtoNeuronObservationState` がある
- `deriveProtoNeuronCandidates` がある
- excitability / refractory / propagation / trace / recurrence / co-activation / weak plasticity / closure coupling が導出される
- observer / metrics / scenario summary に proto-neuron 観測が反映される
- semantic leak test がある
- runtime neuron node を配置していない
- Node bridge を本格実装していない

### W8 完了条件

- `ClosedLoopScenarioSummary` 型がある ✅
- `runClosedLoopScenario` / `runClosedLoopScenarioSuite` がある ✅
- W8-A〜W8-J の 10 scenario がある ✅
- `semanticLeakCount = 0` が全 scenario で検証される ✅
- `nanOrInfinityCount = 0` が全 scenario で検証される ✅
- behavioral tests がある ✅
- docs に W8 の位置づけが追記されている ✅
- runtime neuron node 未配置 ✅
- Node bridge 未実装 ✅
- semantic / consciousness claim なし ✅
- build が通る ✅

---

## S5: Local Excitability Field

**目的**: AETERNA のトーラス生命場の局所領域ごとの「発火しやすさの条件」を Local Excitability Field として観測する。

これは neuron node の配置ではなく、pre-neural / pre-semantic な field profile です。

**実装済み**:
- `src/types/localExcitabilityField.ts` — LocalExcitabilityCell + LocalExcitabilityFieldState 型
- `src/observer/deriveLocalExcitabilityField.ts` — observer-side pure function
- `src/tests/behavioral/localExcitabilityField.test.ts` — 13 behavioral tests
- `src/tests/scenario/localExcitabilityScenario.ts` — S5-A〜S5-H シナリオ
- `src/experiments/runScenario.ts` — MetricsSnapshot / ScenarioResult / ループ / サマリーへの統合
- docs 更新: update-cycle / metrics-protocol / natural-emergence-principles / implementation-language-guardrails / current-roadmap

### S5 完了条件

- `LocalExcitabilityCell` 型がある ✅
- `LocalExcitabilityFieldState` 型がある ✅
- `deriveLocalExcitabilityField` がある ✅
- excitability / thresholdProximity / refractoryDepth / recoveryProgress / traceResidue / returnInfluence / propagationTendency / localResistance / localDissipation が導出される ✅
- observer / metrics に Local Excitability Field が表示される ✅
- scenario / behavioral test (S5-A〜S5-H) がある ✅
- docs に Local Excitability Field の位置づけが追記されている ✅
- neuron node を配置していない ✅
- path formation はまだ実装していない ✅
- semantic leak がない ✅
- build が通る ✅

### 次のステップ

- S6: Path Formation by Repeated Flow — Local Excitability Field を前提条件として使用
- S7: Proto-Network

## S7: Proto-Network Candidate Observation

**目的**: S6 Repeated Flow Path Candidate のグループを観察し、network-like な統計パターンが見られるかを observer-side に記録する。

これは semantic network / concept graph / knowledge graph ではなく、pre-semantic な network-like observation candidate です。

**実装済み**:
- `src/types/protoNetworkCandidate.ts` — ProtoNetworkCandidate + ProtoNetworkObservationState 型
- `src/observer/deriveProtoNetworkCandidates.ts` — observer-side pure function
- `src/tests/behavioral/protoNetworkCandidate.test.ts` — 13 behavioral tests
- `src/tests/scenario/protoNetworkCandidateScenario.ts` — S7-A〜S7-I シナリオ
- `src/experiments/runScenario.ts` — MetricsSnapshot / ScenarioResult / ループ / サマリーへの統合
- docs 更新: update-cycle / metrics-protocol / natural-emergence-principles / implementation-language-guardrails / current-roadmap

### S7 完了条件

- `ProtoNetworkCandidate` 型がある ✅
- `ProtoNetworkObservationState` 型がある ✅
- `deriveProtoNetworkCandidates` がある ✅
- coActivationStrength / propagationStrength / recurrenceStrength / traceCorrelation / replayCoReturn / closureCoupling / weakPlasticity / confidence が導出される ✅
- observer / metrics に Proto-Network Candidate が表示される ✅
- scenario / behavioral test (S7-A〜S7-I) がある ✅
- docs に Proto-Network Candidate の位置づけが追記されている ✅
- runtime edge / graph を作っていない ✅
- semantic leak がない ✅
- Node bridge はしない ✅
- build が通る ✅

### 次のステップ

- S8: Long-Run Natural Emergence Scenarios — Proto-Network Candidate を前提条件として使用

## S8: Long-Run Natural Emergence Scenarios

**目的**: S0–S7 の全コンポーネントを長時間ヘッドレス実行し、pre-semantic 構造（フロー継続性、局所励起性グラジエント、反復経路候補、プロトネットワーク候補）が自然条件下で生起するかを観測する。

これは生命・意識・知性の証明ではない。純粋に研究・診断目的の長時間自然創発観測です。

**実装済み**:
- `src/types/longRunEmergenceScenarioSummary.ts` — LongRunEmergenceScenarioSummary 型
- `src/tests/scenario/longRunEmergenceScenarioConfig.ts` — LongRunEmergenceScenarioConfig 型
- `src/tests/scenario/runLongRunEmergenceScenario.ts` — ヘッドレスシナリオランナー + スイート + フォーマッター
- `src/tests/behavioral/longRunEmergenceScenarios.test.ts` — S8-A〜S8-L の 27 behavioral tests

S8 verifies long-run natural emergence behavior across quiet, repeated return, delayed return, alternating perturbation, stable/unstable medium, high/low resistance, slow/fast echo, semantic leak, and feedback ablation scenarios. It does not claim life, consciousness, meaning, or intelligence; it only observes whether pre-semantic structures arise from natural conditions over time.

### S8 完了条件

- `LongRunEmergenceScenarioSummary` 型がある ✅
- `LongRunEmergenceScenarioConfig` 型がある ✅
- `runLongRunEmergenceScenario` / `runLongRunEmergenceScenarioSuite` がある ✅
- S8-A〜S8-L の 12 scenario がある ✅
- `semanticLeakCount = 0` が全 scenario で検証される ✅
- `nanOrInfinityCount = 0` が全 scenario で検証される ✅
- behavioral tests (27 tests) がある ✅
- docs に S8 の位置づけが追記されている ✅
- runtime graph 未使用 ✅
- Node bridge 未実装 ✅
- semantic / consciousness claim なし ✅
- build が通る ✅


---

## U7: Scenario UX

**目的**: シナリオ観測条件プリセットの定義と、UI シナリオ実行状態・結果サマリー・比較機能を実装する。  
runtime 挙動は変更しない。fake results は生成しない。

**実装済み**:
- `src/types/scenarioPreset.ts` — ScenarioPreset / ScenarioPresetId 型定義
- `src/scenario/scenarioPresetRegistry.ts` — 10 シナリオプリセット + getScenarioPreset()
- `src/ui/scenario/ScenarioRunState.ts` — シナリオ実行状態管理（DOM なし）
- `src/ui/scenario/ScenarioResultSummary.ts` — 結果サマリー型 + ファクトリ関数
- `src/ui/scenario/ScenarioComparison.ts` — 2 結果の比較
- `src/types/aeternaEvent.ts` — scenarioControl / scenarioSummary を AeternaEventKind に追加
- `src/ui/timeline/deriveAeternaEvents.ts` — recordScenarioControlEvent() 追加
- `src/ui/guide/deriveGuideExplanation.ts` — Guide buildTryNext にシナリオ提案 3 件追加
- `src/tests/ui/scenarioUx.test.ts` — U7 ユニットテスト

U7 は観測条件プリセットのみを実装する。生命・意識・感情・学習の主張はしない。

---

## Energy Realness Phases (v3.8 → v4.4)

`docs/energy-realness-principles.md` の 6 原則 (条件を書く / 散逸先を名指す / 中心バッファ直接注入禁止 / 動力学層も観測層と同じ厳しさ / 何も起きないことも valid / 構造先・駆動後) を動力学層に系統的に適用する段階。

各 phase は `*-zero` (transferCoefficient = 0、構造のみ) → `*-positive` (係数 > 0、流量あり) の規律を守って land。

| Phase | 内容 | kind | 解消した gap |
|---|---|---|---|
| **v3.8** | Membrane→Internal 境界 (zero) | structure | 1 (膜が sink-only) / 2 (substrate 孤立) |
| **v3.9** | Chain integration test (External→Medium→Membrane→Substrate, 1000 tick) | drive verification | 1 / 2 |
| **v4.0** | cell-granularity 保存観測面 / Now Summary "保存則チェーン" セクション | observer | 5 (cell 単位の保存値が見えない) |
| **v4.1** | curvature-weighted exchange (structure, mean = 1) | structure | 4 (flat torus) |
| **v4.2** | curvature-weighted exchange (drive, globalGain) | drive | 4 |
| **v4.3-a** | dynamicCore shadow ledger (observer-only) | observer | 3 (dynamicCore violations) 準備 |
| **v4.3-b** | 散逸先を名指す (numeric-invariant) | structure | 3 |
| **v4.3-c** | substrate-backed currentBuffer injection + 供給切断テスト + lint guard | drive | 3 |
| **v4.4** | baseline oscillator 解体 (Math.sin / BASELINE_AMP 除去) | structure → drive | 3 (最終) |

### v3.8 Membrane→Internal 境界 (zero)

**目的**: SpatialWorldMedium.membraneExchangeField が sink-only だった状態を解消し、`LocalConservationSubstrate.storageField` を chain の "内部側" として吊り下げる。

**実装済み**:
- `src/types/membraneToInternalTransfer.ts` — 型定義
- `src/world/membraneToInternalTransfer.ts` — `updateMembraneToInternalTransferZero` / `updateMembraneToInternalTransferPositive` + pair ledger
- `src/types/spatialWorldMedium.ts` — `membraneExchangeReleasedField` 追加 (累積 outflow 記録)
- `src/world/spatialWorldMedium.ts` — released field の伝播
- `src/world/externalDriveToMediumTransfer.ts` — released field の copy 経路
- `src/tests/world/membraneToInternalTransfer.test.ts` — zero/positive 両方の pair-ledger テスト

### v3.9 Chain integration test

**目的**: `External → Medium → Membrane → Substrate` の chain 全段が、毎 tick `closed` で、総エネルギー保存が崩れないことを end-to-end で検証。

**実装済み**:
- `src/tests/integration/externalToSubstrateChain.test.ts` — 1000 tick steady drive ledger チェック、総保存、clampLoss 境界性、**供給切断テスト** (誰も decay 式を書いていないのに、substrate が drain する)

### v4.0 cell-granularity 保存観測面

**目的**: 保存則チェーンの状態を per-cell と chain-level の両方で観測層に出す。

**実装済み**:
- `src/types/cellObservation.ts` — `conservation` グループ追加 (mediumStorage / Dissipation / Residue / Outflow, membraneInflow / Released, substrateStorage / Dissipation / Residue / Outflow)
- `src/types/cellObservation.ts` — `CellObservationInput` に `spatialWorldMedium` / `localConservationSubstrate` snapshot 追加
- `src/observation/deriveCellObservation.ts` — conservation 値を 'measured' kind で populate
- `src/types/nowSummary.ts` — `ConservationChainLedgerStatus` 型と `conservationChain` section ID
- `src/observer/deriveNowSummary.ts` — `_deriveConservationChain` deriver、9 セクション目として統合、open ledger 検出時に "Energy flow is not yet verified" 警告
- テスト: `src/tests/observation/deriveCellObservation.test.ts` 5 件追加、`src/tests/observer/deriveNowSummary.test.ts` 5 件追加

### v4.1 curvature-weighted exchange (structure)

**目的**: トーラスを "形だけ" から脱却。`torusGeometry.ts` の `areaElement / gaussianCurvature / meanCurvature` を local exchange の per-edge weight に反映。v4.1 では mean = 1 制約を保つ (再分配のみ)。

**実装済み**:
- `src/types/curvatureWeightedExchange.ts` — `CurvatureWeightedExchangeConfig` / `CurvatureWeightFields` 型
- `src/world/curvatureWeightedExchange.ts` — `deriveCurvatureWeights(torusGeometry, config)`
- `src/world/spatialWorldMedium.ts` — `curvatureWeights` config を受け取り、per-edge weighted rate を適用 (反対称 delta 会計を保つ)
- `src/substrate/localConservationSubstrate.ts` — 同等の組み込み
- テスト: flat torus mock で bit-identical 検証

### v4.2 curvature-weighted exchange (drive)

**目的**: v4.1 の "mean = 1" を解除する knob を追加。`globalGainCoefficient` (default 1) を導入。

**実装済み**:
- `CurvatureWeightedExchangeConfig.globalGainCoefficient` 追加
- `weight = (1 + s * (rawNorm - 1)) * globalGain` の合成式
- テスト: globalGain ∈ {0.5, 1, 2, 4} の parametrized ledger テスト、directional drift 観測

### v4.3-a dynamicCore shadow ledger (observer-only)

**目的**: dynamicCore に手を入れず、`*= k` / `+= d` / `= f(t)` の各パターンを before/after snapshot から仮想転送として観測する純粋関数を用意。v4.3-b の回帰基準を作る。

**実装済み**:
- `src/core/dynamicCoreEnergyLedger.ts` — `ShadowLedgerEntry` 型、`deriveMultiplicativeDecayShadow` / `deriveScalarMultiplicativeDecayShadow` / `deriveAdditiveInjectionShadow` / `deriveOverwriteShadow`、`aggregateDynamicCoreShadowLedger`
- `ShadowLedgerEntry` は `snapshotComparable` (データが揃ったか) と `ruleObeyed` (ルールが守られたか) を分離して `'insufficient' > 'open' > 'closed'` の優先順
- テスト: 17 件 — 各 helper の closed/violation/insufficient、aggregator のステータス優先順、6 パターン合成テスト

### v4.3-b 散逸先を名指す (numeric-invariant)

**目的**: v4.3-a で観測した転送を実装に昇格させる。**数値軌道は不変** (`*= k` を helper に隠して bit-exact な float 軌道を保つ)。

**実装済み**:
- `src/core/dynamicCoreNamedDestinations.ts` — `ensureSinkField` / `decayWithSink` / `decayAllFourWeightsWithSink` / `decayScalarWithSink` ヘルパー
- `dynamicCore.ts` の以下を named transfer に:
  - `spikeTrace[i] *= 0.9` → `spikeDecayField`
  - `w_*[i] *= 0.99995` → `weightDecayField`
  - `updateResidue` の `RESIDUE_DECAY` → `residueDecayField` / `residueClampLossField`
  - `triggerNoise` の noise injection → `noiseInjectionConsumedField`
  - `injectPredictionError` → `predictionErrorInjectionConsumedField`
  - `updateBaselineAndResidue` → `baselineInjectionConsumedField` / `residueInjectionConsumedField`
- `relationalState.ts` の `partnerAbsenceDrift *= 0.95` → `relationalDriftDecayAccumulator` (scalar)
- テスト: 11 件 — `ensureSinkField` ライフサイクル、scalar sink helpers、bit-exact numeric invariance

### v4.3-c substrate-backed currentBuffer injection (drive)

**目的**: External → Medium → Membrane → Substrate → CurrentBuffer の全 chain を成立させる。注入は substrate に蓄積された量を超えられない。

**実装済み**:
- `src/types/internalToBufferTransfer.ts` — 型定義
- `src/core/internalToBufferTransfer.ts` — `updateInternalToBufferTransferZero` / `updateInternalToBufferTransferPositive` + pair ledger、`applyInternalToBufferInjectionRequest` (per-cell bounded injection)
- `dynamicCore.ts:triggerNoise` に opt-in flag `network.substrateBackedNoiseInjection`、bare `*=` literal を helper 呼び出しに置換
- `relationalState.ts` の `*= 0.95` も helper に置換
- テスト: 13 件 — pair ledger / per-cell 制限 / **供給切断 end-to-end** / **lint guard** (`*= 0.X` literal が 2 ファイルとも 0)

### v4.4 baseline oscillator 解体

**目的**: `energy-realness-principles.md` が明示禁止する "life-like baseline oscillator" を `dynamicCore.ts` から消す。

**実装済み**:
- `src/core/legacyBaselineOscillator.ts` — 旧 `Math.sin` driven 実装を分離 (bit-exact な back-compat 経路)
- `src/core/emergentBaselineFromSubstrate.ts` — substrate.storageField を読む observation-only deriver
- `dynamicCore.ts:updateBaseline` を dispatcher に縮退 (default: legacy / opt-in: emergent)
- テスト: 17 件 — legacy 数値等価、emergent path 各ケース、time-invariance 検証、**lint guard** (dynamicCore.ts に `Math.sin\s*\(` / `BASELINE_AMP` / 文字列 "Math.sin" がコメント含めて存在しない)

---

## 残作業 (Energy Realness 関連)

- **観測インフラの実行時接続**: v4.0 で deriver は揃ったが、`runScenario` / `runScenarioWithEnergyLedgerVisibility` から ledger status と substrate snapshot を渡す配線がまだ。「保存則チェーン」セクションは現状「未提供」のまま実行される。
- **emergent baseline / substrate-backed noise injection の default 化**: 現在は legacy が default、新パスは opt-in。emergent 環境で既存テストが何を観測するかを慎重に確認してから反転。
- **relationalState.ts の残り decay** (`partnerTraceStrength *= traceDecay`, `partnerFamiliarity *= familiarityDecay` 他): `*= 0.X` lint は通っているが、変数経由なので散逸先未指定の状態。
- **W-Series W1〜W6** (未着手): 出力側 (Actuation Pulse → 世界 → Sensory Return) で chain を閉じる作業。本 v3.8→v4.4 の延長線上にある。
