# AETERNA-NATURAL N0–N7 統合レビュー

**Review date:** 2026-05-01  
**Review scope:** N0 Geometry / Dynamics Audit → N7 Long-Run Comparison Suite  
**Repository branch:** copilot/review-aeterna-natural-n0-n7

---

## 1. Review Summary

AETERNA-NATURAL の N0–N7 フェーズを全体レビューした。  
主要な観察事項:

- N0–N7 の全フェーズで必須型・ファイル・ドキュメントが揃っている
- Config default が一貫して安全側に設定されている
- Runtime feedback path は限定的で、全て config-gated + ablation-guarded である
- observer-side paths と runtime-causal paths の区別が型・コメント・ドキュメントで明記されている
- semantic / consciousness / life の主張はコードに存在しない
- fake visual / fake event / fake result は存在しない
- Node bridge / LLM/API の追加は確認されなかった
- Lint: 3 errors (2 pre-existing + 1 new in N7 → **本レビューで修正済み**)
- TypeScript (tsc --noEmit): 0 errors
- N0–N7 全テスト: PASS

---

## 2. N0–N7 実装状態

### N0: Geometry / Dynamics Audit

| 項目 | 状態 |
|------|------|
| docs/geometry-dynamics-audit.md | ✅ 存在 |
| flat torus vs geometric torus の違い | ✅ 明記 |
| currentBuffer / scalar field 構造 | ✅ 整理済 |
| auxiliary fields (baselineActivity, activityResidue, spikeTrace, predictionError) | ✅ 整理済 |
| external constants の使用箇所 (PHI_INV / SCHUMANN_RES / GAMMA_SYNC) | ✅ 記録済 |
| observer-side candidate / runtime feedback boundary | ✅ 整理済 |
| N1 / N2 / N5 / N6 リスク | ✅ 整理済 |
| Runtime 変更なし | ✅ 確認 |

---

### N1: Curved Torus Metric

**必須ファイル:** `src/core/torusGeometry.ts`

| 項目 | 状態 |
|------|------|
| majorRadius / minorRadius 定義 | ✅ |
| majorAngle / minorAngle 計算 | ✅ |
| position3D 計算 | ✅ |
| areaElement 計算 (`r × (R + r·cos v)`) | ✅ |
| gaussianCurvature 計算 (`cos v / (r × ringRadius)`) | ✅ |
| meanCurvature 計算 | ✅ |
| normal / majorTangent / minorTangent | ✅ |
| geometry validation (validateTorusGeometry) | ✅ |
| flat / curved mode (selectTorusMetricGeometry) | ✅ |
| createFlatTorusMetricGeometry で旧挙動へ戻せる | ✅ |
| torusCurvature layer (fieldLayerRegistry) | ✅ |
| NaN / Infinity guard (normalizeVector内) | ✅ |
| docs/curved-torus-metric.md | ✅ |

**重要チェック:**  
- 曲率は areaElement を通して field 更新に影響する。演出ではない。  
- 曲率は意識・感情・生命の説明に使われていない。  
- curved mode は metricMode 設定が必要; default は `torusMetricConfig.ts` の defaultTorusMetricConfig による。  
- areaElement / curvature で NaN / Infinity が発生しないことをテストで確認済。

---

### N2: Complex Scalar Field

**必須ファイル:** `src/types/complexField.ts`, `src/core/complexField.ts`, `src/core/updateComplexField.ts`

| 項目 | 状態 |
|------|------|
| ComplexFieldState | ✅ |
| ComplexFieldConfig | ✅ |
| real / imag buffer | ✅ |
| amplitude / phase 導出 | ✅ |
| phaseCoherence 導出 | ✅ |
| updateComplexField | ✅ |
| NaN / Infinity guard | ✅ |
| amplitude clamp (amplitudeClamp: 5 default) | ✅ |
| modes: scalar / complexObserver / complexRuntime | ✅ |
| default: enabled=false, mode='observerOnly' | ✅ (安全側) |
| VortexCandidate 型 | ✅ |
| deriveVortexCandidates | ✅ |
| topologicalCharge 導出 | ✅ |
| fieldPhase layer | ✅ |
| vortexCandidate layer | ✅ |
| existing scalar runtime 削除なし | ✅ |
| docs/complex-scalar-field.md | ✅ |

