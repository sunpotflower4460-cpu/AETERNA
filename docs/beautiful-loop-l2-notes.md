# Beautiful Loop Minimal L2 - Implementation Notes

**Status**: v0.5 loop integration complete
**Date**: 2026-04-20
**Purpose**: Connect BL-L1 packet stages to main organism loop with minimal observer-side integration

## What Was Added in L2

### 1. Loop Integration

#### Packet Generation in Main Loop
- **Location**: `src/core/AeternaNetwork.js:492-501` (in `updateDynamics`)
- **Integration point**: After all existing stages complete, before return
- **Order**: autoPredictAndError → buildOrganismSnapshot → runInteroceptionStage → runSelfWorldModelStage → store packets → return

#### State Holders for Previous Frame Packets
- **Location**: `src/core/AeternaNetwork.js:259-265` (`initializeBeautifulLoopState`)
- **Fields**:
  - `lastInteroceptionPacket: InteroceptionPacket | null`
  - `lastSelfWorldModelPacket: SelfWorldModelPacket | null`
- **Purpose**: Enable continuity calculation and provide history for future modulation (L3+)

### 2. Enhanced Packet Computation

#### selfContinuity with Frame History
- **Location**: `src/stages/runSelfWorldModelStage.ts:35-65`
- **Enhancement**: Computes continuity by comparing current `selfCoherence` with previous frame
- **Method**: `continuityFromCoherence = 1.0 - abs(current - previous)`
- **Fallback**: Uses L1 behavior (coherenceMemory-based) when no history available
- **Weighting**: 50% frame delta, 30% coherenceMemory, 20% mode stability

#### relationEngagement Minimal Dynamic
- **Location**: `src/stages/runSelfWorldModelStage.ts:73-81`
- **Enhancement**: Now includes `recentTouchActivity` (15% weight)
- **Composition**: 35% energySense, 25% (1-overload), 25% touchExpectation, 15% touchActivity
- **Result**: More responsive to current interaction state

### 3. Observer Display

#### Debug/Observer Panel
- **Location**: `src/ui/updateMetricsUI.js:196-209`
- **Fields displayed** (if UI elements exist):
  - Interoception: energySense, overloadSense, coherenceSense, boundarySense, restorationSense, perturbationPressure
  - Self/World: selfCoherence, selfContinuity, worldPressure, relationEngagement
- **Format**: 3 decimal places
- **Design**: Minimal, non-intrusive (uses optional chaining)

#### updateDynamics Return Value
- **Location**: `src/core/AeternaNetwork.js:610-620`
- **Added fields**: `bl_energySense`, `bl_overloadSense`, `bl_coherenceSense`, `bl_boundarySense`, `bl_restorationSense`, `bl_perturbationPressure`, `bl_selfCoherence`, `bl_selfContinuity`, `bl_worldPressure`, `bl_relationEngagement`
- **Purpose**: Make packets available to UI and scenario runner

### 4. Scenario Runner Enhancements

#### Packet Summary Statistics
- **Location**: `src/experiments/runScenario.ts:515-574`
- **Added summary fields**:
  - `avgEnergySense`: Average energy sense across scenario
  - `avgOverloadSense`: Average overload sense
  - `avgSelfCoherence`: Average self-coherence
  - `avgSelfContinuity`: Average self-continuity
  - `avgWorldPressure`: Average world pressure
  - `avgRelationEngagement`: Average relation engagement
  - `maxPerturbationPressure`: Maximum perturbation pressure observed
  - `minPerturbationPressure`: Minimum perturbation pressure observed
- **Purpose**: Enable scenario-level packet behavior analysis for BL-L3 planning

### 5. Tests

#### Loop Integration Tests
- **File**: `src/tests/beautifulLoopL2.test.ts`
- **Coverage**:
  - Packet initialization state
  - Packet generation on first tick
  - Last packet storage
  - Multi-tick packet updates
  - selfContinuity uses previous frame
  - Continuity differences between quiet/overload scenarios
  - Packet variation across organism states
  - NaN safety across many ticks with touches
  - relationEngagement variation with touch activity
- **All tests pass**: Verified no behavior regression

### 6. Documentation Updates

#### Update Cycle Documentation
- **File**: `docs/update-cycle.md:194-219`
- **Added**: BL-L2 update section noting loop integration details
- **Clarified**: Still observer-side only, no modulation back to dynamics yet

## What Was NOT Done (Intentional)

