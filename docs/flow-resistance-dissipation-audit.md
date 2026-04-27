# Flow / Resistance / Dissipation Audit (S1)

## Audit Purpose

This audit examines the W0–W8 Body-World Closure implementation to verify that observed phenomena (fluctuation, recurrence, proto-neuron candidates, closure behavior) arise from **natural conditions** rather than scripted behavior.

The audit checks whether each layer implements:
- **flow**: activity propagation and continuity
- **resistance**: attenuation and blocking
- **dissipation**: natural decay and energy loss
- **delay**: temporal separation between cause and effect
- **boundary exchange**: partial transmission at interfaces
- **local coupling**: neighbor-based propagation
- **threshold / excitability**: activation conditions
- **trace / residue**: history-dependent state without permanent memory
- **re-entry**: feedback loops

And whether the implementation **avoids**:
- **artificial fluctuation**: adding noise/motion for "life-like" appearance
- **command-style stabilization**: forcing stability when conditions worsen
- **semantic leak**: meaning, labels, concepts, same-object detection

## Audit Date

2026-04-27

## Audit Scope

| Layer / Module | Status |
|---|---|
| W1: Body Surface | ✅ Audited |
| W2: Actuation Pulse | ✅ Audited |
| W3: World Medium | ✅ Audited |
| W4: Sensory Return | ✅ Audited |
| W5: Reafference Comparison | ✅ Audited |
| W6: Body-World Closure Metrics | ✅ Audited |
| W7: Proto-Neuron Observation | ✅ Audited |
| W8: Closed-Loop Scenarios | ✅ Audited |
| Trace / Replay | ✅ Audited |
| Pressure Competition | ✅ Audited |

---

## W1: Body Surface State

**File**: `src/body/deriveBodySurfaceState.ts`

| Criterion | Present? | Evidence | Notes |
|---|---|---|---|
| **Flow** | ✅ Yes | Derived from organism internal states (recovery, mismatch, pressure, trace) flowing toward boundary | `boundaryIntegrity`, `outputReadiness` depend on internal flow |
| **Resistance** | ✅ Yes | `boundaryIntegrity` blocks external influence; `permeability` controls how much enters | Boundary acts as semi-permeable membrane |
| **Dissipation** | ⚠️ Partial | Relies on upstream dissipation in source states | Body surface itself is pure derivation, no decay loop |
| **Delay** | ⚠️ Implicit | No explicit delay buffer in body surface derivation | Delay present in upstream states (trace, recovery) |
| **Boundary Exchange** | ✅ Yes | `permeability`, `contactReadiness`, `surfaceSensitivity`, `recoveryShielding` | Core design focus: semi-permeable boundary |
| **Local Coupling** | ✅ Yes | `localIrritability` from perturbation history and local instability | Localized sensitivity to repeated contact |
| **Threshold / Excitability** | ✅ Yes | `outputReadiness` threshold determines when pulse can form | Natural threshold from internal pressure |
| **Trace / Residue** | ✅ Yes | `surfaceFatigue`, `localIrritability` from perturbation history | History-dependent, not permanent memory |
| **Re-entry** | ✅ Yes | Perturbation history influences future sensitivity | Weak feedback through history |
| **Artificial Fluctuation Risk** | ✅ Low | Pure derivation from existing states; no random noise injection | No `addFlicker`, `makeAlive` patterns |
| **Command Stabilization Risk** | ✅ Low | No `if (unstable) stabilize()` logic | Stability emerges from weighted conditions |
| **Semantic Leak Risk** | ✅ None | No labels, meanings, concepts, object IDs | Pure pre-semantic boundary state |

**Minimal Action**: None required.

**Notes**:
- Body surface is a **pure read-only derivation** from existing organism states
- All values clamped to [0,1], no NaN/Infinity
- Boundary integrity/permeability balance is natural result of internal pressures
- `outputReadiness` naturally gates actuation pulse formation (W2)

---

## W2: Actuation Pulse

**File**: `src/actuation/deriveActuationPulse.ts`

