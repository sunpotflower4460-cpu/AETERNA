# Core Boundary Freeze

**Version**: v2.6.5 — Core Boundary Freeze
**Date**: 2026-05-07
**Purpose**: Establish clear boundaries between torus life field, vital stem, observer, and bridge

---

## 1. Purpose

This document freezes the boundaries between:
1. **Inner Torus Life Field** — the living core that must not be casually modified
2. **Proto-Organism / Vital Stem** — persistent organism state with weak runtime influence
3. **Observer / Super Observation** — external observation tools with no runtime impact
4. **Bridge / Signal Runtime** — translation layer with one-way connection (for now)

**Goal**: Protect the core dynamics while allowing safe extension of observation tools.

---

## 2. What is AETERNA Core

AETERNA core is the **continuous wave propagation on a torus** with:
- Baseline activity (ongoing sine wave)
- Activity residue (slow accumulation)
- Spike trace (firing events)
- Prediction error (mismatch signal)
- Directional weights (propagation paths)
- Homeostatic damping (self-regulation)

**Core = ongoingness without external input**

The core does NOT include:
- Semantic memory
- Consciousness
- Intelligence
- Meaning formation
- LLM integration
- Node bridge bidirectional feedback

---

## 3. Inner Torus Life Field

### Definition

The **Inner Torus Life Field** is the continuous wave propagation substrate that:
- Continues without external input (baseline + residue)
- Has intrinsic dynamics (wave speed, damping, threshold)
- Self-regulates toward target firing rate (homeostatic damping)
- Accumulates activity traces (residue, spike trace)
- Generates prediction error (mismatch between expected and actual)

### Files (Do Not Touch Without Explicit Intent)

- `src/core/AeternaNetwork.js` — live CPU state holder, packet-flow orchestration
- `src/core/dynamicCore.ts` — wave propagation, baseline, residue, spike trace, damping, threshold
- `src/core/torusDynamics.ts` — dynamics stage wrapper
- `src/mode/baselineActivity.ts` — baseline activity + residue stage
- `src/core/DynamicsEngine.ts` — separated engine (currently delegates to dynamicCore.ts)
- `src/core/PredictionCore.ts` — prediction error computation engine
- `src/core/PlasticityEngine.ts` — rewrite/adaptation engine (placeholder)
- `src/core/NoiseField.ts` — baseline noise generation
- `src/core/OrganismRuntime.ts` — engine coordinator (minimal, will grow)

### State Variables (Inner Torus)

- `currentBuffer / prevBuffer / nextBuffer` — wave state triple-buffer
- `baselineActivity[i]` — baseline sine wave activity per cell
- `activityResidue[i]` — accumulated activity residue (slow decay)
- `spikeTrace[i]` — spike trace (1.0 on fire, decays 0.9/tick)
- `predictionError[i]` — currentBuffer[i] - localPrediction[i]
- `w_up / w_down / w_left / w_right` — directional weights (normalized to 4.0 sum)
- `sigmaDisplay` — branching ratio EMA (critical/subcritical)
- `arousal` — firing rate (currGenFiring / numNodes)
- `firingRateError` — TARGET_FIRING_RATE - arousal

### Constants (Neutral Mode Default)

- `waveSpeedBase` — base wave propagation speed (explicit config, not external constant)
- `waveSpeedFreqScale` — frequency-dependent wave speed scaling
- `dampingBase` — base damping factor (explicit config, not external constant)
- `dampingLoss` — frequency-dependent damping loss
- `freqRangeMin / freqRangeMax` — frequency range for ratio calculation
- `TARGET_FIRING_RATE` — homeostatic firing rate target
- `BASELINE_AMP` — baseline sine wave amplitude
- `RESIDUE_DECAY` — residue decay factor
- `RESIDUE_INTAKE` — residue intake factor

**Important**: Since N6 External Constants Removal, AETERNA uses **neutral mode** by default:
- No PHI_INV / SCHUMANN_RES in causal path
- Only explicit config parameters
- Legacy mode available for comparison only (not production default)

### What Belongs Here

- Wave propagation logic
- Baseline activity generation
- Residue accumulation / decay
- Spike trace logic
- Prediction error computation
- Directional weight normalization
- Homeostatic damping
- Threshold crossing detection

### What Does NOT Belong Here

- Semantic memory
- Meaning formation
- LLM feedback
- Node bridge bidirectional feedback
- Proto-neuron runtime nodes
- Proto-network runtime edges
- Consciousness / life / intelligence proof claims

---

## 4. Proto-Organism / Vital Stem

### Definition

The **Proto-Organism / Vital Stem** is the persistent organism state that:
- Drifts slowly across ticks (fatigue, coherenceMemory, residueBias)
- Has weak influence on core dynamics (0.5..1.1 range)
- Maintains energy / stability / overload
- Controls mode (wake/sleep/dream) and action (idle/orient/withdraw)
- Participates in body-world closure