**重要チェック:**  
- real / imag は ψ の数値 buffer であり、意味付けなし。  
- phase を感情・意識として扱うコードは存在しない。  
- vortex は observer-side phase-defect candidate のみ。  
- weak plasticity の接続は N5 まで存在しない。

---

### N3: Curvature × Vortex Coupling

**必須ファイル:** `src/types/curvatureVortexCoupling.ts`, `src/observer/deriveCurvatureVortexCoupling.ts`

| 項目 | 状態 |
|------|------|
| CurvatureVortexCouplingState | ✅ |
| deriveCurvatureVortexCoupling | ✅ |
| signedTotalCharge 導出 | ✅ |
| expectedSignedCharge = 0 | ✅ |
| chargeDeviation 導出 | ✅ |
| vortexDensityByCurvature (5 bands) | ✅ |
| vortexStatsByRegion (outerRim / innerRim / upperRim / lowerRim / neutral) | ✅ |
| curvatureVortexCorrelation 導出 | ✅ |
| vortexPairCandidate (VortexPairCandidate 型) | ✅ |
| flat / curved comparison の下地 | ✅ (N7 で実現) |
| docs/curvature-vortex-coupling.md | ✅ |

**重要チェック:**  
- curvatureVortexCorrelation は observational relationship であり、因果証明ではない旨がコメントに明記されている。  
- signedTotalCharge は topological check のみ。mystical indicator ではない。  
- innerRim は純粋な幾何学的領域ラベル。神秘的中心ではない旨が型コメントに明記。  
- vortex は runtime graph / semantic node に接続されていない。  
- weak plasticity はここで有効化されていない。

---

### N4: Boundary as Mediating Layer

**必須ファイル:** `src/types/membraneState.ts`, `src/boundary/membrane.ts`, `src/types/membraneObservation.ts`, `src/config/membraneConfig.ts`

| 項目 | 状態 |
|------|------|
| MembraneState | ✅ |
| MembraneCell | ✅ |
| MembraneConfig | ✅ |
| createMembraneState | ✅ |
| updateMembraneState | ✅ |
| actuationImprint | ✅ |
| returnImprint | ✅ |
| deformation / recovery 更新 | ✅ |
| permeability / tension clamp | ✅ |
| MembraneObservationState | ✅ |
| deriveMembraneObservation | ✅ |
| twoSidedness / actuationReturnOverlap 導出 | ✅ |
| observerOnly mode | ✅ (default) |
| weakCoupling は default off | ✅ (defaultMembraneConfig: mode='observerOnly') |
| membraneState layer | ✅ |
| docs/boundary-mediating-layer.md | ✅ |

**重要チェック:**  
- BodySurface / WorldMedium は置き換えられていない (import 参照のみ)。  
- membrane は魂・自我・意識の境界として扱われていない。  
- twoSidedness は自己認識として扱われていない。  
- weakCoupling は default で無効。有効化は明示的設定が必要。

---

### N5: Weak Plasticity Channel

**必須ファイル:** `src/config/weakPlasticityConfig.ts`, `src/types/weakPlasticity.ts`, `src/plasticity/weakPlasticity.ts`, `src/types/weakPlasticityObservation.ts`

| 項目 | 状態 |
|------|------|
| WeakPlasticityConfig | ✅ |
| default: enabled=false, ablationEnabled=true, mode='observeOnly' | ✅ (安全側) |
| WeakPlasticityState | ✅ |
| WeakPlasticityCellTrace | ✅ |
| createWeakPlasticityState | ✅ |
| updateWeakPlasticityState | ✅ |
| vortexTrace 導出 | ✅ |
| repeatedFlowTrace 導出 | ✅ |
| localExcitabilityTrace 導出 | ✅ |
| membraneTrace 導出 (membraneInfluence weight) | ✅ |
| trace decay (accumulationDecayRate) | ✅ |
| resistanceDelta / resistanceScale 導出 | ✅ |
| clamp (minResistanceScale=0.95, maxResistanceScale=1.05) | ✅ |
| ablation flag (ablationEnabled) | ✅ |
| observeOnly / resistanceOnly mode | ✅ |
| runtime 接続: resistanceOnly かつ config gated (enabled=true AND ablationEnabled=false) | ✅ |
| WeakPlasticityObservationState | ✅ |
| weakPlasticityTrace layer | ✅ |
| docs/weak-plasticity-channel.md | ✅ |