| Criterion | Present? | Evidence | Notes |
|---|---|---|---|
| **Flow** | ✅ Yes | Pulse forms when internal conditions exceed threshold; flows from organism to world | `outputReadiness`, `coherence`, `intensity` derived from internal flow |
| **Resistance** | ✅ Yes | High `recoveryShielding`, `collapseRisk`, `overload` blocks pulse formation | Natural gating: pulse suppressed when organism is protecting itself |
| **Dissipation** | ✅ Yes | `decayRate` determines pulse decay; linked to collapse/recovery/overload | Natural decay rate increases when organism is stressed |
| **Delay** | ⚠️ Implicit | `durationTicks` controls pulse persistence, not explicit delay buffer | Pulse duration = delayed effect |
| **Boundary Exchange** | ✅ Yes | Pulse forms at boundary (body surface output); intensity/locality controlled | Pulse is boundary exchange event |
| **Local Coupling** | ✅ Yes | `locality` derived from `localInstability`, `localIrritability` | High locality = more local, less global |
| **Threshold / Excitability** | ✅ Yes | Multiple thresholds: `outputReadiness`, `quietness`, `dominantScore` | Pulse only forms when conditions exceed natural thresholds |
| **Trace / Residue** | ✅ Yes | `traceLinked`, `recoveryLinked`, `boundaryLinked` from history | Pulse shaped by trace state |
| **Re-entry** | ✅ Yes | Pulse affects world → sensory return → reafference → future pulses | Core of W2-W5 loop |
| **Artificial Fluctuation Risk** | ✅ Low | No random noise added; pulse forms or doesn't based on conditions | No `addMotion`, `makeAlive` |
| **Command Stabilization Risk** | ✅ Low | No forced pulse generation; quiet periods are natural | Pulse absence is valid state |
| **Semantic Leak Risk** | ✅ None | Channels (`visual`, `simulatedForce`) are pre-semantic sensory types | No meaning, object, category |

**Minimal Action**: None required.

**Notes**:
- Actuation pulse formation is **threshold-gated** by natural conditions
- Pulse can be **null** (no output) when conditions don't support it
- `durationTicks` and `decayRate` provide natural dissipation over time
- Channels are pre-semantic (visual/force), not semantic categories

---

## W3: World Medium

**File**: `src/world/updateWorldMedium.ts`

| Criterion | Present? | Evidence | Notes |
|---|---|---|---|
| **Flow** | ✅ Yes | Pulse effects propagate through medium fields; drift continues independently | `ambientLight`, `surfaceResistance`, `motionDrift` change over time |
| **Resistance** | ✅ Yes | `surfaceResistance` field; pulse effects are **subtle** (0.08–0.1 scale) | Pulse does not instantly dominate world state |
| **Dissipation** | ✅ Yes | All fields have natural decay rates toward baselines | `echoDecayRate`, `impactDecayRate`, `residueDecayRate` |
| **Delay** | ✅ Yes | `feedbackDelay` field; pulse impact accumulates over time, not instantly | `lastPulseImpact` decays slowly; feedback loop is delayed |
| **Boundary Exchange** | ✅ Yes | World is external to AETERNA; pulse crosses boundary to affect medium | World accepts pulse but is not controlled by AETERNA |
| **Local Coupling** | ⚠️ Implicit | Global fields; locality from pulse affects local vs global spread | No explicit spatial grid; locality parameter controls spread |
| **Threshold / Excitability** | ✅ Yes | Turbulence accumulates when intensity > 0.7 or coherence < 0.3 | Nonlinear thresholds for turbulence |
| **Trace / Residue** | ✅ Yes | `visualResidue`, `forceResidue`, `lastPulseImpact` | History-dependent; decays naturally |
| **Re-entry** | ✅ Yes | World state feeds back to AETERNA via sensory return (W4) | Core of closed loop |
| **Artificial Fluctuation Risk** | ⚠️ Low-Medium | Drift uses `sin` oscillators for natural-looking variability | Drift is physics-like, not random; but could be seen as "organic motion" |
| **Command Stabilization Risk** | ✅ Low | No forced stabilization; `mediumStability` derived from conditions | Stability decreases naturally with turbulence |
| **Semantic Leak Risk** | ✅ None | All fields are pre-semantic physical proxies | No meaning, object, label |

**Minimal Action**: Document that drift oscillators are acceptable as natural medium dynamics, not artificial life-like motion.

