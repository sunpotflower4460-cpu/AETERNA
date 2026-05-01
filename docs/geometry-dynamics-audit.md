# AETERNA Geometry / Dynamics Audit (N0)

この文書は N0 Geometry / Dynamics Audit の監査結果です。  
今回の Phase では runtime dynamics を変更しません。現状の core が何をしているかを、比較基準として記録します。

## 1. Summary

- 現在の core dynamics は `segments × segments` の周期境界つき 2D grid を使っている。
- したがって位相的には torus-like だが、更新式の幾何は **flat torus** である。
- 主体の場は `currentBuffer` / `prevBuffer` / `nextBuffer` からなる **single real scalar field**。
- `baselineActivity` / `activityResidue` / `spikeTrace` / `predictionError` は補助 channel であり、主場を支えるが、複素場や二場反応拡散ではない。
- `PHI_INV` / `SCHUMANN_RES` / `GAMMA_SYNC` は core dynamics に直接入っている。
- `ProtoNeuronObservationState` / `RepeatedFlowPathObservationState` / `ProtoNetworkObservationState` / `LocalExcitabilityFieldState` は現状 observer-side に留まっている。
- 乱数注入は明示的に存在し、`triggerNoise()` が毎 tick 呼ばれる。seeded reproducibility はまだない。

## 2. Current geometry model

現在の AETERNA core は周期境界つき 2D grid を使っている。  
これは位相的にはトーラス状だが、`majorRadius` / `minorRadius` / `areaElement` / `curvature` が更新式に入っていないため、幾何学的には **平坦トーラス (flat torus)** とみなすのが正確です。

根拠:

- `AeternaNetwork` は `segments` と `numNodes = segments * segments` を持つ。
- `updateDynamicsCore()` は `i, j` の二重 loop で各セルを更新する。
- 近傍参照は `up / down / left / right` の 4 近傍で、各方向とも `% network.segments` により wrap する。
- Laplacian は 4 近傍の一様な grid 差分に directional weights を掛けた形で計算される。
- `network.R` / `network.r` は `networkGeometry.ts` で埋め込み座標と法線を作るために使われるが、`dynamicCore.ts` の更新式には入らない。
- `areaElement` / `gaussianCurvature` / `meanCurvature` / inner rim / outer rim bias は current core dynamics に見当たらない。

## 3. Flat torus vs geometric torus

### Flat torus

- 2D square grid with periodic boundaries
- uniform cell area
- uniform neighbor distance
- no inner/outer rim curvature difference
- Laplacian is usually uniform
- topology is toroidal, geometry is flat

### Geometric torus

- embedded torus with major radius `R` and minor radius `r`
- position: `((R + r cos v) cos u, (R + r cos v) sin u, r sin v)`
- area element varies by `v`
- gaussian curvature varies by `v`
- inner rim and outer rim differ
- geometry can bias flow, accumulation, and node formation

### Why N1 is needed

現状は renderer 側では埋め込みトーラスを持つが、dynamics 側は flat grid 更新である。  
したがって「トーラスに見えること」と「トーラス幾何が flow を偏らせること」はまだ同じではない。  
N1 はこの差を埋め、曲率・面積要素・内外 rim の差が dynamics に入った時に、何が新しく起きたかを比較可能にするために必要です。

## 4. Current field model

現在の core は **A. Single real scalar field with auxiliary traces** に最も近い。

> The current core is best described as a single real scalar field with auxiliary residue/trace/error channels, not yet a two-field reaction-diffusion system or a complex scalar field.

根拠:

- 主体の場は `Float32Array` の `currentBuffer`。
- `prevBuffer` と `nextBuffer` を使って `2 * current - prev + waveSpeed * laplacian` の wave-like 更新を行う。
- Laplacian は `currentBuffer` の 4 近傍から計算される。
- `baselineActivity` と `activityResidue` は `updateBaselineAndResidue()` で `currentBuffer` に加算される補助項。
- `spikeTrace` は発火履歴 channel として毎 tick 更新される。
- `predictionError` は `currentBuffer - localPrediction` で計算される誤差 channel。
- `firingRateError` と `homeoDamping` は全体 damping に影響する homeostasis scalar。
- complex field 用の real/imag pair や phase buffer は current core にはない。

## 5. Auxiliary fields / residues / traces

