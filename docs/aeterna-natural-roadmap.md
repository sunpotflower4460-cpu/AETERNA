# AETERNA Natural Roadmap

## N0 Geometry / Dynamics Audit

現在の core dynamics を geometry / field / constants / observer-runtime boundary の観点から監査し、比較基準を固定する。  
runtime は変更しない。

## N1 Curved Torus Metric

flat torus 更新から、曲率と面積要素を持つ curved torus metric へ進む。  
inner rim / outer rim の幾何差が flow にどう入るかを明示する。

Implemented in N1 as:

- torus geometry cell generation
- area / curvature / tangent / normal validation
- flat / curved metric ablation mode
- observer/UI geometry exposure with default runtime still flat

## N2 Complex Scalar Field

単一実数場から complex scalar field へ進む。  
amplitude / phase / phase gradient を導入するが、semantic interpretation はしない。

Implemented in N2 as:

- guarded `ComplexFieldState` / `ComplexFieldConfig`
- observer-side amplitude / phase / phase-gradient derivation
- reproducible quiet seeding for real / imag buffers
- observer-side vortex candidate detection with topological charge
- `fieldPhase` / `vortexCandidate` layer registration
- default scalar runtime preserved

## N3 Curvature × Vortex Coupling

曲率場と位相欠陥候補の相互作用を observer-side から監査する。  
vortex はまず candidate として扱い、意味づけしない。

Implemented in N3 as:

- observer-side `CurvatureVortexCouplingState` type
- `deriveCurvatureVortexCoupling()` — pure function combining N1 geometry + N2 vortex observation
- `signedTotalCharge` / `chargeDeviation` topological check (expected 0 on torus)
- five curvature bands with per-band vortex density statistics
- five geometric regions (outerRim / innerRim / upperRim / lowerRim / neutral)
- `curvatureVortexCorrelation` (Pearson, curvature at vortex site vs confidence)
- `curvatureBiasStrength` proxy
- `deriveVortexPairs()` — proximity-based ±-charge pair detection
- `compareFlatCurvedVortexStats()` — flat vs curved snapshot comparison scaffolding
- `curvatureVortexCoupling` field layer in registry (overlay/diagnostic, default OFF)
- `deriveNowSummary` extended with coupling observation lines
- docs/curvature-vortex-coupling.md

## N4 Boundary as Mediating Layer

boundary を単なる wrap 条件ではなく、媒介層として整理する。  
膜的なふるまいを入れても、soul / self boundary の主張には進まない。

## N5 Weak Plasticity Channel

observer-side と runtime の間に極小の plasticity channel を 1 本だけ導入する。  
必ず tiny / ablatable / non-semantic に保つ。

Implemented in N5 as:

- `WeakPlasticityConfig` / `defaultWeakPlasticityConfig` — triple-gated safety config
- `WeakPlasticityCellTrace` / `WeakPlasticityState` — per-cell trace accumulation types
- `createWeakPlasticityState()` / `updateWeakPlasticityState()` — core logic with decay, clamp, NaN guard
- `getResistanceScale()` — triple-gate runtime accessor (returns 1.0 unless all gates open)
- `WeakPlasticityObservationState` / `deriveWeakPlasticityObservation()` — observer-side summary
- `weakPlasticityTrace` field layer (defaultVisible=false, diagnostic/overlay only, multiply blend)
- Event timeline, Now Summary, Guide integration (neutral observational language only)
- docs/weak-plasticity-channel.md, metrics-protocol.md N5 section, vocabulary N5 section
- Tests: weakPlasticity.test.ts, weakPlasticityObservation.test.ts, weakPlasticityLayer.test.ts
- Default: enabled=false, ablationEnabled=true, mode=observeOnly (no runtime impact)

## N6 External Constants Removal / Observed Ratios

`PHI_INV` や `SCHUMANN_RES` のような外来定数を core update equations から外し、可能なら observer/reference ratio へ移す。  
研究比較のための observed ratio は残してよい。

## N7 Long-Run Comparison Suite

N0〜N6 の差分を長時間シナリオで比較できる suite を固定する。  
geometry, field, plasticity, constants removal の影響を見える化する。

## v1.0 Stabilization

N0〜N7 実装後の安定化・安全化・比較可能化フェーズ。

**Status:** ✅ 完了 (2026-05-01)

目的:
- `AeternaNaturalRuntimeConfig` で N-series config を一括管理
- 7 つの presets (safeBaseline / geometryPreview / complexObserverPreview / naturalObserverSuite / plasticityObserveOnly / fullNaturalExperimental / legacyComparison)
- Safety gate (validateAeternaNaturalConfig) — safe / research / experimental mode 階層
- Runtime Mode HUD — 今どの mode で動いているか UI で可視化
- `NaturalDiagnosticState` — NaN / Infinity / saturation / clamp を統合診断
- Long-run execution profiles (test / default / full) — CI は test のみ
- 5 つの stabilization tests (config / presets / safety gate / forbidden claims / feedback leak / constants leak)
- docs/aeterna-natural-v1-stabilization.md

詳細: docs/aeterna-natural-v1-stabilization.md

## v1.1 Observation UX Polish（次フェーズ候補）

v1.0 安定化後の次候補。  
NaturalDiagnosticState / Runtime Mode HUD / long-run profiles の UI 表示をより詳しく整備する。

## v1.3 Research Scenarios / Preset Experiments

**Status:** ✅ 完了 (2026-05-05)

目的:
- `ResearchScenario` 型 — seed / ticks / sampleEveryTicks / preset を明示した再現可能な観測シナリオ
- `RESEARCH_SCENARIO_REGISTRY` — 10 シナリオ (quietBaseline / singlePulseReturn / repeatedGentlePulse / phaseVortexEmergence / curvatureBiasObservation / membraneOverlapObservation / plasticityTraceObservation / neutralVsLegacyConstants / observedRatioSurvey / longRunNaturalComparison)
- `PresetExperiment` 型 — ResearchScenario × runtime preset の具体的な観測ユニット
- `PRESET_EXPERIMENT_REGISTRY` — 14 preset experiments (E01–E14)
- Lookup helpers: `getResearchScenario` / `getPresetExperiment` / `getExperimentsForScenario`
- Tests: `src/tests/scenario/researchScenarios.test.ts`
- docs: `docs/research-scenarios-preset-experiments.md`

詳細: docs/research-scenarios-preset-experiments.md

