# Current Update Flow Map

**Version**: v2.6.5 — Update Flow Map
**Date**: 2026-05-07
**Purpose**: Document the current update sequence in AeternaNetwork.js updateDynamics()

---

## Overview

This document maps the current update flow in `AeternaNetwork.js updateDynamics()`.

The flow is **packet-oriented**: each stage returns a packet, which is assembled into the final `updateDynamics()` result.

**Important**: This is the current implementation state, not a proposed redesign.

---

## Update Sequence

### 1. Baseline & Residue

**Stage**: `runBaselineActivityStage(network)`

**Purpose**: Generate baseline activity (ongoing sine wave) and update activity residue (slow accumulation).

**Inputs**:
- `network.simTime` — current simulation time
- `network.modePhase` — mode phase offset
- `network.currentModeDynamics.baselineGain` — mode-dependent baseline gain
- `network.livingState.longBaselineTone` — living state long baseline tone
- `network.spikeTrace[i]` — spike trace per cell
- `network.activityResidue[i]` — activity residue per cell

**Outputs** (`BaselineResiduePacket`):
- `baselineLevel` — mean baseline level across all cells
- `residueLevel` — mean residue level across all cells

**Side Effects**:
- Updates `network.baselineActivity[i]`
- Updates `network.activityResidue[i]`
- Adds baseline + residue to `network.currentBuffer[i]`

---

### 2. Perception (Touch / Sound / Light / Motion / Time)

**Stages**:
- `updateTouchSensory(network)`
- `updateSoundSensory(network)`
- `updateLightSensory(network)`
- `updateMotionSensory(network)`
- `updateTimeSensory(network)`

**Purpose**: Capture external sensory input and project to torus surface.

**Inputs**:
- `activeTouches` — active touch points (screen coordinates)
- `soundLevel / soundDelta / soundBandLow/Mid/High` — sound sensory input
- `lightLevel / lightDelta` — light sensory input
- `motionLevel / motionDelta` — motion sensory input
- `timePhase / timeLevel` — time sensory input

**Outputs**:
- `touchActive / touchCentroid / touchOnset / touchOffset / touchNovelty / touchTrace` — touch sensory state
- `soundActive / soundLevel / soundDelta / soundNovelty / soundPersistence / soundRecurrence / soundDirectionality` — sound sensory state
- `lightActive / lightLevel / lightDelta / lightNovelty / lightPersistence` — light sensory state
- `motionActive / motionLevel / motionDelta / motionNovelty / motionPersistence` — motion sensory state
- `timeActive / timePhase / timeLevel / timePersistence` — time sensory state

**Side Effects**:
- Updates `network.rawTouchField[i]` — raw touch field per cell
- Adds touch projection to `network.currentBuffer[i]`

---

### 3. Perturbation Event

**Helper**: `derivePerturbationEvent(rawInput, currentState)`

**Purpose**: Convert raw sensory input to structured perturbation event.

**Inputs**:
- `rawInput` — raw touch / sound / light / motion / time input
- `currentState` — organism state (energy, stability, living state)

**Outputs** (`PerturbationEvent`):
- `magnitude` — perturbation magnitude (0..1)
- `novelty` — perturbation novelty (0..1)
- `expectedness` — perturbation expectedness (0..1)
- `locality` — perturbation locality (0..1)

**Side Effects**: None (pure function)

---

### 4. Prediction Mismatch

**Helper**: `derivePredictionMismatch(event, currentState, baselinePredictionError)`

**Purpose**: Derive state-dependent prediction mismatch from perturbation event.

**Inputs**:
- `event` — perturbation event
- `currentState` — organism state (energy, stability, living state)
- `baselinePredictionError` — baseline prediction error

**Outputs** (`PredictionMismatchState`):
- `mismatchLevel` — mismatch level (0..1)
- `surprisePressure` — surprise pressure (0..1)
- `boundaryStress` — boundary stress (0..1)
- `recoveryPull` — recovery pull (0..1)

**Side Effects**: None (pure function)

---

### 5. Body State

**Stage**: `runBodyStateStage(network)`

**Purpose**: Assemble body state packet (energy, stability, overload).

**Inputs**:
- Touch sensory state
- Dynamics state (arousal, sigma)
- Prediction error state
- Rewrite state

**Outputs** (`BodyPacket`):
- `energy` — organism energy (0..1)
- `stability` — organism stability (0..1)
- `overload` — organism overload (0..1)

**Side Effects**: None (pure function)

---

### 6. Living State

**Helper**: `updateLivingState(livingState, network, {...})`

**Purpose**: Update persistent living state variables (fatigue, coherenceMemory, residueBias, predictionSensitivity).

**Inputs**:
- `livingState` — current living state
- `network` — network state
- `arousal` — current arousal
- `coherence` — current coherence
- `residueLevel` — current residue level
- `predictionError` — current prediction error
- `activeTouchCount` — active touch count
- `recentPerturbationIntensity` — recent perturbation intensity
- `stability` — current stability
- `overload` — current overload

**Outputs**: None (mutates livingState in-place)