| Name | File / location | Type | Source | Affects runtime? | Observer-only? | Decay / update rule | Notes |
|---|---|---|---|---|---|---|---|
| `baselineActivity` | `src/core/dynamicCore.ts`, `src/core/AeternaNetwork.js` | `Float32Array` | `nodePhase`, `simTime`, mode, living state | Yes | No | 毎 tick `sin(...)` ベースで再計算 | `updateBaselineAndResidue()` で `currentBuffer` に加算 |
| `activityResidue` | `src/core/dynamicCore.ts`, `src/core/AeternaNetwork.js` | `Float32Array` | `spikeTrace`, `priorChannels.persistence`, living state | Yes | No | `residue = residue * decay + spikeTrace * intake` | 補助残留場。主場ではない |
| `spikeTrace` | `src/core/dynamicCore.ts`, `src/core/AeternaNetwork.js` | `Float32Array` | `currentBuffer` crossing threshold | Yes | No | 発火時 `1.0`、それ以外は `* 0.9` | residue, render, metrics の入力にもなる |
| `lastSpikeTime` | `src/core/dynamicCore.ts`, `src/core/AeternaNetwork.js` | `Float32Array` | spike event time | Indirectly | No | 発火時のみ更新 | runtime の専用 refractory buffer ではなく履歴記録 |
| `predictionError` | `src/core/dynamicCore.ts`, `src/core/AeternaNetwork.js` | `Float32Array` | `currentBuffer - localPrediction` | Yes | No | `updatePredictionError()` で毎 tick 更新 | rewrite / metrics / heartbeat inputs に使われる |
| `localPrediction` | `src/core/AeternaNetwork.js`, `src/perception/localPredictor.ts` | `Float32Array` | local predictor stage | Yes | No | predictor stage で更新 | 誤差計算の参照場。主場ではない |
| `firingRateError` / `homeoDamping` | `src/core/dynamicCore.ts` | scalar | `TARGET_FIRING_RATE - arousal` | Yes | No | 毎 tick 再計算 | global damping の補助項 |
| `clampedThreshold` / `dormantThreshold` | `src/core/dynamicCore.ts` | scalar | base threshold + top-down modulation + dormant trait | Yes | No | 毎 tick 再計算 | 閾値条件。独立 field ではない |
| `topDownModulation` | `src/core/hierarchicalTorus.ts`, `src/core/dynamicCore.ts`, `src/organism/rewrite.ts` | small delta bundle | upper torus feedback | Yes | No | smoothing 付きで更新 | baseline / threshold / rewrite gain を弱く傾ける |
| `currentModulation` | `src/core/beautifulLoopModulation.ts`, `src/organism/updateHeartbeat.js` | small delta bundle | observer packets (`Interoception`, `SelfWorldModel`) | Yes | No | clamp + smoothing | living/homeostatic bias へ戻る。candidate feedback ではない |
| `triggerNoise()` state | `src/core/dynamicCore.ts` | scalar + direct injection | hardware random / fallback random | Yes | No | 毎 tick最大3イベント | quiet baseline でも thermal rate がある |

補足:

- runtime の中に dedicated complex amplitude/phase pair はまだない。
- runtime の中に dedicated curved-metric tensor や curvature field もまだない。
- runtime の中に dedicated physical membrane field もまだない。

## 6. External constants in core dynamics

| Constant | Value | File / location | Used in | Affects runtime dynamics? | Could be moved to observer-side? | Notes |
|---|---|---|---|---|---|---|
| `PHI_INV` | `1 / 1.6180339887` | `src/constants/aeternaConstants.js`, `src/core/dynamicCore.ts` | `damping` | Yes | Yes, in principle | hidden causal ingredient in current damping formula |
| `SCHUMANN_RES` | `7.83` | `src/constants/aeternaConstants.js`, `src/core/dynamicCore.ts` | `freqRatio`, `waveSpeed` | Yes | Yes, in principle | also used in `actionLoop.js` visual rotation coupling |
| `GAMMA_SYNC` | `40.0` | `src/constants/aeternaConstants.js`, `src/core/dynamicCore.ts` | `freqRatio`, `waveSpeed` | Yes | Possibly | part of the same runtime frequency normalization as `SCHUMANN_RES` |
| `PHI` | `1.6180339887` | `src/constants/aeternaConstants.js`, `src/core/AeternaNetwork.js`, `src/core/PhysicalDisk.js` | `R`, ratio display, geometry setup | Not in current update equation | Mostly render / reference side | renderer geometry and disk ratios use it, but `updateDynamicsCore()` does not |

方針:

> N6 will move external constants out of core dynamics where possible.  
> They may remain as observer-side reference ratios, but not as hidden causal ingredients in the core update equations.

## 7. Observer-side candidates

| Candidate / state | Location | Current role | Mutates runtime field directly? | Current judgement |
|---|---|---|---|---|
| `ProtoNeuronObservationState` | `src/types/protoNeuronObservationState.ts`, `src/observer/deriveProtoNeuronCandidates.ts` | observer snapshot | No | observer-side |
| `RepeatedFlowPathObservationState` | `src/types/repeatedFlowPath.ts`, `src/observer/deriveRepeatedFlowPaths.ts` | observer snapshot | No | observer-side |
| `ProtoNetworkObservationState` | `src/types/protoNetworkCandidate.ts`, `src/observer/deriveProtoNetworkCandidates.ts` | observer snapshot | No | observer-side |
| `LocalExcitabilityFieldState` | `src/types/localExcitabilityField.ts`, `src/observer/deriveLocalExcitabilityField.ts` | observer snapshot | No | observer-side |
| `VortexCandidate` | not found in `src/` | not implemented yet | No | N2/N3 future term only |

