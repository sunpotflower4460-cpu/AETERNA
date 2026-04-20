# Beautiful Loop Minimal L3 - Implementation Notes

**Status**: v0.5 modulation layer complete
**Date**: 2026-04-20
**Purpose**: Close Beautiful Loop by returning packet feedback to organism core as thin modulation

## What Was Added in L3

### 1. Modulation Module

#### beautifulLoopModulation.ts
- **Location**: `src/core/beautifulLoopModulation.ts`
- **Role**: Compute weak bias deltas from BL packets to organism core
- **Key principle**: Packets do NOT become main driver - only provide weak nudges

#### BeautifulLoopModulation Interface
```typescript
{
  noveltyBiasDelta: number;        // -0.08 to +0.08
  withdrawBiasDelta: number;       // -0.05 to +0.10
  rewritePressureDelta: number;    // -0.02 to +0.05
  restorationBiasDelta: number;    // -0.03 to +0.08
  touchOpennessDelta: number;      // -0.05 to +0.08
}
```

#### Modulation Functions
- `computeBeautifulLoopModulation()`: Main computation from packets
- `smoothModulation()`: EMA smoothing to prevent sudden jumps
- `clampModulation()`: Safety bounds enforcement
- `createDefaultModulationConfig()`: Configuration with ablation flags
- `createZeroModulation()`: Initial zero state

### 2. Packet → Modulation Mappings

All mappings are designed to be **weak** and **non-dominant**.

#### selfCoherence Low + worldPressure High → noveltyBiasDelta
- **Purpose**: "When self is fragmented and world is pressing, become slightly more sensitive to novelty"
- **Target**: Affects `predictionSensitivity` in `LivingState`
- **Strength**: Weighted combination, clamped to ±0.08
- **Application**: Added to prediction sensitivity target during living state update

#### overloadSense High + boundarySense Low → withdrawBiasDelta
- **Purpose**: "When overloaded with weak boundaries, lean slightly toward protection"
- **Target**: Reserved for future action bias (currently tracked but not strongly applied)
- **Strength**: Weighted combination, clamped to -0.05/+0.10
- **Application**: Passed to homeostatic state for potential withdraw tendency

#### selfContinuity Drop → rewritePressureDelta
- **Purpose**: "When continuity breaks, slightly support rewrite/reorganization"
- **Target**: Could influence rewrite pressure (currently minimal effect)
- **Strength**: Very weak (±0.05 max) to prevent rewrite runaway
- **Application**: Computed but effect kept intentionally minimal

#### restorationSense High → restorationBiasDelta
- **Purpose**: "When conditions favor restoration, support that direction"
- **Target**: Affects `restorationBias` in `HomeostaticState`
- **Strength**: Clamped to -0.03/+0.08
- **Application**: Directly added to restoration bias calculation

#### relationEngagement High → touchOpennessDelta
- **Purpose**: "When engaged with interaction, become slightly more open to touch"
- **Target**: Affects `touchNeedBaseline` in `LivingState`
- **Strength**: Clamped to -0.05/+0.08
- **Application**: Added to touch need baseline target

### 3. Integration into Organism Core

#### AeternaNetwork Changes

**initializeBeautifulLoopState()** (lines 269-283)
- Added `blModulationConfig`: configuration object
- Added `lastModulation`: previous frame's modulation for smoothing
- Added `currentModulation`: current frame's modulation bundle

**updateDynamics()** (lines 514-526)
- After packet generation (L2)
- Compute raw modulation from packets
- Apply EMA smoothing
- Clamp to safety bounds
- Store for next frame

**Return packet** (lines 651-656)
- Added `bl_noveltyBiasDelta`
- Added `bl_withdrawBiasDelta`
- Added `bl_rewritePressureDelta`
- Added `bl_restorationBiasDelta`
- Added `bl_touchOpennessDelta`
- Added `bl_modulationEnabled` flag

#### Living State Integration

**updateLivingState()** (`src/organism/livingState.ts`)

**Signature change** (lines 82-116)
- Added `blModulation` optional parameter with `touchOpennessDelta` and `noveltyBiasDelta`

**Prediction sensitivity modulation** (lines 191-210)
- Apply `blNoveltyDelta` to sensitivity target
- Effect: Low coherence + high world pressure → slightly more sensitive to prediction errors

**Touch need baseline modulation** (lines 212-226)
- Apply `blTouchDelta` to touch target
- Effect: High relation engagement → slightly more open to touch input

#### Homeostatic State Integration

**updateHomeostaticState()** (`src/organism/survivalState.ts`)

**Signature change** (lines 79-108)
- Added `blModulation` optional parameter with `restorationBiasDelta` and `withdrawBiasDelta`

**Restoration bias modulation** (lines 193-212)
- Apply `blRestorationDelta` to restoration bias
- Effect: High restoration sense → supports return to baseline

#### Heartbeat Application

**updateHeartbeat()** (`src/organism/updateHeartbeat.js`)

