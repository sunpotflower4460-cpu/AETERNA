# AETERNA-NATURAL Current State Audit

**Version**: v2.6.5 — Current State Audit / Core Boundary Freeze
**Date**: 2026-05-07
**Purpose**: Document the current implementation state before v2.7 "Now Summary Panel"

---

## 1. Summary

AETERNA-NATURAL is currently at v2.6 (after v2.4 Japanese-First UI / v2.5 Onboarding / v2.6 Lens Explanations planned).

The system is a torus-field observation lab where:
- **Inner Torus Life Field** — continuous wave propagation with baseline activity, residue, spike traces, prediction error
- **Vital Stem / Proto-Organism** — persistent living state, energy/stability/overload, mode (wake/sleep/dream), action decision, body-world closure
- **Observer / Super Observation** — external observation tools including cell inspector, visual lens, time replay, causal trace, proto-neuron/proto-network candidates
- **Bridge / Signal Runtime** — torus→signal one-way connection with proto-meaning seeds (no LLM feedback to core yet)

Runtime dynamics are **stable and must not be changed** without explicit intention.

---

## 2. Current Architecture

### Layer Structure

```
┌─────────────────────────────────────────────┐
│  UI / Observation Workspace                 │  ← Observer-side only
│  - ObservationWorkspace.tsx                 │
│  - CellInspectorPanel / MetricSpotlightPanel│
│  - TimeReplayPanel / CausalTracePanel       │
│  - LensAwareGuidePanel                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Observer / Super Observation               │  ← Observer-side candidates
│  - deriveCellObservation                    │
│  - deriveProtoNeuronCandidates              │
│  - deriveProtoNetworkCandidates             │
│  - deriveVortexCandidates                   │
│  - deriveMembraneObservation                │
│  - deriveTorusCurvatureObservation          │
│  - deriveLocalExcitabilityField             │
│  - deriveRepeatedFlowPaths                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Bridge / Signal Runtime                    │  ← One-way bridge (Torus → Signal)
│  - bridge.ts                                │
│  - buildTorusStatePacket                    │
│  - touchPatternToProtoSeeds                 │
│  - bridgeTorusToSignal                      │
│  - applySignalFeedback (stub only)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Vital Stem / Proto-Organism                │  ← Organism state (runtime-impacting)
│  - livingState.ts                           │
│  - bodyState.ts / survivalState.ts          │
│  - energyFlow.ts                            │
│  - modeController.ts (wake/sleep/dream)     │
│  - actionDecision.ts (idle/orient/withdraw) │
│  - deriveBodyWorldClosureState              │
│  - deriveReafferenceComparison              │
│  - membrane.ts                              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Inner Torus Life Field                     │  ← Core dynamics (do not touch)
│  - AeternaNetwork.js                        │
│  - dynamicCore.ts                           │
│  - torusDynamics.ts                         │
│  - baselineActivity.ts                      │
│  - DynamicsEngine / PredictionCore          │
│  - PlasticityEngine / NoiseField            │
│  - OrganismRuntime                          │
└─────────────────────────────────────────────┘
```

---

## 3. Update Flow Overview

Current update flow (from `AeternaNetwork.js updateDynamics()`):

1. **Baseline & Residue** — `runBaselineActivityStage()` → baselineLevel, residueLevel
2. **Perception** — touch / sound / light / motion / time sensory input
3. **Perturbation & Mismatch** — `derivePerturbationEvent()`, `derivePredictionMismatch()`
4. **Body State** — energy, stability, overload → `runBodyStateStage()`
5. **Living State** — fatigue, coherenceMemory, residueBias, predictionSensitivity → `updateLivingState()`
6. **Mode Controller** — wake/sleep/dream drive → `runModeControllerStage()`
7. **Action Decision** — idle/orient/withdraw/settle → `runActionDecisionStage()`
8. **World Medium** — `updateWorldMedium()` (simulated or external input)
9. **Sensory Return** — `deriveSensoryReturn()`
10. **Reafference Comparison** — `deriveReafferenceComparison()`
11. **Body-World Closure** — `deriveBodyWorldClosureState()`
12. **Torus Dynamics** — `runTorusDynamicsStage()` → arousal, sigma, clusterRatio, phiProxy, phaseCoherence, firingRateError
13. **Observer** — metrics, proto-neuron, proto-network, lens, guide (observer-side only)