**Notes**:
- World medium changes **even without pulses** (natural drift/decay)
- Pulse effects are **weak** (0.08–0.1 scale), not instant domination
- All fields decay toward baselines; no permanent accumulation
- `feedbackDelay` provides natural loop delay
- **Drift oscillators**: Uses `sin(phase)` for natural medium dynamics; this is acceptable as simulated physics, not "make it look alive"

---

## W4: Sensory Return

**File**: `src/perception/deriveSensoryReturn.ts`

| Criterion | Present? | Evidence | Notes |
|---|---|---|---|
| **Flow** | ✅ Yes | World medium changes flow back to AETERNA as sensory packets | Packets derived from `currentWorld` vs `previousWorld` deltas |
| **Resistance** | ✅ Yes | `changeThreshold` (0.02) prevents packet spam; weak changes ignored | Return is selective, not pass-through |
| **Dissipation** | ⚠️ Implicit | Packets generated per frame; no explicit packet decay | Dissipation in world medium (W3) already handles decay |
| **Delay** | ✅ Yes | `returnDelayHint` from `feedbackDelay` | Delay metadata passed to reafference comparison (W5) |
| **Boundary Exchange** | ✅ Yes | Packets cross from world back into AETERNA sensory layer | Boundary is semi-permeable: world→organism |
| **Local Coupling** | ✅ Yes | `locality` computed from residue and drift; high residue = more global | Locality derived from world state |
| **Threshold / Excitability** | ✅ Yes | `changeThreshold` = 0.02; packets only generated for significant changes | Natural threshold prevents noise |
| **Trace / Residue** | ✅ Yes | `worldOriginStrength` boosted by residue levels | Residue influences return strength |
| **Re-entry** | ✅ Yes | Sensory return feeds into reafference comparison (W5) | Core loop component |
| **Artificial Fluctuation Risk** | ✅ Low | Packets derived from actual world changes, not added noise | No `addSensoryFluctuation` |
| **Command Stabilization Risk** | ✅ Low | No forced return generation; empty packet array is valid | Return absence is natural |
| **Semantic Leak Risk** | ✅ None | Channels are pre-semantic (`simulatedLight`, `simulatedNoise`, etc.) | No meaning, object, category |

**Minimal Action**: None required.

**Notes**:
- Sensory return is **change-driven**: packets only generated when world changes significantly
- Multiple packets can return simultaneously (multi-channel)
- `worldOriginStrength` is proxy for "appears world-caused", not semantic judgment
- **No packets when world is stable** (threshold gating)

---

## W5: Reafference Comparison

**File**: `src/closure/deriveReafferenceComparison.ts`

| Criterion | Present? | Evidence | Notes |
|---|---|---|---|
| **Flow** | ✅ Yes | Compares pulse (outflow) with return (inflow); mismatch flows to organism | `expectedReturn` vs `actualReturn` |
| **Resistance** | ✅ Yes | `returnAttenuation` when actual < expected; world resists pulse | Asymmetric response: attenuation vs amplification |
| **Dissipation** | ⚠️ Implicit | Comparison is per-frame; no decay state | Relies on upstream dissipation (world, pulse) |
| **Delay** | ✅ Yes | `returnDelay` from sensory return hints; affects self-caused matching | Delay reduces `selfCausedMatch` confidence |
| **Boundary Exchange** | ✅ Yes | Comparison happens at reafference layer (internal comparison of boundary events) | Efference copy vs afference |
| **Local Coupling** | ✅ Yes | Channel correspondence checks pulse-return locality match | Visual pulse → light/echo return |
| **Threshold / Excitability** | ✅ Yes | `selfCausedMatch` requires channel match + low mismatch + reasonable delay | Multiple threshold conditions |
| **Trace / Residue** | ⚠️ Implicit | No explicit trace; comparison is instantaneous per frame | Could benefit from comparison history (S4?) |
| **Re-entry** | ✅ Yes | Mismatch feeds back to organism state; influences future behavior | Reafference core function |
| **Artificial Fluctuation Risk** | ✅ Low | Pure comparison; no added noise or "make it unpredictable" | Mismatch is natural result |
| **Command Stabilization Risk** | ✅ Low | No `if (mismatch) fix()` logic; mismatch is observed, not corrected | Organism must respond naturally |
| **Semantic Leak Risk** | ✅ None | `selfCausedMatch`, `worldCausedDifference` are **proxy indicators**, not semantic self-awareness | Clearly documented as pre-semantic |