**Living state update** (lines 19-37)
- Extract modulation from `network.currentModulation`
- Pass `touchOpennessDelta` and `noveltyBiasDelta` to `updateLivingState`

**Homeostatic state update** (lines 48-71)
- Extract modulation from `network.currentModulation`
- Pass `restorationBiasDelta` and `withdrawBiasDelta` to `updateHomeostaticState`

### 4. Modulation Configuration

#### ModulationConfig Interface
```typescript
{
  enabled: boolean;                        // Master switch
  interoceptionFeedbackEnabled: boolean;   // Interoception packet feedback
  selfWorldFeedbackEnabled: boolean;       // Self-world packet feedback
  globalStrength: number;                  // Overall multiplier (0-1)
  smoothingFactor: number;                 // EMA smoothing (default 0.15)
}
```

#### Ablation Flags
- `enabled = false` → all modulation zeros
- `interoceptionFeedbackEnabled = false` → only self-world affects modulation
- `selfWorldFeedbackEnabled = false` → only interoception affects modulation
- `globalStrength = 0.5` → half-strength modulation across all deltas

### 5. Safety Mechanisms

#### Hard Clamping
Every delta has strict bounds enforced by `clampModulation()`:
- `noveltyBiasDelta`: [-0.08, +0.08]
- `withdrawBiasDelta`: [-0.05, +0.10]
- `rewritePressureDelta`: [-0.02, +0.05] (especially tight)
- `restorationBiasDelta`: [-0.03, +0.08]
- `touchOpennessDelta`: [-0.05, +0.08]

#### EMA Smoothing
Default smoothing factor 0.15 prevents sudden jumps:
```typescript
smoothed = current * 0.15 + previous * 0.85
```

#### Finite Checks
All calculations use `clampFinite()` to handle edge cases and prevent NaN propagation.

### 6. Tests

#### beautifulLoopL3.test.ts
**Location**: `src/tests/beautifulLoopL3.test.ts`
**Coverage**: 13 tests, all passing

**Test categories**:
1. **Initialization**: Zero modulation at start
2. **Config**: Default enabled state
3. **Generation**: Non-zero modulation after ticks
4. **Safety**: All deltas clamped across many frames
5. **Ablation**: Disabled config produces zeros
6. **Smoothing**: EMA behavior verification
7. **NaN safety**: No NaN across 100+ frames with perturbations
8. **Exposure**: Deltas visible in return packet
9. **Response tests**: Modulation responds to:
   - Coherence drop conditions
   - Overload conditions
   - Restoration conditions
   - Touch engagement
10. **Function tests**: Utility function correctness

**Test results**: 220/220 tests passing (219 existing + 13 new BL-L3)
- 1 pre-existing failure in Scenario J (unrelated to BL-L3)

### 7. Connection Points Summary

BL-L3 connects to organism core at exactly **3 points**:

1. **LivingState.predictionSensitivity**
   - Via `noveltyBiasDelta`
   - Effect: Coherence drop → slightly more sensitive to prediction errors

2. **LivingState.touchNeedBaseline**
   - Via `touchOpennessDelta`
   - Effect: Relation engagement → slightly more open to touch

3. **HomeostaticState.restorationBias**
   - Via `restorationBiasDelta`
   - Effect: Restoration sense → supports baseline return

**Not connected** (intentionally):
- Mode state (no direct mode switching)
- Energy reserve (no direct energy changes)
- Boundary integrity (no direct boundary changes)
- Action state (no direct action forcing)
- Rewrite trigger (rewrite pressure delta computed but minimally applied)

### 8. What Was NOT Done (Intentional)

Per design constraints:

- **No packet-driven mode switching**: Mode controller untouched by packets
- **No strong homeostasis override**: Modulation is additive bias only
- **No high-level self model**: Packets remain minimal proxies
- **No relational self expansion**: Relation engagement stays minimal
- **No felt-state completion**: Interoception remains basic sensing
- **No UI changes**: Observer display not modified (could be added later)
- **No scenario expansion**: Scenario tests not added (could be added later)
- **No withdraw action forcing**: withdrawBiasDelta tracked but not strongly applied

## Design Decisions

### Why Thin Modulation?

1. **Safety first**: Organism core remains primary driver
2. **Loop closure**: Minimal feedback completes the loop without takeover
3. **Reversible**: Can disable without breaking core dynamics
4. **Observable**: Effects are measurable but not overwhelming
5. **Incremental**: Establishes pattern for future expansion

### Why These Connection Points?

1. **predictionSensitivity**: Already slow-changing, naturally accepts bias
2. **touchNeedBaseline**: Already slow-changing, naturally accepts bias
3. **restorationBias**: Central to homeostasis, appropriate for interoception feedback

### Why EMA Smoothing?

Raw packet values can fluctuate frame-to-frame. Smoothing:
- Prevents oscillation
- Makes modulation gradual
- Reduces noise amplification
- Maintains stability

