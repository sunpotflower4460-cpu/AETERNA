# AETERNA Update Cycle

This document defines the order of operations within a single frame/tick of AETERNA's organism loop.

## Purpose

This is not just documentation—it is a research artifact that prevents "code order = theory order" conflation and provides a baseline for comparing different update sequences.

## Entry Point

**File**: `src/organism/actionLoop.js`
**Function**: `actionLoop(now)`
**Frequency**: ~60 FPS (requestAnimationFrame)

## Update Order (1 Tick)

### 1. Frame Input
- **Location**: `actionLoop.js:9`
- **Responsibility**: Compute dt, update disk physics
- **Call**: `updateDiskPhysics(1/60)`
- **Output**: `diskNodeIdx` (physical disk position)

### 2. Endogenous Dynamics - Heartbeat
- **Location**: `actionLoop.js:10`
- **Responsibility**: Inject periodic baseline pulse to maintain ongoing activity
- **Call**: `updateHeartbeat()`
- **Effect**: Pulses layer-1 nodes if clock triggers

### 3. Endogenous Dynamics - Noise
- **Location**: `actionLoop.js:12`
- **Responsibility**: Trigger stochastic noise based on tension
- **Call**: `network.triggerNoise(state.tensionLoad, state.network.sigmaDisplay)`
- **Effect**: Adds hardware-random noise to maintain variability

### 4. Touch Memory Decay
- **Location**: `actionLoop.js:13`
- **Responsibility**: Decay touch history traces
- **Call**: `state.touchMem.decay()`
- **Effect**: Exponential decay of past touch events

### 5. Core Network Update
- **Location**: `actionLoop.js:14`
- **Responsibility**: Main organism update encompassing perception → dynamics → plasticity → organism state
- **Call**: `state.network.updateDynamics(diskNodeIdx, state.activeTouches)`
- **Returns**: `dyn` (dynamics packet with all metrics)

#### 5.1 Baseline Activity Update
- **Location**: `AeternaNetwork.js:396`
- **Responsibility**: Update baseline ongoing activity and residue
- **Call**: `runBaselineActivityStage(this)`
- **Output**: `baselinePacket` (baselineLevel, residueLevel, residueNodes)

#### 5.2 Perception Update
- **Location**: `AeternaNetwork.js:397`
- **Responsibility**: Capture all sensory inputs and update perceptual state
- **Call**: `updatePerceptionState(touchState)`
- **Sub-stages**:
  - Touch sensory input capture (`captureTouchSensoryInput`)
  - Local prediction update (`runLocalPredictorStage`)
  - Touch pattern analysis (`runTouchPatternStage`)
  - Touch perception finalization (`finalizeTouchSensoryStage`)
  - Sound sensory update (`updateSoundSensory`)
  - Light sensory update (`updateLightSensory`)
  - Motion sensory update (`updateMotionSensory`)
  - Time sensory update (`updateTimeSensory`)
- **Output**: `perceptionPacket` (rawTouchMean, onset/offset, novelty, patterns, all sensory channels)

#### 5.3 Dormant Nodes Update
- **Location**: `AeternaNetwork.js:398`
- **Responsibility**: Update dormant node wake pressure and state
- **Call**: `updateDormantNodes(this)`
- **Effect**: May wake dormant nodes based on pressure

#### 5.4 Torus Dynamics Propagation
- **Location**: `AeternaNetwork.js:399`
- **Responsibility**: Run wave propagation on torus network
- **Call**: `runTorusDynamicsStage(this)`
- **Output**: `dynamicsPacket` (arousal, sigma, clusterRatio, firingRateError)

#### 5.5 Prediction Mismatch
- **Location**: `AeternaNetwork.js:336` (within `updatePostPropagationState`)
- **Responsibility**: Compute prediction error and expectation violation
- **Call**: `buildPredictionPacket(this)`
- **Output**: `predictionPacket` (meanPredictionError, meanLocalPredictionError)

#### 5.6 Rewrite / Plasticity
- **Location**: `AeternaNetwork.js:337`
- **Responsibility**: Structural weight rewriting based on prediction error and history
- **Call**: `runPriorRewriteStage(this)`
- **Output**: `rewritePacket` (rewriteTendency, pressure, biases, events)

#### 5.7 Energy Flow Update
- **Location**: `AeternaNetwork.js:340-359`
- **Responsibility**: Update energy reserve, inflow/outflow, maintenance costs
- **Call**: `updateEnergyFlowState(...)`
- **Effect**: Updates `this.energyFlowState` with energy dynamics

