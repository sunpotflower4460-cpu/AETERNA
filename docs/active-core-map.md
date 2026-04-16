# Active Core Map

## Core orchestration

- `src/core/AeternaNetwork.js` — live CPU state holder and thin packet-flow orchestration.
- `src/types/packets.ts` — shared packet contracts for perception, prediction, rewrite, mode, organism, action, and dynamics.

## Core physiology modules

- `src/mode/baselineActivity.ts` — baseline activity + residue packet stage.
- `src/perception/touchSensory.ts` — raw touch field, onset/offset/novelty/trace projection, and percept packet assembly.
- `src/perception/localPredictor.ts` — local prediction update and prediction packet assembly.
- `src/perception/touchPattern.ts` — touch sequence state, pure score shaping, dominant pattern packet fields.
- `src/organism/priorRewrite.ts` — rewrite pressure, prior channels, rewrite packet assembly.
- `src/organism/bodyState.ts` — energy/stability/overload/rest/orienting packet assembly.
- `src/mode/modeController.ts` — wake/sleep/dream drive selection and mode packet assembly.
- `src/organism/actionDecision.ts` — idle/orient/withdraw/settle selection and action pulse application.
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
It now delegates the step order to packet-oriented stage files and mostly applies returned packets when building the public `updateDynamics()` result.

## Where to touch active code first

- Update flow / packet order: `src/core/AeternaNetwork.js`
- Perception packet changes: `src/perception/touchSensory.ts`, `src/perception/touchPattern.ts`, `src/perception/localPredictor.ts`
- Rewrite packet changes: `src/organism/priorRewrite.ts`
- Mode / organism / action packet changes: `src/mode/modeController.ts`, `src/organism/bodyState.ts`, `src/organism/actionDecision.ts`
- Dynamics / metrics / render packet changes: `src/core/torusDynamics.ts`, `src/core/torusMetrics.ts`, `src/core/torusGeometry.ts`
- Bridge-facing numeric packet mapping: `src/types/packets.ts`, `src/types/torusState.ts`, `src/bridge/bridge.ts`