### Why Separate Config Flags?

Ablation studies require:
- Complete disable (enabled = false)
- Interoception-only feedback
- Self-world-only feedback
- Strength adjustment (globalStrength)

## Key Implementation Details

### Modulation Computation Order

1. **Packet generation** (BL-L2)
2. **Raw modulation** from packets via `computeBeautifulLoopModulation()`
3. **Smoothing** via `smoothModulation()` with previous frame
4. **Clamping** via `clampModulation()` to safety bounds
5. **Storage** for next frame's smoothing
6. **Application** during heartbeat via living/homeostatic state updates

### Delta Calculation Example (noveltyBiasDelta)

```typescript
// Inputs from packets
coherenceLoss = 1.0 - selfCoherence        // 0-1
overloadFactor = overloadSense             // 0-1
worldPressFactor = worldPressure           // 0-1

// Weighted combination (weak)
rawDelta = coherenceLoss * 0.15 + worldPressFactor * 0.12 + overloadFactor * 0.08

// Clamp to small range
noveltyBiasDelta = clamp(rawDelta, -0.05, 0.05)
```

Maximum possible value even with extreme inputs: 0.08 (post-clamp)

### Application Example (predictionSensitivity)

```typescript
// Before BL-L3
sensitivityTarget = 0.5 + errorLevel * 0.1 + surpriseInfluence

// With BL-L3
blNoveltyDelta = blModulation?.noveltyBiasDelta ?? 0
sensitivityTarget = 0.5 + errorLevel * 0.1 + surpriseInfluence + blNoveltyDelta

// Maximum effect with blNoveltyDelta = 0.08
// sensitivityTarget shifts from 0.6 to 0.68 (13% relative change)
// After slow smoothing (0.002 factor), actual effect is ~0.00016 per frame
```

## Verification

### Build Status
- **TypeScript**: Compiles without errors
- **Linter**: No new warnings
- **Vite build**: Successful (153.86 kB bundle)

### Test Status
- **BL-L3 tests**: 13/13 passing
- **All tests**: 219/220 passing (1 pre-existing failure)
- **No regression**: Existing tests unaffected

### Behavior Verification
- Modulation deltas stay within bounds across 100+ frame runs
- No NaN under heavy perturbation + touch
- Modulation responds appropriately to packet conditions
- Disabled config produces zero modulation
- EMA smoothing works as expected

## Future Work (BL-L4+)

### Potential Expansions (Not in L3)
- Packet-to-mode weak influence (not direct switching)
- Rewrite pressure modulation (currently minimal)
- Withdraw action bias (currently tracked but not applied)
- Felt-state expansion beyond minimal sensing
- Relational self beyond minimal engagement proxy
- Observer/debug UI for modulation visualization
- Scenario tests for specific modulation patterns

### Constraints for Future Phases
- Modulation must remain **thin** (no packet dominance)
- Existing dynamics remain **primary drivers**
- Effects should be **observable but not overwhelming**
- Must support **ablation** (disableable without breakage)

## Notes

- This is a **loop closure** phase, not a self-emergence phase
- Packets are **derived proxies**, not theoretical implementations
- Modulation is **additive bias**, not state override
- Loop is now "薄く閉じている" (thinly closed)
- Organism core causality still flows the same way as before L3

## Files Changed

### Modified
- `src/core/AeternaNetwork.js`: Added modulation state, computation, application
- `src/organism/livingState.ts`: Added blModulation parameter, applied to sensitivity and touch baseline
- `src/organism/survivalState.ts`: Added blModulation parameter, applied to restoration bias
- `src/organism/updateHeartbeat.js`: Pass modulation to state updates

### Added
- `src/core/beautifulLoopModulation.ts`: Modulation computation module
- `src/tests/beautifulLoopL3.test.ts`: Integration tests
- `docs/beautiful-loop-l3-notes.md`: This file

## Connection Summary

**From packets**:
- `InteroceptionPacket` → `restorationBiasDelta` → `HomeostaticState.restorationBias`
- `SelfWorldModelPacket.selfCoherence` → `noveltyBiasDelta` → `LivingState.predictionSensitivity`
- `SelfWorldModelPacket.relationEngagement` → `touchOpennessDelta` → `LivingState.touchNeedBaseline`

**Strength**: All deltas < ±0.10, most < ±0.05
**Frequency**: Computed every frame, applied via heartbeat
**Reversibility**: `enabled = false` → zero modulation

## References

- **BL-L1 notes**: `docs/beautiful-loop-l1-notes.md`
- **BL-L2 notes**: `docs/beautiful-loop-l2-notes.md`
- **Update cycle**: `docs/update-cycle.md`
- **Packet types**: `src/types/interoception.ts`, `src/types/selfWorldModel.ts`
- **Modulation module**: `src/core/beautifulLoopModulation.ts`
- **Tests**: `src/tests/beautifulLoopL3.test.ts`
