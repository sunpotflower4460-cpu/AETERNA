# v2.7 Now Summary Inputs

> **✅ 完了 (2026-05-08)** — v2.7 今起きていること要約パネル / Now Summary Panel の実装が完了しました。
> 実装: `src/observer/deriveNowSummary.ts`, `src/ui/observation/NowSummaryPanel.tsx`, 他。
> 詳細: `docs/now-summary-panel.md` を参照。

**Version**: v2.6.5 → v2.7 完了
**Date**: 2026-05-07 / 完了: 2026-05-08
**Purpose**: Define the metrics that v2.7 "今起きていること要約パネル" (Now Summary Panel) should read

---

## Purpose

v2.7 will add a **"今起きていること"** (What's Happening Now) summary panel that displays the current state of AETERNA in a concise, beginner-friendly format.

This document defines:
1. Which metrics to read
2. From which source files
3. Whether runtime or observer-side
4. Beginner label (Japanese)
5. Researcher label (English)
6. What it indicates
7. What it does NOT prove

---

## A. トーラス生命場 (Torus Life Field)

### A1. arousal

- **Source**: `src/core/dynamicCore.ts` → `updateDynamicsCore()` → `currGenFiring / numNodes`
- **Runtime / Observer**: Runtime (core dynamics output)
- **Beginner Label**: 覚醒度 (awakening level)
- **Researcher Label**: Firing Rate
- **What it indicates**: Current firing rate across all cells (0..1)
- **What it does NOT prove**: Consciousness, awareness, subjective experience

### A2. sigma

- **Source**: `src/core/dynamicCore.ts` → `updateDynamicsCore()` → `sigmaDisplay` (branching ratio EMA)
- **Runtime / Observer**: Runtime (core dynamics output)
- **Beginner Label**: 臨界性 (criticality)
- **Researcher Label**: Branching Ratio σ
- **What it indicates**: Branching ratio (σ ≈ 1.0 = critical, σ > 1.0 = supercritical, σ < 1.0 = subcritical)
- **What it does NOT prove**: Intelligence, life, consciousness

### A3. phaseCoherence

- **Source**: `src/core/torusMetrics.ts` → `computePhaseCoherence()`
- **Runtime / Observer**: Runtime (derived metric)
- **Beginner Label**: 位相の揃い (phase alignment)
- **Researcher Label**: Phase Coherence
- **What it indicates**: How aligned the phase is across cells (0..1)
- **What it does NOT prove**: Meaning, semantic coherence, consciousness

### A4. clusterRatio

- **Source**: `src/core/torusMetrics.ts` → `computeLargestCluster()` → `largestClusterSize / numNodes`
- **Runtime / Observer**: Runtime (derived metric)
- **Beginner Label**: 最大クラスタ比 (largest cluster ratio)
- **Researcher Label**: Cluster Ratio
- **What it indicates**: Ratio of largest connected cluster to total cells (0..1)
- **What it does NOT prove**: Unity, self, consciousness

### A5. baselineLevel

- **Source**: `src/mode/baselineActivity.ts` → `runBaselineActivityStage()` → `baselineLevel`
- **Runtime / Observer**: Runtime (core dynamics output)
- **Beginner Label**: 基底活動 (baseline activity)
- **Researcher Label**: Baseline Level
- **What it indicates**: Mean baseline sine wave level across all cells (0..~0.003)
- **What it does NOT prove**: Intrinsic motivation, life, consciousness

### A6. residueLevel

- **Source**: `src/mode/baselineActivity.ts` → `runBaselineActivityStage()` → `residueLevel`
- **Runtime / Observer**: Runtime (core dynamics output)
- **Beginner Label**: 残留活動 (residual activity)
- **Researcher Label**: Activity Residue Level
- **What it indicates**: Mean activity residue level across all cells (0..1.25)
- **What it does NOT prove**: Memory, learning, consciousness

### A7. firingRateError

- **Source**: `src/core/dynamicCore.ts` → `updateDynamicsCore()` → `TARGET_FIRING_RATE - arousal`
- **Runtime / Observer**: Runtime (core dynamics output)
- **Beginner Label**: 目標との差 (difference from target)
- **Researcher Label**: Firing Rate Error
- **What it indicates**: Difference between target firing rate and current arousal (-1..1)
- **What it does NOT prove**: Homeostasis, self-regulation, life

---

## B. 生命幹 (Vital Stem)

### B1. energy

- **Source**: `src/organism/survivalState.ts` → `updateHomeostaticState()` → `energy`
- **Runtime / Observer**: Runtime (organism state)
- **Beginner Label**: エネルギー (energy)
- **Researcher Label**: Organism Energy
- **What it indicates**: Current organism energy level (0..1)
- **What it does NOT prove**: Life, metabolism, biological energy

### B2. stability

- **Source**: `src/organism/survivalState.ts` → `updateHomeostaticState()` → `stability`
- **Runtime / Observer**: Runtime (organism state)
- **Beginner Label**: 安定性 (stability)
- **Researcher Label**: Organism Stability
- **What it indicates**: Current organism stability (0..1)
- **What it does NOT prove**: Life, homeostasis, self-regulation

### B3. overload

- **Source**: `src/organism/survivalState.ts` → `updateHomeostaticState()` → `overload`
- **Runtime / Observer**: Runtime (organism state)
- **Beginner Label**: 過負荷 (overload)
- **Researcher Label**: Organism Overload
- **What it indicates**: Current organism overload level (0..1)
- **What it does NOT prove**: Stress, suffering, distress

### B4. fatigue

- **Source**: `src/organism/livingState.ts` → `livingState.fatigue`
- **Runtime / Observer**: Runtime (persistent living state)
- **Beginner Label**: 疲労 (fatigue)
- **Researcher Label**: Living State Fatigue
- **What it indicates**: Accumulated fatigue from extended activity (0..0.8)
- **What it does NOT prove**: Suffering, tiredness, subjective experience

### B5. coherenceMemory

- **Source**: `src/organism/livingState.ts` → `livingState.coherenceMemory`
- **Runtime / Observer**: Runtime (persistent living state)
- **Beginner Label**: 過去の揃い記憶 (past alignment memory)
- **Researcher Label**: Coherence Memory
- **What it indicates**: Smoothed memory of recent coherence (0..1)
- **What it does NOT prove**: Memory, learning, consciousness

### B6. predictionSensitivity

- **Source**: `src/organism/livingState.ts` → `livingState.predictionSensitivity`
- **Runtime / Observer**: Runtime (persistent living state)
- **Beginner Label**: 予測感度 (prediction sensitivity)
- **Researcher Label**: Prediction Sensitivity
- **What it indicates**: How sensitively prediction error is processed (0.2..0.9)
- **What it does NOT prove**: Intelligence, learning, consciousness

### B7. touchNeedBaseline

- **Source**: `src/organism/livingState.ts` → `livingState.touchNeedBaseline`
- **Runtime / Observer**: Runtime (persistent living state)
- **Beginner Label**: 接触開放度 (touch openness)
- **Researcher Label**: Touch Need Baseline
- **What it indicates**: Openness to tactile input (0.2..0.8)
- **What it does NOT prove**: Desire, need, subjective experience

### B8. modeState

- **Source**: `src/mode/modeController.ts` → `runModeControllerStage()` → `modeState`
- **Runtime / Observer**: Runtime (mode state)
- **Beginner Label**: モード (mode)
- **Researcher Label**: Mode State
- **What it indicates**: Current mode ('wake' / 'sleep' / 'dream')
- **What it does NOT prove**: Consciousness, sleep, dream (not biological)

### B9. actionState

- **Source**: `src/organism/actionDecision.ts` → `runActionDecisionStage()` → `actionState`
- **Runtime / Observer**: Runtime (action state)
- **Beginner Label**: 行動 (action)
- **Researcher Label**: Action State
- **What it indicates**: Current action ('idle' / 'orient' / 'withdraw' / 'settle')
- **What it does NOT prove**: Intention, volition, free will

---

## C. 閉ループ (Body-World Closure)

### C1. loopGain

- **Source**: `src/closure/deriveBodyWorldClosureState.ts` → `deriveBodyWorldClosureState()` → `loopGain`
- **Runtime / Observer**: Runtime (derived metric)
- **Beginner Label**: ループゲイン (loop gain)
- **Researcher Label**: Body-World Loop Gain
- **What it indicates**: returnStrength / expectedReturn (0..1.5)
- **What it does NOT prove**: Agency, self-causation, life

### C2. returnStrength

- **Source**: `src/closure/deriveBodyWorldClosureState.ts` → `deriveBodyWorldClosureState()` → `returnStrength`
- **Runtime / Observer**: Runtime (derived metric)
- **Beginner Label**: 戻り強度 (return strength)
- **Researcher Label**: Sensory Return Strength
- **What it indicates**: Intensity of sensory return from world (0..1)
- **What it does NOT prove**: Perception, sensation, consciousness

### C3. returnMismatch

- **Source**: `src/closure/deriveBodyWorldClosureState.ts` → `deriveBodyWorldClosureState()` → `returnMismatch`
- **Runtime / Observer**: Runtime (derived metric)
- **Beginner Label**: 戻り不一致 (return mismatch)
- **Researcher Label**: Return Mismatch
- **What it indicates**: Mismatch between expected and actual return (0..1)
- **What it does NOT prove**: Error, mistake, consciousness

### C4. selfCausedMatch

- **Source**: `src/closure/deriveBodyWorldClosureState.ts` → `deriveBodyWorldClosureState()` → `selfCausedMatch`
- **Runtime / Observer**: Runtime (derived metric)
- **Beginner Label**: 自己起因の一致 (self-caused match)
- **Researcher Label**: Self-Caused Match
- **What it indicates**: How much return matches expectation (0..1)
- **What it does NOT prove**: Agency, self-causation, free will

### C5. closureStability

- **Source**: `src/closure/deriveBodyWorldClosureState.ts` → `deriveBodyWorldClosureState()` → `closureStability`
- **Runtime / Observer**: Runtime (derived metric)
- **Beginner Label**: 閉ループ安定性 (closure stability)
- **Researcher Label**: Body-World Closure Stability
- **What it indicates**: Stability of closed loop (0..1)
- **What it does NOT prove**: Life, homeostasis, self-regulation

### C6. membraneDeformation

- **Source**: `src/boundary/membrane.ts` → `membraneState.membraneDeformation`
- **Runtime / Observer**: Runtime (membrane state)
- **Beginner Label**: 膜変形 (membrane deformation)
- **Researcher Label**: Membrane Deformation
- **What it indicates**: Deformation of boundary membrane (0..1)
- **What it does NOT prove**: Boundary, self/other, consciousness

---

## D. 履歴 (History)

### D1. activityResidue

- **Source**: `src/core/AeternaNetwork.js` → `network.activityResidue[i]` (per-cell)
- **Runtime / Observer**: Runtime (core dynamics state)
- **Beginner Label**: 活動残留 (activity residue)
- **Researcher Label**: Activity Residue
- **What it indicates**: Accumulated activity residue per cell (0..1.25)
- **What it does NOT prove**: Memory, trace, learning

### D2. traceState

- **Source**: `src/organism/deriveTraceState.ts` → `deriveTraceState()`
- **Runtime / Observer**: Observer-side (derived metric)
- **Beginner Label**: 痕跡状態 (trace state)
- **Researcher Label**: Trace State
- **What it indicates**: Trace state summary (decayRate, retentionStrength, volatility, meanTrace, peakTrace)
- **What it does NOT prove**: Memory, learning, consciousness

### D3. replayState

- **Source**: `src/organism/deriveReplayState.ts` → `deriveReplayState()`
- **Runtime / Observer**: Observer-side (derived metric)
- **Beginner Label**: 再生状態 (replay state)
- **Researcher Label**: Replay State
- **What it indicates**: Replay state summary (replayPhase, replayDrive, replayBias, replayNovelty, replayClarity)
- **What it does NOT prove**: Memory, recall, consciousness

### D4. plasticityTrace

- **Source**: `src/observer/deriveWeakPlasticityObservation.ts` → `deriveWeakPlasticityObservation()`
- **Runtime / Observer**: Observer-side (derived metric)
- **Beginner Label**: 弱い可塑性痕跡 (weak plasticity trace)
- **Researcher Label**: Weak Plasticity Trace
- **What it indicates**: Weak plasticity trace (observer-side only, not runtime memory)
- **What it does NOT prove**: Learning, memory, semantic memory

### D5. recentHistoryBias

- **Source**: `src/organism/livingState.ts` → `livingState.recentHistoryBias`
- **Runtime / Observer**: Runtime (persistent living state)
- **Beginner Label**: 最近の履歴バイアス (recent history bias)
- **Researcher Label**: Recent History Bias
- **What it indicates**: EMA of recent perturbations (-0.5..0.5)
- **What it does NOT prove**: Memory, learning, consciousness

---

## E. 創発候補 (Emergent Candidates)

### E1. protoPoint候補数

- **Source**: `src/observer/deriveProtoPointCandidates.ts` → `protoPointObservationState.candidates.length`
- **Runtime / Observer**: Observer-side (candidate observation)
- **Beginner Label**: 原初点候補数 (proto-point candidate count)
- **Researcher Label**: Proto-Point Candidate Count
- **What it indicates**: Number of proto-point candidates (observer-side only)
- **What it does NOT prove**: Neuron, node, semantic unit

### E2. protoNeuron候補数

- **Source**: `src/observer/deriveProtoNeuronCandidates.ts` → `protoNeuronObservationState.candidates.length`
- **Runtime / Observer**: Observer-side (candidate observation)
- **Beginner Label**: 原初ニューロン候補数 (proto-neuron candidate count)
- **Researcher Label**: Proto-Neuron Candidate Count
- **What it indicates**: Number of proto-neuron candidates (observer-side only, not runtime nodes)
- **What it does NOT prove**: Neuron, consciousness, intelligence

### E3. protoNetwork候補数

- **Source**: `src/observer/deriveProtoNetworkCandidates.ts` → `protoNetworkObservationState.candidates.length`
- **Runtime / Observer**: Observer-side (candidate observation)
- **Beginner Label**: 原初ネットワーク候補数 (proto-network candidate count)
- **Researcher Label**: Proto-Network Candidate Count
- **What it indicates**: Number of proto-network candidates (observer-side only, not runtime graph)
- **What it does NOT prove**: Network, semantic network, intelligence

### E4. vortex候補数

- **Source**: `src/observer/deriveVortexCandidates.ts` → `vortexCandidates.length`
- **Runtime / Observer**: Observer-side (candidate observation)
- **Beginner Label**: 渦候補数 (vortex candidate count)
- **Researcher Label**: Vortex Candidate Count
- **What it indicates**: Number of vortex candidates (topological charge, phase defect)
- **What it does NOT prove**: Mind, thought, consciousness

---

## F. リスク (Risk)

### F1. collapseRisk

- **Source**: `src/observer/deriveNaturalDiagnosticState.ts` → `naturalDiagnosticState.extinctionRisk`
- **Runtime / Observer**: Observer-side (diagnostic metric)
- **Beginner Label**: 崩壊リスク (collapse risk)
- **Researcher Label**: Extinction Risk (Collapse)
- **What it indicates**: Risk of field extinction (0..1)
- **What it does NOT prove**: Death, failure, cessation

### F2. saturationRisk

- **Source**: `src/observer/deriveNaturalDiagnosticState.ts` → `naturalDiagnosticState.saturationRisk`
- **Runtime / Observer**: Observer-side (diagnostic metric)
- **Beginner Label**: 飽和リスク (saturation risk)
- **Researcher Label**: Saturation Risk
- **What it indicates**: Risk of field saturation (0..1)
- **What it does NOT prove**: Overflow, overload, distress

### F3. overload

- **Source**: `src/organism/survivalState.ts` → `updateHomeostaticState()` → `overload`
- **Runtime / Observer**: Runtime (organism state)
- **Beginner Label**: 過負荷 (overload)
- **Researcher Label**: Organism Overload
- **What it indicates**: Current organism overload level (0..1)
- **What it does NOT prove**: Stress, suffering, distress

### F4. NaN / Infinity

- **Source**: Runtime validation (check for NaN/Infinity in all buffers)
- **Runtime / Observer**: Runtime (integrity check)
- **Beginner Label**: 数値異常 (numerical anomaly)
- **Researcher Label**: NaN / Infinity Check
- **What it indicates**: Whether NaN or Infinity is present in any buffer (boolean)
- **What it does NOT prove**: Bug, error, failure (just a check)

### F5. feedbackSaturation

- **Source**: `src/closure/deriveBodyWorldClosureState.ts` → `deriveBodyWorldClosureState()` → `feedbackSaturationRisk`
- **Runtime / Observer**: Runtime (derived metric)
- **Beginner Label**: フィードバック飽和リスク (feedback saturation risk)
- **Researcher Label**: Feedback Saturation Risk
- **What it indicates**: Risk of feedback loop saturation (0..1)
- **What it does NOT prove**: Danger, failure, collapse

---

## Summary Table

| Category | Metric | Beginner Label (JP) | Researcher Label (EN) | Runtime / Observer | Source |
|---|---|---|---|---|---|
| A. Torus Life Field | arousal | 覚醒度 | Firing Rate | Runtime | dynamicCore.ts |
| A. Torus Life Field | sigma | 臨界性 | Branching Ratio σ | Runtime | dynamicCore.ts |
| A. Torus Life Field | phaseCoherence | 位相の揃い | Phase Coherence | Runtime | torusMetrics.ts |
| A. Torus Life Field | clusterRatio | 最大クラスタ比 | Cluster Ratio | Runtime | torusMetrics.ts |
| A. Torus Life Field | baselineLevel | 基底活動 | Baseline Level | Runtime | baselineActivity.ts |
| A. Torus Life Field | residueLevel | 残留活動 | Activity Residue Level | Runtime | baselineActivity.ts |
| A. Torus Life Field | firingRateError | 目標との差 | Firing Rate Error | Runtime | dynamicCore.ts |
| B. Vital Stem | energy | エネルギー | Organism Energy | Runtime | survivalState.ts |
| B. Vital Stem | stability | 安定性 | Organism Stability | Runtime | survivalState.ts |
| B. Vital Stem | overload | 過負荷 | Organism Overload | Runtime | survivalState.ts |
| B. Vital Stem | fatigue | 疲労 | Living State Fatigue | Runtime | livingState.ts |
| B. Vital Stem | coherenceMemory | 過去の揃い記憶 | Coherence Memory | Runtime | livingState.ts |
| B. Vital Stem | predictionSensitivity | 予測感度 | Prediction Sensitivity | Runtime | livingState.ts |
| B. Vital Stem | touchNeedBaseline | 接触開放度 | Touch Need Baseline | Runtime | livingState.ts |
| B. Vital Stem | modeState | モード | Mode State | Runtime | modeController.ts |
| B. Vital Stem | actionState | 行動 | Action State | Runtime | actionDecision.ts |
| C. Body-World Closure | loopGain | ループゲイン | Body-World Loop Gain | Runtime | deriveBodyWorldClosureState.ts |
| C. Body-World Closure | returnStrength | 戻り強度 | Sensory Return Strength | Runtime | deriveBodyWorldClosureState.ts |
| C. Body-World Closure | returnMismatch | 戻り不一致 | Return Mismatch | Runtime | deriveBodyWorldClosureState.ts |
| C. Body-World Closure | selfCausedMatch | 自己起因の一致 | Self-Caused Match | Runtime | deriveBodyWorldClosureState.ts |
| C. Body-World Closure | closureStability | 閉ループ安定性 | Body-World Closure Stability | Runtime | deriveBodyWorldClosureState.ts |
| C. Body-World Closure | membraneDeformation | 膜変形 | Membrane Deformation | Runtime | membrane.ts |
| D. History | activityResidue | 活動残留 | Activity Residue | Runtime | AeternaNetwork.js |
| D. History | traceState | 痕跡状態 | Trace State | Observer | deriveTraceState.ts |
| D. History | replayState | 再生状態 | Replay State | Observer | deriveReplayState.ts |
| D. History | plasticityTrace | 弱い可塑性痕跡 | Weak Plasticity Trace | Observer | deriveWeakPlasticityObservation.ts |
| D. History | recentHistoryBias | 最近の履歴バイアス | Recent History Bias | Runtime | livingState.ts |
| E. Emergent Candidates | protoPointCount | 原初点候補数 | Proto-Point Candidate Count | Observer | deriveProtoPointCandidates.ts |
| E. Emergent Candidates | protoNeuronCount | 原初ニューロン候補数 | Proto-Neuron Candidate Count | Observer | deriveProtoNeuronCandidates.ts |
| E. Emergent Candidates | protoNetworkCount | 原初ネットワーク候補数 | Proto-Network Candidate Count | Observer | deriveProtoNetworkCandidates.ts |
| E. Emergent Candidates | vortexCount | 渦候補数 | Vortex Candidate Count | Observer | deriveVortexCandidates.ts |
| F. Risk | collapseRisk | 崩壊リスク | Extinction Risk | Observer | deriveNaturalDiagnosticState.ts |
| F. Risk | saturationRisk | 飽和リスク | Saturation Risk | Observer | deriveNaturalDiagnosticState.ts |
| F. Risk | overload | 過負荷 | Organism Overload | Runtime | survivalState.ts |
| F. Risk | NaN/Infinity | 数値異常 | NaN / Infinity Check | Runtime | (validation check) |
| F. Risk | feedbackSaturation | フィードバック飽和リスク | Feedback Saturation Risk | Runtime | deriveBodyWorldClosureState.ts |

---

## Next Steps for v2.7

1. Create `src/ui/summary/deriveNowSummary.ts` — derive now summary from all state
2. Create `src/ui/summary/NowSummaryPanel.tsx` — display now summary in Japanese-first UI
3. Use beginner/standard/researcher/developer display modes from `observationDisplayModeConfig.ts`
4. Show beginner labels by default, with tooltip explaining what it does NOT prove
5. Add "詳細" (details) button to open observation workspace for deeper inspection
6. Test with multiple scenarios (quiet baseline, high activity, high overload, collapse risk)

---

**Ready for v2.7**: ✅ Metrics defined, sources identified, labels prepared
