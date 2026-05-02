# AETERNA-NATURAL v1.0 Stabilization

**Version:** v1.0 Stabilization  
**Date:** 2026-05-01  
**Scope:** N0–N7 stabilization, safety gate, config matrix, diagnostics, long-run profiles, claim guards

---

## 1. Purpose

AETERNA-NATURAL v1.0 Stabilization は、N0〜N7 フェーズで実装した  
geometry / complex field / vortex / membrane / weak plasticity / observed ratios / comparison suite を  
**安全に切り替え・観測・比較・診断できる状態**に固定することを目的とする。

新機能の追加は行わない。  
目的は:

- 実装が壊れにくい
- default config が安全
- old scalar / flat behavior へ戻せる
- NaN / Infinity / saturation を検出できる
- UI で今どの mode か分かる
- docs と実装がズレていない
- semantic / consciousness / mystical proof claim が混入していない
- long-run comparison が軽量テストで動く

---

## 2. Runtime Config Matrix

`src/config/aeternaNaturalRuntimeConfig.ts` にて一括管理。

| フィールド | 型 | default | 説明 |
|---|---|---|---|
| `metricMode` | `'flat' \| 'curved'` | `'flat'` | N1 torus metric mode |
| `fieldRuntimeMode` | `'scalar' \| 'complexObserver' \| 'complexRuntime'` | `'scalar'` | N2 field mode |
| `membraneMode` | `'off' \| 'observerOnly' \| 'weakCoupling'` | `'observerOnly'` | N4 membrane mode |
| `weakPlasticityMode` | `'off' \| 'observeOnly' \| 'resistanceOnly'` | `'off'` | N5 plasticity mode |
| `weakPlasticityEnabled` | `boolean` | `false` | N5 master switch |
| `weakPlasticityAblationEnabled` | `boolean` | `true` | N5 ablation gate |
| `externalConstantsMode` | `'neutral' \| 'legacy'` | `'neutral'` | N6 constants mode |
| `observedRatiosEnabled` | `boolean` | `true` | N6 observer-side ratio (safe) |
| `longRunComparisonEnabled` | `boolean` | `false` | N7 comparison gate |
| `safetyMode` | `'safe' \| 'research' \| 'experimental'` | `'safe'` | Safety hierarchy |

---

## 3. Safe / Research / Experimental Modes

### safe（default）

- runtime feedback 経路は無効
- complexRuntime / resistanceOnly / weakCoupling は自動で safe な代替に fallback
- old scalar / flat behavior に最も近い

### research

- observer-series features を有効化できる（curved, complexObserver, observeOnly, observerOnly）
- complexRuntime / resistanceOnly / weakCoupling は forbidden（errors を出す）
- warnings は表示される

### experimental

- すべての mode が許可される
- complexRuntime / resistanceOnly / weakCoupling は warnings を出すが blocked しない
- resistanceOnly + ablation disabled はさらに強い warning

---

## 4. Presets

`src/config/aeternaNaturalPresets.ts`

| preset ID | safetyMode | 目的 |
|---|---|---|
| `safeBaseline` | safe | pre-N-series に最も近い安全基準 |
| `geometryPreview` | research | N1 曲率のみ観測 |
| `complexObserverPreview` | research | N2 複素場・位相・渦候補を observer-only で観測 |
| `naturalObserverSuite` | research | N1–N6 observer 全機能 (runtime feedback なし) |
| `plasticityObserveOnly` | research | N5 trace 蓄積のみ (resistanceScale 非反映) |
| `fullNaturalExperimental` | **experimental** | 全機能 runtime feedback あり (⚠ default 禁止) |
| `legacyComparison` | research | N6 前の constants 比較専用 (⚠ default 禁止) |

---

## 5. Safety Gate

`src/runtime/validateAeternaNaturalConfig.ts`

`validateAeternaNaturalConfig(config)` は:
- `valid`, `warnings`, `errors`, `normalizedConfig` を返す
- safe mode: 危険設定を自動で safe な代替に落とす
- research mode: complexRuntime / resistanceOnly / weakCoupling は errors を出す
- experimental mode: 許可するが warnings を出す
- `normalizeAeternaNaturalConfig(config)` は normalizedConfig だけを返す convenience helper

---

## 6. Runtime Feedback Paths

以下は **runtime feedback に使われない**（observer-side only）:

- `observedRatios` / `referenceRatios`
- `emergentResonanceProxy`
- `weakPlasticityObservation` (ablation on の場合)
- `longRunComparisonResult`
- `NaturalDiagnosticState`

以下は runtime feedback が **ある**（experimental only）:

- `fieldRuntimeMode='complexRuntime'`: 複素場を runtime に反映
- `weakPlasticityMode='resistanceOnly'` + ablation off: resistanceScale を runtime に弱く反映
- `membraneMode='weakCoupling'`: 膜を runtime に弱く結合

---

## 7. Observer-Only Paths

以下は observer-side のみで runtime に影響しない:

