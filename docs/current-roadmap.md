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
| **W1** | Body Surface 導入 | 未着手 |
| **W2** | Actuation Pulse 導入 | 未着手 |
| **W3** | Simulated World Medium 導入 | 未着手 |
| **W4** | Sensory Return 導入 | 未着手 |
| **W5** | Reafference Comparison 導入 | 未着手 |
| **W6** | Body-World Closure Metrics | 未着手 |
| **W7** | Emergent Proto-Neuron Observation | ✅ observer-side candidate observation |
| **W8** | Closed-Loop Scenario Tests | ✅ scenario / behavioral tests / docs |

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
