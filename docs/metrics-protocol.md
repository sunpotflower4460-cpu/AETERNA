# AETERNA Metrics Protocol

This document defines the observable metrics used to evaluate "life-likeness" and "primitive organism-likeness" in AETERNA.

## Purpose

These metrics are not arbitrary performance indicators. They are **operationalized definitions** of what it means for a system to exhibit ongoing, self-sustaining, history-dependent, perturbation-responsive behavior—the minimal criteria for a primitive living system.

## Metric Categories

### A. Ongoingness

**Definition**: The system maintains internal activity without external input.

#### A.1 Mean Activity
- **Meaning**: Average magnitude of ongoing network activity
- **Measurement**: Mean absolute value of `currentBuffer` across all nodes over time window
- **Formula**: `sum(|currentBuffer[i]|) / numNodes`
- **Success Condition**: Mean activity > 0.1 in absence of touch for 1000+ frames
- **Failure Condition**: Mean activity < 0.01 (collapse to silence)
- **Limitation**: Does not distinguish structured activity from random noise

#### A.2 Activity Variance
- **Meaning**: Temporal variability of activity (non-frozen behavior)
- **Measurement**: Standard deviation of mean activity over sliding 100-frame window
- **Formula**: `stddev(meanActivity[t-100:t])`
- **Success Condition**: Variance > 0.05 (system is not frozen)
- **Failure Condition**: Variance < 0.001 (frozen state)
- **Limitation**: High variance could indicate instability rather than life-likeness

#### A.3 Boundedness
- **Meaning**: Activity remains within physiological bounds (does not explode)
- **Measurement**: Max absolute value of any node over time
- **Formula**: `max(|currentBuffer|)`
- **Success Condition**: Max < 50.0 for all frames
- **Failure Condition**: Any value > 100.0 or NaN
- **Limitation**: Bounded activity does not guarantee life-likeness

#### A.4 Collapse Rate
- **Meaning**: Frequency of complete activity collapse
- **Measurement**: Count of frames where mean activity < 0.01
- **Formula**: `count(meanActivity < 0.01) / totalFrames`
- **Success Condition**: Collapse rate < 0.01 (less than 1% of frames)
- **Failure Condition**: Collapse rate > 0.1 (frequent death)
- **Limitation**: Depends on heartbeat and noise tuning

#### A.5 Saturation Rate (Phase 1)
- **Meaning**: Frequency of activity hitting the soft-clamp ceiling (runaway tendency)
- **Measurement**: Count of frames where maxActivity > 8.0 (soft-clamp threshold in dynamicCore)
- **Formula**: `count(maxActivity > 8.0) / totalFrames`
- **Success Condition**: Saturation rate < 0.05 (less than 5% of frames)
- **Failure Condition**: Saturation rate > 0.1 (persistent ceiling contact indicating runaway)
- **Classification**: Derived
- **Limitation**: Brief excursions above 8.0 are expected and suppressed by soft-clamp; only sustained saturation indicates runaway

#### A.6 Spontaneous Ignition Count (Phase 1)
- **Meaning**: Number of times activity spontaneously rises from near-zero to above quiet floor
- **Measurement**: Count of upward crossings of 0.05 threshold in mean activity
- **Formula**: `count(meanActivity[t] >= 0.05 AND meanActivity[t-1] < 0.05)`
- **Success Condition**: > 0 over 1000 frames of no-input run
- **Failure Condition**: 0 ignitions (system cannot self-restart)
- **Classification**: Evidence
- **Limitation**: Threshold is heuristic; low noise may reduce ignition frequency

#### A.7 Quiet Baseline Floor (Phase 1)
- **Meaning**: Mean activity level maintained when no external touch input is present
- **Measurement**: Mean of meanActivity over all frames with no active touch
- **Formula**: `mean(meanActivity[t] for t where activeTouchCount == 0)`
- **Success Condition**: quietBaselineFloor > 0.05 (not dead; quiet but alive)
- **Failure Condition**: quietBaselineFloor < 0.01 (system cannot sustain baseline without input)
- **Classification**: Measured
- **Limitation**: Value depends on baseline noise and longBaselineTone tuning

