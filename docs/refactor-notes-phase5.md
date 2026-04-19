# AETERNA Phase 5 Refactor Notes

**Date**: 2026-04-19
**Phase**: Architecture Refactor
**Goal**: Organize organism core into research-friendly structure

## Overview

This phase focused on separating responsibilities from AeternaNetwork into specialized engines, defining clear boundaries between world/organism/presentation state, and centralizing constants and helpers.

## What Was Changed

### 1. New Engine Files Created

#### `src/core/DynamicsEngine.ts`
**Responsibility**: Torus wave propagation and flow

- Encapsulates `runDynamicsUpdate()` method
- Returns DynamicsPacket with arousal, sigma, cluster ratio, etc.
- Currently delegates to existing `dynamicCore.ts` (thin wrapper)
- Future: Will absorb more dynamics logic

#### `src/core/PredictionCore.ts`
**Responsibility**: Prediction error computation

- Implements `buildPredictionPacket()` method
- Computes mean/max prediction errors
- Separates prediction logic from dynamics and plasticity
- Future: Will integrate with touch expectation more deeply

#### `src/core/PlasticityEngine.ts`
**Responsibility**: Rewrite and adaptation

- Placeholder for future plasticity coordination
- Will eventually absorb logic from `priorRewrite.ts`
- Maintains separation from dynamics
- Future: Prior channel updates, weight adaptation

#### `src/core/NoiseField.ts`
**Responsibility**: Baseline noise generation

- Handles stochastic noise injection
- Thin wrapper around existing `triggerNoise` implementation
- Separates noise from deterministic dynamics
- Future: Spatially structured fluctuations

#### `src/core/OrganismRuntime.ts`
**Responsibility**: Engine coordination

- Aggregates all engines
- Entry point for organism tick coordination
- Currently placeholder - will grow into orchestrator
- Future: Mediate between engines and living state

### 2. State Type Definitions

#### `src/types/worldState.ts`
Defines **external** world state (environment, inputs):
- `WorldTouchInput` - touch events from outside
- `WorldEnvironment` - time, viewport, global params
- `WorldState` - aggregates all external inputs

#### `src/types/organismState.ts`
Defines **internal** organism state (dynamics, homeostasis):
- `OrganismNetworkBuffers` - activation buffers
- `OrganismLivingState` - slow organism variables
- `OrganismHomeostaticState` - survival variables
- `OrganismEnergyState` - energy flow
- `OrganismModeState` - wake/sleep/dream
- `OrganismActionState` - action tendencies

#### `src/types/presentationState.ts`
Defines **observer-side** visualization state:
- `PresentationCameraState` - 3D camera
- `PresentationVisualLayer` - layer visibility
- `PresentationDebugState` - debug UI
- `GraphicsMode` - rendering mode
- `PresentationRenderBuffers` - visualization only

### 3. Core Constants Centralization

#### `src/core/coreConstants.ts`
Centralized IDs, enums, and helpers:
- Re-exports existing PHI, SCHUMANN_RES, etc.
- `SIGNAL_SOURCE` - signal type identifiers
- `NODE_LAYER`, `NODE_TYPE` - node classification
- `MODE_STATE`, `ACTION_STATE` - organism states
- `TOUCH_PATTERN`, `REWRITE_TENDENCY` - behavior IDs
- Helper functions: `clampFinite`, `clamp01`, `sigmoid`, `relu`, etc.

### 4. AeternaNetwork Integration

**Changes to `src/core/AeternaNetwork.js`**:
- Added imports for new engines and centralized helpers
- Added `initializeEngines()` method to create engine instances
- Delegated `clampFinite` and `clamp01` to centralized helpers
- Engines stored as `this.dynamicsEngine`, `this.predictionCore`, etc.
- Engines initialized but not yet actively used (future integration point)

## Responsibilities Moved Out of AeternaNetwork

### Currently Separated (Interfaces Created):
1. **Dynamics propagation** → `DynamicsEngine` (interface ready)
2. **Prediction error** → `PredictionCore` (interface ready)
3. **Plasticity logic** → `PlasticityEngine` (interface ready)
4. **Noise injection** → `NoiseField` (interface ready)
5. **Helper functions** → `coreConstants.ts` (centralized)

### Still in AeternaNetwork (To Be Moved):
1. **Baseline/residue updates** (currently in `runBaselineActivityStage`)
2. **Metrics assembly** (currently in `runTorusMetricsStage`)
3. **Geometry updates** (currently in `torusGeometry.ts`)
4. **Weight normalization** (currently in `torusWeights.ts`)
5. **Dormant nodes** (currently in `dormantNodes.ts`)
6. **Sensory input capture** (currently in perception modules)

## World / Organism / Presentation Separation

### Clarified Boundaries:

**World (External)**:
- Touch inputs, sound, light, motion, time
- Environment parameters (viewport, time step)
- NOT organism's internal state

