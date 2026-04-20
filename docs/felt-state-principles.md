# Felt-State Principles

AETERNA v0.5 / A1: Felt-State / Interoception Expansion

## Overview

Felt-state is NOT a human emotion model. It is a primitive-organism-level organization of internal condition into qualitative axes.

## Purpose

1. **Organize existing state** - Not create new state
2. **Unified vocabulary** - Single source for internal sensing terms
3. **Foundation for hierarchy** - Prepare for future interoceptive development
4. **Separation of concerns** - Keep internal sensing distinct from mode/action/narrative

## Core Principles

### 1. Felt-State is Derived, Not Primary

Felt-state vector is a **read-only view** of existing organism state. It does NOT:
- Store new state
- Drive dynamics directly
- Replace existing mechanisms
- Add new degrees of freedom

### 2. Continuous, Not Categorical

All felt-state axes are **continuous numeric values**, not discrete categories or labels.

Example:
- ✓ `overload: 0.73` (continuous)
- ✗ `emotion: "stressed"` (categorical label)

### 3. Descriptive Labels, Not Anthropomorphic

Axis names like "depletion" or "openness" are:
- Descriptive convenience terms
- NOT assertions of human-like experience
- NOT emotional states
- References to internal organism qualities

## Felt-State Vector Components

### depletion
**Source**: `energyReserve` (low), `fatigue` (high)
**Range**: 0 (no depletion) to 1+ (severe depletion)
**Meaning**: Energy reserve depletion / exhaustion sense

### overload
**Source**: `overloadLevel`, `irritabilityLevel`, sustained prediction errors
**Range**: 0 (no overload) to 1+ (severe overload)
**Meaning**: Pressure from excessive activity/perturbation

### coherence
**Source**: `coherenceMemory`, cluster stability, `selfCoherence` (from self/world packet)
**Range**: 0 (incoherent) to 1 (highly coherent)
**Meaning**: Self-coherence / stability sense

### boundaryIntegrity
**Source**: `boundaryIntegrity`, `stabilityIndex`, `collapseRisk` (penalty)
**Range**: 0 (boundary loss) to 1 (strong boundary)
**Meaning**: Sense of self-boundary maintenance

### restorationReadiness
**Source**: `restorationBias`, `recoveryDrive`, quiet time bonus
**Range**: 0 (no restoration) to 1 (high restoration readiness)
**Meaning**: Readiness for recovery/restoration

### perturbationLoad
**Source**: recent perturbation, prediction errors, `recentHistoryBias`
**Range**: 0 (calm) to 1+ (high perturbation)
**Meaning**: Recent perturbation pressure

### openness
**Source**: `touchNeedBaseline`, `relationEngagement`, energy, irritability penalties
**Range**: 0 (closed) to 1 (open)
**Meaning**: Openness to external engagement

## Relationship to Other Systems

### vs. InteroceptionPacket
- **InteroceptionPacket**: Lightweight public packet (6 values)
- **FeltStateVector**: Richer internal representation (7+ values)
- InteroceptionPacket can be derived from FeltStateVector
- Mapping is straightforward (e.g., `energySense = 1 - depletion`)

### vs. Beautiful Loop L3 Modulation
FeltStateVector informs BL-L3 modulation reading:
- `overloadSense` ← `feltState.overload`
- `restorationSense` ← `feltState.restorationReadiness`
- `boundarySense` ← `feltState.boundaryIntegrity`

The modulation system uses these as inputs, not as direct outputs.

### vs. Mode State
Felt-state does NOT directly determine mode:
- Mode is determined by existing mechanisms (sleep pressure, wake drive, etc.)
- Felt-state provides additional context for future mode refinements
- Mode can influence felt-state (e.g., sleep mode → recovery readiness)

### vs. Relational Self (Future)
Felt-state provides groundwork for relational self development:
- `openness` weakly incorporates `relationEngagement`
- Future phases may add relational felt-axes
- Felt-state remains non-anthropomorphic

## Implementation Details

### Derivation Function

`deriveFeltState()` is a pure function:
```typescript
function deriveFeltState(
  snapshot: OrganismSnapshot,
  livingState: OrganismLivingState,
  homeostaticState: OrganismHomeostaticState,
  energyState: OrganismEnergyState,
  selfWorld: SelfWorldModelPacket | null
): FeltStateVector
```

- No side effects
- Deterministic
- Testable
- Scenario-comparable

### Coefficients

All coefficients are:
- Small (< 1.0 typically)
- Straightforward linear combinations
- Heavily clamped
- Finite-checked

