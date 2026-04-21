# A3 Offline Replay / Rest Consolidation - Implementation Notes

## AETERNA v0.5 / A3

### Overview

This phase introduces minimal offline replay and rest consolidation mechanisms. Replay is NOT event reconstruction or dream演出, but weak trace/pattern reactivation during quiet/rest conditions.

### Core Principles

1. **Replay is trace reactivation, not event playback**
   - No episodic memory reconstruction
   - No narrative replay
   - Weak reactivation of salient patterns/pressures/traces

2. **Replay happens during quiet/rest**
   - Low external input
   - Low to moderate arousal
   - Moderate awareness window or settling window
   - High restoration readiness

3. **Replay is suppressed during high input**
   - High arousal suppresses replay
   - Active touch input suppresses replay
   - High perturbation load suppresses replay

4. **Consolidation is weak and gradual**
   - Consolidation gain is always capped at 0.3
   - Effects are cumulative over many replay cycles
   - Consolidation affects slow state variables only

### Architecture

#### New Types

**`ReplayState` (src/types/replayState.ts)**
- `replayPressure`: Pressure to initiate replay (builds during quiet)
- `replayReadiness`: Availability for replay to occur
- `consolidationGain`: How much replay affects slow state (always weak)
- `activeReplayCount`: Count of active replay traces
- `recentReplaySalience`: Weight of recent replay
- `restConsolidationDepth`: Rest-based consolidation depth
- `replaySuppression`: Suppression pressure from high input
- `lastReplayCategory`: Category of last replay event

#### New Modules

**`ReplayQueue` (src/organism/replayQueue.ts)**
- Manages replay candidates with salience-based prioritization
- Maximum capacity of 50 candidates
- Automatic decay (rate: 0.998 per frame)
- Automatic pruning of low-weight candidates (< 0.01)
- Candidates are never removed immediately, only after replay or decay

**`deriveReplayState` (src/organism/deriveReplayState.ts)**
- Pure function deriving replay state from organism state
- Calculates replay pressure, readiness, suppression, consolidation gain
- Uses felt state, arousal/awareness, and queue state

### Replay Candidate Selection

Candidates are added when salience exceeds 0.3 for:

1. **Touch surprise** (touchTotalSurprise > 0.5)
2. **General surprise** (meanPredictionError > 0.6)
3. **Restoration** (restorationBias > 0.6 AND overload < 0.3)
4. **Repetition** (touchRepeatCount > 5 AND meanTouchHabituation > 0.4)
5. **Absence** (touch absenceError > 0.4)

### Replay Firing Conditions

Replay occurs when ALL of:
- `replayReadiness > 0.5`
- `replaySuppression < 0.3`
- `replayPressure > 0.4`

When triggered, up to 2 candidates are replayed per frame.

### Consolidation Effects

Consolidation is intentionally minimal:

1. **Touch/Repetition candidates**:
   - Slightly stabilize `touchExpectationConfidence` (×1.005 max)

2. **Restoration candidates**:
   - Slightly strengthen `restorationBias` (+0.0002 max)

3. **All candidates**:
   - Very weak influence on `longBaselineTone` (±0.00005 max)

Consolidation strength = `consolidationGain × candidate.weight × 0.01`

### Integration Points

**Scenario Runner** (src/experiments/runScenario.ts):
- Replay queue initialized with each scenario
- Candidate detection runs every frame
- Replay state derived alongside felt state / arousal-awareness
- Replay processing occurs before metrics collection
- Metrics include replay pressure, readiness, consolidation gain, queue size

**Metrics**:
- `replayPressure`, `replayReadiness`, `consolidationGain`
- `activeReplayCount`, `recentReplaySalience`
- `restConsolidationDepth`, `replaySuppression`
- `replayQueueSize`

**Summary**:
- `totalReplayCount`: Total replays across scenario
- `avgReplayPressure`, `avgReplayReadiness`, `avgConsolidationGain`
- `maxActiveReplayCount`, `avgRecentReplaySalience`
- `avgQueueFillRatio`: Average queue occupancy

### What This Is NOT

- **NOT** episodic memory
- **NOT** autobiographical memory
- **NOT** dream演出 or narrative
- **NOT** predictive hierarchy本格実装
- **NOT** mode system redesign
- **NOT** event reconstruction

### What's Left for Future Phases

- More sophisticated replay scheduling
- Replay interaction with mode states
- Dream-like processing (separate from replay)
- Long-term memory consolidation
- Hierarchical predictive replay
- Self-model consolidation

### Testing

Tests cover:
- ReplayQueue operations (add, decay, prune, prioritize)
- deriveReplayState calculations
- Boundary conditions and NaN prevention
- Integration under extreme conditions

All tests pass with 17 passing test cases.

### Metrics Protocol

Replay metrics are classified as:
- **Derived**: `replayPressure`, `replayReadiness`, `replaySuppression`, `consolidationGain`, `restConsolidationDepth`
- **Proxy**: `activeReplayCount`, `recentReplaySalience`
- **Evidence**: `replayQueueSize`, `totalReplayCount`

None are "exact" or "proof" - they are indicators of replay/consolidation dynamics.