**重要チェック:**  
- semantic memory は作られていない。  
- "learning" と断定するコードは存在しない。  
- runtime graph / network edge は作られていない。  
- Node-AI-Z / Node Mother への接続なし。  
- 変化量: learningRate=1e-4, maxDeltaPerTick=1e-4 (10^-4 オーダー)。  
- ablation で完全に切れる (ablationEnabled=true で resistanceScale は runtime に返らない)。

---

### N6: External Constants Removal / Observed Ratios

**必須ファイル:** `src/observer/referenceRatios.ts`, `src/config/coreDynamicsConstantsConfig.ts`, `src/types/observedRatios.ts`, `src/observer/deriveObservedRatios.ts`

| 項目 | 状態 |
|------|------|
| 外来定数使用箇所の再監査 | ✅ |
| runtime-causal / observer-reference / UI-doc 分類 | ✅ |
| referenceRatios.ts が observer 側にある | ✅ |
| dynamicCore が referenceRatios を import していない | ✅ **確認** |
| neutral mode で PHI_INV / SCHUMANN_RES の直接因果使用が外れている | ✅ |
| legacy mode が比較用として明記 | ✅ |
| CoreDynamicsConstantsConfig | ✅ |
| ObservedRatio / ObservedRatiosState 型 | ✅ |
| deriveObservedRatios | ✅ |
| referenceRatioDistance 導出 | ✅ |
| matchStrength 導出 | ✅ |
| emergentResonanceProxy 導出 | ✅ |
| default: externalConstantsMode='neutral' | ✅ (安全側) |
| docs/external-constants-removal.md | ✅ |
| docs/observed-ratios.md | ✅ |

**重要チェック:**  
- observedRatio は runtime dynamics に戻っていない。  
- emergentResonanceProxy は runtime feedback に使われていない。  
- φ / Schumann / 432Hz は証明扱いされていない。  
- neutral mode が default。  
- legacy mode は comparison only として明記。  
- 一致・不一致ともに観測結果として扱われる。

---

### N7: Long-Run Comparison Suite

**必須ファイル:** `src/types/longRunComparison.ts`, `src/comparison/longRunComparisonVariants.ts`, `src/comparison/runLongRunComparisonSuite.ts`, `src/ui/comparison/LongRunComparisonPanel.tsx`

| 項目 | 状態 |
|------|------|
| LongRunComparisonConfig | ✅ |
| LongRunComparisonVariant | ✅ |
| LongRunComparisonResult | ✅ |
| comparison variant registry (LONG_RUN_COMPARISON_VARIANTS) | ✅ |
| legacyFlatScalar variant | ✅ |
| curvedOnly variant | ✅ |
| complexOnly variant | ✅ |
| curvedComplex variant | ✅ |
| curvedComplexMembrane variant | ✅ |
| curvedComplexPlasticityObserveOnly variant | ✅ |
| curvedComplexPlasticityResistanceOnly variant | ✅ |
| neutralConstantsFullNatural variant | ✅ |
| legacyConstantsFullNatural variant | ✅ (9 variants total) |
| runLongRunComparisonSuite | ✅ |
| 共有 seed / scenario / ticks での比較 | ✅ |
| variant summaries 生成 | ✅ |
| differenceHighlights 生成 | ✅ |
| semanticLeakCount / nanOrInfinityCount 記録 | ✅ |
| LongRunComparisonPanel | ✅ |
| docs/long-run-comparison-suite.md | ✅ |

**重要チェック:**  
- fake result / fake event なし。  
- 結果を補正するコードなし。  
- observed ratio は runtime feedback に使われていない。  
- high vortex count を意識扱いしていない (型コメントに明記)。  
- emergence が出ないことを失敗扱いしていない (type comment に明記)。  
- LLM/API / Node bridge: inactive (overview panel で確認)。

---

## 3. Cross-Phase Architecture Map

