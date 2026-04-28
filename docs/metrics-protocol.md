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

### G. Actuation Pulse (W2)

**Definition**: 世界へ漏れる最小の pre-semantic body output candidate。発話ではない。

#### G.1 Pulse Generated Count
- **Meaning**: 非 null の Actuation Pulse が導出された回数
- **Measurement**: `deriveActuationPulse(...) !== null` の累積
- **Classification**: Measured

#### G.2 Channel Count
- **Meaning**: `visual` / `simulatedForce` ごとの導出回数
- **Measurement**: channel 別カウント
- **Classification**: Measured

#### G.3 Null Pulse Count
- **Meaning**: 抑制条件により pulse を返さなかった回数
- **Measurement**: `deriveActuationPulse(...) === null` の累積
- **Classification**: Measured

#### G.4 Intensity / Coherence / Rhythm / Locality
- **Meaning**: pulse の強さ / まとまり / 周期性 / 場の局所性
- **Measurement**: `ActuationPulse.intensity`, `coherence`, `rhythm`, `locality`
- **Classification**: Derived

#### G.5 Recovery-Linked / Boundary-Linked / Trace-Linked / Output Readiness
- **Meaning**: 回復 / 境界 / trace / Body Surface 出力準備との結びつき
- **Measurement**: `recoveryLinked`, `boundaryLinked`, `traceLinked`, `outputReadiness`
- **Classification**: Proxy

**Important**:
- Actuation Pulse は semantic output ではない
- channel は world-medium-ready な interface であり、W2 では observer / scenario 記録に留める
- output しないことも自然な観測結果として扱う

#### F.6 Perturbation Expectedness
- **Meaning**: How expected the perturbation is (inverse of surprise)
- **Measurement**: `derivePerturbationEvent` output `expectedness`
- **Classification**: Derived

**Metric Categories**:
- **Measured**: `perturbationMagnitude` (raw input magnitude)
- **Derived**: `mismatchLevel`, `boundaryStress`, `perturbationNovelty`, `perturbationExpectedness`
- **Proxy**: `surprisePressure`, `recoveryPull`

### H. World Medium (W3)

**Definition**: 外界シミュレーションの状態。AETERNA の Actuation Pulse を受け取り変化する。

#### H.1 World Medium Raw Values

- **Meaning**: World Medium の現在の生の値
- **Measurement**: `WorldMediumState` の各フィールド
- **Classification**: Measured
- **Values**:
  - `ambientLight` (0–1): 環境光レベル
  - `ambientNoise` (0–1): 環境ノイズレベル
  - `surfaceResistance` (0–1): 表面抵抗
  - `echoLevel` (0–1): エコーレベル
  - `motionDrift` (0–1): ドリフト
  - `fieldTemperature` (0–1): 場の温度
  - `feedbackDelay` (0–1): feedback 遅延
  - `lastPulseImpact` (0–1): 直近 pulse 影響
  - `mediumStability` (0–1): 安定度

#### H.2 Pulse Count

- **Meaning**: World Medium に送られた Actuation Pulse の総数
- **Measurement**: updateWorldMedium に pulse が渡された回数
- **Classification**: Measured

#### H.3 Pulse Impact Change

- **Meaning**: pulse 前後の lastPulseImpact の変化量
- **Measurement**: `lastPulseImpact[t+1] - lastPulseImpact[t]` when pulse applied
- **Classification**: Measured

#### H.4 Visual Residue Decay Rate

- **Meaning**: visualResidue の減衰速度
- **Measurement**: `visualResidue` の時間変化率（pulse なし時）
- **Classification**: Derived

#### H.5 Force Residue Decay Rate

- **Meaning**: forceResidue の減衰速度
- **Measurement**: `forceResidue` の時間変化率（pulse なし時）
- **Classification**: Derived

#### H.6 Medium Stability

- **Meaning**: World Medium がどれくらい安定しているか
- **Measurement**: `mediumStability` 値
- **Classification**: Derived

#### H.7 World Turbulence

- **Meaning**: World Medium の乱流度・変動性
- **Measurement**: `worldTurbulence` 値
- **Classification**: Proxy

#### H.8 Return Readiness (W4 準備用)

- **Meaning**: Sensory Return を生成する準備度（W4 以降で使用予定）
- **Measurement**: `returnReadiness` 値
- **Classification**: Proxy

**Important**:
- World Medium metrics は AETERNA 外部の状態
- W3 では Sensory Return / Reafference Comparison は未実装
- これらは外界シミュレーションの観測値であり、AETERNA の内部状態ではない
- semantic interpretation は行わない