---

## 4. Inner Torus Life Field

### Core Files (Do Not Touch Without Explicit Intent)

- **`src/core/AeternaNetwork.js`** — live CPU state holder, packet-flow orchestration (68KB, ~1800 lines)
- **`src/core/dynamicCore.ts`** — wave propagation, baseline, residue, spike trace, damping, threshold
- **`src/core/torusDynamics.ts`** — stage wrapper for dynamics core
- **`src/mode/baselineActivity.ts`** — baseline activity + residue stage
- **`src/core/DynamicsEngine.ts`** — separated engine (currently delegates to dynamicCore.ts)
- **`src/core/PredictionCore.ts`** — prediction error computation engine
- **`src/core/PlasticityEngine.ts`** — rewrite/adaptation engine (placeholder)
- **`src/core/NoiseField.ts`** — baseline noise generation
- **`src/core/OrganismRuntime.ts`** — engine coordinator (minimal, will grow)

### Key State Variables (Inner Torus)

- **`currentBuffer / prevBuffer / nextBuffer`** — wave state triple-buffer
- **`baselineActivity[i]`** — baseline sine wave activity per cell
- **`activityResidue[i]`** — accumulated activity residue (slow decay)
- **`spikeTrace[i]`** — spike trace (1.0 on fire, decays 0.9/tick)
- **`predictionError[i]`** — currentBuffer[i] - localPrediction[i]
- **`w_up / w_down / w_left / w_right`** — directional weights (normalized to 4.0 sum)
- **`sigmaDisplay`** — branching ratio EMA (critical/subcritical)
- **`arousal`** — firing rate (currGenFiring / numNodes)
- **`firingRateError`** — TARGET_FIRING_RATE - arousal

### Constants (Neutral Mode Default)

Since N6 External Constants Removal, AETERNA core uses **neutral mode** by default:
- No PHI_INV / SCHUMANN_RES in causal path
- Only explicit config parameters (waveSpeedBase, dampingBase, freqRangeMin/Max)
- Legacy mode available for comparison only (not production default)

---

## 5. Vital Stem / Proto-Organism

### Persistent Living State (Runtime-Impacting)

**File**: `src/organism/livingState.ts`

Persistent organism state that **drifts slowly** across ticks:

- **`fatigue`** — increases with activity, slowly decreases in quiet (0..0.8)
- **`coherenceMemory`** — smoothed memory of recent coherence (0..1)
- **`preferredErgodicity`** — flow preference (very slow drift, 0.2..0.8)
- **`longBaselineTone`** — glacially slow baseline tone (0.05..0.25)
- **`recentHistoryBias`** — EMA of recent perturbations (-0.5..0.5)
- **`residueBias`** — how easily residue accumulates (0.2..0.8)
- **`predictionSensitivity`** — changes with experience (0.2..0.9)
- **`touchNeedBaseline`** — openness to tactile input (0.2..0.8)
- **`lastMajorPerturbationAt`** — timestamp of last major perturbation
- **`stabilityMemory`** — slow integration of stability (0..1)
- **`overloadMemory`** — tracks recent overload (0..1)

**Influence on Core**:
- `baselineGainModifier` — fatigue reduces baseline gain (0.5..1.1)
- `predictionSensitivityModifier` — affects prediction error processing (0.6..1.2)
- `residueGainModifier` — affects residue accumulation (0.8..1.15)
- `modeStabilityBias` — coherence memory biases toward stable regimes (0..0.2)
- `rewriteGainModifier` — recent history bias affects rewrite tendency (0.95..1.1)

### Body State / Organism

**Files**:
- `src/organism/bodyState.ts` — energy/stability/overload packet assembly
- `src/organism/survivalState.ts` — homeostatic state (energy, stability, overload)
- `src/organism/energyFlow.ts` — energy flow state
- `src/organism/actionDecision.ts` — idle/orient/withdraw/settle action selection
- `src/mode/modeController.ts` — wake/sleep/dream mode selection