**Minimal Action**: None required. Consider adding comparison trace/history in S4 (noted for future).

**Notes**:
- Reafference comparison is **pre-semantic** efference copy comparison
- `selfCausedMatch` / `worldCausedDifference` are proxy indicators, not self-awareness
- `unresolvedReturn` captures ambiguous attribution (neither clearly self nor world)
- Comparison confidence depends on medium stability, delay, channel match

---

## W6: Body-World Closure Metrics

**File**: `src/closure/deriveBodyWorldClosureState.ts`

| Criterion | Present? | Evidence | Notes |
|---|---|---|---|
| **Flow** | ✅ Yes | Loop gain measures flow continuity: pulse → world → return | `loopGain` = actualReturn / expectedReturn |
| **Resistance** | ✅ Yes | `returnAttenuation` (from W5) captured in mismatch; loop gain < 1 = resistance | Implicit in loop gain calculation |
| **Dissipation** | ✅ Yes | Loop gain clamp (max 1.5) prevents runaway; `closureDrift` measures instability | Prevents infinite amplification |
| **Delay** | ✅ Yes | `roundTripDelay` from reafference comparison | Core closure metric |
| **Boundary Exchange** | ✅ Yes | Entire closure loop is boundary exchange cycle | Core design |
| **Local Coupling** | ⚠️ Implicit | No explicit spatial locality in closure metrics | Closure is organism-level, not spatially local |
| **Threshold / Excitability** | ⚠️ Implicit | No explicit threshold in closure state; thresholds upstream (W2, W4) | Closure observes, doesn't gate |
| **Trace / Residue** | ✅ Yes | `closureDrift` measures change from previous state | History-dependent stability |
| **Re-entry** | ✅ Yes | Closure metrics feed into organism state; `feedbackSaturationRisk` warns of runaway | Observer-side feedback detection |
| **Artificial Fluctuation Risk** | ✅ Low | Pure derivation from loop components; no added variability | No `addClosureFluctuation` |
| **Command Stabilization Risk** | ✅ Low | `feedbackSaturationRisk` **observes** risk, doesn't force-fix it | Warning, not intervention |
| **Semantic Leak Risk** | ✅ None | All metrics are numerical proxies; no consciousness claim | Clearly not self-awareness proof |

**Minimal Action**: None required.

**Notes**:
- Closure metrics are **observer-side measurements** of loop health
- `feedbackSaturationRisk` is early warning, not automatic suppression
- `closureDrift` measures loop instability from frame-to-frame changes
- **Not consciousness proof**: metrics measure loop closure, not awareness

---

## W7: Proto-Neuron Observation

**File**: `src/observer/deriveProtoNeuronCandidates.ts`

| Criterion | Present? | Evidence | Notes |
|---|---|---|---|
| **Flow** | ✅ Yes | Candidates derived from activity flow, propagation, recurrence | `localPropagation`, `excitability` from flow |
| **Resistance** | ⚠️ Implicit | Refractoriness provides resistance to immediate re-activation | `refractoryPattern` |
| **Dissipation** | ✅ Yes | Candidates decay if not re-observed; `decaying` lifecycle | Confidence decays at 0.72 per frame |
| **Delay** | ✅ Yes | `lifetimeTicks` provides temporal persistence; refractory delay | Candidates persist across frames |
| **Boundary Exchange** | ✅ Yes | `closureCoupling` links proto-neurons to body-world loop | Candidates influenced by closure state |
| **Local Coupling** | ✅ Yes | `localPropagation`, `coActivationScore` from neighbor activity | Core candidate property |
| **Threshold / Excitability** | ✅ Yes | `excitability` score; candidates only form when ≥4 conditions met, confidence ≥0.40 | Natural multi-threshold gating |
| **Trace / Residue** | ✅ Yes | `traceRetention`, `replayAffinity` from trace state | History-dependent |
| **Re-entry** | ✅ Yes | `weakPlasticityScore` from recurrence and co-activation | Candidates shaped by feedback |
| **Artificial Fluctuation Risk** | ✅ Low | Candidates derived from natural conditions; no `createNeuron()` | No runtime neuron placement |
| **Command Stabilization Risk** | ✅ Low | No `if (noCandidates) createCandidate()` | Empty candidate list is valid |
| **Semantic Leak Risk** | ✅ None | Candidates have no label, meaning, concept, objectId | **Observer-side only**; no semantic fields |