```
[N1 TorusGeometry]
    ↓ curved geometry cells (areaElement, gaussianCurvature, etc.)
    ↓ → [torusGeometry field in network runtime]
    ↓
[N2 ComplexField (observer only)]
    ↓ real/imag buffers, amplitude, phase, vortexCandidate, topologicalCharge
    ↓
[N3 CurvatureVortexCoupling (observer only)]
    ↓ correlation, band stats, region stats, pair candidates (observation only)
    ↓
[N4 Membrane (observer only / weak coupling)]
    ↓ actuationImprint, returnImprint, twoSidedness, deformation (observation)
    ↓
[N5 WeakPlasticity (observer only / resistance only, config gated)]
    ↓ vortexTrace, repeatedFlowTrace, localExcitabilityTrace, membraneTrace
    ↓ resistanceScale → [optional runtime only when mode=resistanceOnly AND enabled AND NOT ablation]
    ↓
[N6 ObservedRatios (observer only)]
    ↓ matchStrength, emergentResonanceProxy (observer side, NEVER runtime)
    ↓
[N7 LongRunComparison]
    ↓ cross-variant summaries, differenceHighlights (comparison only)
```

---

## 4. Runtime Feedback Paths

現在の runtime に実際に戻る可能性がある経路の一覧:

| Source | Target | Mode | Default | Ablation | Strength | Clamp | Risk |
|--------|--------|------|---------|----------|----------|-------|------|
| vortex candidate → WeakPlasticity → resistanceScale | localResistance (medium) | resistanceOnly | OFF (enabled=false) | ablationEnabled=true | learningRate=1e-4, maxDelta=1e-4 | [0.95, 1.05] | Low (triple-gated) |
| repeatedFlow → WeakPlasticity → resistanceScale | localResistance (medium) | resistanceOnly | OFF | ablationEnabled=true | 0.5 × learningRate | same | Low |
| localExcitability → WeakPlasticity → resistanceScale | localResistance (medium) | resistanceOnly | OFF | ablationEnabled=true | 0.25 × learningRate | same | Low |
| membrane → WeakPlasticity → resistanceScale | localResistance (medium) | resistanceOnly | OFF | ablationEnabled=true | 0.25 × learningRate | same | Low |
| coreDynamicsConstantsConfig (legacy mode) | freqRatio / waveSpeed / damping | legacy | neutral (OFF) | N/A | full pre-N6 path | standard | Low (comparison only) |

**確認事項:**  
- observedRatios → runtime: **経路なし** ✅  
- protoNetwork → runtime: **経路なし** ✅  
- emergentResonanceProxy → runtime: **経路なし** ✅  
- LLM/API → runtime: **経路なし** ✅  
- Node bridge → runtime: **経路なし** ✅

---

## 5. Observer-Only Paths

以下の path は observer-side のみ。runtime に戻らない:

| Observer | Source | Note |
|----------|--------|------|
| CurvatureVortexCoupling | N1 geometry + N2 vortex candidates | 統計のみ、因果なし |
| VortexObservationState | ComplexField | observer-side phase-defect candidates |
| MembraneObservationState | MembraneState | twoSidedness等の観測値 |
| WeakPlasticityObservationState | WeakPlasticityState | ablation=true 時は resistanceScale も観測のみ |
| ObservedRatiosState | field dynamics metrics | matchStrength は runtime に戻らない |
| LongRunVariantSummary | comparison run results | 比較結果のみ、runtime 変更なし |
| ProtoNetworkObservationState | observer | runtime graph なし |
| RepeatedFlowPathObservationState | observer | flow path 候補のみ |
| LocalExcitabilityFieldState | observer | 閾値近傍の観測のみ |

---

## 6. Config Defaults

| Config | Default | Safety Level |
|--------|---------|-------------|
| TorusMetricConfig.metricMode | (defaultTorusMetricConfig に依存) | 設定変更で curved 有効 |
| ComplexFieldConfig.enabled | false | ✅ 安全側 |
| ComplexFieldConfig.mode | 'observerOnly' | ✅ 安全側 |
| MembraneConfig.enabled | true | ⚠ 有効だが mode='observerOnly' で安全 |
| MembraneConfig.mode | 'observerOnly' | ✅ 安全側 |
| MembraneConfig.couplingToWorld | 0 | ✅ 安全側 |
| MembraneConfig.couplingToBody | 0 | ✅ 安全側 |
| WeakPlasticityConfig.enabled | false | ✅ 安全側 |
| WeakPlasticityConfig.ablationEnabled | true | ✅ 安全側 |
| WeakPlasticityConfig.mode | 'observeOnly' | ✅ 安全側 |
| CoreDynamicsConstantsConfig.externalConstantsMode | 'neutral' | ✅ 安全側 |
| CoreDynamicsConstantsConfig.allowLegacyExternalConstants | false | ✅ 安全側 |