#### A.8 Ongoingness Score (Phase 1)
- **Meaning**: Composite proxy score for sustained, bounded, non-collapsed activity
- **Measurement**: Derived from collapseRate, saturationRate, and quietBaselineFloor
- **Formula**: `(1 - min(collapseRate*5, 1)) * 0.5 + (1 - min(saturationRate*20, 1)) * 0.3 + min(quietBaselineFloor/0.2, 1) * 0.2`
- **Success Condition**: ongoingnessScore > 0.7
- **Failure Condition**: ongoingnessScore < 0.3
- **Classification**: Proxy
- **Limitation**: Weights are heuristic; does not capture pattern richness or history-dependence

### B. Perturbation Sensitivity

**Definition**: The system responds to external stimuli in a measurable way.

#### B.1 Response Amplitude
- **Meaning**: Magnitude of change caused by single touch
- **Measurement**: Change in mean activity from pre-touch baseline to peak post-touch
- **Formula**: `max(meanActivity[t_touch:t_touch+50]) - mean(meanActivity[t_touch-50:t_touch])`
- **Success Condition**: Response amplitude > 0.2 for moderate touch
- **Failure Condition**: Response amplitude < 0.05 (unresponsive)
- **Limitation**: Very strong responses could indicate instability

#### B.2 Response Latency
- **Meaning**: Time delay from touch to peak response
- **Measurement**: Frame offset from touch to peak mean activity
- **Formula**: `argmax(meanActivity[t_touch:t_touch+50]) - t_touch`
- **Success Condition**: Latency < 10 frames (responsive within ~167ms)
- **Failure Condition**: No peak detected within 100 frames
- **Limitation**: Fast latency does not imply adaptive response

#### B.3 Recovery Time
- **Meaning**: Time to return to baseline after perturbation
- **Measurement**: Frames required for mean activity to return within 20% of pre-touch baseline
- **Formula**: `first(t : meanActivity[t] < baseline * 1.2) - t_touch`
- **Success Condition**: Recovery within 50-200 frames (moderate persistence)
- **Failure Condition**: No recovery within 500 frames, or instant recovery (<5 frames)
- **Limitation**: Recovery time depends on touch intensity

#### B.4 Spatial Spread
- **Meaning**: How far perturbation propagates from touch point
- **Measurement**: Number of nodes with |activity - baseline| > threshold after touch
- **Formula**: `count(|currentBuffer[i] - baseline[i]| > 0.5) at t_touch + 10`
- **Success Condition**: 10-50% of nodes affected
- **Failure Condition**: <5% (local only) or >95% (global saturation)
- **Limitation**: Spatial spread depends on network connectivity

### C. History Dependence

**Definition**: The system's response depends on past events, not just current input.

#### C.1 Repeated Touch Adaptation
- **Meaning**: Response to identical touch changes over repetitions
- **Measurement**: Response amplitude on touch N vs touch 1 (same location, same pressure, fixed interval)
- **Formula**: `responseAmplitude(touch_N) / responseAmplitude(touch_1)`
- **Success Condition**: Ratio < 0.8 by 5th repetition (habituation-like) OR ratio diverges (sensitization-like)
- **Failure Condition**: Ratio remains 0.95-1.05 (no adaptation)
- **Limitation**: Current AETERNA may not show strong adaptation (expectation mechanism incomplete)

#### C.2 Trace-Dependent Divergence
- **Meaning**: Two identical touches separated by different histories produce different responses
- **Measurement**: Compare response to touch A after quiet vs after repeated touches
- **Formula**: `|responseAmplitude(A_after_quiet) - responseAmplitude(A_after_active)| / responseAmplitude(A_after_quiet)`
- **Success Condition**: Divergence > 0.2 (history matters)
- **Failure Condition: Divergence < 0.05 (stateless)
- **Limitation**: Requires precise control of history conditions

#### C.3 Expectation Violation Response (future)
- **Meaning**: System responds differently to expected vs unexpected stimuli
- **Measurement**: Prediction error magnitude for expected vs novel touch
- **Formula**: `meanPredictionError(novel_touch) - meanPredictionError(expected_touch)`
- **Success Condition**: Novel touch produces 2x prediction error of expected touch
- **Failure Condition**: No difference in prediction error
- **Limitation**: Requires touch prediction mechanism (currently rudimentary in AETERNA)

### D. Self-Stabilization

**Definition**: The system recovers from perturbations or transitions between stable states.