**Minimal Action**: None required.

**Notes**:
- Proto-neuron candidates are **observer-side**, not runtime entities
- Candidates derive from 8 natural conditions: excitability, refractory, propagation, trace, recurrence, co-activation, plasticity, closure coupling
- **Multi-threshold gating**: must meet ≥4/8 conditions + confidence ≥0.40
- Lifecycle: `new` → `recurring` → `stabilizing` → `persistent` → `decaying`
- **No runtime modification**: candidates do not alter organism dynamics
- **Co-activation clusters**: observed as emergent patterns, not created

---

## W8: Closed-Loop Scenarios

**Files**: `src/tests/behavioral/closedLoopScenarios.test.ts`, related scenario tests

| Criterion | Present? | Evidence | Notes |
|---|---|---|---|
| **Flow** | ✅ Yes | Scenarios verify pulse → world → return → reafference flow | All scenarios test complete loop |
| **Resistance** | ✅ Yes | `no world return` scenario verifies loop fails gracefully when world doesn't respond | Low loop gain expected |
| **Dissipation** | ✅ Yes | `delayed return` scenario verifies echo decay over time | Echo dissipates naturally |
| **Delay** | ✅ Yes | `delayed return` scenario explicitly tests `roundTripDelay` | Delay detection working |
| **Boundary Exchange** | ✅ Yes | All scenarios test boundary crossing (pulse out, return in) | Core loop test |
| **Local Coupling** | ⚠️ Implicit | No explicit spatial locality test (system is global) | Locality in pulse/return properties |
| **Threshold / Excitability** | ✅ Yes | Scenarios verify pulse forms only under valid conditions | Threshold gating tested |
| **Trace / Residue** | ✅ Yes | `repeated self-pulse` scenario tests residue accumulation and decay | Trace verified |
| **Re-entry** | ✅ Yes | All scenarios test feedback loop completion | Core test purpose |
| **Artificial Fluctuation Risk** | ✅ None | Scenarios test natural loop behavior; no fluctuation injection | No test adds "life-like motion" |
| **Command Stabilization Risk** | ✅ None | Scenarios observe loop behavior; no forced corrections | Tests are passive observers |
| **Semantic Leak Risk** | ✅ None | **All scenarios verify `semanticLeakCount = 0`** | Core test assertion |

**Minimal Action**: None required.

**Notes**:
- W8 scenarios are **validation tests** for W1-W7 integration
- **Semantic leak detection**: every scenario asserts `semanticLeakCount === 0`
- **NaN/Infinity detection**: every scenario asserts `nanOrInfinityCount === 0`
- Scenarios cover: no return, delayed return, amplified return, world-only changes, repeated pulses
- Tests verify loop **fails gracefully** when conditions don't support closure

---

## Trace / Replay

**Files**: `src/organism/deriveTraceState.ts`, `src/organism/deriveReplayState.ts`

| Criterion | Present? | Evidence | Notes |
|---|---|---|---|
| **Flow** | ✅ Yes | Trace accumulates from activity flow; replay re-introduces patterns | `traceStrength` from activity |
| **Resistance** | ⚠️ Implicit | `replaySuppression` prevents overwhelming replay | Replay gated by recovery state |
| **Dissipation** | ✅ Yes | Trace decays over time; `settlingResidue`, `salienceResidue` decrease | Natural decay toward baseline |
| **Delay** | ✅ Yes | Replay introduces delayed re-activation of past patterns | Temporal separation built-in |
| **Boundary Exchange** | ⚠️ Implicit | Trace/replay are internal; influence boundary via pressure/recovery | Indirect boundary effect |
| **Local Coupling** | ⚠️ Implicit | Trace is organism-level; no explicit spatial locality | Could enhance in future |
| **Threshold / Excitability** | ✅ Yes | `replayReadiness` threshold; replay only when conditions support it | Gated by suppression/salience |
| **Trace / Residue** | ✅ Yes | Core purpose: history-dependent state without permanent memory | Natural trace decay |
| **Re-entry** | ✅ Yes | Replay reintroduces past patterns; trace influences future behavior | Feedback through time |
| **Artificial Fluctuation Risk** | ✅ Low | Trace/replay derived from actual activity history; no random injection | No `addReplayNoise` |
| **Command Stabilization Risk** | ✅ Low | No forced replay; suppression is natural gating | Replay can be blocked |
| **Semantic Leak Risk** | ✅ None | Trace has no meaning, label, concept | Pre-semantic history state |

