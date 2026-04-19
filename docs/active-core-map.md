# Active Core Map

## Core orchestration

- `src/core/AeternaNetwork.js` — live CPU state holder and thin packet-flow orchestration.
- `src/types/packets.ts` — shared packet contracts for perception, prediction, rewrite, mode, organism, action, and dynamics.

## Phase 5: Separated Engines

AETERNA now uses specialized engines to separate concerns:

- `src/core/DynamicsEngine.ts` — torus wave propagation and flow (currently delegates to dynamicCore.ts).
- `src/core/PredictionCore.ts` — prediction error computation and mismatch detection.
- `src/core/PlasticityEngine.ts` — rewrite/adaptation logic (placeholder for future integration).
- `src/core/NoiseField.ts` — baseline noise generation and stochastic fluctuations.
- `src/core/OrganismRuntime.ts` — engine coordinator (currently minimal, will grow).

## State Type Definitions

- `src/types/worldState.ts` — external world state (environment, touch inputs, sensory streams).
- `src/types/organismState.ts` — internal organism state (buffers, living state, homeostasis, energy, mode, action).
- `src/types/presentationState.ts` — observer-side visualization (camera, renderer, debug UI, render buffers).

## Core Constants and Helpers

- `src/core/coreConstants.ts` — centralized signal IDs, enums (MODE_STATE, ACTION_STATE, TOUCH_PATTERN, etc.), and helper functions (clampFinite, clamp01, sigmoid, relu).

## Core physiology modules

- `src/mode/baselineActivity.ts` — baseline activity + residue packet stage.
- `src/perception/touchSensory.ts` — raw touch field, onset/offset/novelty/trace projection, and percept packet assembly.
- `src/perception/localPredictor.ts` — local prediction update and prediction packet assembly.
- `src/perception/touchPattern.ts` — touch sequence state, pure score shaping, dominant pattern packet fields.
- `src/organism/priorRewrite.ts` — rewrite pressure, prior channels, rewrite packet assembly.
- `src/organism/bodyState.ts` — energy/stability/overload/rest/orienting packet assembly from touch/dynamics/prediction/rewrite packets.
- `src/mode/modeController.ts` — wake/sleep/dream drive selection and mode packet assembly.
- `src/organism/actionDecision.ts` — idle/orient/withdraw/settle selection and action pulse application from touch + organism packets.
- `src/core/torusDynamics.ts` — propagation-stage entry points and dynamics packet assembly.
- `src/core/torusMetrics.ts` — cluster/phi/coherence cache refresh and metrics packet assembly.
- `src/core/torusGeometry.ts` — torus generation, radius updates, render buffer refresh.
- `src/core/torusWeights.ts` — directional weight normalization and external STDP helpers.

## Lower-level implementation still used by the stage wrappers

- `src/core/dynamicCore.ts`
- `src/core/derivedMetrics.ts`
- `src/core/networkGeometry.ts`
- `src/core/networkWeights.ts`
- `src/perception/touchPerception.ts`
- `src/perception/touchPatterns.ts`
- `src/perception/localPrediction.ts`
- `src/organism/rewrite.ts`
- `src/organism/survivalState.ts`
- `src/organism/actionState.ts`
- `src/organism/modeState.ts`

## What AeternaNetwork keeps vs delegates

AeternaNetwork still keeps the live torus buffers, organism scalars, touch traces, rewrite memory, and render arrays.
It now delegates the visible step order to packet-oriented stage files and mostly applies returned packets when building the public `updateDynamics()` result.
Touch-derived pattern and direction fields are handed into body/action stages as packet data instead of being reread from unrelated module state.

**Phase 5 Addition**: AeternaNetwork now initializes and holds references to specialized engines (DynamicsEngine, PredictionCore, PlasticityEngine, NoiseField, OrganismRuntime), though these engines are not yet actively used in the update loop. This provides the infrastructure for gradual responsibility migration.

## Where to touch active code first

- Update flow / packet order: `src/core/AeternaNetwork.js`
- Perception packet changes: `src/perception/touchSensory.ts`, `src/perception/touchPattern.ts`, `src/perception/localPredictor.ts`
- Rewrite packet changes: `src/organism/priorRewrite.ts`
- Mode / organism / action packet changes: `src/mode/modeController.ts`, `src/organism/bodyState.ts`, `src/organism/actionDecision.ts`
- Dynamics / metrics / render packet changes: `src/core/torusDynamics.ts`, `src/core/torusMetrics.ts`, `src/core/torusGeometry.ts`
- Bridge-facing numeric packet mapping: `src/types/packets.ts`, `src/types/torusState.ts`, `src/bridge/bridge.ts`
- **Engine logic**: `src/core/DynamicsEngine.ts`, `src/core/PredictionCore.ts`, `src/core/PlasticityEngine.ts`, `src/core/NoiseField.ts`, `src/core/OrganismRuntime.ts`