**Metric Categories**:
- **Measured**: `ambientLight`, `ambientNoise`, `surfaceResistance`, `echoLevel`, `motionDrift`, `fieldTemperature`, `feedbackDelay`, `lastPulseImpact`, pulse count, pulse impact change
- **Derived**: `mediumStability`, visual/force residue decay rates
- **Proxy**: `worldTurbulence`, `returnReadiness`

### I. Sensory Return (W4)

**Definition**: pre-semantic signal が World Medium から AETERNA に戻る入力。意味入力ではない。

#### I.1 Sensory Return Packet Count

- **Meaning**: 生成された SensoryReturnPacket の総数
- **Measurement**: `deriveSensoryReturn` が返した packet 配列の累積長
- **Classification**: Measured

#### I.2 Channel Count

- **Meaning**: channel 別の packet 数
- **Measurement**: channel ごとの packet 数
  - `simulatedLight`
  - `simulatedNoise`
  - `simulatedPressure`
  - `simulatedMotion`
  - `simulatedEcho`
- **Classification**: Measured

#### I.3 Raw World Value Delta

- **Meaning**: World Medium の生の値の変化量
- **Measurement**: `currentWorld[field] - previousWorld[field]` の絶対値
- **Classification**: Measured

#### I.4 Intensity

- **Meaning**: 戻り信号の強さ
- **Measurement**: `SensoryReturnPacket.intensity`
- **Classification**: Derived

#### I.5 Novelty

- **Meaning**: 前回までの world state と比べた新規性
- **Measurement**: `SensoryReturnPacket.novelty`
- **Classification**: Derived

#### I.6 Locality

- **Meaning**: 局所的な戻りか、全体的な戻りか
- **Measurement**: `SensoryReturnPacket.locality`
- **Classification**: Derived

#### I.7 Rhythm

- **Meaning**: 戻りの周期性
- **Measurement**: `SensoryReturnPacket.rhythm`
- **Classification**: Derived

#### I.8 World Origin Strength

- **Meaning**: この信号が World Medium 由来である強度（W4 では self/world 判定なし）
- **Measurement**: `SensoryReturnPacket.worldOriginStrength`
- **Classification**: Proxy

#### I.9 Return Delay Hint

- **Meaning**: どれくらい遅れて戻った可能性があるかの hint
- **Measurement**: `SensoryReturnPacket.returnDelayHint`
- **Classification**: Proxy

#### I.10 Medium Stability Hint

- **Meaning**: World Medium が安定している状態から戻ったのか、揺れている状態から戻ったのかの hint
- **Measurement**: `SensoryReturnPacket.mediumStabilityHint`
- **Classification**: Proxy

**Important**:
- Sensory Return は semantic input ではない
- W4 では simulated return のみ（real sensor はまだ使わない）
- Reafference Comparison（self-caused / world-caused 判定）は W5
- PerturbationEvent への変換は weak（overwhelming しない）

**Metric Categories**:
- **Measured**: sensory return packet count, raw world value delta, channel count
- **Derived**: intensity, novelty, locality, rhythm
- **Proxy**: worldOriginStrength, returnDelayHint, mediumStabilityHint

### J. Medium Profile / Delay-Echo-Resistance (S4)

**Definition**: 閉ループ媒質における戻りの遅れ、反響、抵抗、吸収、減衰を observer-side にまとめた profile。安定化命令ではない。

#### J.1 Delay Profile

- **Meaning**: 戻りの delay band / variance / stability window を観測する
- **Measurement**: `deriveDelayProfile(...)`
- **Important**:
  - delay が短いこと自体を「良い」と断定しない
  - delay が長いこと自体を「悪い」と断定しない
  - exact delay claim ではなく closed-loop proxy を扱う

#### J.2 Echo Profile

- **Meaning**: echo residue がどの程度残り、どの程度減衰しているかを観測する
- **Measurement**: `deriveEchoProfile(...)`
- **Important**:
  - echo を増やすための実装ではない
  - echo saturation risk は warning / proxy であり command ではない
  - visual / force residue は medium-side residue proxy

#### J.3 Resistance Profile

- **Meaning**: world / boundary / return path のどこで抵抗・吸収・減衰が起きているかを観測する
- **Measurement**: `deriveResistanceProfile(...)`
- **Important**:
  - pass-through / blocked の両極端を観測する
  - resistanceBalance は中庸を命令する値ではなく観測値
  - transmissionRatio は pulse copy の疑いを見る proxy

#### J.4 Combined Medium Profile

- **Meaning**: Delay / Echo / Resistance の observer-side bundle
- **Measurement**: `deriveMediumProfileState(...)`
- **Important**:
  - S4 自体は viability や feedback を直接変更しない
  - later phases では Minimal Natural Feedback の input material になりうる
  - semantic interpretation はしない