#### D.0 Recovery Profile Core (Phase 3)
- **`recoveryPressure`** (Derived): Current pressure returning toward viable basin after mismatch.
- **`relaxationLevel`** (Derived): Degree of actual de-tensioning after disturbance.
- **`stabilizationPull`** (Derived): Pull toward a stable band (original or shifted).
- **`collapseRisk`** (Derived): Composite risk of degradation/collapse under current load.
- **`boundaryRepairPressure`** (Proxy): Weak boundary-support tendency under restoration/self-preservation.
- **`selfPreservationDrive`** (Proxy): Minimal non-personified drift toward anti-collapse operation.
- **`overloadDrain`** (Measured/Derived hybrid): How much overload/depletion is currently eating viability.
- **`recoveryTrajectory`** (Observer vocabulary): `recover | shift | degrade | partial_repair`.
- **`collapseMode`** (Observer vocabulary): `stable | soft_collapse | hard_collapse | runaway`.

**Important**: trajectory/collapse labels are observation tags for scenario comparison, not runtime semantic mode switches.

#### D.1 Return-to-Baseline Time
- **Meaning**: Time to recover homeostatic baseline after large perturbation
- **Measurement**: Frames to return within 10% of pre-perturbation baseline
- **Formula**: `first(t : |meanActivity[t] - baseline| < baseline * 0.1) - t_perturbation`
- **Success Condition**: Recovery within 100-500 frames
- **Failure Condition**: No recovery, or new stable state permanently different
- **Limitation**: Assumes single attractor; organism may have multiple stable modes

#### D.2 Overload Saturation Probability
- **Meaning**: Probability of collapse under sustained high tension
- **Measurement**: Fraction of high-tension episodes (tension > 0.5 for 100+ frames) that trigger collapse
- **Formula**: `count(collapse | tension > 0.5) / count(tension > 0.5)`
- **Success Condition**: Saturation probability < 0.3 (resilient)
- **Failure Condition**: Saturation probability > 0.7 (fragile)
- **Limitation**: Depends on tension accumulation and noise tuning

#### D.3 Mode Transition Frequency
- **Meaning**: Rate of spontaneous mode changes (quiet ↔ active ↔ dream)
- **Measurement**: Mode transitions per 1000 frames
- **Formula**: `count(modeState[t] != modeState[t-1]) / (totalFrames / 1000)`
- **Success Condition**: 1-5 transitions per 1000 frames (stable but dynamic)
- **Failure Condition**: <0.1 (stuck) or >20 (chaotic)
- **Limitation**: Current mode system may not transition spontaneously without tuning

#### D.4 Arousal / Awareness Dissociation
- **Meaning**: Activation height and foreground availability remain separable
- **Measurement**: Compare `arousalLevel` and `awarenessWindow` during quiet, overload, and depleted runs
- **Operational Readout**:
  - overload run: `foregroundPressure` rises and `arousalLevel` increases during perturbation windows
  - quiet run: `avgArousalLevel` stays above zero baseline
  - depleted run: late `awarenessWindow` narrows relative to early window
- **Success Condition**: At least one scenario shows `arousalLevel` and `awarenessWindow` diverging in a stable, finite way
- **Failure Condition**: The two values collapse into near-equality across all scenarios
- **Limitation**: These are derived observer quantities, not direct measurements

### E. Endogenous Action Tendency

**Definition**: The system exhibits spontaneous actions without external stimulus.

#### E.1 Spontaneous Orient Pulses
- **Meaning**: Frequency of orient actions in absence of touch
- **Measurement**: Orient actions per 1000 quiet frames (no touch for 100+ frames prior)
- **Formula**: `count(actionState == 'orient' | quiet) / (quietFrames / 1000)`
- **Success Condition**: >0.5 spontaneous orients per 1000 quiet frames
- **Failure Condition**: Zero spontaneous actions
- **Limitation**: Current action system may be primarily reactive

#### E.2 Internally Triggered Mode Shifts
- **Meaning**: Mode transitions that occur without external perturbation
- **Measurement**: Mode transitions during quiet periods (no touch for 100+ frames)
- **Formula**: `count(modeTransition | quiet) / totalModeTransitions`
- **Success Condition**: >20% of mode transitions are spontaneous
- **Failure Condition**: All transitions are stimulus-locked
- **Limitation**: Requires sufficient mode pressure accumulation

#### E.3 Action Bursts Without Touch
- **Meaning**: Sequences of multiple actions in absence of input
- **Measurement**: Count of action sequences (2+ consecutive non-idle actions) during quiet
- **Formula**: `count(actionBursts | quiet) / (quietFrames / 1000)`
- **Success Condition**: >0.1 action bursts per 1000 quiet frames
- **Failure Condition**: Zero action bursts without touch
- **Limitation**: May require tuning of endogenous action drives

### F. Perturbation Mismatch (Phase 2)