#### 5.8 Organism State Update
- **Location**: `AeternaNetwork.js:361-367`
- **Responsibility**: Update organism-level homeostatic variables (energy, stability, overload, drives)
- **Call**: `runBodyStateStage(this, packets)`
- **Output**: `organismPacket` (energy, stability, overload, restDrive, orientingDrive)

#### 5.9 Mode Controller
- **Location**: `AeternaNetwork.js:368-375`
- **Responsibility**: Update organism mode (quiet/active/dream), mode phase, dream replay
- **Call**: `runModeControllerStage(this, packets)`
- **Output**: `modePacket` (modeState, phase, drives, confidence, dreamReplay)

#### 5.10 Action Decision
- **Location**: `AeternaNetwork.js:376-379`
- **Responsibility**: Decide organism action tendency (idle/orient/explore/rest)
- **Call**: `runActionDecisionStage(this, packets)`
- **Output**: `actionPacket` (actionState, pulseLevel, direction)

#### 5.11 Metrics Emission
- **Location**: `AeternaNetwork.js:407`
- **Responsibility**: Compute derived metrics (phi proxy, cluster size, coherence)
- **Call**: `runTorusMetricsStage(this, dynamicsPacket)`
- **Output**: `metricsPacket` (clusterRatio, phiProxy, phaseCoherence)

#### 5.12 Render Buffer Update
- **Location**: `AeternaNetwork.js:409`
- **Responsibility**: Update vertex positions and colors for visualization
- **Call**: `updateRenderBuffers(diskNodeIdx)`
- **Effect**: Writes to `vertexPositions` and `colors` arrays

#### 5.13 Auto-Predict
- **Location**: `AeternaNetwork.js:410`
- **Responsibility**: Finalize prediction error injection
- **Call**: `autoPredictAndError()`
- **Effect**: May inject prediction errors for future frames

### 6. Rendering / Presentation
- **Location**: `actionLoop.js:16-30`
- **Responsibility**: Update Three.js scene, camera, visual layers
- **Steps**:
  - Mark geometry for update
  - Rotate particle system
  - Update camera based on mouse/touch
  - Render scene

### 7. Tension State Update
- **Location**: `actionLoop.js:26`
- **Responsibility**: Update global tension load for noise modulation
- **Call**: `updateTensionState(dyn)`
- **Effect**: Updates `state.tensionLoad` and `state.tensionDuration`

### 8. Engine State Derivation
- **Location**: `actionLoop.js:27`
- **Responsibility**: Derive high-level engine state (WHITE/BLACK/NEUTRAL)
- **Call**: `deriveEngineState(dyn)`
- **Output**: Engine state string

### 9. UI Update (throttled)
- **Location**: `actionLoop.js:28`
- **Responsibility**: Update metrics UI, visual layers, guide panel (15 FPS / 10 FPS)
- **Call**: `maybeUpdateUi(now, dyn, engineState)`
- **Effect**: Updates DOM metrics display

### 10. Signal Bridge (throttled)
- **Location**: `actionLoop.js:29`
- **Responsibility**: Bridge torus state to signal runtime (every 100ms)
- **Call**: `maybeBridgeSignal(now, dyn, engineState)`
- **Effect**: Sends packet to signal runtime, updates guide panel

### 11. Final Render
- **Location**: `actionLoop.js:30`
- **Responsibility**: Render Three.js scene to canvas
- **Call**: `state.renderer.render(state.scene, state.camera)`

## Key Ordering Decisions

1. **Heartbeat before dynamics**: Endogenous pulses precede propagation
2. **Baseline before perception**: Ongoing activity is independent of input
3. **Perception before dynamics**: Sensory input captured before propagation
4. **Dynamics before prediction**: Wave state must update before mismatch computed
5. **Prediction before plasticity**: Error must be known before rewrite
6. **Plasticity before organism state**: Structural changes precede homeostasis
7. **Organism state before mode**: Body state informs mode transitions
8. **Mode before action**: Mode context informs action decisions
9. **Metrics after all updates**: Derived metrics computed from final state

## Future Comparison Use Cases

When testing alternative update orders:
- Moving prediction before dynamics (predictive coding)
- Moving plasticity before dynamics (anticipatory weights)
- Splitting perception into pre/post-dynamics stages
- Reordering mode/action decision relative to other stages

Compare behavioral outcomes against this baseline order.

## Beautiful Loop L1 - Observer Stages (v0.5)

