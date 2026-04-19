# AETERNA Research Log

This log records experimental results, observations, and notes from scenario runs.

## Purpose

Research log for tracking:
- Scenario execution results
- Config variations and their effects
- Unexpected behaviors
- Comparative observations
- Ideas for future experiments

## Format

Each entry should include:
- Date
- Scenario name
- Config summary
- Key metrics
- Observations
- Follow-up questions

---

## 2026-04-18: Initial Research Backbone Setup

### Context
- Created Phase 1 research backbone infrastructure
- Added `docs/update-cycle.md` documenting 1-tick organism update order
- Added `docs/metrics-protocol.md` defining life-like observables
- Added `src/experiments/runScenario.ts` for headless scenario execution
- Added `src/tests/scenario.test.ts` with 5 baseline scenarios (A-E)
- Added `src/experiments/ablationFlags.ts` for mechanism toggling (infrastructure only)

### Scenarios Defined

**Scenario A: No Stimulus**
- Purpose: Verify ongoing activity without external input
- Expected: Mean activity > 0.1, variance > 0.01, no NaN, collapse < 10%

**Scenario B: Single Touch**
- Purpose: Measure perturbation response and recovery
- Expected: Response amplitude > 0.2, recovery within 50-200 frames

**Scenario C: Repeated Touch**
- Purpose: Detect history-dependent adaptation (future: habituation/sensitization)
- Note: Current AETERNA may not show strong adaptation yet

**Scenario D: Hold-Release**
- Purpose: Observe offset response and residue/persistence
- Expected: Offset increase after release, residue > 0

**Scenario E: Quiet Long-Run**
- Purpose: Verify long-term stability and spontaneous mode transitions
- Expected: Activity > 0.1 over 2000 frames, mode transitions possible but not required

### Ablation Flags

Infrastructure created for:
- baselineEnabled
- predictionEnabled
- touchPredictionEnabled
- rewriteEnabled
- modeEnabled
- actionLoopEnabled
- dreamReplayEnabled
- hierarchyEnabled
- energyFlowEnabled

**Note**: Flags are defined but not yet wired into core mechanisms. Future work will integrate flags to actually disable mechanisms for comparison.

### Next Steps
1. Run scenario tests to establish baseline metrics
2. Fix any issues that emerge from first test runs
3. Integrate ablation flags into core mechanisms (optional, as needed)
4. Run comparative experiments (baseline vs no-prediction vs no-plasticity)
5. Document findings in this log

---

## 2026-04-19: Phase 7 - Self-Origin Evidence & Behavioral Identity

### Context
- Implemented Phase 7: Self-Origin Evidence infrastructure
- Added evidence observation layer on top of existing organism core
- No changes to core dynamics (no behavior break)
- Focus: evidence collection, not assertion

### New Infrastructure

**Documentation:**
- `docs/self-origin-evidence.md`: Defines 5 evidence categories
- `docs/self-origin-hypotheses.md`: Current observables and honest caveats

**Metrics:**
- `src/core/evidenceMetrics.ts`: 6 new metrics (all [PROXY] or [DERIVED])
  - identityConsistencyScore
  - selfPreservationEvidenceScore
  - endogenousDriftScore
  - historyDependentDivergence
  - nonInstrumentalActionRate
  - selfOriginCandidateScore

**Event Logging:**
- `src/organism/selfOriginEvents.ts`: Event log for self-origin candidates
  - Spontaneous orient/settle
  - Self-protective dampening
  - Restoration-seeking drift
  - Low-energy conserving shift
  - Overload recovery shift

**Scenarios:**
- Scenario Q: No-input continuation (endogenous drift observation)
- Scenario R: Repeated stimulus after different history (history-dependent divergence)
- Scenario S: Overload to recovery (self-preservation evidence)
- Scenario T: Non-instrumental micro-action (spontaneous action rate)
- Scenario U: Identity continuity run (slow variable persistence)

### Evidence Categories

1. **Identity Persistence**: Slow variables maintain characteristic values over time
2. **Self-Preservation**: Recovery/restoration tendency under stress
3. **Non-Instrumental Action**: Actions without immediate external trigger
4. **Endogenous Drift**: State changes during no-input periods
5. **History-Dependent Individuality**: Response divergence based on prior history

### Key Design Principles

✅ **Evidence, not proof**: All metrics labeled [PROXY] or [DERIVED]
✅ **No演出**: No presentation layer, no "self" declaration
✅ **No behavior break**: Event logging sits on top of existing dynamics
✅ **Alternative explanations**: Documented for every evidence pattern
✅ **Honest caveats**: Small effect sizes, threshold arbitrariness acknowledged

### Observations (Preliminary)

**Not yet run - pending test execution**

Expected patterns:
- Slow variable drift above noise floor in long quiet runs
- Response divergence after different histories
- Sparse spontaneous actions (current tuning: <1 per 1000 quiet frames)
- Self-preservation bias correlation with vulnerability
- Identity consistency across time segments

### Limitations & Caveats

1. **Threshold arbitrariness**: "Quiet" = 100 frames is operational, not natural
2. **Small effect sizes**: Self-origin signals weak relative to noise
3. **Alternative explanations**: Noise, parameter inertia, hysteresis all plausible
4. **Tuning dependence**: Current tuning not optimized for evidence observability
5. **No cross-session**: Identity persistence not tested across restarts

### Next Steps

1. Run scenario tests Q-U to establish baselines
2. Implement ablation comparisons (with/without homeostasis, living state)
3. Analyze noise floor vs endogenous drift structure
4. Tune endogenous action drives if spontaneous rate too low
5. Phase 8: Integrate relational self-origin (signal boundary negotiation)

### What Phase 7 Does NOT Include

❌ Relational self (deferred to Phase 8)
❌ Signal-runtime as self-origin (stays presentation layer)
❌ Full motor agency (minimal action candidates only)
❌ Adaptive self-preservation (no learning yet)
❌ Cross-session identity persistence

---

## Template for Future Entries

### YYYY-MM-DD: [Experiment Title]

**Config:**
- Scenario: [name]
- Frames: [N]
- Touch script: [description]
- Ablation: [flags modified]

**Results:**
- Mean activity: [value]
- Response amplitude: [value]
- Collapse frames: [N]
- Mode transitions: [N]

**Observations:**
- [Key finding 1]
- [Key finding 2]

**Follow-up:**
- [Question or next experiment]

---