**State Variables**:
- **`energy`** — organism energy (0..1)
- **`stability`** — organism stability (0..1)
- **`overload`** — organism overload (0..1)
- **`modeState`** — 'wake' / 'sleep' / 'dream'
- **`wakeDrive / sleepPressure / dreamPressure`** — mode drive values (0..1)
- **`actionState`** — 'idle' / 'orient' / 'withdraw' / 'settle'
- **`orientingDrive / restDrive`** — action drive values (0..1)

---

## 6. Body-World Closure

### Closed-Loop Components

**Files**:
- `src/body/deriveBodySurfaceState.ts` — body surface state (two-sided boundary)
- `src/actuation/deriveActuationPulse.ts` — actuation pulse (action→world)
- `src/world/updateWorldMedium.ts` — world medium state (simulated or external)
- `src/perception/deriveSensoryReturn.ts` — sensory return (world→organism)
- `src/closure/deriveReafferenceComparison.ts` — reafference comparison (expected vs actual return)
- `src/closure/deriveBodyWorldClosureState.ts` — body-world closure state
- `src/closure/deriveMediumProfileState.ts` — medium profile (delay/echo/resistance)
- `src/boundary/membrane.ts` — membrane state (integrity, exchange, deformation)

**State Variables**:
- **`loopGain`** — returnStrength / expectedReturn (0..1.5)
- **`roundTripDelay`** — actuation→return delay (0..1)
- **`returnStrength`** — intensity of sensory return (0..1)
- **`selfCausedMatch`** — how much return matches expectation (0..1)
- **`worldMismatch`** — world-caused difference + return mismatch (0..1)
- **`closureStability`** — stability of closed loop (0..1)
- **`closureDrift`** — drift from previous state (0..1)
- **`unresolvedReturn`** — unresolved sensory return (0..1)
- **`feedbackSaturationRisk`** — risk of feedback saturation (0..1)
- **`comparisonConfidence`** — confidence in reafference comparison (0..1)
- **`returnMismatch`** — mismatch between expected and actual return (0..1)

---

## 7. Observer System

### Super Observation (Observer-Side Only, No Runtime Impact)

**Files**:
- `src/observation/deriveCellObservation.ts` — cell observation state (all metrics for one cell)
- `src/ui/inspector/cellInspectorState.ts` — cell inspector state
- `src/ui/lens/metricLensRegistry.ts` — 17 visual lenses
- `src/ui/lens/lensContextPacket.ts` — lens context packet
- `src/ui/inspector/aiGuideContextInterface.ts` — AI guide context interface

**UI Components**:
- `src/ui/observation/ObservationWorkspace.tsx` — main observation workspace
- `src/ui/observation/ObservationHeader.tsx` — header (live/replay/cell/lens)
- `src/ui/observation/InspectorDrawer.tsx` — inspector drawer (cell/lens/guide)
- `src/ui/observation/CellInspectorPanel.tsx` — cell inspector panel
- `src/ui/observation/MetricSpotlightPanel.tsx` — metric spotlight (visual lens)
- `src/ui/observation/TimeReplayPanel.tsx` — time replay panel
- `src/ui/observation/CausalTracePanel.tsx` — causal trace panel
- `src/ui/observation/LayerCorrelationPanel.tsx` — layer correlation panel
- `src/ui/observation/DifferenceViewPanel.tsx` — difference view panel
- `src/ui/observation/ObservedRatioInvolvementPanel.tsx` — observed ratio involvement panel
- `src/ui/guide/LensAwareGuidePanel.tsx` — lens-aware guide panel

**Visual Lenses** (17 lenses):
1. arousal
2. sigma
3. clusterRatio
4. phaseCoherence
5. energy
6. stability
7. overload
8. baselineLevel
9. residueLevel
10. predictionError
11. touchActive
12. modeState
13. actionState
14. loopGain
15. closureStability
16. protoNeuronCount
17. protoNetworkCount

---

## 8. Proto-Neuron / Proto-Network Observation

### Observer-Side Candidates (No Runtime Neuron Nodes)