### Interoception Stage (Observer)
- **Location**: AeternaNetwork.js:496 (in updateDynamics, after autoPredictAndError)
- **Role**: Observer-only packet generation
- **Call**: `runInteroceptionStage(organismSnapshot)`
- **Output**: `InteroceptionPacket` (energySense, overloadSense, coherenceSense, boundarySense, restorationSense, perturbationPressure)
- **Important**: Does NOT modify dynamics or organism state. Pure observation layer.

### Self/World Model Stage (Observer)
- **Location**: AeternaNetwork.js:497 (in updateDynamics, after interoception)
- **Role**: Observer-only proto-self/world boundary packet
- **Call**: `runSelfWorldModelStage(interoceptionPacket, organismSnapshot, lastSelfWorldModelPacket)`
- **Output**: `SelfWorldModelPacket` (selfCoherence, selfContinuity, worldPressure, relationEngagement)
- **Important**: Does NOT modify dynamics or organism state. Pure observation layer.

### Felt-State Stage (Observer)
- **Location**: `AeternaNetwork.js` (after self/world packet generation)
- **Role**: Derived internal condition view
- **Call**: `deriveFeltState(organismSnapshot, livingState, homeostaticState, energyFlowState, selfWorldModelPacket)`
- **Output**: `FeltStateVector` (depletion, overload, coherence, boundaryIntegrity, restorationReadiness, perturbationLoad, openness)
- **Important**: Read-only organization of existing state. Not a mode driver.

### A2 Arousal / Awareness Stage (Observer)
- **Location**: `AeternaNetwork.js` (after felt-state derivation)
- **Role**: Separate activation height from foreground availability
- **Call**: `deriveArousalAwareness(organismSnapshot, feltState, livingState, selfWorldModelPacket)`
- **Output**: `ArousalAwarenessState` (arousalLevel, awarenessWindow, salienceOpenness, foregroundPressure, restDepth, hyperreactivity, settlingWindow)
- **Important**: Observer/metrics layer only in A2. Does not directly switch mode.

**BL-L1 Design Note**: These stages are added as auxiliary observers in v0.5. They run AFTER the main update cycle completes and produce packets for debugging/analysis. They do NOT yet feed back into organism dynamics. Future BL-L2/L3 will connect the loop.

**BL-L2 Update (v0.5)**: As of Beautiful Loop L2, these stages are now fully integrated into the main loop:
- Packets are generated every tick after all core updates complete
- `lastInteroceptionPacket` and `lastSelfWorldModelPacket` are stored in AeternaNetwork state
- `selfContinuity` now uses previous frame packet for continuity calculation
- `relationEngagement` is minimally dynamic, including recent touch activity
- Packets are exposed in `updateDynamics` return value (bl_* fields)
- Packets are displayed in observer UI and included in scenario summaries
- **Still observer-side only** - packets do not yet modulate organism dynamics (planned for BL-L3)

**BL-L3 Update (v0.5)**: As of Beautiful Loop L3, the loop is now thinly closed:
- **Modulation computation** happens after packet generation (AeternaNetwork.js:514-526)
- `computeBeautifulLoopModulation()` creates weak bias deltas from packets
- Modulation is smoothed via EMA and clamped to safety bounds
- **Connection points** (3 total):
  - `noveltyBiasDelta` → `LivingState.predictionSensitivity` (via heartbeat)
  - `touchOpennessDelta` → `LivingState.touchNeedBaseline` (via heartbeat)
  - `restorationBiasDelta` → `HomeostaticState.restorationBias` (via heartbeat)
- Modulation deltas exposed in return packet (bl_*Delta fields)
- **Critical constraint**: Modulation is WEAK (all deltas < ±0.10), organism core remains primary driver
- **Ablation support**: Can be disabled via `blModulationConfig.enabled = false`
- See `docs/beautiful-loop-l3-notes.md` for full details

**A2 Update (v0.5)**: Arousal and awareness-like availability are now separated after felt-state derivation:
- `arousalLevel` tracks activation / mobilization height
- `awarenessWindow` tracks foreground availability
- `salienceOpenness` and `foregroundPressure` expose passage/opening dynamics for observation
- These values are emitted in runtime/scenario outputs without becoming mode control

### Phase 3 Recovery Loop (Observer + weak homeostatic coupling)

- After perturbation, mismatch pressure rises (`meanPredictionError`, perturbation packet).
- Mismatch is folded into recovery-layer observables (`recoveryPressure`, `relaxationLevel`, `stabilizationPull`, `collapseRisk`).
- `restorationBias`, boundary integrity, and self-preservation bias contribute weakly to boundary repair tendency.
- Recovery outcomes are tracked as **observer vocabulary** (`recover`, `shift`, `degrade`, `partial_repair`) for scenario analysis.
- Collapse distinctions are tracked as `soft_collapse`, `hard_collapse`, or `runaway`.
- This loop is **pre-semantic**: it is about life-field recovery/collapse mechanics, not semantic interpretation or node-level meaning assignment.