**Measured**:
- raw `feedbackDelay`
- raw `echoLevel`
- raw `surfaceResistance`
- raw pulse intensity
- raw return intensity

**Derived**:
- `averageReturnDelay`
- `echoDecayRate`
- `transmissionRatio`
- `returnAttenuation`
- `resistanceBalance`

**Proxy**:
- `unstableDelayScore`
- `delayedEchoScore`
- `echoSaturationRisk`
- `mediumAbsorption`
- `profileConfidence`

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

---

## Phase 5: Observation Layer Metrics (Observer-Side Proxy)

**Phase 5: Observation Layer Purification** adds a set of observer-side proxy metrics derived from existing state. These are NOT behavior drivers. They are read-only research observations.

### Important Constraints

- Observation metrics are **observer-side derived proxies**, not confirmed structural facts.
- They are **read-only**: they do not modify organism core dynamics.
- The vocabulary (knot, path, basin, etc.) is **not semantic**: it does not assign meaning.
- Proto-point candidate ≠ semantic node. No label is attached.
- See `docs/observation-vocabulary.md` for full vocabulary definitions.

### P5.1 Knot Count (proxy)
- **Meaning**: Number of locally recurring activity cluster candidates observed this frame
- **Derived from**: `recurrenceWeight`, `replayReadiness`, `recentPatternWeight`, replay suppression
- **Classification**: Observer-side proxy

### P5.2 Path Count (proxy)
- **Meaning**: Number of propagation channel candidates observed this frame
- **Derived from**: `recentReplaySalience`, `activeReplayCount`, `consolidationGain`, perturbation history
- **Classification**: Observer-side proxy

### P5.3 Recurrence Locus Count (proxy)
- **Meaning**: Number of field regions that re-activate repeatedly across events
- **Derived from**: `recurrenceWeight`, `recentPatternWeight`, perturbation slope, `traceStrength`
- **Classification**: Observer-side proxy

### P5.4 Basin Count (proxy)
- **Meaning**: Number of stability-zone candidates (regions the field returns to)
- **Derived from**: `stabilizationPull`, `restorationBias`, `relaxationLevel`, `collapseRisk`
- **Classification**: Observer-side proxy

### P5.5 Long-Lived Anomaly Count (proxy)
- **Meaning**: Number of persistent deviations above baseline that survive recovery
- **Derived from**: mean activity vs. baseline margin, `salienceResidue`, `mismatchLevel`
- **Classification**: Observer-side proxy

### P5.6 Proto-Point Candidate Count (proxy)
- **Meaning**: Number of field regions that simultaneously meet knot/recurrence + basin/residue + persistence criteria
- **Derived from**: knotCount OR recurrenceLocusCount; AND basinCount OR `recoveryLinkedResidue`/`settlingResidue`; AND `traceStrength` + `recurrenceWeight` thresholds
- **Critical**: This is NOT a semantic node. No label is attached. Not passed to any teacher.
- **Classification**: Observer-side proxy candidate

### P5.7 Observation Confidence (proxy)
- **Meaning**: Rough signal quality estimate for current observation window
- **Derived from**: history length, state availability, finite-value check
- **Range**: 0–1; not a probability
- **Classification**: Observer-side quality proxy

---

## Phase 7: Proto-Point Observation Metrics (Observer-Side Proxy)

**Phase 7: proto-point の観測導入** adds detailed per-candidate observation metrics for
proto-point structural candidates. These are NOT behavior drivers. They are strictly
read-only observer-side proxies derived from existing state.

### Important Constraints

- All proto-point observation metrics are **observer-side derived proxies**.
- They are **strictly read-only**: they do NOT modify organism core dynamics.
- Candidates are NOT semantic nodes, labels, concepts, or object identifiers.
- No Node bridge is implemented. Phase 8+ only.
- All sub-scores labeled [PROXY] or [DERIVED] — not confirmed measurements.
- See `docs/proto-point-observation-principles.md` for full principles.

### P7.1 Proto-Point Candidate Count (proxy)
- **Meaning**: Number of currently observable proto-point candidates above confidence threshold
- **Derived from**: Multi-criteria proxy conditions: recurrenceWeight, traceStrength, replayReadiness, knotCount, basinCount, activityContrast
- **Range**: 0–3 (maximum 3 virtual region slots)
- **Classification**: Observer-side proxy count

### P7.2 Stable Candidate Count (proxy)
- **Meaning**: Number of candidates with persistence ≥ 5 ticks AND confidence ≥ 0.40
- **Derived from**: Per-candidate persistence counter + confidence score
- **Classification**: Observer-side proxy count