- **No modulation back to dynamics**: Packets remain observer-only
- **No organism core changes**: Existing prediction/rewrite/homeostasis untouched
- **No packet-driven mode changes**: Mode controller unaffected by packets
- **No packet-driven actions**: Action decision unaffected by packets
- **No UI expansion**: Only added to existing updateMetricsUI, no new panels
- **No felt-state completion**: Minimal packet fields only
- **No relational self expansion**: relationEngagement remains minimal proxy

## Design Decisions

### Why Observer-Side Integration?

1. **Safety first**: No risk of breaking existing organism dynamics
2. **Gradual closure**: Loop closes incrementally, not all at once
3. **Debugging ready**: Packets visible before they affect behavior
4. **Reversible**: Can remove L2 without leaving broken references

### Why Minimal Dynamic Changes?

1. **Proxy values**: selfContinuity and relationEngagement are derived proxies, not theoretical constructs
2. **Incremental complexity**: Add minimal dynamics first, expand in L3+
3. **Testability**: Small changes easier to verify
4. **No premature abstraction**: Build from what works, not what theory predicts

### Integration Point Choice

Packets generated **after** all existing stages ensures:
- Complete organism state available for snapshot
- No interference with existing update order
- Clear separation between existing dynamics and observer packets
- Easy to identify packet-related issues

## Key Implementation Details

### OrganismSnapshot Builder
- **Method**: `buildOrganismSnapshot(organismPacket, predictionPacket, perceptionPacket)`
- **Purpose**: Creates minimal snapshot without exposing full network internals
- **Fields**: 12 fields (timestamp, energy, overload, coherence, boundary, modeState, etc.)
- **Design**: Decouples packet stages from AeternaNetwork implementation details

### Continuity Calculation
```typescript
if (lastPacket) {
  coherenceDelta = abs(selfCoherence - lastPacket.selfCoherence)
  continuityFromCoherence = 1.0 - coherenceDelta
  selfContinuity = continuityFromCoherence * 0.5 +
                   coherenceMemory * 0.3 * (1 - overloadPenalty * 0.6) +
                   (1 - overloadPenalty) * 0.2 * modeStabilityFactor
}
```

### Packet Storage
```javascript
// After packet generation
this.lastInteroceptionPacket = interoceptionPacket;
this.lastSelfWorldModelPacket = selfWorldModelPacket;
```

## Verification

### Build Status
- **TypeScript**: Compiles without errors
- **Linter**: No new warnings
- **Tests**: 197/198 pass (1 pre-existing failure unrelated to BL-L2)

### Test Results
- All BL-L2 integration tests pass
- All existing tests still pass (no regression)
- Scenario tests include packet summary statistics
- No NaN detected in packet fields across 100+ frame runs with touches

## Future Work (BL-L3)

### Thin Modulation Layer
- Use `selfContinuity` to weakly influence mode transitions
- Use `worldPressure` to slightly modulate rewrite pressure
- Use `relationEngagement` to affect action openness
- Use `perturbationPressure` to inform homeostatic response

### Constraints for L3
- Modulation must remain **thin** (small coefficients, gentle nudges)
- Existing dynamics remain primary drivers
- Packet influence should be **observable but not dominant**
- Must be possible to disable packet modulation without breaking system

## Notes

- This is an **integration** phase, not a theory phase
- Packets are **derived proxies**, not direct theoretical implementations
- All changes are **additive** - no existing functionality removed
- Loop is now "薄く閉じ始めている" (beginning to close thinly)
- Organism core causality still flows the same way as before L2

## Files Changed

### Modified
- `src/core/AeternaNetwork.js`: Added BL state init, buildOrganismSnapshot, packet generation in updateDynamics, return fields
- `src/stages/runSelfWorldModelStage.ts`: Added lastPacket parameter, continuity with history, dynamic relationEngagement
- `src/experiments/runScenario.ts`: Added packet summary statistics, updated lastPacket parameter
- `src/ui/updateMetricsUI.js`: Added BL packet display fields
- `docs/update-cycle.md`: Added BL-L2 update section

### Added
- `src/tests/beautifulLoopL2.test.ts`: Loop integration tests
- `docs/beautiful-loop-l2-notes.md`: This file

## References

- **BL-L1 notes**: `docs/beautiful-loop-l1-notes.md`
- **Update cycle**: `docs/update-cycle.md`
- **Packet types**: `src/types/interoception.ts`, `src/types/selfWorldModel.ts`
- **Stage functions**: `src/stages/runInteroceptionStage.ts`, `src/stages/runSelfWorldModelStage.ts`
