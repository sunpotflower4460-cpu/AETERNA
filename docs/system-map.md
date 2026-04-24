# System Map

- `src/core/` — torus core dynamics, physical disk, and **separated engines** (DynamicsEngine, PredictionCore, PlasticityEngine, NoiseField, OrganismRuntime).
- `src/perception/` — touch memory and live pointer/touch perception.
- `src/organism/` — shared runtime state, heartbeat, disk updates, organism action loop.
- `src/bridge/` — torus packetization and Signal Runtime bridge entry.
- `src/signal/` — current prediction / proto-meaning / utterance pipeline used by the bridge.
- `src/render/` — reality visual layer and scene-side visualization.
- `src/ui/` — guide panel, DOM cache, metrics UI, debug panels.
- `src/types/` — shared active TypeScript contracts, including **worldState**, **organismState**, and **presentationState**.
- `src/utils/` — local UI and math helpers.
- `archive/` — inactive prototypes, preserved notes, and old references.

## Architecture Updates (Phase 5)

### Engine Separation

Core responsibilities are being separated into specialized engines:

- **DynamicsEngine** (`src/core/DynamicsEngine.ts`) - Torus wave propagation and dynamics
- **PredictionCore** (`src/core/PredictionCore.ts`) - Prediction error computation
- **PlasticityEngine** (`src/core/PlasticityEngine.ts`) - Rewrite and adaptation logic
- **NoiseField** (`src/core/NoiseField.ts`) - Baseline noise generation
- **OrganismRuntime** (`src/core/OrganismRuntime.ts`) - Engine coordination

### State Boundaries

State is now clearly separated into three layers:

- **World State** (`src/types/worldState.ts`) - External environment and inputs
- **Organism State** (`src/types/organismState.ts`) - Internal dynamics and homeostasis
- **Presentation State** (`src/types/presentationState.ts`) - Visualization and UI

### Core Constants

- **coreConstants.ts** (`src/core/coreConstants.ts`) - Centralized IDs, enums, and helper functions


## Phase 2: Perturbation Types (外乱受容)

- **`src/types/perturbationEvent.ts`** — PerturbationEvent: structured perturbation descriptor (magnitude, novelty, expectedness, locality)
- **`src/types/predictionMismatchState.ts`** — PredictionMismatchState: state-dependent mismatch quality (mismatchLevel, surprisePressure, boundaryStress, recoveryPull)
- **`src/perception/derivePerturbationEvent.ts`** — pure helper: derives PerturbationEvent from raw input + organism state
- **`src/prediction/derivePredictionMismatch.ts`** — pure helper: derives PredictionMismatchState from PerturbationEvent + organism state (state-dependent)
- **`src/tests/scenario/perturbationComparisonScenario.ts`** — headless comparison: same touch under different states
- **`src/tests/behavioral/perturbationMismatch.test.ts`** — behavioral tests for perturbation/mismatch

### Input → Perturbation Model

```
External Input
     ↓
derivePerturbationEvent(rawInput, currentState)
     ↓
PerturbationEvent { magnitude, novelty, expectedness, locality, ... }
     ↓
derivePredictionMismatch(event, currentState, baselinePredictionError)
     ↓
PredictionMismatchState { mismatchLevel, surprisePressure, boundaryStress, recoveryPull }
     ↓
Observer (metrics / scenario) — does NOT feed back into organism core
```