**Proto-Neuron Candidate** (`src/observer/deriveProtoNeuronCandidates.ts`):
- **`excitability`** — local excitability tendency (0..1)
- **`refractoryPattern`** — refractory pattern quality (0..1)
- **`localPropagation`** — propagation tendency to neighbors (0..1)
- **`traceRetention`** — trace retention over time (0..1)
- **`recurrenceScore`** — recurrence score (0..1)
- **`coActivationScore`** — co-activation with other candidates (0..1)
- **`weakPlasticityScore`** — weak plasticity trace (0..1)
- **`closureCoupling`** — coupling with body-world closure (0..1)
- **`confidence`** — weighted average of above metrics (0..1)
- **`lifecycle`** — 'nascent' / 'emerging' / 'sustained' / 'fading'

**Proto-Network Candidate** (`src/observer/deriveProtoNetworkCandidates.ts`):
- **`coActivationStrength`** — co-activation strength among group (0..1)
- **`propagationStrength`** — propagation strength among group (0..1)
- **`recurrenceStrength`** — recurrence strength among group (0..1)
- **`traceCorrelation`** — trace correlation among group (0..1)
- **`replayCoReturn`** — replay co-return tendency (0..1)
- **`closureCoupling`** — closure coupling with body-world loop (0..1)
- **`weakPlasticity`** — weak plasticity trace (0..1)
- **`confidence`** — weighted average of above metrics (0..1)

**Important**:
- These are **observer-side candidates only**
- No runtime neuron nodes are created
- No runtime edges / graph structure is built
- No semantic memory is stored
- No feedback to core dynamics

---

## 9. Bridge Status

### Current Bridge State (One-Way: Torus → Signal)

**File**: `src/bridge/bridge.ts`

**Torus → Signal Runtime Input**:
- `buildTorusStatePacket()` — assembles TorusStatePacket from live state
- `touchPatternToProtoSeeds()` — converts touch pattern scores to proto-meaning seeds (noveltyBias, recurrenceBias, persistenceBias, directionalityBias)
- `bridgeTorusToSignal()` — converts TorusStatePacket to Signal Runtime input and runs 13-stage pipeline

**Signal Runtime → Torus Feedback**:
- `applySignalFeedback()` — **stub only** (logs highlight_hubs for debug, no actual feedback yet)

**Proto-Meaning Seed Generation**:
- **Touch pattern seeds** — derived from touch pattern scores (tap→novelty, repeat→recurrence, hold→persistence, stroke→directionality)
- **Semantic seeds** — 'arrival', 'novelty', 'recurrence', 'return', 'persistence', 'pressure', 'passage', 'direction' (threshold-based, not definitive)

**Important**:
- No strong feedback from Signal Runtime to AETERNA core yet
- AETERNA本体は意味化される前の生命場として守る
- Node bridge / LLM / API は本格接続していない

---

## 10. UI / Observation Workspace

### Current UI State

**Japanese-First UI** (v2.4):
- `src/i18n/observationTermsJa.ts` — 44 observation terms with beginner/standard/researcher/developer display modes
- `src/i18n/valueKindLabelsJa.ts` — 7 ValueKind labels (Raw / Derived / Proxy / Check / Reference / Candidate / MetaObserver)
- `src/i18n/uiLabelsJa.ts` — UI_TABS_JA / UI_PANEL_DESCRIPTIONS_JA / UI_DISCLAIMERS_JA
- `src/config/observationDisplayModeConfig.ts` — beginner/standard/researcher/developer display modes
- `src/ui/terms/ObservationGlossaryPanel.tsx` — observation glossary panel
- `src/ui/terms/ObservationTermCard.tsx` — term card
- `src/ui/terms/TermTooltip.tsx` — term tooltip

**Observation Workspace** (v2.0):
- `src/ui/observation/ObservationWorkspace.tsx` — main workspace (live/replay/cell/lens tabs)
- `src/ui/observation/ObservationHeader.tsx` — header (ライブ/再生/セル/レンズ)
- `src/ui/observation/InspectorDrawer.tsx` — inspector drawer (JP tabs)
- `src/ui/observation/ObservationMobileTabs.tsx` — mobile tabs (JP labels)
- `src/ui/observation/ObservationDiagnosticStrip.tsx` — diagnostic strip