Example:
```typescript
const rawDepletion = energyDepletion * 0.6 + fatigueContribution * 0.4;
return clampFinite(rawDepletion, 0, 1.5);
```

### Safety

- All values are finite-checked
- NaN propagation is prevented
- Clamped to reasonable ranges
- Tested with extreme inputs

## Usage

### In Scenarios

Felt-state metrics are collected in scenario runner:
```typescript
snapshot.felt_depletion = feltState.depletion;
snapshot.felt_overload = feltState.overload;
// ...
```

Summaries include:
- `avgDepletion`, `avgOverload`, etc.
- `maxOverload`, `minCoherence`

### In Observer/Debug

Felt-state can be displayed alongside:
- InteroceptionPacket values
- Living state values
- Homeostatic state values

Labeled as "derived" or "proxy" where appropriate.

### NOT Used For

- Direct mode switching
- Hard state overrides
- Narrative generation
- Emotional expression
- UI演出 (UI演出は禁止)

## What's NOT in Felt-State

### Not Included (Intentionally)

- Human emotion labels ("sad", "happy", "angry")
- Narrative qualities ("loneliness", "joy")
- Relational specifics ("attachment", "trust") - kept minimal
- Temporal meta-qualities ("anticipation", "regret")

### Might Add Later (A2-A4)

If needed for internal organization:
- `warmthLike`: Comfort/safety axis (non-anthropomorphic)
- `painLike`: Aversive quality (biological, not psychological)
- `settlingLike`: Return-to-baseline quality
- `fragility`: Structural vulnerability sense

Only add if they serve organism organization, not human legibility.

## Testing

### Unit Tests

`src/tests/feltState.test.ts`:
- Typical organism state
- Low-energy depleted state
- High-overload stressed state
- Quiet recovery state
- Self-world integration
- Extreme inputs (no NaN)

### Scenario Tests

Scenarios AF-AI:
- **AF**: Quiet low-load felt-state
- **AG**: Overload felt-state
- **AH**: Recovery felt-state
- **AI**: Repeated touch felt-state dynamics

### Validation

- No NaN values
- Finite ranges
- Behavioral consistency
- No regression in existing tests

## Design Constraints

### What We Did NOT Do

- ✗ Add felt-state as primary driver
- ✗ Make mode depend on felt-state
- ✗ Add human emotion mapping
- ✗ Create narrative from felt-state
- ✗ Modify organism core for felt-state
- ✗ Add UI visualization as primary feature

### What We DID Do

- ✓ Organize existing state
- ✓ Create unified vocabulary
- ✓ Add observer/scenario support
- ✓ Integrate with BL-L3 reading
- ✓ Maintain backward compatibility
- ✓ Keep coefficients small
- ✓ Ensure finite/clamped values

## Future Phases

### A2: Felt-State Hierarchy (Potential)

If needed:
- Layered felt-state (fast/slow)
- Felt-state memory/trace
- Felt-state prediction

### A3-A4: Interoceptive Refinement

Possible directions:
- Felt-state influence on attention
- Felt-state in predictive hierarchy
- Relational felt-qualities (minimal)

### Not Planned

- Human emotion modeling
- Personality traits
- Mood states
- Affective computing integration

## Key Takeaways

1. **Felt-state is internal organism organization**, not human emotion
2. **Derived from existing state**, not new degrees of freedom
3. **Continuous numeric values**, not categorical labels
4. **Observer role**, not dynamics driver
5. **Small coefficients**, heavily clamped and finite-checked
6. **Backward compatible**, no breaking changes
7. **Testable and scenario-comparable**

## Questions to Ask

When considering felt-state changes:

- Does this add new primary state? (❌ Don't do this)
- Does this replace existing mechanisms? (❌ Don't do this)
- Does this anthropomorphize? (❌ Don't do this)
- Does this organize existing state? (✓ Good)
- Does this provide unified vocabulary? (✓ Good)
- Are coefficients small and straightforward? (✓ Good)
- Are values finite-checked and clamped? (✓ Good)

## References

- `src/types/feltState.ts` - Type definition
- `src/organism/deriveFeltState.ts` - Derivation logic
- `src/stages/runInteroceptionStage.ts` - Integration point
- `src/tests/feltState.test.ts` - Unit tests
- `src/tests/scenario.test.ts` (Scenarios AF-AI) - Behavioral tests
- `docs/beautiful-loop-l3-notes.md` - BL-L3 context
- AETERNA 段階的設計書 v0.5 - Original specification