### Files (Weak Influence Only)

- `src/organism/livingState.ts` — persistent living state (fatigue, coherenceMemory, etc.)
- `src/organism/bodyState.ts` — energy/stability/overload packet assembly
- `src/organism/survivalState.ts` — homeostatic state
- `src/organism/energyFlow.ts` — energy flow state
- `src/organism/actionDecision.ts` — idle/orient/withdraw/settle action selection
- `src/mode/modeController.ts` — wake/sleep/dream mode selection
- `src/closure/deriveReafferenceComparison.ts` — reafference comparison
- `src/closure/deriveBodyWorldClosureState.ts` — body-world closure state
- `src/closure/deriveMediumProfileState.ts` — medium profile (delay/echo/resistance)
- `src/boundary/membrane.ts` — membrane state (integrity, exchange, deformation)

### State Variables (Vital Stem)

**Living State**:
- `fatigue` — increases with activity, slowly decreases in quiet (0..0.8)
- `coherenceMemory` — smoothed memory of recent coherence (0..1)
- `preferredErgodicity` — flow preference (very slow drift, 0.2..0.8)
- `longBaselineTone` — glacially slow baseline tone (0.05..0.25)
- `recentHistoryBias` — EMA of recent perturbations (-0.5..0.5)
- `residueBias` — how easily residue accumulates (0.2..0.8)
- `predictionSensitivity` — changes with experience (0.2..0.9)
- `touchNeedBaseline` — openness to tactile input (0.2..0.8)
- `lastMajorPerturbationAt` — timestamp of last major perturbation
- `stabilityMemory` — slow integration of stability (0..1)
- `overloadMemory` — tracks recent overload (0..1)

**Organism State**:
- `energy` — organism energy (0..1)
- `stability` — organism stability (0..1)
- `overload` — organism overload (0..1)
- `modeState` — 'wake' / 'sleep' / 'dream'
- `wakeDrive / sleepPressure / dreamPressure` — mode drive values (0..1)
- `actionState` — 'idle' / 'orient' / 'withdraw' / 'settle'
- `orientingDrive / restDrive` — action drive values (0..1)

**Body-World Closure**:
- `loopGain` — returnStrength / expectedReturn (0..1.5)
- `roundTripDelay` — actuation→return delay (0..1)
- `returnStrength` — intensity of sensory return (0..1)
- `selfCausedMatch` — how much return matches expectation (0..1)
- `worldMismatch` — world-caused difference + return mismatch (0..1)
- `closureStability` — stability of closed loop (0..1)
- `closureDrift` — drift from previous state (0..1)
- `unresolvedReturn` — unresolved sensory return (0..1)
- `feedbackSaturationRisk` — risk of feedback saturation (0..1)
- `comparisonConfidence` — confidence in reafference comparison (0..1)
- `returnMismatch` — mismatch between expected and actual return (0..1)

### Weak Influence on Core

Living state influence is **intentionally weak** (0.5..1.1 range):
- `baselineGainModifier` — fatigue reduces baseline gain (0.5..1.1)
- `predictionSensitivityModifier` — affects prediction error processing (0.6..1.2)
- `residueGainModifier` — affects residue accumulation (0.8..1.15)
- `modeStabilityBias` — coherence memory biases toward stable regimes (0..0.2)
- `rewriteGainModifier` — recent history bias affects rewrite tendency (0.95..1.1)

**Important**: These are **weak influences**, not hard overrides. The core dynamics remain dominant.

### What Belongs Here

- Persistent organism state that drifts slowly
- Energy / stability / overload tracking
- Mode (wake/sleep/dream) and action (idle/orient/withdraw) control
- Body-world closure state
- Reafference comparison
- Membrane state
- Weak influence on core (0.5..1.1 range)

### What Does NOT Belong Here

- Strong feedback to core (>1.5x modulation)
- Semantic memory
- Meaning formation
- LLM feedback
- Node bridge bidirectional feedback
- Proto-neuron runtime nodes
- Proto-network runtime edges

---

## 5. Observer / Super Observation

### Definition

The **Observer / Super Observation** system is the external observation apparatus that:
- Has **no runtime impact** on core dynamics
- Observes metrics, candidates, patterns from the outside
- Provides visual lenses, cell inspector, time replay, causal trace
- Generates proto-neuron / proto-network candidates (observer-side only, not runtime nodes)

### Files (Safe to Extend)

**Core Observation**:
- `src/observation/deriveCellObservation.ts` — cell observation state (all metrics for one cell)
- `src/ui/inspector/cellInspectorState.ts` — cell inspector state
- `src/ui/lens/metricLensRegistry.ts` — 17 visual lenses
- `src/ui/lens/lensContextPacket.ts` — lens context packet
- `src/ui/inspector/aiGuideContextInterface.ts` — AI guide context interface