### P7.3 Average Confidence (proxy)
- **Meaning**: Mean confidence score across all current candidates
- **Formula**: `0.20*recurrenceScore + 0.20*traceAffinity + 0.20*replayAffinity + 0.15*localContrast + 0.15*knotOverlap + 0.10*basinOverlap`
- **Range**: 0–1; not a probability
- **Classification**: Observer-side derived proxy

### P7.4 Max Confidence (proxy)
- **Meaning**: Highest confidence score among current candidates
- **Range**: 0–1
- **Classification**: Observer-side derived proxy

### P7.5 Candidate Lifecycle (observer-side)
- **Meaning**: Observer-side tracking of candidate age and stability
- **Stages**: `new` (1st tick) → `recurring` (2–7 ticks) → `persistent` (≥8 ticks + confidence >0.40) → `decaying` (conditions no longer met)
- **Critical**: Lifecycle is observer-side only. Does NOT affect organism runtime behavior.
- **Classification**: Observer-side tracking

### P7.6 Sub-Scores (proxy)
Each candidate carries individual sub-scores:
- **recurrenceScore** [PROXY]: How much the region repeatedly re-activates
- **traceAffinity** [PROXY]: Trace/residue overlap
- **replayAffinity** [PROXY]: Replay re-entry accessibility
- **localContrast** [PROXY]: Salience above ambient field
- **knotOverlap** [PROXY]: Overlap with Phase 5 knot candidates
- **basinOverlap** [PROXY]: Overlap with Phase 5 basin candidates
- **anomalyOverlap** [PROXY]: Overlap with long-lived anomaly candidates

---

## Phase 8: AETERNA → Node Bridge Packet Metrics (Observer-Side, Read-Only Export)

**Phase 8: AETERNA → Node bridge 最小版** adds metrics for the observation packet export pipeline.
These metrics describe how well the export and sanitization pipeline is operating.
They are NOT behavior drivers. They are read-only pipeline health indicators.

### Important Constraints

- All Phase 8 metrics are **export pipeline metrics**, not organism behavior metrics.
- The packet is **pre-semantic**: it carries observation data, not meaning or labels.
- The exporter is **read-only**: it does NOT modify organism dynamics.
- The bridge is **AETERNA → Node only** in this phase (no reverse feedback).
- See `docs/aeterna-to-node-bridge-spec.md` for full bridge specification.

### P8.1 Packet Generated Count
- **Meaning**: Number of `AeternaObservationPacket` instances exported in a scenario run
- **Derived from**: Number of metrics snapshots multiplied by export rate
- **Classification**: Measured count

### P8.2 Semantic Leak Count (target: 0)
- **Meaning**: Number of forbidden semantic fields found and stripped per packet
- **Target**: Always 0 in normal operation
- **Forbidden fields**: label, meaning, concept, category, sameObject, objectId, teacherVerdict, language, utterance, semanticNode, objectLabel, teacherBinding, nodeBridge, naturalLanguage, interpretation
- **Classification**: Measured integrity check

### P8.3 Packet Confidence (proxy)
- **Meaning**: Observation stability proxy — how stable the current observation window is
- **This is NOT**: semantic confidence, concept confidence, or a probability estimate
- **Derived from**: ongoingness level, boundaryIntegrity, collapseRisk, trace availability
- **Range**: 0–1; not a probability
- **Classification**: Observer-side derived proxy

### P8.4 Non-Finite Fields Fixed Count (target: 0)
- **Meaning**: Number of NaN / Infinity values replaced in a packet during sanitization
- **Target**: 0 in normal operation (all values should be finite before sanitization)
- **Classification**: Measured data quality check

### P8.5 FieldState Values Finite Fraction
- **Meaning**: Fraction of packets where all fieldState values are finite
- **Target**: 1.0 (all packets should have finite fieldState)
- **Classification**: Derived data quality metric

### P8.6 Long-Cycle Coherence Shift (proxy)
- **Meaning**: Slow drift in phase coherence between consecutive observation windows
- **Derived from**: `phaseCoherence[t] - phaseCoherence[t-1]`
- **Range**: -1 to +1; positive = coherence rising, negative = falling
- **Note**: Only present when consecutive coherence readings are available
- **Classification**: Observer-side proxy

### Scenario Summary Additions (Phase 8)

Scenario packet summaries include:
- `packetGeneratedCount`: Total packets exported
- `semanticLeakTotal`: Total forbidden-field incidents (target: 0)
- `nonFiniteFieldsTotal`: Total NaN/Infinity fixes (target: 0)
- `allPacketsClean`: Boolean — true if no semantic leaks and no non-finite fixes
- `avgConfidence`: Mean packet confidence over the run
- `protoPointPresentFraction`: Fraction of frames with proto-point candidates in packet
- `fieldStateFiniteFraction`: Fraction of packets with all-finite fieldState (target: 1.0)
- `lastFieldState`: Final frame's fieldState values
- `lastPatternCandidates`: Final frame's patternCandidates counts

