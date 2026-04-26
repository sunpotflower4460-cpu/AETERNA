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


## W-Series: Body-World Closure（設計境界のみ固定、W0 完了）

AETERNA は内側だけでなく世界と閉じる方向へ進む。ただし意味形成はしない。

- **Body Surface** (`docs/body-world-closure-principles.md`) — W1 で導入
- **Actuation Pulse** (`docs/actuation-pulse-spec.md`) — W2 で導入。言語出力ではなく身体的作用。
- **World Medium** (`docs/world-medium-spec.md`) — W3 で導入。まず simulated world から始める。real sensor は後段。
- **Sensory Return** — W4 で導入
- **Reafference Comparison** (`docs/reafference-comparison-spec.md`) — W5 で導入
- **Body-World Closure Metrics** (`docs/body-world-closure-metrics.md`) — W6 で導入
- **Emergent Proto-Neuron Observation** (`docs/emergent-proto-neuron-principles.md`) — W7 で観測開始。proto-neuron は最初から置かず、トーラス生命場の流れから自然に観測される節候補として扱う。
- **Node-AI-Z / Node Mother**: 意味・構造化の後段として扱う。AETERNA 側に先取りしない。

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
