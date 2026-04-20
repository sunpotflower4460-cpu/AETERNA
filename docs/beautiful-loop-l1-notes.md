# Beautiful Loop Minimal L1 - Implementation Notes

**Status**: v0.5 skeleton complete
**Date**: 2026-04-20
**Purpose**: Minimal observer-layer packet types and stages for future loop closure

## What Was Added

### 1. Packet Types

#### InteroceptionPacket
- **File**: `src/types/interoception.ts`
- **Role**: Internal sensing/felt-state observation packet
- **Fields**:
  - `timestamp`: frame number
  - `energySense`: internal energy/reserve sense (0-1)
  - `overloadSense`: overload pressure sense (0-1+)
  - `coherenceSense`: self-coherence/stability sense (0-1)
  - `boundarySense`: boundary integrity sense (0-1)
  - `restorationSense`: restoration/recovery tendency (0-1)
  - `perturbationPressure`: perturbation pressure from external dynamics (0-1+)

#### SelfWorldModelPacket
- **File**: `src/types/selfWorldModel.ts`
- **Role**: Minimal proto-self and world-organism boundary observation
- **Fields**:
  - `timestamp`: frame number
  - `selfCoherence`: self-side coherence/integration (0-1)
  - `selfContinuity`: self-continuity over recent history (0-1)
  - `worldPressure`: external pressure from world-side (0-1+)
  - `relationEngagement`: engagement/openness to relation (0-1)

#### OrganismSnapshot
- **File**: `src/types/organismSnapshot.ts`
- **Role**: Minimal snapshot of organism state for packet generation
- **Purpose**: Decouples packet stages from full network state dependencies

### 2. Stage Functions

#### runInteroceptionStage
- **File**: `src/stages/runInteroceptionStage.ts`
- **Input**: `OrganismSnapshot`
- **Output**: `InteroceptionPacket`
- **Role**: Pure transform from organism state to internal sensing packet
- **Important**: Does NOT modify dynamics - observer only

#### runSelfWorldModelStage
- **File**: `src/stages/runSelfWorldModelStage.ts`
- **Input**: `InteroceptionPacket`, `OrganismSnapshot`
- **Output**: `SelfWorldModelPacket`
- **Role**: Pure transform to proto-self/world boundary packet
- **Important**: Does NOT modify dynamics - observer only

### 3. Integration Points

#### Scenario Runner
- **File**: `src/experiments/runScenario.ts`
- **Change**: Added BL-L1 packet generation to metrics snapshots
- **Fields**: `bl_energySense`, `bl_overloadSense`, `bl_coherenceSense`, `bl_boundarySense`, `bl_restorationSense`, `bl_perturbationPressure`, `bl_selfCoherence`, `bl_selfContinuity`, `bl_worldPressure`, `bl_relationEngagement`
- **Safety**: Wrapped in try-catch to avoid breaking scenarios if packet generation fails

#### Update Cycle Documentation
- **File**: `docs/update-cycle.md`
- **Change**: Added section documenting BL-L1 observer stages
- **Note**: Stages are NOT yet integrated into main loop - TBD for future

### 4. Tests

#### Interoception Stage Tests
- **File**: `src/tests/interoceptionStage.test.ts`
- **Coverage**:
  - Valid packet generation from typical snapshot
  - Low energy condition handling
  - High overload condition handling
  - Quiet/resting condition
  - No NaN with extreme inputs
  - Stable output for repeated input

#### Self/World Model Stage Tests
- **File**: `src/tests/selfWorldModelStage.test.ts`
- **Coverage**:
  - Valid packet generation from typical inputs
  - High world pressure with active touch
  - Low self-continuity during high overload
  - High self-coherence in quiet stable state
  - Mode state differences in self-continuity
  - High relation engagement with good conditions
  - No NaN with extreme inputs
  - Stable output for repeated input

## What Was NOT Done (Intentional)

- **No integration into main update loop**: Stages are standalone, not yet called from `AeternaNetwork.updateDynamics`
- **No dynamics modification**: Packets do not feed back into organism core
- **No homeostasis changes**: Existing homeostatic state unchanged
- **No UI integration**: Packets not yet displayed in visual interface
- **No signal/runtime bridge**: Packets not yet sent to signal runtime
- **No felt-state completion**: Minimal packet fields only, not full felt-state theory
- **No relational self expansion**: Minimal relation engagement field only

## Design Principles Applied

1. **No behavior break**: Existing dynamics completely unchanged
2. **Observer role**: Packets are read-only views of state
3. **Weak coupling**: Stages use snapshot intermediary, not direct network reference
4. **Numeric-only packets**: No text, no interpretation, pure numbers
5. **Finite bounds**: All values clamped to reasonable ranges
6. **NaN safety**: Tests verify no NaN under extreme conditions

## Future Work (BL-L2 / BL-L3)

### BL-L2: Loop Closure
- Connect interoception/self-world packets back to organism dynamics
- Add minimal modulation layer from packets to organism state
- Integrate stages into main update cycle (after action stage)

### BL-L3: Thin Modulation
- Use packets to weakly influence mode transitions
- Add minimal prediction-from-interoception layer
- Expand relation engagement to affect action tendencies

## Verification

Run tests with:
```bash
npm run test:run
```

Check scenario output with BL-L1 metrics:
```bash
# Scenario tests will include bl_* fields in metrics snapshots
```

## Notes

- This is a **skeleton implementation** - it establishes types and stages but does not yet close the loop
- The implementation prioritizes **"通る骨組み"** (working skeleton) over theoretical completeness
- Packet values are **derived/proxy** measures, not direct implementations of theoretical constructs
- All changes are **additive** - no existing functionality was removed or modified

## References

- **Design doc**: AETERNA 段階的設計書 v0.5 - Beautiful Loop Minimal
- **Update cycle**: `docs/update-cycle.md`
- **Packet flow**: `docs/packet-flow.md`
- **Organism state**: `src/types/organismState.ts`
