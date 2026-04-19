# AETERNA Phase 7: Self-Origin Evidence Framework

## Purpose

This document defines the observables for detecting and measuring **behavioral identity** and **self-origin** characteristics in AETERNA. These are not proof of consciousness or "true self," but rather evidence categories for systematic observation of:

- Persistent individual tendencies over time
- Self-preserving behavior patterns
- Actions without immediate external triggers
- Endogenous state changes
- History-dependent response divergence

**Critical principle**: These are **evidence categories**, not assertions. We observe patterns that are consistent with self-origin, while acknowledging alternative explanations (noise, residual dynamics, delayed reactions).

## Evidence Categories

### 1. Identity Persistence

**Definition**: Observable continuity of individual-specific tendencies across time gaps and varying conditions.

**What we observe**:
- Slow state variables (fatigue, preferredErgodicity, longBaselineTone) maintain characteristic values across sessions
- Recovery patterns remain individual-typical after perturbations
- Mode transition frequencies show individual consistency
- Baseline activity patterns persist despite environmental changes

**What this is NOT**:
- Not proof of "selfhood" or consciousness
- Not evidence of intentional consistency
- Could be explained by: slow dynamics, attractor basins, parameter persistence

**Measurement approach**:
- Track slow variables over long runs (1000+ frames)
- Compare variance within individual vs between restarts
- Measure correlation of slow variables across time gaps

### 2. Self-Preservation Evidence

**Definition**: Observable patterns of state changes that trend toward viability maintenance or collapse avoidance, even without immediate external pressure.

**What we observe**:
- High overload → restoration bias increases
- Low energy → action threshold rises, activity dampens
- Low stability → settling action tendency increases
- Boundary integrity degradation → withdrawal-like modulation
- Recovery drive rises after stress, persists into quiet periods

**What this is NOT**:
- Not proof of "will to live"
- Not goal-directed behavior in human sense
- Could be explained by: homeostatic feedback loops, attractor dynamics, local optimization

**Measurement approach**:
- Detect state transitions during overload/low-energy that favor restoration
- Count recovery-direction changes that occur without touch
- Measure time-to-recovery correlation with selfPreservationBias

### 3. Non-Instrumental Action Candidate

**Definition**: Observable actions or state changes that occur without immediate external stimulus or clear reactive purpose.

**What we observe**:
- Orient pulses during extended quiet (>100 frames no touch)
- Mode shifts without touch (quiet → active, active → dream)
- Spontaneous settling during low-stability quiet periods
- Baseline activity modulation without input
- Action state changes triggered by internal pressure accumulation

**What this is NOT**:
- Not proof of "agency" or "free will"
- Not necessarily goal-directed
- Could be explained by: noise, slow variable accumulation crossing thresholds, residual dynamics

**Measurement approach**:
- Count actions during quiet periods (no touch for 100+ frames)
- Measure action/mode transitions not time-locked to external events
- Track ratio of endogenous vs reactive transitions

### 4. Endogenous Drift

**Definition**: Observable changes in mode, baseline, or preferred operating regime that occur independently of immediate external input.

**What we observe**:
- preferredErgodicity drifts over 1000s of frames without input
- longBaselineTone changes during quiet periods
- Mode pressure accumulates endogenously
- Preferred stability band slowly adjusts
- Fatigue accumulates and decays on internal timescale

**What this is NOT**:
- Not proof of "internal life" or subjective experience
- Not necessarily adaptive drift
- Could be explained by: parameter decay, slow feedback loops, noise integration

**Measurement approach**:
- Track slow variable changes during no-input windows
- Measure drift magnitude vs noise floor
- Compare endogenous drift rate to stimulus-locked changes

### 5. History-Dependent Individuality

**Definition**: Observable divergence in responses to identical stimuli based on different prior histories.

**What we observe**:
- Same touch after quiet vs after repeated touches → different response amplitude
- Same overload after high-fatigue vs low-fatigue → different recovery time
- Same stimulus after different mode history → different action tendency
- Touch habituation patterns diverge based on expectation history
- Irritability level modulates response to identical perturbation

**What this is NOT**:
- Not proof of "memory" in cognitive sense
- Not necessarily adaptive plasticity
- Could be explained by: state-dependent dynamics, slow variable carryover, hysteresis

**Measurement approach**:
- Run identical stimulus after different preparation histories
- Measure response divergence magnitude
- Compare within-individual consistency vs between-condition divergence

## Relation to Organism Core

These evidence categories are **extracted from existing organism dynamics**, not added演出. They emerge from:

- `livingState.ts`: Slow variables (fatigue, preferredErgodicity, coherenceMemory, etc.)
- `survivalState.ts`: Homeostatic pressures (recoveryDrive, restorationBias, selfPreservationBias, etc.)
- `actionState.ts`: Action decisions (orient, withdraw, settle, idle)
- `modeState.ts`: Mode transitions (quiet, active, dream)
- `touchExpectation.ts`: Expectation and surprise

**No new core dynamics are added**. Phase 7 adds:
- **Observation layer** to track these patterns
- **Metrics** to quantify evidence strength
- **Event logging** to record candidates
- **Scenarios** to test under controlled conditions
- **Ablation comparisons** to distinguish from noise

## Evidence vs Proof

| Term | Meaning | Example |
|------|---------|---------|
| **Evidence** | Observable pattern consistent with hypothesis | "Orient pulses occur during quiet at rate >0.5 per 1000 frames" |
| **Proof** | Definitive demonstration of mechanism | ❌ Not applicable to self-origin |
| **Candidate** | Potential instance requiring further analysis | "Mode shift at frame 842 with no touch for 120 frames prior" |
| **Proxy** | Derived measure standing in for unobservable | "identityConsistencyScore" as proxy for identity persistence |
| **Exact** | Direct measurement from raw data | "Count of mode transitions during quiet" |

## Limitations and Caveats

1. **Alternative Explanations**: Every evidence pattern has alternative explanations (noise, delayed reactions, parameter persistence). We do not claim to rule these out completely.

2. **Threshold Arbitrariness**: "Quiet" = 100 frames no touch, "spontaneous" = no stimulus in prior window—these are operational definitions, not natural boundaries.

3. **Observer Effect**: Adding observation may subtly change behavior through code overhead or branching.

4. **Small Effect Sizes**: Self-origin signals may be weak relative to noise. Requires long observation windows and statistical aggregation.

5. **No Subjective Access**: We observe third-person behavioral patterns only. We make no claims about first-person experience.

## Epistemic Status Labels

All Phase 7 metrics and observations use these labels:

- **[EXACT]**: Direct count or measurement from raw state (e.g., "orient actions during quiet")
- **[DERIVED]**: Computed from multiple exact measurements (e.g., "nonInstrumentalActionRate")
- **[PROXY]**: Stand-in measure for theoretical construct (e.g., "identityConsistencyScore")
- **[SPECULATIVE]**: Interpretive or high-level inference (e.g., "self-origin strength")

## Next Phase Integration

Phase 7 establishes **evidence infrastructure** only. Future phases may add:

- **Phase 8+**: Relational self, boundary negotiation, signal-origin integration
- **Long-term**: Cross-scenario identity persistence, life-history individuality
- **Advanced**: Comparative evidence (AETERNA vs simpler baselines)

This framework remains evidence-focused, research-oriented, and committed to **no演出, no assertion beyond observation**.