**Side Effects**:
- Updates `livingState.fatigue`
- Updates `livingState.coherenceMemory`
- Updates `livingState.preferredErgodicity`
- Updates `livingState.longBaselineTone`
- Updates `livingState.recentHistoryBias`
- Updates `livingState.residueBias`
- Updates `livingState.predictionSensitivity`
- Updates `livingState.touchNeedBaseline`
- Updates `livingState.lastMajorPerturbationAt`
- Updates `livingState.stabilityMemory`
- Updates `livingState.overloadMemory`

---

### 7. Mode Controller

**Stage**: `runModeControllerStage(network)`

**Purpose**: Select mode (wake/sleep/dream) based on drives.

**Inputs**:
- Body state (energy, stability, overload)
- Living state (fatigue, coherenceMemory)
- Dynamics state (arousal, sigma)

**Outputs** (`ModePacket`):
- `modeState` — 'wake' / 'sleep' / 'dream'
- `wakeDrive` — wake drive (0..1)
- `sleepPressure` — sleep pressure (0..1)
- `dreamPressure` — dream pressure (0..1)

**Side Effects**:
- Updates `network.modeState`
- Updates `network.wakeDrive`
- Updates `network.sleepPressure`
- Updates `network.dreamPressure`

---

### 8. Action Decision

**Stage**: `runActionDecisionStage(network)`

**Purpose**: Select action (idle/orient/withdraw/settle) based on drives.

**Inputs**:
- Touch sensory state
- Body state (energy, stability, overload)
- Mode state (modeState)

**Outputs** (`ActionPacket`):
- `actionState` — 'idle' / 'orient' / 'withdraw' / 'settle'
- `orientingDrive` — orienting drive (0..1)
- `restDrive` — rest drive (0..1)

**Side Effects**:
- Updates `network.actionState`
- Updates `network.orientingDrive`
- Updates `network.restDrive`
- Applies action pulse to `network.currentBuffer[i]` (if orient/withdraw)

---

### 9. World Medium

**Helper**: `updateWorldMedium(worldMediumState, actuationPulse, previousState)`

**Purpose**: Update simulated world medium state.

**Inputs**:
- `worldMediumState` — current world medium state
- `actuationPulse` — actuation pulse from organism (or null)
- `previousState` — previous world medium state

**Outputs** (`WorldMediumState`):
- `mediumStability` — medium stability (0..1)
- `mediumDelay` — medium delay (0..1)
- `mediumEcho` — medium echo (0..1)
- `mediumResistance` — medium resistance (0..1)
- `mediumDissipation` — medium dissipation (0..1)

**Side Effects**: None (pure function)

---

### 10. Sensory Return

**Helper**: `deriveSensoryReturn(worldMediumState, actuationPulse)`

**Purpose**: Derive sensory return from world medium.

**Inputs**:
- `worldMediumState` — world medium state
- `actuationPulse` — actuation pulse from organism (or null)

**Outputs** (`SensoryReturnPacket[]`):
- Array of sensory return packets with `intensity`, `returnDelayHint`, `modalityHint`

**Side Effects**: None (pure function)

---

### 11. Reafference Comparison

**Helper**: `deriveReafferenceComparison(actuationPulse, sensoryReturns, bodyWorldClosureState)`

**Purpose**: Compare expected return with actual return.

**Inputs**:
- `actuationPulse` — actuation pulse from organism (or null)
- `sensoryReturns` — sensory return packets from world
- `bodyWorldClosureState` — previous body-world closure state (or null)

**Outputs** (`ReafferenceComparisonState`):
- `expectedReturn` — expected return intensity (0..1)
- `actualReturn` — actual return intensity (0..1)
- `returnMismatch` — mismatch between expected and actual (0..1)
- `returnDelay` — delay of sensory return (0..1)
- `selfCausedMatch` — how much return matches expectation (0..1)
- `worldCausedDifference` — world-caused difference (0..1)
- `unresolvedReturn` — unresolved sensory return (0..1)
- `comparisonConfidence` — confidence in comparison (0..1)

**Side Effects**: None (pure function)

---

### 12. Body-World Closure

**Helper**: `deriveBodyWorldClosureState(input)`

**Purpose**: Derive body-world closure state from actuation, sensory return, reafference comparison.

**Inputs**:
- `actuationPulse` — actuation pulse from organism (or null)
- `sensoryReturns` — sensory return packets from world
- `worldMediumState` — world medium state
- `reafferenceComparisonState` — reafference comparison state
- `ongoingness` — ongoingness level (0..1)
- `previousState` — previous body-world closure state (or null)

**Outputs** (`BodyWorldClosureState`):
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

**Side Effects**: None (pure function)

---

### 13. Torus Dynamics

**Stage**: `runTorusDynamicsStage(network)`

**Purpose**: Run wave propagation on torus.

**Inputs**:
- `network.currentBuffer[i]` — current wave state
- `network.prevBuffer[i]` — previous wave state
- `network.w_up/down/left/right[i]` — directional weights
- `network.nodeSign[i]` — node sign (+1 or -1)