Current proto-neuron and proto-network candidates appear to be observer-side unless explicitly fed back into runtime state.  
This preserves scientific integrity, but also means candidate structures do not yet become physical medium history.  
N5 will evaluate one strictly limited weak plasticity channel.

## 8. Runtime feedback boundary

| Source | Target | Feedback strength | Ablation flag? | Runtime effect? | Observer-only? | Notes |
|---|---|---|---|---|---|---|
| Hierarchical top-down modulation | `baselineGainDelta`, `thresholdDelta`, `rewriteGainDelta` on sub-tori | Weak / clamped / smoothed | No explicit flag found | Yes | No | existing runtime feedback, but not candidate-derived |
| Beautiful Loop modulation | living / homeostatic bias inputs | Weak / clamped / smoothed | `ModulationConfig.enabled` | Yes | No | observer packet → weak bias, not semantic node feedback |
| `DynamicViabilityState` | none in main `AeternaNetwork` tick | None in main runtime | Scenario flags available downstream | No direct currentBuffer effect in main app | Mostly yes | in `runScenario.ts`, it feeds `deriveMinimalNaturalFeedback()` |
| `NaturalFeedbackAdjustment` / `applyMinimalNaturalFeedback()` | world medium / sensory return / actuation / body surface / trace | Weak | Yes (`NaturalFeedbackAblationFlags`) | Yes, but scenario/world-loop side | No | exists in scenario harness, not in `dynamicCore.ts` |
| `MediumProfileState` | observer summaries and downstream observer derivations | None | N/A | No direct core effect | Yes | input to LEF / repeated flow / proto-network observation |
| `LocalExcitabilityFieldState` | observer summaries | None | N/A | No | Yes | no path reinforcement or threshold write-back |
| `RepeatedFlowPathObservationState` | observer summaries | None | N/A | No | Yes | no runtime edge / graph creation |
| `ProtoNeuronObservationState` | observer summaries | None | N/A | No | Yes | no node creation, no action trigger |
| `ProtoNetworkObservationState` | observer summaries | None | N/A | No | Yes | no graph / semantic relation write-back |

境界の現状整理:

- candidate 系 (`ProtoNeuron` / `RepeatedFlowPath` / `ProtoNetwork` / `LocalExcitability`) は observer-side に留まっている。
- runtime に戻る feedback は存在しても、現状は **candidate 系からではない**。
- world-loop feedback (`MinimalNaturalFeedback`) は scenario / closure 側にあるが、`currentBuffer` を直接書き換える channel ではない。

## 9. Noise / random injection

Random/noise sources must be explicit.  
If noise remains, it should be treated as a stated perturbation source, not as hidden life-like motion.  
Future phases should support ablation or seeded reproducibility.

現状:

- `actionLoop.js` は毎 tick `network.triggerNoise(...)` を呼ぶ。
- `triggerNoise()` は `getHardwareRandomFloat()` を使い、`crypto.getRandomValues` がなければ `Math.random()` に fallback する。
- seeded random ではない。
- `thermalRate` は `omega_t <= 30` で `0.05` なので、quiet baseline でもノイズ注入可能性がある。
- 1 tick あたり最大 3 回、ランダム node に `1.0 + rand` を加算する。
- したがって current core には **明示的 stochastic perturbation source** がある。

## 10. Risks before N1 / N2 / N5 / N6

### N1 Curved Torus Metric risks

- Laplacian weighting may destabilize field
- area normalization may change amplitude scale
- inner/outer rim bias may be mistaken for fake visual
- renderer and dynamics must both label curvature source clearly

### N2 Complex Scalar Field risks

- large runtime change
- old scalar tests may fail
- amplitude/phase must not be semanticized
- vortex candidates must be observer-side initially
- stability parameters need careful bounds

### N5 Weak Plasticity risks

- observer-to-runtime feedback can become too strong
- must have ablation flag
- must be tiny
- must not create runtime graph / semantic memory

### N6 External Constants Removal risks

- visual behavior may change
- old resonance expectations may disappear
- must move constants to observer reference, not delete research comparison
- docs must explain why this increases scientific honesty

## 11. Recommended next phases

1. **N1 Curved Torus Metric**  
   dynamics 側に area element / curvature / inner-outer rim bias を導入し、flat torus baseline と比較可能にする。

2. **N2 Complex Scalar Field**  
   `currentBuffer` 単独から、amplitude/phase を含む complex field へ拡張する。ただし observer-side vocabulary を先に固定する。

3. **N5 Weak Plasticity Channel**  
   candidate 由来ではない極小 feedback を 1 本だけ導入し、ablation 前提で比較する。

4. **N6 External Constants Removal / Observed Ratios**  
   `PHI_INV` / `SCHUMANN_RES` / `GAMMA_SYNC` を hidden causal ingredients から observer/reference ratio へ寄せる。

5. **N7 Long-Run Comparison Suite**  
   N0 baseline, N1 curved metric, N2 complex field, N6 constant removal の比較を長時間テストで固定する。