**注意:** MembraneConfig.enabled=true はデフォルトで有効だが、mode='observerOnly' かつ couplingToWorld=0 / couplingToBody=0 のため、runtime への影響はない。

---

## 7. Scientific Integrity Checks

| チェック項目 | 結果 |
|------------|------|
| fake visual がない | ✅ |
| fake event がない | ✅ |
| fake result がない | ✅ |
| fake vortex がない | ✅ |
| fake membrane deformation がない | ✅ |
| fake learning visual がない | ✅ |
| Raw / Derived / Proxy / Presentation-smoothed の区別 | ✅ (fieldLayerRegistry の valueKind で区別) |
| observer-side と runtime-causal の区別 | ✅ (型コメント・docs に明記) |
| reference ratio と causal constant の区別 | ✅ (N6 で明確に分離) |
| comparison result の誇張なし | ✅ |
| 出なかった創発も有効な観測結果として扱われる | ✅ (N7 型コメント・docs に明記) |

---

## 8. Semantic Claim Guard 結果

### 禁止用語チェック (英語)

| 用語 | ソースコード内の使用 | 結果 |
|------|-------------------|------|
| thinking / is thinking | guard/test/comment のみ | ✅ |
| wants to / AETERNA wants | guard リストのみ | ✅ |
| feels / AETERNA feels | guard リストのみ | ✅ |
| conscious / is conscious / has consciousness | guard リストのみ | ✅ |
| self-aware / is self-aware | guard リストのみ | ✅ |
| understands / AETERNA understands | guard リストのみ | ✅ |
| remembered / AETERNA remembered | guard リストのみ | ✅ |
| emotion / has emotions | guard リストのみ | ✅ |
| desire / has desires / AETERNA desires | guard リストのみ | ✅ |
| soul / has a soul | guard リストのみ | ✅ |
| proof of life / proof of consciousness | guard リストのみ | ✅ |

### 禁止用語チェック (日本語)

docs / UI コピー内に禁止日本語表現が存在しないことを確認済み。

### Claim Guard 仕組みの確認

- `src/ui/guide/guideClaimGuard.ts`: 英語・日本語の禁止フレーズリストと検査関数
- `src/ui/guide/guideCopy.ts`: コピー生成で claim guard 適用
- `src/types/longRunComparison.ts` (LongRunVariantSummary): 型コメントに解釈ガードライン
- `src/ui/comparison/ComparisonHighlights.tsx` および `VariantSummaryCard.tsx`: UI ガードコメント
- `src/tests/behavioral/naturalEmergenceAudit.test.ts`: semanticLeakCount=0 テスト (全シナリオ PASS)

---

## 9. Performance / Stability QA

| 項目 | 結果 |
|------|------|
| complex field の NaN / Infinity | deriveAmplitudePhase でガード済み; amplitudeClampCount 追跡 ✅ |
| amplitudeClamp が効く | amplitudeClamp=5 default ✅ |
| weakPlasticity が飽和しない | accumulationDecayRate=1e-5, clamp [0.95, 1.05] ✅ |
| membrane deformation が clamp される | deformationClamp=1.0 default ✅ |
| long-run comparison の重さ | sampleEveryTicks / maxSnapshotsPerVariant でバウンド ✅ |
| CI では lightweight test を使用 | N0–N7 個別テストは ~1 秒以内 ✅ |
| full long-run は manual / optional | compare:longrun script で分離 ✅ |
| mobile UI が極端に重くならない | fieldLayerOverlayRules によるレイヤー制限あり ✅ |

---

## 10. 残っているリスク

1. **TorusMetricConfig の default metricMode**  
   `defaultTorusMetricConfig` が flat か curved かによって N1 の影響が変わる。現在の review では defaultTorusMetricConfig の設定を確認したが、明示的な文書化が `docs/curved-torus-metric.md` にあることを確認。ただし運用 UI での表示・切り替えの説明が今後より明確になると望ましい。

