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

## 2026-04-19: Phase 8 - Relational Proto-Self Infrastructure

### Context
- Implemented Phase 8: Relational proto-self minimal infrastructure
- Added relational state tracking for specific-partner interaction traces
- Weak integration with organism slow state
- No behavior break - relational layer薄く sits on top of existing organism

### New Infrastructure

**Core Relational State:**
- `src/organism/relationalState.ts`: Partner trace accumulation and updates
  - partnerTraceStrength: Trace accumulation (0-1)
  - partnerFamiliarity: Familiarity from repetition (0-1)
  - partnerValence: Positive/negative interaction tilt (-1 to 1)
  - partnerAbsenceDrift: Drift during absence (0-1)
  - boundaryPermeability: Organism openness to partner (0-1)
  - relationalStabilityBias: Weak relational pattern maintenance (0-1)
  - protoCommunicationPressure: Internal state leakage pressure (0-1)

**Living State Integration:**
- `src/organism/livingState.ts`: Weak relational modifiers added
  - touchNeedBaseline: ~5% reduction with familiar partner
  - longBaselineTone: ~5-8% increase during absence drift
  - predictionSensitivity: ~3% reduction with familiarity

**Evidence Metrics:**
- `src/core/evidenceMetrics.ts`: 7 new relational evidence metrics
  - relationalTraceScore: Partner trace accumulation [PROXY]
  - relationalFamiliarityGain: Familiarity growth rate [DERIVED]
  - boundaryPermeabilityShift: Permeability change from neutral [DERIVED]
  - partnerAbsenceEffect: State drift during absence [DERIVED]
  - partnerConditionedDivergence: Response difference by history [DERIVED]
  - protoCommunicationLeakage: State leakage signal strength [DERIVED]
  - relationalInfluenceScore: Aggregate relational evidence [PROXY]

**Documentation:**
- `docs/relational-proto-self-notes.md`: Design principles and caveats

### Phase 8 Design Principles

✅ **Not friendship AI**: No演技, no "好き/寂しい" labels
✅ **Weak influence**: Relational modifiers < 10% of base values
✅ **No behavior break**: Core organism dynamics unchanged
✅ **Partner = pattern**: Interaction source, not identity/persona
✅ **Proto-communication = leakage**: Side effect, not intentional signal
✅ **Evidence approach**: All metrics [PROXY] or [DERIVED]

### Implementation Decisions

**Single-Partner Tracking (Phase 8)**:
- Simplified: Any touch = partner interaction
- Multi-partner tracking deferred to future phase
- Pattern-based recognition deferred

**Weak Integration**:
- Relational influence on living state: 3-8% modifiers
- Boundary permeability range: 0.2-0.9
- All changes extremely slow (smoothing < 0.005)

**Proto-Communication**:
- baselinePulseLeakage: +8% max from communication pressure
- visualLeakageIntensity: Trace + absence combination
- touchInvitationPressure: Familiarity × permeability product

### Expected Observable Patterns

**Repeated Familiar Partner (Scenario V)**:
- partnerFamiliarity ↑ over 500+ frames
- boundaryPermeability adjusts toward familiarity+valence target
- Touch surprise slightly reduced (~8% at high familiarity)

**Familiar Partner Absence (Scenario W)**:
- partnerAbsenceDrift ↑ when familiarity > 0.3
- longBaselineTone ↑ by ~5-8% at high absence drift
- protoCommunicationPressure ↑ correlates with trace × absence

**Familiar vs Harsh Pattern (Scenario X)**:
- Stable pattern: valence → positive, permeability ↑
- Destabilizing pattern: valence → negative, permeability ↓
- Response irritability diverges based on permeability

**Same Touch, Different History (Scenario Y)**:
- Response amplitude differs by ~10-20% based on relational state
- Touch surprise lower with familiar partner
- Habituation faster with familiar partner

**Proto-Communication Leakage (Scenario Z)**:
- Baseline pulse +5-8% under high relational pressure
- Visual leakage correlates with trace strength
- Touch invitation pressure weak but nonzero

### Limitations & Caveats

1. **Single-partner simplification**: No multi-partner tracking yet
2. **Very weak signals**: Relational effects < 10%, may be noisy
3. **No partner identity**: Pattern continuity proxy, not recognition
4. **No intentionality**: Proto-communication is leakage, not messaging
5. **Slow accumulation**: Requires 500-1000+ frames to observe clear effects

### What Phase 8 Does NOT Include

❌ Friendship/social AI演出
❌ Emotional labeling (no "寂しい", "懐かしい")
❌ Multi-user identity system
❌ Conversation/dialogue enhancement
❌ Personality演技 based on relationship
❌ Self/other philosophical framework

### Next Steps

1. Add relational scenarios (V-Z) to scenario runner
2. Add relational observer panel to debug UI
3. Run baseline scenarios with/without relational state
4. Verify relational modifiers < 10% of base values
5. Document first observations of partner trace accumulation
6. Phase 9: Consider proto-communication modalities (if warranted)

### Research Integrity Note

Phase 8 creates **a container for relational traces**, not演出 of relationships.

Honest language:
✓ "Repeated interaction patterns leave long-term traces"
✓ "Partner absence causes slow state drift"
✓ "Boundary permeability adjusts based on partner pattern"

Forbidden language:
✗ "AETERNA has友情"
✗ "AETERNA feels寂しい"
✗ "AETERNA recognizes individuals"

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