- `metricMode='curved'`: 曲率は geometry 計算に使うが wave update は設定依存
- `fieldRuntimeMode='complexObserver'`: 複素場は observe のみ
- `membraneMode='observerOnly'`: 膜は observe のみ
- `weakPlasticityMode='observeOnly'` または ablation on: resistanceScale は計算されるが反映されない
- `observedRatios`: runtime feedback なし（設定で変更不可）

---

## 8. Diagnostics

`src/types/naturalDiagnosticState.ts` — `NaturalDiagnosticState` 型  
`src/observer/deriveNaturalDiagnosticState.ts` — 導出関数

### NaturalDiagnosticState フィールド

| フィールド | 説明 |
|---|---|
| `totalNanOrInfinityCount` | 全 N-series の NaN/Infinity 合計 |
| `geometryWarnings` | N1: torus geometry 警告 |
| `complexFieldWarnings` | N2: complex field 警告 |
| `vortexWarnings` | N2/N3: vortex 警告 |
| `membraneWarnings` | N4: membrane 警告 |
| `plasticityWarnings` | N5: weak plasticity 警告 |
| `observedRatioWarnings` | N6: observed ratios 警告 |
| `comparisonWarnings` | N7: long-run comparison 警告 |
| `saturationRiskMax` | 全 subsystem の saturation risk 最大値 |
| `clampEventCount` | 全 subsystem の clamp events 合計 |
| `safetyWarnings` | cross-system safety 警告 |
| `validForLongRun` | long-run 比較に適した状態か |

`validForLongRun=false` 条件:
- `totalNanOrInfinityCount > 0`
- `saturationRiskMax > 0.8`
- `safetyWarnings.length > 0`

---

## 9. Long-Run Execution Profiles

`src/comparison/longRunExecutionProfiles.ts`

| profile | ticks | sampleEveryTicks | maxSnapshots | runInCi |
|---|---|---|---|---|
| `test` | 50 | 10 | 5 | ✅ |
| `default` | 1000 | 50 | 20 | ❌ |
| `full` | 5000 | 100 | 50 | ❌ |

- CI では `test` profile のみ
- `default` は routine research
- `full` は manual only

---

## 10. Interpretation Guardrails

以下は必ず守ること:

- **渦数が多いことは意識を意味しない**  
  high vortex count does not mean consciousness.

- **可塑性蓄積が多いことは意味記憶を意味しない**  
  high plasticity accumulation does not mean semantic memory.

- **参照比率との近接は神秘的証明ではない**  
  high observed ratio match does not mean mystical proof.

- **closure stability が高いことは自己認識を意味しない**  
  higher closure stability does not mean self-awareness.

- **創発候補が出ないことも有効な観測結果である**  
  no emergence is a valid result.

---

## 11. Known Limitations

- `complexRuntime` はまだ experimental — clamp / NaN guard を事前確認すること
- `weakPlasticity resistanceOnly` は慎重に扱う — saturation risk を監視すること
- vortex candidates は observer-side proxies — runtime graph nodes ではない
- membrane twoSidedness は self-awareness ではない
- observed ratios は比較であり、因果証明ではない
- long-run comparison は seed / scenario に依存する
- 現在の結果は consciousness / life / intelligence を証明しない
- NaturalDiagnosticState は個別 N-series observer の出力が渡された場合のみ有効
- UI の naturalMode HUD は `dyn` オブジェクトの `natural*` フィールドが設定されていない場合は default を表示する

---

## 12. Files Added / Modified

### New Files

| ファイル | 説明 |
|---|---|
| `src/config/aeternaNaturalRuntimeConfig.ts` | 統合 runtime config + default |
| `src/config/aeternaNaturalPresets.ts` | 7 presets |
| `src/runtime/validateAeternaNaturalConfig.ts` | safety gate |
| `src/types/naturalDiagnosticState.ts` | NaturalDiagnosticState 型 |
| `src/observer/deriveNaturalDiagnosticState.ts` | 診断状態導出関数 |
| `src/comparison/longRunExecutionProfiles.ts` | 3 execution profiles |
| `src/tests/stabilization/naturalRuntimeConfig.test.ts` | config / presets tests |
| `src/tests/stabilization/safetyGate.test.ts` | safety gate tests |
| `src/tests/stabilization/noForbiddenClaims.test.ts` | forbidden claims guard |
| `src/tests/stabilization/noRuntimeFeedbackLeak.test.ts` | feedback leak guard |
| `src/tests/stabilization/noExternalConstantsLeak.test.ts` | constants leak guard |
| `docs/aeterna-natural-v1-stabilization.md` | 本ドキュメント |

### Modified Files

| ファイル | 変更内容 |
|---|---|
| `src/ui/updateMetricsUI.js` | `_updateNaturalModeHud` 追加 |
| `index.html` | N-Series Runtime Mode HUD chips 追加 |
| `docs/aeterna-natural-observation-ux-polish.md` | v1.1 観測 UX polish 方針 |
| `docs/aeterna-natural-roadmap.md` | v1.0 Stabilization 完了追記 |
| `docs/current-roadmap.md` | v1.0 Stabilization 完了追記 |
| `README.md` | v1.0 Stabilization 追記 |