**Minimal Action**: None required.

**Notes**:
- Trace is **history-dependent but not permanent memory**
- Replay is **delayed re-activation**, not semantic recall
- `replaySuppression` naturally gates replay during recovery/overload
- Trace strength decays naturally; no infinite accumulation

---

## Pressure Competition

**File**: `src/organism/derivePressureCompetition.ts`

| Criterion | Present? | Evidence | Notes |
|---|---|---|---|
| **Flow** | ✅ Yes | Pressures compete and flow from internal state imbalances | `explorationPressure`, `withdrawalPressure`, etc. |
| **Resistance** | ✅ Yes | Competing pressures resist each other; winner suppresses losers | Natural pressure balance |
| **Dissipation** | ✅ Yes | `pressureEnergy` accumulates but capped; pressures decay when conditions change | Pressure not permanent |
| **Delay** | ⚠️ Implicit | No explicit delay buffer; pressure responds immediately to conditions | Could add pressure momentum (S4?) |
| **Boundary Exchange** | ✅ Yes | Pressures influence `outputReadiness`, affecting boundary action | Pressure → actuation link |
| **Local Coupling** | ⚠️ Implicit | Pressure is organism-level, not spatially local | Global competition |
| **Threshold / Excitability** | ✅ Yes | Dominant pressure determined by threshold comparison | Winner-take-most logic |
| **Trace / Residue** | ⚠️ Implicit | No explicit pressure history; instant competition | Could add pressure trace (S4?) |
| **Re-entry** | ✅ Yes | Pressures influence actuation → world → return → future pressures | Feedback through closure loop |
| **Artificial Fluctuation Risk** | ✅ Low | Pressures derived from recovery/mismatch/trace states; no random boost | No `addMotivation` |
| **Command Stabilization Risk** | ⚠️ Low | `competitionStability` derived from balance; no forced winner | Natural competition outcome |
| **Semantic Leak Risk** | ✅ None | Pressures are pre-semantic drives (exploration, withdrawal, safety, etc.) | No meaning, concept, goal |

**Minimal Action**: None required. Consider pressure trace/momentum for S4 (noted for future).

**Notes**:
- Pressure competition is **natural winner-take-most** from competing drives
- `competitionStability` measures balance, not forced equilibrium
- Pressures are **pre-semantic drives**, not semantic goals or intentions
- Energy cap prevents infinite accumulation

---

## Artificial Fluctuation Risk Summary

| Layer | Risk Level | Evidence | Notes |
|---|---|---|---|
| Body Surface | ✅ Low | Pure derivation; no noise injection | |
| Actuation Pulse | ✅ Low | Threshold-gated; no forced motion | |
| World Medium | ⚠️ Low-Medium | Drift uses sin oscillators | Acceptable as simulated physics |
| Sensory Return | ✅ Low | Change-driven packets; no added noise | |
| Reafference | ✅ Low | Pure comparison; no artificial mismatch | |
| Closure Metrics | ✅ Low | Observer-side; no added variability | |
| Proto-Neuron | ✅ Low | Condition-derived; no `createNeuron()` | |
| Scenarios | ✅ None | Passive observation; no injection | |
| Trace/Replay | ✅ Low | History-driven; no random replay | |
| Pressure | ✅ Low | Condition-driven; no motivation boost | |

**Overall Risk**: Low

**Concerning Patterns Found**: None

**Recommended Actions**:
- Document that world medium drift oscillators are acceptable as simulated physics
- No immediate fixes required

---

## Command-Style Stabilization Risk Summary