**Observer-Side Candidates**:
- `src/observer/deriveProtoNeuronCandidates.ts` — proto-neuron candidates (observer-side only)
- `src/observer/deriveProtoNetworkCandidates.ts` — proto-network candidates (observer-side only)
- `src/observer/deriveVortexCandidates.ts` — vortex candidates (topological charge)
- `src/observer/deriveMembraneObservation.ts` — membrane observation
- `src/observer/deriveTorusCurvatureObservation.ts` — torus curvature observation
- `src/observer/deriveLocalExcitabilityField.ts` — local excitability field (observer-side only)
- `src/observer/deriveRepeatedFlowPaths.ts` — repeated flow paths (observer-side only)
- `src/observer/deriveObservedRatios.ts` — observed ratios (observer-side only)
- `src/observer/deriveWeakPlasticityObservation.ts` — weak plasticity observation (observer-side only)

**UI Components**:
- `src/ui/observation/ObservationWorkspace.tsx` — main observation workspace
- `src/ui/observation/ObservationHeader.tsx` — header (ライブ/再生/セル/レンズ)
- `src/ui/observation/InspectorDrawer.tsx` — inspector drawer (JP tabs)
- `src/ui/observation/CellInspectorPanel.tsx` — cell inspector panel
- `src/ui/observation/MetricSpotlightPanel.tsx` — metric spotlight (visual lens)
- `src/ui/observation/TimeReplayPanel.tsx` — time replay panel
- `src/ui/observation/CausalTracePanel.tsx` — causal trace panel
- `src/ui/observation/LayerCorrelationPanel.tsx` — layer correlation panel
- `src/ui/observation/DifferenceViewPanel.tsx` — difference view panel
- `src/ui/observation/ObservedRatioInvolvementPanel.tsx` — observed ratio involvement panel
- `src/ui/guide/LensAwareGuidePanel.tsx` — lens-aware guide panel

### What Belongs Here

- Visual lenses (17 lenses)
- Cell inspector (all metrics for one cell)
- Time replay (recorded snapshot playback)
- Causal trace (indirect signal relationship candidates)
- Layer correlation (cross-layer observational data)
- Proto-neuron candidates (observer-side only, not runtime nodes)
- Proto-network candidates (observer-side only, not runtime edges)
- Vortex candidates (topological charge, phase defect)
- Membrane observation (two-sidedness, integrity, boundary exchange)
- Local excitability field (observer-side field profile, not runtime neurons)
- Repeated flow paths (observer-side path candidates, not runtime edges)
- Observed ratios (observer-side comparison, not causal)
- Weak plasticity observation (observer-side trace, not runtime memory)

### What Does NOT Belong Here

- Runtime feedback to core
- Runtime neuron nodes
- Runtime network edges
- Semantic memory
- Meaning formation
- LLM feedback
- Node bridge bidirectional feedback
- Consciousness / life / intelligence proof claims

---

## 6. Bridge / Signal Runtime

### Definition

The **Bridge / Signal Runtime** is the translation layer that:
- Converts torus state to signal runtime input (one-way: Torus → Signal)
- Generates proto-meaning seeds from touch patterns (pre-semantic)
- Runs 13-stage signal pipeline
- Has **stub feedback only** (applySignalFeedback does nothing yet)

### Files (One-Way Bridge Only)

- `src/bridge/bridge.ts` — torus→signal bridge
- `src/signal/index.js` — signal runtime entry point

### Functions

- `buildTorusStatePacket()` — assembles TorusStatePacket from live state
- `touchPatternToProtoSeeds()` — converts touch pattern scores to proto-meaning seeds (noveltyBias, recurrenceBias, persistenceBias, directionalityBias)
- `bridgeTorusToSignal()` — converts TorusStatePacket to Signal Runtime input and runs 13-stage pipeline
- `applySignalFeedback()` — **stub only** (logs highlight_hubs for debug, no actual feedback yet)

### Proto-Meaning Seeds

**Touch Pattern → Proto-Meaning Seeds**:
- `tap` → `noveltyBias` (arrival / novelty / punctate-contact)
- `repeat` → `recurrenceBias` (recurrence / return / repeated-contact)
- `hold` → `persistenceBias` (persistence / sustained-contact)
- `stroke` → `directionalityBias` (directional traversal / passage)

**Semantic Seeds** (threshold-based, not definitive):
- 'arrival', 'novelty', 'recurrence', 'return', 'persistence', 'pressure', 'passage', 'direction'

**Important**: These are **proto-meaning seeds**, not semantic meanings. They are pre-semantic bias values.

### What Belongs Here