**Outputs** (`DynamicsPacket`):
- `arousal` — firing rate (currGenFiring / numNodes)
- `sigma` — branching ratio EMA (critical/subcritical)
- `clusterRatio` — largest cluster size / numNodes
- `phiProxy` — integrated information proxy
- `phaseCoherence` — phase coherence across cells
- `firingRateError` — TARGET_FIRING_RATE - arousal
- `freqRatio` — frequency ratio for wave speed / damping

**Side Effects**:
- Updates `network.currentBuffer[i]` — new wave state
- Updates `network.prevBuffer[i]` — old current state
- Updates `network.nextBuffer[i]` — becomes new prevBuffer (triple-buffer rotation)
- Updates `network.spikeTrace[i]` — spike trace (1.0 on threshold crossing, decay 0.9)
- Updates `network.sigmaDisplay` — branching ratio EMA
- Updates `network.firingRateError` — TARGET_FIRING_RATE - arousal

---

### 14. Observer

**Helpers**:
- `deriveCellObservation(...)` — all metrics for one cell
- `deriveProtoNeuronCandidates(...)` — proto-neuron candidates (observer-side only)
- `deriveProtoNetworkCandidates(...)` — proto-network candidates (observer-side only)
- `deriveVortexCandidates(...)` — vortex candidates (topological charge)
- `deriveMembraneObservation(...)` — membrane observation
- `deriveTorusCurvatureObservation(...)` — torus curvature observation
- `deriveLocalExcitabilityField(...)` — local excitability field (observer-side only)
- `deriveRepeatedFlowPaths(...)` — repeated flow paths (observer-side only)
- `deriveObservedRatios(...)` — observed ratios (observer-side only)
- `deriveWeakPlasticityObservation(...)` — weak plasticity observation (observer-side only)

**Purpose**: Observe metrics, candidates, patterns from the outside (no runtime impact).

**Inputs**:
- All state from torus life field, vital stem, body-world closure

**Outputs**:
- Observer-side metrics, candidates, patterns (no runtime feedback)

**Side Effects**: None (pure functions, observer-side only)

---

## Dependency Diagram

```
External Input (touch/sound/light/motion/time)
    ↓
Perception (raw sensory input)
    ↓
Perturbation Event (structured perturbation)
    ↓
Prediction Mismatch (state-dependent mismatch)
    ↓
Body State (energy/stability/overload)
    ↓
Living State (fatigue/coherenceMemory/residueBias/predictionSensitivity)
    ↓
Mode Controller (wake/sleep/dream)
    ↓
Action Decision (idle/orient/withdraw/settle)
    ↓
Actuation Pulse (action→world)
    ↓
World Medium (simulated or external)
    ↓
Sensory Return (world→organism)
    ↓
Reafference Comparison (expected vs actual)
    ↓
Body-World Closure (loop gain/closure stability)
    ↓
Baseline & Residue (ongoing sine wave + slow accumulation)
    ↓
Torus Dynamics (wave propagation + spike trace)
    ↓
Observer (metrics/proto-neuron/proto-network/lens/guide)
```

---

## Important Notes

1. **Baseline & Residue** run **before** torus dynamics (added to currentBuffer before wave propagation)
2. **Living State** updates **after** body state (uses energy/stability/overload from body state)
3. **Mode Controller** runs **after** living state (uses fatigue/coherenceMemory from living state)
4. **Action Decision** runs **after** mode controller (uses modeState from mode controller)
5. **Torus Dynamics** run **after** all perception / body / mode / action stages (wave propagation is the final core step)
6. **Observer** runs **after** torus dynamics (observer-side only, no runtime feedback)
7. **Bridge** runs **after** observer (one-way: Torus → Signal Runtime, no strong feedback yet)

---

## What Is Not Clear

The following areas need further investigation:

1. **Prior Rewrite Stage** — when does `runPriorRewriteStage()` run? (not clearly documented in this flow)
2. **Touch Pattern Stage** — when does `runTouchPatternStage()` run? (not clearly documented in this flow)
3. **Local Predictor Stage** — when does `runLocalPredictorStage()` run? (not clearly documented in this flow)
4. **Interoception Stage** — when does `runInteroceptionStage()` run? (not clearly documented in this flow)
5. **Self-World Model Stage** — when does `runSelfWorldModelStage()` run? (not clearly documented in this flow)

**Action**: Further investigation needed to map complete flow.

---

## Next Steps for v2.7

For v2.7 "Now Summary Panel", we need to read the following state after all stages complete:

- **Torus Life Field** — arousal, sigma, phaseCoherence, clusterRatio, baselineLevel, residueLevel, firingRateError
- **Vital Stem** — energy, stability, overload, fatigue, coherenceMemory, predictionSensitivity, touchNeedBaseline, modeState, actionState
- **Body-World Closure** — loopGain, returnStrength, returnMismatch, selfCausedMatch, closureStability, membrane deformation
- **History** — activityResidue, traceState, replayState, plasticityTrace, recentHistoryBias
- **Emergent Candidates** — protoPoint candidate count, protoNeuron candidate count, protoNetwork candidate count, vortex candidate count
- **Risk** — collapse risk, saturation risk, overload, NaN/Infinity, feedback saturation

See `docs/v2-7-now-summary-inputs.md` for full details.
