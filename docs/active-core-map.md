# Active Core Map

- `src/core/AeternaNetwork.js` — CPU state source of truth and update-order orchestration.
- `src/core/dynamicCore.ts` — baseline/residue, prediction-error injection, core propagation, and noise.
- `src/core/derivedMetrics.ts` — cluster, phi proxy, phase coherence, and derived cache refresh.
- `src/core/networkGeometry.ts` — torus generation, radius updates, and render buffers.
- `src/core/networkWeights.ts` — directional weight normalization and external STDP updates.
- `src/core/aeternaTuning.ts` — shared core/perception/organism tuning constants used by helpers.

- `src/perception/localPrediction.ts` — neighborhood prediction updates.
- `src/perception/touchPerception.ts` — raw touch field, onset/offset, novelty, and touch projection.
- `src/perception/touchPatterns.ts` — centroid, repeat/hold/stroke tracking, and pattern modulation.
- `src/perception/TouchMemory.js` + `src/perception/touchMemoryState.ts` — touch trace bookkeeping and STDP handoff.

- `src/organism/modeState.ts` — wake/sleep/dream drives and dream replay.
- `src/organism/survivalState.ts` — energy, stability, overload, rest, and orienting state.
- `src/organism/actionState.ts` — idle/orient/withdraw/settle selection and action pulse effects.
- `src/organism/rewrite.ts` — prior bias, rewrite pressure, plasticity trace, and rewrite event selection.
- `src/organism/actionLoop.js` + `src/organism/runtimeLoop.ts` — frame loop orchestration, tension/UI/bridge cadence.

## Agent touch points

- Touch perception changes: start in `touchPerception.ts` or `touchPatterns.ts`.
- Rewrite/plasticity changes: start in `rewrite.ts`.
- Mode or survival tuning: start in `modeState.ts` or `survivalState.ts`.
- Core wave / metrics / render changes: start in `dynamicCore.ts`, `derivedMetrics.ts`, or `networkGeometry.ts`.
- Cross-cutting update order only: edit `AeternaNetwork.js`.

## AeternaNetwork role

- Holds all live CPU buffers and scalar organism state.
- Calls helper modules in the visible update order.
- Remains the integration point when helpers need shared state without importing each other.
