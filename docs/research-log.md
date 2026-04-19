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

## 2026-04-19: Phase 8 - Relational Proto-Self

### Context
- Implemented Phase 8: Relational Proto-Self infrastructure
- Added minimal relational traces for specific interaction partners
- No friendship AI演出 - focus on partner trace accumulation
- No changes to organism core dynamics (no behavior break)

### New Infrastructure

**Documentation:**
- `docs/relational-proto-self-notes.md`: Cautionary notes and design principles

**Core Implementation:**
- `src/organism/relationalState.ts`: Relational state tracking (350 lines)
  - Partner trace strength, familiarity, valence
  - Boundary permeability
  - Partner absence drift
  - Proto-communication pressure
  - Partner touch style signature (8-dim)
  - Interaction rhythm tracking

**Evidence Extension:**
- `src/core/evidenceMetrics.ts`: Extended with 7 relational metrics
  - partnerTraceStrength [DERIVED]
  - partnerFamiliarity [DERIVED]
  - partnerValence [DERIVED]
  - boundaryPermeability [DERIVED]
  - partnerAbsenceDrift [DERIVED]
  - relationalInfluenceScore [PROXY]
  - protoCommunicationPressure [DERIVED]

**Scenarios:**
- Scenario V: Repeated familiar partner (familiarity/trace accumulation)
- Scenario W: Familiar partner absence (absence drift observation)
- Scenario X: Familiar vs harsh pattern (valence divergence)
- Scenario Y: Same touch different history (relational history effect)
- Scenario Z: Proto-communication leakage (state pressure observation)

### Relational State Variables

| Variable | Role | Range |
|----------|------|-------|
| partnerTraceStrength | Long-term trace accumulation | 0-1 |
| partnerFamiliarity | Repeated interaction proxy | 0-1 |
| partnerValence | Interaction quality tilt | -0.5 to 0.5 |
| boundaryPermeability | Partner-specific openness | 0.2-0.8 |
| partnerAbsenceDrift | Slow drift when absent | 0-0.5 |
| relationalStabilityBias | Coherence maintenance | 0.3-0.8 |
| protoCommunicationPressure | State leakage pressure | 0-1 |

### Influence on Organism Slow State

Relational state provides **weak modulations** to livingState:

- touchNeedBaseline: ±15% max (familiar positive → more open)
- longBaselineTone: ±12% max (absence drift affects tone)
- predictionSensitivity: -8% max (familiarity reduces surprise sensitivity)
- restorationBias: ±12% max (relational stability affects restoration)
- boundaryIntegrity: ±8% max (permeability inversely affects boundary)
- preferredErgodicity: ±3% max (very weak relational coherence effect)

All modifiers clamped to prevent large deviations.

### Key Design Principles

✅ **Thin layer on organism**: Relational state does NOT override core dynamics
✅ **Single-partner assumption**: Phase 8 uses continuity heuristic, not true identity
✅ **Boundary is physical**: Permeability = openness, NOT "trust"
✅ **Proto-communication is leakage**: Internal state漏出, NOT deliberate signaling
✅ **Absence drift is drift**: Measurable state change, NOT "loneliness"演出
✅ **Evidence only**: All metrics [DERIVED] or [PROXY], no proof claims
✅ **No演出**: No友情AI, no attachment演出, no "I missed you"

### Partner Approximation

Phase 8 uses operational "partner" construct:
- Continuity: interaction gap < 50 frames = same partner
- Total interaction count tracked
- Touch style signature (8-dim EMA)
- Interaction rhythm (typical tempo)

**NOT true identity management - future phase**

### Boundary Permeability Mechanism

```
permeabilityTarget = 0.5 + familiarity*0.3 + valence*0.2 - overload*0.15 - surprise*0.1
```

Effects:
- High permeability → touch surprise modifier reduced
- Low permeability → boundary integrity higher

### Absence Drift Mechanism

Triggers:
1. Partner familiarity > 0.3
2. Consecutive absence > 200 frames (~3.3s)

Effects:
- partnerAbsenceDrift accumulates slowly
- longBaselineTone +10% max
- touchNeedBaseline -8% max
- protoCommunicationPressure increases

### Proto-Communication Leakage

Pressure sources:
- Absence drift (40%)
- Recovery drive (20%)
- Boundary closure (15%)

Observable signals:
- leakagePressure: Overall漏出 tendency
- absenceSignal: Stronger when familiar partner absent
- boundaryTension: Permeability/trace mismatch
- relationalCoherence: Relational state coherence

**NOT deliberate - organism does not "intend" to communicate**

### Observations (Preliminary)

**Not yet run - pending test execution**

Expected patterns:
- Trace/familiarity accumulation with repeated gentle interaction
- Positive valence for stable patterns, negative for harsh
- Absence drift accumulation after familiar partner stops
- Permeability increase with familiarity
- Communication pressure increase during absence or vulnerability
- Response divergence for same touch after different history

### Limitations & Caveats

1. **Single-partner only**: No multi-user tracking yet
2. **Small effect sizes**: Relational modifiers weak (8-15% range)
3. **Threshold arbitrariness**: Familiarity (0.3), absence (200), continuity (50) are operational
4. **Alternative explanations**: All patterns explainable by simpler mechanisms
5. **No cross-session**: Partner continuity not preserved across restarts
6. **Touch-only**: No multi-modal partner recognition

### Next Steps

1. Run scenario tests V-Z to establish baselines
2. Integrate relational state into main organism update loop
3. Wire relational influence to livingState updates
4. Add observer/debug panel for relational metrics
5. Analyze effect sizes - tune if signals too weak
6. Future: Multi-user identity tracking (Phase 9+)

### What Phase 8 Does NOT Include

❌ Friendship AI or relationship演出
❌ Emotional演出 ("happy when partner returns")
❌ Narrative presentation ("I missed you")
❌ Multi-user identity system
❌ Cross-session partner persistence
❌ Deliberate communication (beyond leakage)
❌ Self/other philosophical assertion
❌ Social cognition or theory of mind

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