### Phase 4 Trace / Replay Loop (pre-semantic residue reactivation)

- After perturbation and mismatch, the field may retain a weak **trace** rather than a remembered event.
- Stronger mismatch, repeated perturbation, boundary stress, and recovery-linked return all contribute to residue staying slightly longer.
- When external input is low and the field is quiet enough, that trace may weakly re-activate as **replay**.
- Replay is a **low-intensity pattern resurgence**, not full event reconstruction and not semantic recall.
- Replay is suppressed while live input / arousal dominate, so it does not take over the main loop.
- After replay, only tiny slow-state deltas remain (weak consolidation): slightly easier recurrence, slight restoration/stabilization bias, slight settling residue.
- Semantic interpretation is outside this loop's responsibility.

### W2 Actuation Pulse Placement (observer-side, read-only)

- After recovery / trace / body surface related observer derivations, `deriveActuationPulse` may run.
- It reads `BodySurfaceState`, `PressureCompetitionState`, `RecoveryState`, `TraceState`, and mismatch proxies.
- It returns either a weak `visual` / `simulatedForce` pulse candidate or `null`.
- The result is currently used only for observer / debug / scenario recording.
- It does **not** take over the main loop.
- It does **not** perform semantic interpretation.

### W3 World Medium Update (external simulation, read-only in this phase)

- After deriving Actuation Pulse, the external World Medium may be updated.
- `updateWorldMedium(worldState, actuationPulse, dt)` is a **pure function** that:
  - Takes current `WorldMediumState` and optional `ActuationPulse`
  - Returns next `WorldMediumState`
  - Applies pulse effects (visual / simulatedForce) to world parameters
  - Applies natural decay and drift even without pulses
- World Medium is **external to AETERNA** — not part of organism core state.
- World Medium update is **read-only from AETERNA's perspective** in W3.
- No Sensory Return feedback to AETERNA yet (W4+).
- No Reafference Comparison yet (W5+).

Recommended position in update cycle:

```
derive actuation pulse
↓
update simulated world medium (external)
↓
derive sensory return (W4+)
↓
optional weak perturbation injection
↓
future reafference comparison (W5+)
```

**Important constraints**:
- World Medium state is managed separately from organism state
- AETERNA does not directly read World Medium state in W3
- Actuation Pulse is the only channel from AETERNA to World Medium
- Sensory Return (World Medium → AETERNA) is deferred to W4
- No semantic interpretation occurs in World Medium

### W4 Sensory Return Derivation (pre-semantic world signal, weak connection to perturbation pipeline)

- After updating World Medium, `deriveSensoryReturn` may run to generate return packets.
- `deriveSensoryReturn(currentWorld, previousWorld, dt)` is a **pure function** that:
  - Compares current and previous `WorldMediumState`
  - Returns array of `SensoryReturnPacket[]`
  - Generates packets only when World Medium shows significant change
  - Maps World Medium changes to sensory channels (simulatedLight / simulatedNoise / simulatedPressure / simulatedMotion / simulatedEcho)
- Sensory Return packets are **pre-semantic signals** from World Medium, not semantic input.
- Packets can optionally be converted to `PerturbationEvent` via `sensoryReturnToPerturbation()` for **weak connection** to perturbation pipeline.
- **W4 does NOT perform Reafference Comparison** (self-caused vs world-caused distinction is W5).

Recommended position in update cycle:

```
update simulated world medium
↓
derive sensory return ← W4
↓
optional weak perturbation injection
↓
future reafference comparison (W5+)
```

**Important constraints**:
- Sensory Return is **not semantic input**
- It is world-side signal, not meaning or interpretation
- Conversion to perturbation is **weak** to avoid overwhelming organism
- No self/world distinction yet (W5)
- Real sensors not connected yet (later phase)

### Phase 5 Observation Layer (observer-side pattern candidates, read-only)

- After trace / replay, the observer layer may detect structural candidates in the life-field.
- `deriveObservationPatterns` runs as a **pure function** after all core updates — it reads state and returns derived proxy counts.
- Observation layer is **strictly read-only**: it does not modify organism state, does not drive actions, does not assign semantic meaning.
- Observation vocabulary (knot, path, recurrence locus, basin, proto-point candidate, etc.) is **research shorthand**, not semantic labeling.
- Proto-point candidates are field structural observations, not semantic nodes, and are not passed to any teacher or LLM.
- See `docs/observation-vocabulary.md` for full vocabulary definitions.
- Node bridge (Phase 8+) is out of scope for this phase.