**Classification**:
- **Measured**: `packetGeneratedCount`, `semanticLeakTotal`, `nonFiniteFieldsTotal`
- **Derived**: `allPacketsClean`, `fieldStateFiniteFraction`
- **Proxy**: `avgConfidence`, `protoPointPresentFraction`, `lastFieldState`, `lastPatternCandidates`


## W-Series: Body-World Closure Metrics（W6 以降）

> **Status**: W0 — 定義の固定のみ。W6（Body-World Closure Metrics）まで実装しない。

AETERNA が世界と閉じた循環を持つ生命場として機能しているかを見るための研究指標。
これらは意識の証明ではない。exact claim をしない。

詳細定義は `docs/body-world-closure-metrics.md` を参照。

### 追加予定の指標（W6）

| 指標名 | 意味 | 分類 |
|---|---|---|
| `loopGain` | 作用が世界を経由して戻る際の増幅・減衰比 | Derived |
| `roundTripDelay` | Actuation Pulse から Sensory Return までの遅延 | Measured |
| `returnStrength` | Sensory Return の強度 | Measured |
| `selfCausedMatch` | 自己起因と判断される戻り入力の割合 | Derived |
| `worldMismatch` | 外界独自変化の差分強度 | Derived |
| `closureStability` | 閉ループの安定度 | Derived |
| `closureDrift` | 閉ループ中心点のゆっくりとした移動 | Proxy |
| `unresolvedReturn` | 帰属不明の Sensory Return の量 | Derived |
| `feedbackSaturationRisk` | フィードバック飽和・暴走リスク | Proxy |

---

## Section W1: Body Surface / Boundary Layer Metrics

W1 で導入した Body Surface は、AETERNA のトーラス生命場が外界と接するための身体境界である。
これは UI ではなく、pre-semantic な境界膜・皮膚に相当する。

### W1 メトリクス定義

#### Measured

| 指標名 | 意味 | 分類 |
|---|---|---|
| `externalContactLoad` | 境界面に現在到来している外乱の負荷 | Measured |

#### Derived

| 指標名 | 意味 | 分類 |
|---|---|---|
| `boundaryIntegrity` | 境界がどれくらい保たれているか | Derived |
| `surfaceSensitivity` | 外界からの perturbation をどれくらい受け取りやすいか | Derived |
| `permeability` | 境界がどれくらい開いているか（外界の影響が入りやすいか） | Derived |
| `contactReadiness` | 外界との接触を受け取れる準備度 | Derived |

#### Proxy

| 指標名 | 意味 | 分類 |
|---|---|---|
| `outputReadiness` | 将来 Actuation Pulse を外へ返せる準備度（W2 用） | Proxy |
| `recoveryShielding` | 回復中に外界からの影響を少し遮る保護傾向 | Proxy |
| `localIrritability` | 局所的な過敏さ（反復外乱後に高まりうる） | Proxy |
| `surfaceTension` | 境界面の張力・硬直度 | Proxy |
| `surfaceFatigue` | 境界面の疲労・摩耗（持続的過負荷で蓄積） | Proxy |
| `protectiveClosure` | 能動的な境界閉鎖傾向 | Proxy |

---

## S2: Dynamic Viability / Flow Conditions

Dynamic Viability は「安定化命令」ではない。
flow / resistance / dissipation / delay / boundary exchange を observer-side で観測し、
AETERNA が世界との閉ループを保ったまま流れ続けられる範囲にあるかを読むための state である。

### Measured

- `pulse intensity`
- `return intensity`
- `echoLevel`
- `feedbackDelay`
- `surfaceResistance`

### Derived

| 指標名 | 意味 | 入力例 |
|---|---|---|
| `flowContinuity` | pulse / return / trace / closure が完全に途切れていないか | `ActuationPulse`, `SensoryReturnPacket[]`, `TraceState`, `BodyWorldClosureState` |
| `energyThroughput` | pulse → world → sensory return に信号が通っている度合い | `pulse.intensity`, `returnStrength`, `lastPulseImpact`, `returnReadiness` |
| `dissipationBalance` | 残響や痕跡が即消えも固定化もしない中庸にあるか | `echoLevel`, `lastPulseImpact`, `traceStrength`, `salienceResidue`, `replayReadiness` |
| `resistanceBalance` | world / boundary が素通しでも完全遮断でもないか | `surfaceResistance`, `permeability`, `boundaryIntegrity`, `returnAttenuation`, `loopGain` |
| `delayCoherence` | return delay が閉ループの観測可能範囲にあるか | `feedbackDelay`, `returnDelay`, `roundTripDelay`, `unresolvedReturn`, `closureDrift` |
| `boundaryExchange` | Body Surface が完全開放でも完全閉鎖でもない交換状態を保てているか | `boundaryIntegrity`, `permeability`, `contactReadiness`, `outputReadiness`, `recoveryShielding` |