| Layer | Risk Level | Evidence | Notes |
|---|---|---|---|
| Body Surface | ✅ Low | No `if (unstable) stabilize()` | |
| Actuation Pulse | ✅ Low | Quiet periods are natural | |
| World Medium | ✅ Low | Stability derived from conditions | |
| Sensory Return | ✅ Low | Empty returns are valid | |
| Reafference | ✅ Low | Mismatch observed, not corrected | |
| Closure Metrics | ✅ Low | Saturation risk is warning, not fix | |
| Proto-Neuron | ✅ Low | No forced candidate creation | |
| Scenarios | ✅ None | Passive tests | |
| Trace/Replay | ✅ Low | Suppression is natural gating | |
| Pressure | ✅ Low | Competition outcome is natural | |

**Overall Risk**: Low

**Concerning Patterns Found**: None

**Recommended Actions**: None

---

## Semantic Leak Risk Summary

| Layer | Risk Level | Forbidden Fields Present? | Evidence |
|---|---|---|---|
| Body Surface | ✅ None | No | Pure pre-semantic boundary state |
| Actuation Pulse | ✅ None | No | Channels are pre-semantic types |
| World Medium | ✅ None | No | Physical proxy fields only |
| Sensory Return | ✅ None | No | Pre-semantic sensory signals |
| Reafference | ✅ None | No | Proxy indicators, not self-awareness |
| Closure Metrics | ✅ None | No | Numerical loop health metrics |
| Proto-Neuron | ✅ None | No | **Observer-side candidates; no label/meaning/concept** |
| Scenarios | ✅ None | No | **All tests verify semanticLeakCount = 0** |
| Trace/Replay | ✅ None | No | Pre-semantic history state |
| Pressure | ✅ None | No | Pre-semantic drives |

**Forbidden Fields Checked**:
- `label` ❌ Not found
- `meaning` ❌ Not found
- `concept` ❌ Not found
- `category` ❌ Not found
- `sameObject` ❌ Not found
- `objectId` ❌ Not found
- `teacherVerdict` ❌ Not found
- `languageMeaning` ❌ Not found
- `utterance` ❌ Not found (in W0-W8 scope)

**Overall Risk**: None

**Recommended Actions**: None

---

## Immediate Minimal Fixes

**Required Now**: None

All audited layers meet S1 criteria.

---

## Next-Phase Candidates (S2-S8)

### S2: Dynamic Viability State
- Formalize viability range observation from closure metrics
- Add viability proximity warning (not forced correction)

### S3: Minimal Natural Feedback
- Strengthen reafference → organism feedback
- Add mismatch → pressure influence (currently weak)

### S4: Delay / Echo / Resistance Profile
- Add explicit delay buffers for reafference comparison
- Add comparison trace/history (currently instantaneous)
- Add pressure momentum/trace (currently instant competition)
- Enhance echo decay dynamics

### S5: Local Excitability Field
- Add spatial locality to proto-point/proto-neuron observation
- Currently organism-level; could benefit from spatial grid

### S6: Path Formation by Repeated Flow
- Observe flow paths that strengthen with repeated activity
- Build on proto-neuron local propagation

### S7: Proto-Network Candidate Observation
- Derive proto-network candidates from persistent proto-neurons
- Observe co-activation clusters as emergent network candidates

### S8: Long-Run Natural Emergence Scenarios
- Extended scenarios (10k+ ticks) to observe long-term emergence
- Test proto-network stability over extended time

---

## Do Not Fix Yet

The following are noted as potential improvements but are **intentionally deferred** to avoid behavior break:

1. **World medium drift oscillators**: Currently uses `sin(phase)` for natural-looking drift. This is acceptable as simulated physics; not "make it look alive". No change needed.

2. **Implicit dissipation in pure derivations**: Body surface and reafference comparison are pure per-frame derivations with no internal decay loops. Dissipation is handled upstream in their source states (trace, recovery, world medium). This is acceptable architecture; no change needed.

3. **Implicit delay in derived states**: Some layers (body surface, reafference) don't have explicit delay buffers; they rely on upstream delays. This is acceptable for S1; consider explicit delay buffers in S4.

4. **Global vs local**: Many layers (pressure, closure, trace) are organism-level, not spatially local. This is acceptable for current phase; consider spatial locality in S5.

---

## Risks to Watch

1. **World medium drift**: Uses deterministic oscillators (`sin(phase)`). Monitor that this doesn't evolve into "make it look organic" additions. **Current status**: Acceptable.