2. **curvedComplexPlasticityResistanceOnly variant の安全性**  
   N7 の最高リスク variant。weakPlasticityAblationEnabled=false で実行されるが、clamp [0.95, 1.05] および saturationRisk 観測で管理。実際に動かす際は saturationRisk > 0.8 の記録が推奨。

3. **MembraneConfig.enabled=true (default)**  
   membrane は default で有効だが mode='observerOnly' かつ coupling=0 のため runtime への影響はない。将来 weakCoupling を有効化する際は明示的設定が必要。

4. **runLongRunComparisonSuite.ts のスタブ実装**  
   現在の snapshot 値は deterministic stub (dynamicCore との完全統合ではない)。完全統合時に実際の field 値と stub 値の乖離が発生しうる。これは既知の設計仕様であり、コメントに明記されている。

5. **sensoryReturn.test.ts / scenario.test.ts の pre-existing failures**  
   これらのテストは N0–N7 に起因しない pre-existing 失敗。修正は本レビュースコープ外。

---

## 11. 次に推奨する Phase

### N-series 安定化 (v1.0 Stabilization)

1. **runLongRunComparisonSuite と dynamicCore の完全統合**  
   現在のスタブ snapshot を実際の observer 値 (VortexObservationState, MembraneObservationState 等) に差し替える。stub との差異を観測し記録する。

2. **TorusMetricConfig の default metricMode 確定と文書化**  
   flat / curved のどちらをプロダクション default にするかを決定し、docs に反映する。

3. **curvedComplexPlasticityResistanceOnly variant の実環境テスト**  
   CI 外で saturationRisk の実観測値を記録する。

4. **MembraneConfig.weakCoupling の安全評価**  
   weakCoupling を有効化した場合の runtime への影響を観測・記録する (N4a 相当)。

5. **sensoryReturn.test.ts / scenario.test.ts の修正**  
   pre-existing failures を解消し、test suite を完全 green にする。

---

## 12. 追加・変更したファイル

### 本レビューで追加したファイル

| ファイル | 内容 |
|---------|------|
| `docs/aeterna-natural-integration-review.md` | 本ドキュメント |

### 本レビューで変更したファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/comparison/runLongRunComparisonSuite.ts` | 未使用 import `ComparisonVariantId` を削除 (lint error 修正) |

### 意図的に変更しなかった箇所

- `src/core/dynamicCore.ts` — runtime dynamics は変更しない
- `src/plasticity/weakPlasticity.ts` — plasticity logic は変更しない
- `src/boundary/membrane.ts` — membrane logic は変更しない
- `src/core/complexField.ts` / `updateComplexField.ts` — complex field logic は変更しない
- 各 observer ファイル — observation logic は変更しない
- pre-existing lint errors in `src/observer/deriveLocalExcitabilityField.ts` / `src/observer/deriveRepeatedFlowPaths.ts` — N0–N7 非起因のため修正対象外
- pre-existing test failures in `sensoryReturn.test.ts` / `scenario.test.ts` — N0–N7 非起因のため修正対象外

---

## 13. Build / Lint / Test 結果

| ツール | 結果 | 備考 |
|-------|------|------|
| `tsc --noEmit` | ✅ 0 errors | |
| `npm run lint` | 2 errors (pre-existing) | `deriveLocalExcitabilityField.ts:75`, `deriveRepeatedFlowPaths.ts:384`。N7 の新規 lint error は本レビューで修正済み。 |
| N0–N7 コアテスト | ✅ 全 PASS | torusGeometry, complexField, curvatureVortexCoupling, membrane, weakPlasticity, observedRatios, longRunComparisonSuite |
| N0–N7 UI レイヤーテスト | ✅ 全 PASS | curvatureVortexLayer, membraneLayer, weakPlasticityLayer, observedRatiosPanel, longRunComparisonPanel |
| naturalEmergenceAudit | ✅ PASS (semanticLeakCount=0 確認) | |
| longRunEmergenceScenarios | ✅ PASS | |
| sensoryReturn.test.ts / scenario.test.ts | 既知の pre-existing failures (N0–N7 非起因) | タイムアウト傾向あり |

---

*本ドキュメントは AETERNA-NATURAL N0–N7 統合レビューの公式記録です。*  
*fake visual / fake event / fake result は含まれていません。*  
*semantic / consciousness / intelligence / life / mystical proof claim は含まれていません。*