### Proxy

| 指標名 | 意味 | 入力例 |
|---|---|---|
| `underCouplingRisk` | 世界との結合が弱すぎる危険 | `loopGain`, `returnStrength`, `lastPulseImpact`, `outputReadiness` |
| `overCouplingRisk` | pulse-return が増幅しすぎる危険 | `loopGain`, `echoLevel`, `returnStrength`, `returnAmplification`, `feedbackSaturationRisk` |
| `saturationRisk` | activity / return / echo / trace が上限に張り付く危険 | `pulse intensity`, `returnStrength`, `echoLevel`, `traceStrength`, `feedbackSaturationRisk` |
| `extinctionRisk` | flow / return / trace が弱まりすぎる危険 | `flowContinuity`, `energyThroughput`, `returnStrength`, `traceContinuity`, `returnReadiness` |
| `viabilityConfidence` | Dynamic Viability metrics 自体の観測信頼度 | state coverage, `comparisonConfidence`, `closureStability`, extreme risk, previous-frame delta |

### Important

- risk metrics は command ではない
- `if unstable then stabilize()` を入れない
- `if too quiet then randomize()` を入れない
- semantic meaning / label / same-object / teacher binding を追加しない

### W1 既存概念との関係

```
boundaryIntegrity:
  境界が保たれている度合い
  ← homeostatic boundaryIntegrity + boundaryRepairPressure

permeability:
  外界がどれくらい入りやすいか
  ← explorationPressure（高→開）、withdrawalPressure/overload（高→閉）

surfaceSensitivity:
  入ってきた外乱にどれくらい反応しやすいか
  ← surprisePressure + mismatchLevel + salienceResidue

recoveryShielding:
  回復中に境界がどれくらい保護寄りになるか
  ← recoveryPressure + selfPreservationDrive + withdrawalPressure

outputReadiness:
  外へ pulse を返す準備度（W2 Actuation Pulse の前準備）
  ← pressureEnergy + boundaryIntegrity - overload
```

### W1 表示について

observer / debug での表示区分:

- 表示グループ: **Body Surface / Boundary Layer**
- 「skin mood」などの人間的表現は使わない
- `derived` / `proxy` と明示して表示する
- 研究用表示に留める

### W1 未実装

以下は W1 では実装していない:

- Actuation Pulse 本実装（W2 で導入予定）
- World Medium 本実装（W3 で導入予定）
- Sensory Return 本実装（W4 で導入予定）
- Reafference Comparison（W5 で導入予定）

## W5. Reafference Comparison Metrics (Implemented)

**Definition**: Metrics derived from comparing AETERNA's Actuation Pulse with Sensory Return from World Medium. These are pre-semantic comparison metrics, not self-awareness or semantic judgments. **Status**: Implemented and integrated into AeternaNetwork runtime and observer UI.

### W5.1 Expected Return (Derived)
- **Meaning**: Predicted strength of sensory return based on Actuation Pulse
- **Measurement**: Derived from pulse intensity, coherence, outputReadiness, locality
- **Formula**: `intensity*0.4 + coherence*0.2 + outputReadiness*0.2 + locality*0.2`
- **Range**: 0–1
- **Classification**: Derived
- **Success Condition**: expectedReturn > 0 when pulse exists
- **Failure Condition**: NaN or out of range
- **Limitation**: Simple linear combination; does not model world dynamics

### W5.2 Actual Return (Measured)
- **Meaning**: Actual strength of sensory return received from World Medium
- **Measurement**: Average of `(intensity * worldOriginStrength)` across SensoryReturnPackets
- **Range**: 0–1
- **Classification**: Measured
- **Success Condition**: actualReturn > 0 when World Medium shows significant change
- **Failure Condition**: NaN or out of range
- **Limitation**: Averaged across channels; does not distinguish channel-specific returns

### W5.3 Return Delay (Measured)
- **Meaning**: Temporal delay between pulse and return
- **Measurement**: Average of `returnDelayHint` from SensoryReturnPackets
- **Range**: 0–1
- **Classification**: Measured
- **Success Condition**: returnDelay < 0.5 for typical feedback
- **Failure Condition**: NaN or out of range
- **Limitation**: Proxy value from World Medium feedbackDelay, not actual measured latency