### Phase 7 Proto-Point Observation Layer (observer-side detailed candidates, read-only)

- After Phase 5 observation pattern derivation, `deriveProtoPointCandidates` generates detailed per-candidate records.
- It takes `ObservationPatternState` + trace/replay/recovery state as input and returns `ProtoPointObservationState`.
- Each `ProtoPointCandidate` carries per-slot sub-scores: recurrenceScore, traceAffinity, replayAffinity, localContrast, knotOverlap, basinOverlap.
- Confidence is a weighted proxy: `0.20*recurrenceScore + 0.20*traceAffinity + 0.20*replayAffinity + 0.15*localContrast + 0.15*knotOverlap + 0.10*basinOverlap`.
- Observer-side lifecycle is tracked (`new` / `recurring` / `persistent` / `decaying`) but does NOT affect organism dynamics.
- **Strictly read-only**: does not modify organism state, does not drive actions, no Node bridge.
- Candidates are NOT semantic nodes, labels, concepts, or object identifiers.
- See `docs/proto-point-observation-principles.md` for full principles.

### Phase 8 Observation Export (pre-semantic packet, read-only, AETERNA → Node direction only)

- After the main organism update cycle completes (including Phase 5 and Phase 7 observers), an optional **observation export step** may run.
- `exportAeternaObservationPacket` reads current state (fieldState, traceState, recoveryState, observationPatternState, pressureCompetitionState) and assembles a compressed `AeternaObservationPacket`.
- The packet contains only pre-semantic proxy observations: field state metrics, structural candidate counts, pressure tendencies, and trace/replay indicators.
- The packet is then passed through `sanitizeAeternaObservationPacket` which strips any forbidden semantic fields and validates all numeric values.
- **Strictly read-only and one-way**: export runs AFTER all core updates; the packet does NOT feed back into organism core dynamics.
- **No Node → AETERNA feedback in this phase**: the bridge is observation-upload only.
- **No semantic content**: label, meaning, concept, same-object, teacherVerdict, language, utterance are forbidden in the packet.
- Semantic interpretation of the packet is the responsibility of the Node side (future phase).
- See `docs/aeterna-to-node-bridge-spec.md` for full boundary specification.


## Implementation Notes

- Update cycle is **not** directly exposed to external control currently
- dt is fixed at ~1/60s (requestAnimationFrame)
- Some stages are throttled (UI: 15 FPS, guide: 10 FPS, bridge: 10 Hz)
- All stages must complete within one frame (~16.67ms @ 60 FPS)

## Phase 2: Perturbation Reception (外乱受容)

### Design Principle

Input enters as a **perturbation** onto an already-flowing life-field, not as a trigger that starts the field.

- Baseline activity runs continuously regardless of external input
- Touch and other inputs arrive as disturbances (外乱) superimposed on ongoing dynamics
- Prediction mismatch is state-dependent: the same touch in different organism states produces different mismatch
- Mismatch connects to collapse / recovery / shift as downstream outcomes
- Semantic interpretation is NOT performed at this stage

### Perturbation Path (Phase 2)

1. **Baseline flows** (`runBaselineActivityStage` → `updateHeartbeat` → endogenous noise) — always on
2. **Perturbation arrives** (touch/sound/light/motion enters as disturbance on baseline)
3. **PerturbationEvent derived** (`derivePerturbationEvent`) — magnitude, novelty, expectedness, locality
4. **PredictionMismatchState derived** (`derivePredictionMismatch`) — state-dependent mismatch quality
5. **Downstream**: mismatch connects to collapse risk, recovery pull, boundary stress
6. **Observer reads** mismatch metrics without modifying organism dynamics

## W-Series: Body-World Closure（設計境界のみ、W0 固定済み）

AETERNA は内側だけでなく世界と閉じる方向へ進む。意味形成はしない。

将来の update cycle に追加される予定の段階（W1〜W8）。

### 将来ループ（W3 以降で段階的に追加）

```
Torus Life Field (現在のループ)
↓
Body Surface (W1)
↓
Actuation Pulse (W2)
↓
World Medium — simulated world から始める (W3)
↓
Sensory Return (W4)
↓
Reafference Comparison (W5)
↓
Perturbation + Mismatch (既存)
↓
Torus Life Field
```

- W0: docs のみ固定。runtime 変更なし。
- W1〜W8: 段階的に実装。
- proto-neuron は W7 で観測開始。最初から置かない。
- real sensor は後段（W3 は simulated world のみ）。