---

## 11. Current Strengths

1. **Stable Torus Dynamics** — baseline + residue + spike trace + prediction error working reliably
2. **Persistent Living State** — slow drift, fatigue, coherenceMemory, residueBias, predictionSensitivity
3. **Body-World Closure** — closed loop with reafference comparison, loop gain, closure stability
4. **Proto-Organism** — energy/stability/overload, mode (wake/sleep/dream), action (idle/orient/withdraw)
5. **Super Observation** — 17 visual lenses, cell inspector, time replay, causal trace, layer correlation
6. **Observer-Side Candidates** — proto-neuron, proto-network, vortex, membrane, local excitability, repeated flow paths
7. **Japanese-First UI** — 44 observation terms with 4 display modes (beginner/standard/researcher/developer)
8. **Bridge (One-Way)** — Torus → Signal Runtime with proto-meaning seeds (no strong feedback yet)
9. **Reproducibility** — seed / config / scenario / ticks in export (JSON/Markdown)
10. **Guardrails** — language claim QA, fake visual guard, no consciousness/life/intelligence proof claims

---

## 12. Current Risks

1. **Complex Update Flow** — 13+ stages in AeternaNetwork.updateDynamics(), hard to trace
2. **Large AeternaNetwork.js** — 68KB, ~1800 lines, many responsibilities
3. **Engine Separation Incomplete** — DynamicsEngine / PredictionCore / PlasticityEngine are stubs, not yet active
4. **Bridge Feedback Stub** — applySignalFeedback() does nothing yet, future bidirectional risk
5. **No LBM / NCA / Distributed Torus** — external substrate experiments not separated yet
6. **Grok Proposal Mixing Risk** — LBM / materiality / collapse law could leak into core if not guarded
7. **Weak vs Strong Influence** — livingState influence is weak (0.5..1.1 range), but could be strengthened unintentionally
8. **Proto-Neuron Candidate Creep** — risk of turning observer-side candidates into runtime nodes
9. **Semantic Leak Risk** — proto-meaning seeds are still pre-semantic, but risk of semantic interpretation creeping in
10. **Pre-existing Lint Errors** — 3 unused-vars errors in deriveLocalExcitabilityField.ts, deriveRepeatedFlowPaths.ts, validateReleaseSafety.ts

---

## 13. Do-Not-Touch Areas

### Absolutely Do Not Touch Without Explicit Intent

1. **`src/core/AeternaNetwork.js`** — main orchestration loop, packet flow, live state holder
2. **`src/core/dynamicCore.ts`** — wave propagation, baseline, residue, spike trace, damping, threshold
3. **`src/core/torusDynamics.ts`** — dynamics stage wrapper
4. **`src/organism/livingState.ts`** — persistent living state (fatigue, coherenceMemory, residueBias, etc.)
5. **`src/mode/baselineActivity.ts`** — baseline activity + residue stage
6. **`src/organism/bodyState.ts`** — body state packet assembly
7. **`src/organism/survivalState.ts`** — homeostatic state
8. **`src/organism/actionDecision.ts`** — action decision stage
9. **`src/mode/modeController.ts`** — mode controller stage
10. **`src/closure/deriveReafferenceComparison.ts`** — reafference comparison
11. **`src/closure/deriveBodyWorldClosureState.ts`** — body-world closure state
12. **`src/boundary/membrane.ts`** — membrane state

### Why Not To Touch

- These files define the **core dynamics** of the torus life field
- Changes here can break **ongoingness, baseline, residue, spike trace, prediction error**
- Weak influences from livingState are **intentionally weak** (0.5..1.1 range)
- Body-world closure is **carefully balanced** for loop stability
- Membrane state affects **boundary integrity**

---

## 14. Safe Next Steps

### Can Be Extended Safely