### W5.4 Return Mismatch (Derived)
- **Meaning**: Difference between expected and actual return
- **Measurement**: `abs(expectedReturn - actualReturn)`
- **Range**: 0–1
- **Classification**: Derived
- **Success Condition**: Low mismatch when pulse-return correspondence is good
- **Failure Condition**: NaN or out of range
- **Limitation**: Absolute difference; does not distinguish attenuation vs amplification

### W5.5 Self-Caused Match (Proxy)
- **Meaning**: Proxy indicator for how much return appears to be caused by AETERNA's pulse
- **Measurement**: Weighted combination of:
  - Channel correspondence (0.35)
  - Match quality (1 - mismatch) (0.3)
  - Reasonable delay (0.2)
  - Medium stability (0.15)
- **Range**: 0–1
- **Classification**: Proxy
- **Success Condition**: High when pulse and return correspond well
- **Failure Condition**: NaN or out of range
- **Limitation**: NOT a semantic "I did this" judgment; purely proxy indicator
- **Important**: This is pre-semantic comparison, not self-awareness

### W5.6 World-Caused Difference (Proxy)
- **Meaning**: Proxy indicator for how much return appears to be caused by independent world dynamics
- **Measurement**: Weighted combination of:
  - No pulse but strong return (0.4)
  - Amplification (actualReturn > expectedReturn) (0.3)
  - Unusual delay (0.15)
  - Medium instability (0.1)
  - Motion drift (0.05)
- **Range**: 0–1
- **Classification**: Proxy
- **Success Condition**: High when return appears independent of pulse
- **Failure Condition**: NaN or out of range
- **Limitation**: NOT a semantic "world did this" judgment; purely proxy indicator
- **Important**: This is pre-semantic comparison, not semantic interpretation

### W5.7 Unresolved Return (Proxy)
- **Meaning**: Ambiguous return that cannot be clearly attributed to self or world
- **Measurement**: High when both selfCausedMatch and worldCausedDifference are low
- **Range**: 0–1
- **Classification**: Proxy
- **Success Condition**: High when attribution is unclear
- **Failure Condition**: NaN or out of range
- **Limitation**: Residual category; does not provide actionable information

### W5.8 Comparison Confidence (Proxy)
- **Meaning**: Reliability of the reafference comparison
- **Measurement**: Weighted combination of:
  - Pulse and return both exist (0.3)
  - Medium stability (0.25)
  - Clear timing (0.2)
  - Good channel match (0.25)
- **Range**: 0–1
- **Classification**: Proxy
- **Success Condition**: High when comparison is unambiguous
- **Failure Condition**: NaN or out of range
- **Limitation**: Confidence is a proxy, not a proof

### W5.9 Pulse-Return Correlation (Derived, Optional)
- **Meaning**: Channel correspondence between pulse and return
- **Measurement**: Score based on channel matching (visual → simulatedLight = 1.0, etc.)
- **Range**: 0–1
- **Classification**: Derived
- **Success Condition**: High when channels correspond
- **Limitation**: Simple rule-based matching

### W5.10 Return Attenuation (Derived, Optional)
- **Meaning**: How much return was dampened compared to expected
- **Measurement**: `max(0, expectedReturn - actualReturn)`
- **Range**: 0–1
- **Classification**: Derived
- **Success Condition**: High when world dampens the return
- **Limitation**: Simple subtraction

### W5.11 Return Amplification (Derived, Optional)
- **Meaning**: How much return was amplified compared to expected
- **Measurement**: `max(0, actualReturn - expectedReturn)`
- **Range**: 0–1
- **Classification**: Derived
- **Success Condition**: High when world amplifies the return
- **Limitation**: Simple subtraction

### W5.12 Delayed Echo Score (Derived, Optional)
- **Meaning**: Proxy for returns with significant delay
- **Measurement**: `returnDelay * actualReturn` when returnDelay > 0.6
- **Range**: 0–1
- **Classification**: Derived
- **Success Condition**: High when delayed returns are strong
- **Limitation**: Simple product

**Important Notes for W5 Metrics**:
- All W5 metrics are **pre-semantic** — they are not self-awareness or semantic judgments
- selfCausedMatch / worldCausedDifference are **proxy indicators**, not meaning assignments
- W5 **is observation-centric** — feedback to organism dynamics is intentionally minimal
- These metrics are **integrated in AeternaNetwork** and displayed in observer UI
- All metrics are available in the dynamics packet returned by updateDynamics()
- No semantic node / object label / teacher binding / LLM teacher involved
- Implemented in `src/closure/deriveReafferenceComparison.ts`
- Tests in `src/tests/behavioral/reafferenceComparison.test.ts` and `src/tests/scenario/reafferenceComparisonScenario.ts`


### W7. Emergent Proto-Neuron Observation

**Definition**: Observer-side derived/proxy metrics for naturally arising pre-semantic excitable loci inside the body-world closed loop.