**Definition**: The quality of prediction error arising from external perturbation, dependent on organism state.

#### F.1 Mismatch Level
- **Meaning**: Degree of prediction mismatch induced by perturbation
- **Measurement**: `derivePredictionMismatch` output `mismatchLevel`
- **Formula**: `baselinePredictionError * (1 + novelty * 0.5) * (1 + overload * 0.3) * (1 - expectedness * 0.25) + novelty * overload * 0.2`
- **Classification**: Derived
- **Note**: State-dependent — same touch produces higher mismatch under overload

#### F.2 Surprise Pressure
- **Meaning**: Pressure from unexpected input given current state
- **Measurement**: `derivePredictionMismatch` output `surprisePressure`
- **Formula**: `novelty * (1 + overload * 0.4) * (1 - coherenceMemory * 0.3)`
- **Classification**: Derived
- **Note**: Decreases with familiarity and coherence

#### F.3 Boundary Stress
- **Meaning**: Stress on organism boundary from perturbation contact
- **Measurement**: `derivePredictionMismatch` output `boundaryStress`
- **Classification**: Derived

#### F.4 Recovery Pull
- **Meaning**: Pull toward recovery/restoration after mismatch
- **Measurement**: `derivePredictionMismatch` output `recoveryPull`
- **Formula**: `restorationBias * (1 - overload * 0.5) * stability`
- **Classification**: Derived

#### F.5 Perturbation Novelty
- **Meaning**: How unexpected the perturbation is given familiarity
- **Measurement**: `derivePerturbationEvent` output `novelty`
- **Classification**: Derived

#### F.6 Perturbation Expectedness
- **Meaning**: How expected the perturbation is (inverse of surprise)
- **Measurement**: `derivePerturbationEvent` output `expectedness`
- **Classification**: Derived

**Metric Categories**:
- **Measured**: `perturbationMagnitude` (raw input magnitude)
- **Derived**: `mismatchLevel`, `boundaryStress`, `perturbationNovelty`, `perturbationExpectedness`
- **Proxy**: `surprisePressure`, `recoveryPull`

## Measurement Implementation

All metrics should be computed from scenario runs (see `src/experiments/runScenario.ts`).

### Phase 1 Ongoingness Additions

Scenario summaries now include (added in Phase 1):
- `saturationFrames`: Count of frames where maxActivity > 8.0 (soft-clamp threshold)
- `saturationRate`: `saturationFrames / totalFrames`
- `collapseRate`: `collapseFrames / totalFrames`
- `spontaneousIgnitionCount`: Number of upward threshold crossings (meanActivity crosses 0.05)
- `quietBaselineFloor`: Mean activity during no-touch frames
- `ongoingnessScore`: Composite proxy [0–1] combining collapse, saturation, and floor

**Classification**:
- **Measured**: `quietBaselineFloor`, `saturationFrames`, `collapseFrames`, `spontaneousIgnitionCount`
- **Derived**: `collapseRate`, `saturationRate`
- **Proxy**: `ongoingnessScore`

These metrics are the primary evaluation tool for Phase 1 (no-input long-run stability). They should be collected before and after any future mechanism addition to verify the life-field has not weakened.

### Phase 3 Recovery Additions

Scenario summaries now include:
- `avgRecoveryPressure`
- `avgRelaxationLevel`
- `avgStabilizationPull`
- `avgRecoveryCollapseRisk`
- `avgBoundaryRepairPressure`
- `avgSelfPreservationDrive`
- `avgOverloadDrain`
- `recoveryFrameCount`, `shiftFrameCount`, `degradeFrameCount`, `partialRepairFrameCount`
- `softCollapseFrames`, `hardCollapseFrames`, `runawayFrames`
- `avgRecoveryTime`
- `avgSettlingTime`
- `repeatedOverloadDegradationSlope`

**Classification**:
- **Measured**: raw activity, boundary integrity deltas, overload level, touch/mismatch load
- **Derived**: `recoveryPressure`, `relaxationLevel`, `stabilizationPull`, `collapseRisk`, recovery/settling times
- **Proxy**: `selfPreservationDrive`, `boundaryRepairPressure`, degradation slope

### A2 Scenario Summary Additions

Scenario summaries now include:
- `avgArousalLevel`
- `avgAwarenessWindow`
- `avgSalienceOpenness`
- `avgForegroundPressure`
- `maxArousalLevel`
- `minAwarenessWindow`

These are for research comparison only and should not be interpreted as human-style awareness claims.

