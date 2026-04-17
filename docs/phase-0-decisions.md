# Phase 0 Decisions

Purpose: fix the initial conditions for later phases without changing current behavior.

## Fixed candidates

### A. Dormant node ratio
- Recommended initial value: `5%`
- Alternatives: `10%`, `20%`
- Why: introduces margin while keeping the current torus dynamics closest to the present baseline.
- Review again when: dormant-node allocation and wake-up rules exist and can be measured against ignition ratio, prediction error, and stability.

### B. First sensory modality
- Recommended initial value: `sound`
- Alternatives: `light`, `motion`
- Why: easiest to validate in isolation and the most natural first bridge from current structure to future audio-oriented work.
- Review again when: the first non-touch sensory packet exists and common modality packet rules are stable.

### C. Small torus size
- Recommended initial value: `12×12`
- Alternatives: `16×16`, `18×18`
- Why: smallest practical two-layer experiment with lower computational and debugging cost.
- Review again when: the first hierarchical torus prototype shows clear aliasing, insufficient separation, or unstable coupling.

### D. Inter-layer update ratio
- Recommended initial value: `10:1`
- Alternatives: `100:1`
- Why: makes lower/higher layer interaction visible early and avoids a hierarchy that updates too slowly to inspect.
- Review again when: minimal two-layer hierarchy logs show that upper-layer changes are still too noisy or too detached.

### E. Hardware RNG scope
- Recommended initial value: partial replacement only
- Replacement candidates: `triggerNoise`, part of dormant-node wake-up judgment
- Alternatives: full random replacement
- Why: preserves margin-like uncertainty without destabilizing every stochastic path at once.
- Review again when: hardware RNG can be measured for drift, reproducibility impact, and failure handling.

## Confirmed future connection points

### Dormant node ratio
- `src/core/AeternaNetwork.js` — structural state is initialized here, so a dormant mask / ratio setting would start here.
- `src/core/networkGeometry.ts` — node layout and hub placement live here, so dormant-node distribution would likely be attached here.
- `src/core/dynamicCore.ts` — propagation and spike updates live here, so dormant-node skip / wake conditions would eventually affect this path.

### First sound sensory entry
- `src/core/AeternaNetwork.js` — `updatePerceptionState()` is the current sensory entry order and the first place a sound stage would be inserted.
- `src/perception/touchSensory.ts` — current sensory-stage wrapper and best template for a future `soundSensory` stage.
- `src/perception/touchPerception.ts` — current onset / novelty / projection shaping reference for modality-specific preprocessing.
- `src/types/packets.ts` — perception packet contracts would need extension for a sound packet.
- `src/bridge/bridge.ts` and `src/types/torusState.ts` — only needed later if sound-derived state is exposed outside the torus runtime.

### Future hierarchy core files
- `src/core/AeternaNetwork.js`
- `src/core/networkGeometry.ts`
- `src/core/dynamicCore.ts`
- `src/core/derivedMetrics.ts`
- `src/core/torusGeometry.ts`
- `src/core/torusMetrics.ts`
- `src/types/packets.ts`

### RNG replacement targets
- `src/core/dynamicCore.ts` — current `triggerNoise()` uses `Math.random()` and is the primary Phase 0 replacement target.
- `src/organism/actionLoop.js` — calls `state.network.triggerNoise(...)`, so this is the runtime caller to keep in view.
- Dormant-node wake-up judgment does not exist yet in active code, so there is no current implementation target beyond the future dormant-node path above.
- `src/perception/pointerHandlers.js` also uses `Math.random()` in `injectMassiveError()`, but this is a debug-style manual injection path and is not part of the recommended initial hardware-RNG scope.

### priorChannels inventory preview
- `src/core/AeternaNetwork.js` — `priorChannels` arrays are created here.
- `src/perception/touchPerception.ts` — novelty / recurrence / persistence / directionality are consumed in touch perception and projection.
- `src/perception/localPrediction.ts` — novelty is used in local prediction gain.
- `src/core/dynamicCore.ts` — persistence affects residue decay / intake.
- `src/organism/rewrite.ts` — structured rewrite logic reads and writes channel values.
- `src/tests/network.test.ts` — runtime expectations for `priorChannels` live here.

## Intentionally not done in Phase 0
- No `soundSensory` implementation
- No dormant-node implementation
- No hierarchy implementation
- No resonance or informational-energy work
- No behavior change to current dynamics