**Measured**
- local activation count
- propagation count
- repeated co-activation count

**Derived**
- excitability
- localPropagation
- traceRetention
- recurrenceScore
- coActivationScore

**Proxy**
- weakPlasticityScore
- closureCoupling
- confidence
- proto-neuron stability

**Important**
- proto-neuron observation is read-only
- proto-neuron is not a semantic node
- confidence is not meaning confidence
- W7 does not place runtime neuron nodes or bridge to Node-AI-Z

---

## W8 Closed-Loop Scenario Summary Metrics

W8 で導入した `ClosedLoopScenarioSummary` の指標一覧。

これらは閉ループ生命場の成立度を測る研究指標である。意識・主観性・知性の証明ではない。

### Measured（直接計測）

| Metric | 意味 |
|---|---|
| `ticks` | 実行した tick 数 |
| `pulseCount` | 発射された Actuation Pulse の数 |
| `sensoryReturnCount` | 受け取った Sensory Return パケットの数 |
| `reafferenceCount` | Reafference Comparison を計算したフレーム数 |
| `protoNeuronCandidateCount` | 観測された proto-neuron candidate の数（observer-side） |
| `stableProtoNeuronCandidateCount` | 安定した候補の数（stabilizing + persistent lifecycle） |
| `semanticLeakCount` | semantic leak が検出されたフレーム数（必ず 0 であること） |
| `nanOrInfinityCount` | NaN / Infinity が検出されたフレーム数（必ず 0 であること） |
| `worldOnlyReturnCount` | AETERNA の pulse なしで world 由来の return が来た数 |
| `selfMatchedReturnCount` | selfCausedMatch が閾値以上だったフレーム数 |
| `unresolvedReturnCount` | unresolvedReturn が高かったフレーム数 |
| `closureFailureCount` | closureStability が 0.25 未満になったフレーム数 |

### Derived（計算値）

| Metric | 意味 |
|---|---|
| `averageLoopGain` | loopGain の平均（> 1.0 は増幅リスク） |
| `averageClosureStability` | closureStability の平均（高いほど安定した閉ループ） |
| `averageClosureDrift` | closureDrift の平均（高いほど変質傾向） |
| `averageRoundTripDelay` | roundTripDelay の平均 |
| `averageSelfCausedMatch` | selfCausedMatch の平均 |
| `averageWorldCausedDifference` | worldCausedDifference の平均 |
| `averageProtoNeuronConfidence` | proto-neuron candidate の confidence 平均 |
| `averageClosureCoupling` | closure coupling proxy の平均 |

### Proxy（間接指標）

| Metric | 意味 |
|---|---|
| `maxFeedbackSaturationRisk` | feedbackSaturationRisk の最大値（閉ループ暴走リスク） |

### 重要注意

- `semanticLeakCount` は 0 でなければならない（必須条件）
- `nanOrInfinityCount` は 0 でなければならない（必須条件）
- `maxFeedbackSaturationRisk` が高くても「暴走した」ではなく「リスクが観測された」
- `averageProtoNeuronConfidence` は意味の確信度ではない
- proto-neuron candidate は observer-side のまま — runtime neuron node への変換は行わない
- W8 の summary は "生命証明" や "意識あり" と表示してはならない
- 表示ラベルは「Closed-Loop Scenario Summary」とすること

### D.5 Minimal Natural Feedback (S3)

**Definition**: Dynamic Viability を直接 stabilize command に変換せず、World Loop の媒質条件・境界条件・伝達条件を微弱に調整しているかを観測する。

#### Measured
- `appliedTargetCount` — feedback が実際に向いた target 数
- `adjustment raw values` — `echoDecayAdjustment`, `returnGainAdjustment`, `pulseLeakageAdjustment`, `boundaryPermeabilityAdjustment`, `sensoryAttenuationAdjustment`, `traceDecayAdjustment`, optional `worldResistanceAdjustment`, `delayWindowAdjustment`, `mediumAbsorptionAdjustment`
- `feedback enabled flags` — ablation flag の on/off 状態

#### Derived
- `adjustmentStrength` — overall feedback strength
- `adjustmentConfidence` — upstream coverage / viability confidence を反映した confidence

#### Proxy
- `feedbackEffectEstimate` — adjustment が次 tick 条件へどれくらい効いていそうかの proxy
- `overcorrectionRisk` — feedback 自体が強すぎる可能性の proxy
- `feedbackDominanceRisk` — viability metrics より feedback が支配的になっていないかの proxy

**Important**:
- これらは stabilization success の指標ではない
- feedback は現象を直接生成しない
- on/off ablation 比較で差が極端すぎないことも監視対象に含める
