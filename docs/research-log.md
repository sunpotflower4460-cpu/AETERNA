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