2. **Proto-neuron candidate count**: If candidates become too numerous or too stable, verify they remain **observer-side** and don't influence runtime. **Current status**: Gated by multi-threshold (≥4/8 conditions, confidence ≥0.40); candidates decay when not re-observed. Acceptable.

3. **Feedback saturation**: `feedbackSaturationRisk` warns of runaway amplification. Ensure this remains a **warning** and doesn't trigger automatic suppression. **Current status**: Observer-side only; no automatic suppression. Acceptable.

4. **Pressure competition**: Ensure pressures remain pre-semantic drives, not semantic goals or intentions. **Current status**: No meaning fields; pressures are numerical competition. Acceptable.

---

## S1 Completion Summary

**Audit Date**: 2026-04-27

**Scope**: W0–W8 Body-World Closure implementation + Trace/Replay + Pressure Competition

**Findings**:
- ✅ **Flow**: Present in all layers
- ✅ **Resistance**: Present in all layers
- ✅ **Dissipation**: Present in most layers; implicit in pure derivations (acceptable)
- ⚠️ **Delay**: Present explicitly in world/return/reafference; implicit in body surface (acceptable)
- ✅ **Boundary Exchange**: Core design focus; present throughout
- ⚠️ **Local Coupling**: Present in proto-neurons; implicit/global in pressure/closure (acceptable for current phase)
- ✅ **Threshold / Excitability**: Natural multi-threshold gating throughout
- ✅ **Trace / Residue**: History-dependent state without permanent memory
- ✅ **Re-entry**: Feedback loops present; closure loop complete

**Artificial Fluctuation Risk**: ✅ **Low** — No "make it look alive" patterns found

**Command Stabilization Risk**: ✅ **Low** — No "if unstable then stabilize" patterns found

**Semantic Leak Risk**: ✅ **None** — No forbidden semantic fields found; all tests verify `semanticLeakCount = 0`

**Immediate Fixes Required**: **None**

**Behavior Break Risk**: **None** — S1 audit performed; no runtime changes made

**Build Status**: ✅ Expected to pass (no code changes)

**S1 Completion**: ✅ **PASS**

---

## Appendix: Audit Methodology

### Flow Check
- Does activity propagate between layers?
- Does internal state leak outward naturally?
- Is there continuity of activation?

### Resistance Check
- Are there barriers that block or attenuate flow?
- Does the medium resist change?
- Are thresholds present that gate activation?

### Dissipation Check
- Do values decay over time toward baseline?
- Is there natural energy loss?
- Are there decay rates, attenuation, or dampening?

### Delay Check
- Is there temporal separation between cause and effect?
- Are there delay buffers, feedback delays, or round-trip times?
- Can delayed responses be observed?

### Boundary Exchange Check
- Do signals cross boundaries (organism ↔ world)?
- Is the boundary semi-permeable (not fully open or fully closed)?
- Does permeability vary based on state?

### Local Coupling Check
- Do nearby elements influence each other?
- Is propagation neighbor-based?
- Is there spatial or regional structure?

### Threshold / Excitability Check
- Are there activation conditions?
- Do elements only activate when conditions are met?
- Are thresholds natural results of weighted conditions?

### Trace / Residue Check
- Is there history-dependent state?
- Does past activity leave traces that influence future behavior?
- Do traces decay naturally (not permanent memory)?

### Re-entry Check
- Are there feedback loops?
- Does output affect future input?
- Is the system closed (output → world → input → output)?

### Artificial Fluctuation Check
- Search for: `addFlicker`, `makeAlive`, `addOrganicMotion`, `addRandomNoise`
- Search for comments: "make it look", "life-like", "organic", "natural-looking"
- Check if fluctuation is a **result** of conditions, not an **input**

### Command Stabilization Check
- Search for: `if (unstable)`, `if (collapsing)`, `if (saturating)`
- Check if stability is **forced** or **derived from conditions**
- Verify warnings are passive, not active corrections

### Semantic Leak Check
- Search for forbidden fields: `label`, `meaning`, `concept`, `category`, `sameObject`, `objectId`, `teacherVerdict`, `languageMeaning`
- Verify proto-neuron candidates have no semantic metadata
- Check observation packets for semantic fields
- Verify tests assert `semanticLeakCount === 0`