### A3 Replay / Consolidation Additions

Scenario summaries now include:
- `avgTraceStrength`: Mean residue strength remaining in the field
- `avgRecurrenceWeight`: Mean recurrence-linked remaining weight
- `avgSalienceResidue`: Mean salient mismatch residue
- `totalReplayCount`: Total number of replay events across scenario
- `avgReplayPressure`: Average pressure to initiate replay
- `avgReplayReadiness`: Average availability for replay to occur
- `avgConsolidationGain`: Average consolidation strength (always weak)
- `maxActiveReplayCount`: Maximum simultaneous replay traces
- `avgRecentReplaySalience`: Average salience weight of replay events
- `avgRecentPatternWeight`: Mean lingering weight of the recent local pattern
- `avgSettlingResidue`: Mean quiet-settling residue
- `avgRecoveryLinkedResidue`: Mean recovery-linked residue
- `avgWeakConsolidationDelta`: Mean weak post-replay slow-state delta
- `avgReplayContributionToStabilization`: Mean replay contribution toward stabilization
- `avgQueueFillRatio`: Average replay queue occupancy (0-1)

**Important**: These are derived/proxy metrics, NOT direct measurements. They indicate trace / replay / weak consolidation dynamics but are not "proof" of memory or semantic recall.

**Classification**:
- **Measured**: `totalReplayCount`, `activeReplayCount`, raw local activity resurgence, `replayQueueSize`
- **Derived**: `traceStrength`, `recurrenceWeight`, `salienceResidue`, `replayReadiness`, `replaySuppression`, `consolidationGain`, `restConsolidationDepth`
- **Proxy**: `recentPatternWeight`, `settlingResidue`, `recoveryLinkedResidue`, `recentReplaySalience`, `weakConsolidationDelta`, `replayContributionToStabilization`

Replay is intentionally minimal and does not dominate organism dynamics. It is NOT episodic memory, not event playback, and not dream演出.

### Temporal Windows
- **Short window**: 50 frames (~0.83s @ 60 FPS)
- **Medium window**: 100 frames (~1.67s)
- **Long window**: 1000 frames (~16.7s)

### Baseline Computation
- **Pre-stimulus baseline**: Mean of 50-100 frames before touch
- **Quiet baseline**: Mean activity during 500+ frame no-touch period

### Statistical Significance
- Report mean ± std dev over 3+ runs with different seeds
- Flag metrics with >50% variance across runs

## Success Criteria Summary

An AETERNA organism exhibits **primitive life-likeness** if:
1. Ongoingness: Mean activity > 0.1 for 1000+ frames without input, variance > 0.05, no NaN
2. Perturbation Sensitivity: Response amplitude > 0.2, recovery within 50-200 frames
3. History Dependence: Repeated touch adaptation ratio < 0.8 OR trace divergence > 0.2
4. Self-Stabilization: Return-to-baseline within 100-500 frames, mode transitions 1-5 per 1000 frames
5. Endogenous Action: >0.5 spontaneous orients per 1000 quiet frames

### Phase 1 Minimum Viability (生命場としての成立)

Before any of the above, AETERNA must first pass Phase 1 minimum viability:
- **No collapse**: collapseRate < 0.05 over 5000 no-input ticks
- **No saturation**: saturationRate < 0.02 over 5000 no-input ticks
- **No NaN**: nanFrames = 0 at all times
- **Quiet floor**: quietBaselineFloor > 0.05 (not dead without input)
- **Bounded**: peakActivity < 50.0 at all times
- **Not frozen**: activity variance > 0.001 over any 1000-frame window

## Limitations and Open Questions

1. **Threshold Arbitrariness**: Success thresholds are heuristic, not derived from biological principles
2. **Metric Independence**: Metrics may be correlated (e.g., high variance may predict mode transitions)
3. **Temporal Scale**: Metrics assume ~60 FPS; different frame rates may require adjustment
4. **Missing Metrics**: Social interaction, learning curves, long-term stability (hours/days) not covered
5. **Interpretation**: Passing metrics does not guarantee "real" life-likeness—only operational criteria

## Future Extensions

- **Spatial Metrics**: Traveling waves, cluster formation dynamics
- **Long-Horizon Metrics**: Stability over 10,000+ frames, attractor drift
- **Comparative Metrics**: AETERNA vs simpler baselines (random walk, fixed-point attractor)
- **Ablation Metrics**: Effect size of removing each mechanism (prediction, rewrite, mode, etc.)