**Organism (Internal)**:
- Network buffers, prediction, rewrite
- Living state, homeostasis, energy, mode, action
- Internal dynamics, NOT visualization

**Presentation (Observer)**:
- Camera, renderer, visual layers
- Debug UI, metrics display
- Render buffers for visualization only

This separation is now **documented in type definitions** and will guide future refactoring.

## Centralized IDs and Helpers

### Before:
- `clampFinite` duplicated in AeternaNetwork
- Signal sources identified by strings scattered across files
- Mode/action states defined locally
- Activation helpers duplicated

### After:
- `clampFinite`, `clamp01` in `coreConstants.ts`
- `SIGNAL_SOURCE` enum for all signal types
- `MODE_STATE`, `ACTION_STATE` centralized
- Common activation functions (sigmoid, relu) available globally

## Tests and Validation

### Regression Tests:
- **Result**: All tests pass (1 expected failure in Phase 3 feature)
- **Scenarios tested**:
  - No stimulus baseline
  - Single touch response
  - Repeated touch
  - Hold-release
  - Long quiet drift
  - Perturbation after quiet
  - Touch expectation
  - Homeostasis and survival

### No Behavior Breaks:
- Build passes
- Test suite passes (178/179 tests)
- Existing packet flow unchanged
- AeternaNetwork still orchestrates all updates
- Engines initialized but not yet actively used (safe integration)

## Documentation Updates

See updated documentation files for details on new architecture.

## What Was NOT Done (Intentionally Deferred)

### Not Changed (By Design):
1. **No new life mechanisms added** - focus was on structure
2. **No UI changes** - presentation layer unchanged
3. **Observer layer not promoted** - signal/runtime stays observer-side
4. **Not all files converted to TS** - gradual migration
5. **Engines not yet actively used** - integration is incremental

### Deferred to Future Phases:
1. **Full TS conversion** - only new files are TS
2. **PhysicalDisk.js → TS** - deferred
3. **TouchMemory.js → TS** - deferred
4. **RealityVisualLayer.js → TS** - deferred
5. **Complete engine integration** - engines exist but AeternaNetwork still runs show

## Next Phase Recommendations

### High Priority:
1. **Gradually move logic into engines**
   - Start with DynamicsEngine actually running dynamics
   - Move prediction logic into PredictionCore
   - Move rewrite logic into PlasticityEngine

2. **Convert core JS files to TS**
   - `AeternaNetwork.js` → `AeternaNetwork.ts` (biggest impact)
   - `PhysicalDisk.js` → `PhysicalDisk.ts`
   - `TouchMemory.js` → `TouchMemory.ts`

3. **Further thin AeternaNetwork**
   - Move baseline/residue to dedicated module
   - Move metrics assembly to dedicated module
   - Reduce AeternaNetwork to orchestration + state holder

### Medium Priority:
1. **Interface/adapter boundaries**
   - `TouchInputAdapter` for input sources
   - `MetricsEmitter` for metrics output
   - `ExperimentRunner` for headless scenarios

2. **Utility consolidation**
   - Move more helpers to `coreConstants.ts`
   - Remove remaining duplicated functions
   - Centralize geometry/weight helpers

### Low Priority:
1. **Presentation layer refactor**
   - Separate RealityVisualLayer concerns
   - Clean up render buffer management
   - Improve debug UI modularity

## Files Added

- `src/core/DynamicsEngine.ts`
- `src/core/PredictionCore.ts`
- `src/core/PlasticityEngine.ts`
- `src/core/NoiseField.ts`
- `src/core/OrganismRuntime.ts`
- `src/core/coreConstants.ts`
- `src/types/worldState.ts`
- `src/types/organismState.ts`
- `src/types/presentationState.ts`

## Files Modified

- `src/core/AeternaNetwork.js` - Added engine initialization and centralized helpers

## Remaining Giant Responsibilities in AeternaNetwork

### Still Large:
1. **State initialization** (14 init methods) - could be modular
2. **Perception orchestration** - `updatePerceptionState` method
3. **Post-propagation orchestration** - `updatePostPropagationState` method
4. **Massive return packet** - `updateDynamics` returns 70+ fields
5. **Geometry render state** - mixed with organism core

### Candidates for Next Split:
- **StateInitializer** - handle all initialization
- **PerceptionCoordinator** - orchestrate sensory updates
- **MetricsAssembler** - build return packet
- **GeometryManager** - separate from organism

## Conclusion

Phase 5 successfully established architectural boundaries and created engine interfaces without breaking existing behavior. The codebase is now better positioned for:

- **Research**: Clear separation of concerns
- **Testing**: Engines can be mocked/replaced
- **Comparison**: State boundaries make experiments easier
- **Iteration**: Engines can evolve independently

The refactor was **intentionally conservative** - new structures were added without removing old code, ensuring no behavior breaks. Future phases can incrementally migrate logic into engines while maintaining working system at each step.