- Torus → Signal Runtime input conversion
- Touch pattern → proto-meaning seeds conversion
- 13-stage signal pipeline execution
- Stub feedback (no actual feedback yet)

### What Does NOT Belong Here

- Strong feedback from Signal Runtime to AETERNA core
- LLM feedback to core
- Node bridge bidirectional feedback
- Semantic memory storage
- Meaning formation in core
- Consciousness / life / intelligence proof claims

---

## 7. What Must Not Be Changed Casually

### Absolutely Do Not Touch Without Explicit Intent

1. **Wave Propagation Logic** (`dynamicCore.ts`) — laplacian, wave speed, damping, homeostatic feedback
2. **Baseline Activity** (`baselineActivity.ts`) — baseline sine wave generation
3. **Residue Accumulation** (`dynamicCore.ts`) — residue decay, residue intake
4. **Spike Trace Logic** (`dynamicCore.ts`) — spike trace on threshold crossing, decay 0.9/tick
5. **Prediction Error** (`dynamicCore.ts`) — currentBuffer[i] - localPrediction[i]
6. **Directional Weights** (`torusWeights.ts`) — weight normalization to 4.0 sum
7. **Living State Influence** (`livingState.ts`) — weak influence (0.5..1.1 range) must stay weak
8. **Body-World Closure** (`deriveBodyWorldClosureState.ts`) — loop gain, closure stability must stay balanced
9. **Membrane State** (`membrane.ts`) — boundary integrity, exchange, deformation
10. **Proto-Neuron Derivation** (`deriveProtoNeuronCandidates.ts`) — observer-side only, no runtime nodes

### Why Not To Touch

- These define the **ongoingness** of the torus life field
- Changes can break **baseline continuity**
- Changes can break **residue accumulation**
- Changes can break **spike trace continuity**
- Changes can break **loop stability** in body-world closure
- Changes can introduce **semantic leap** (proto-neuron candidates becoming runtime nodes)

---

## 8. What Can Be Extended Safely

### Safe Extension Areas (Observer-Side Only)

1. **New Visual Lenses** — add new metrics to metricLensRegistry.ts (no runtime impact)
2. **New Observation Panels** — add new UI panels for observing state (no runtime impact)
3. **New Observer-Side Candidates** — add new observer-side derivation (no runtime nodes)
4. **New Guide Responses** — add new rule-based guide responses (no runtime impact)
5. **New Export Formats** — add new export formats (JSON, Markdown, CSV) (no runtime impact)
6. **New Research Scenarios** — add new headless scenarios (no runtime impact if headless)
7. **New Comparison Variants** — add new comparison variants (no runtime impact if headless)
8. **New Tests** — add new behavioral tests, scenario tests, docs tests (no runtime impact)
9. **New Docs** — add new documentation, guardrails, audit reports (no runtime impact)
10. **New Japanese Terminology** — add new observation terms, UI labels (no runtime impact)

### Extension Guidelines

- **Observer-side only** — no feedback to core dynamics
- **Weak influence only** — if adding influence, keep it weak (0.5..1.1 range)
- **Separate experiments** — LBM / NCA / distributed torus in separate sandbox, not core
- **No semantic leap** — proto-meaning seeds remain pre-semantic, no LLM feedback yet
- **No runtime nodes** — proto-neuron candidates remain observer-side, no runtime graph
- **No consciousness claims** — no "is alive", "feels", "wants", "consciousness proved", "life proved", "intelligence proved"

---

## 9. What Belongs to AETERNA-MEDIUM Instead

### External Substrate Experiment Candidates (Not Core)

These proposals must be implemented in a **separate sandbox** (AETERNA-MEDIUM candidate):

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

See `docs/external-substrate-experiment-candidates.md` for full details.

---

## 10. v2.7 Readiness Checklist

Before proceeding to v2.7 "Now Summary Panel":

- [x] Inner Torus Life Field identified and frozen
- [x] Proto-Organism / Vital Stem identified and frozen
- [x] Observer / Super Observation identified and frozen
- [x] Bridge / Signal Runtime status documented
- [x] Do-not-touch areas documented
- [x] Safe extension areas documented
- [x] AETERNA-MEDIUM candidates separated
- [x] Weak influence range (0.5..1.1) documented
- [x] Observer-side candidates documented (no runtime nodes)
- [x] Bridge feedback stub documented (no strong feedback yet)
- [x] Runtime dynamics unchanged
- [x] No LBM / NCA / distributed torus added to core
- [x] No Node bridge / LLM / API本格接続
- [x] No consciousness / life / intelligence proof claims
- [ ] Build / lint / test validated

---

**Boundary Freeze Status**: ✅ FROZEN

**Next**: Proceed to v2.7 "Now Summary Panel" with clear understanding of boundaries.