1. **Observer-Side Tools** — new visual lenses, new metrics, new observation panels (no runtime impact)
2. **Guide System** — lens-aware guide, rule-based responses, question routing (no runtime impact)
3. **UI / UX** — new panels, tabs, mobile layout, Japanese terminology (no runtime impact)
4. **Docs** — new documentation, guardrails, audit reports (no runtime impact)
5. **Tests** — new behavioral tests, scenario tests, docs tests (no runtime impact)
6. **Export** — new export formats, reproducibility checks (no runtime impact)
7. **Research Scenarios** — new scenarios, preset experiments (no runtime impact if headless)
8. **Comparison Suite** — new comparison variants, long-run tests (no runtime impact if headless)

### Extension Guidelines

- **Observer-side only** — no feedback to core dynamics
- **Weak influence only** — if adding influence, keep it weak (0.5..1.1 range)
- **Separate experiments** — LBM / NCA / distributed torus in separate sandbox, not core
- **No semantic leap** — proto-meaning seeds remain pre-semantic, no LLM feedback yet
- **No runtime nodes** — proto-neuron candidates remain observer-side, no runtime graph

---

## 15. What Belongs to AETERNA-MEDIUM Instead

### External Substrate Experiment Candidates (Not Core)

These proposals should be implemented in a **separate sandbox** (AETERNA-MEDIUM candidate):

1. **Lattice Boltzmann Method (LBM)** — fluid dynamics substrate
2. **Neural Cellular Automata (NCA)** — differentiable physics substrate
3. **Distributed Torus Field** — multi-scale toroidal topology
4. **Energy as First-Class Citizen** — energy ledger, dissipation cost, recovery cost
5. **Materiality Probability** — collapse law, irreversible materialization
6. **Scale Separation** — micro/meso/macro scales

### Why Not Core

- These are **large-scale substrate changes**
- They require **separate headless comparison** before integration
- They risk **breaking existing ongoingness** if merged directly
- They need **observer-side metric translation** to compare with current core
- They need **guardrail review** to ensure no semantic leak

### Separation Rule

Do NOT merge AETERNA-MEDIUM candidates into AETERNA core without:
1. Separate sandbox implementation
2. Headless comparison (1000+ ticks, multiple scenarios)
3. Observer-side metric translation
4. Guardrail review (no semantic leak, no consciousness claim)

---

## 16. v2.7 Readiness Checklist

Before proceeding to v2.7 "Now Summary Panel":

- [x] Current state audit complete (this document)
- [x] Core boundary freeze complete (docs/core-boundary-freeze.md)
- [x] Update flow map complete (docs/current-update-flow-map.md)
- [x] v2.7 input metrics list complete (docs/v2-7-now-summary-inputs.md)
- [x] External substrate candidates separated (docs/external-substrate-experiment-candidates.md)
- [x] Inner Torus Life Field identified
- [x] Vital Stem / Proto-Organism identified
- [x] Observer / Super Observation identified
- [x] Bridge / Signal Runtime status documented
- [x] Do-not-touch areas documented
- [x] Safe next steps documented
- [x] AETERNA-MEDIUM candidates separated
- [x] Runtime dynamics unchanged
- [x] No LBM / NCA / distributed torus added to core
- [x] No Node bridge / LLM / API本格接続
- [x] No consciousness / life / intelligence proof claims
- [ ] Build / lint / test validated

---

## 17. Intentionally Not Touched

The following areas were **intentionally not modified** during this audit:

- Runtime dynamics (AeternaNetwork, dynamicCore, torusDynamics)
- Living state influence (weak range 0.5..1.1 unchanged)
- Body-world closure (loop gain, closure stability unchanged)
- Membrane state (boundary integrity unchanged)
- Proto-neuron / proto-network derivation (observer-side only, unchanged)
- Bridge feedback (still stub, no strong feedback added)
- External constants mode (neutral mode default, unchanged)
- Weak plasticity (observer-side only, unchanged)
- Observed ratios (observer-side only, unchanged)

---

**Next**: Proceed to v2.7 "Now Summary Panel" with clear understanding of:
1. What is Inner Torus Life Field (do not touch)
2. What is Vital Stem / Proto-Organism (weak influence only)
3. What is Observer / Super Observation (safe to extend)
4. What is Bridge / Signal Runtime (one-way only for now)
5. What metrics to read for "今起きていること" (see docs/v2-7-now-summary-inputs.md)
