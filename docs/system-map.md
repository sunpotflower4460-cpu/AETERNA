# System Map

- `src/core/` — torus core dynamics, physical disk, and **separated engines** (DynamicsEngine, PredictionCore, PlasticityEngine, NoiseField, OrganismRuntime).
- `src/perception/` — touch memory and live pointer/touch perception.
- `src/organism/` — shared runtime state, heartbeat, disk updates, organism action loop.
- `src/bridge/` — torus packetization and Signal Runtime bridge entry.
- `src/signal/` — bridge-side structuring/runtime layer built on emitted packets; not the AETERNA organism core itself.
- `src/render/` — reality visual layer and scene-side visualization.
- `src/ui/` — guide panel, DOM cache, metrics UI, debug panels.
- `src/types/` — shared active TypeScript contracts, including **worldState**, **organismState**, and **presentationState**.
- `src/utils/` — local UI and math helpers.
- `archive/` — inactive prototypes, preserved notes, and old references.

## Boundary Fix (Phase 0)

- AETERNA proper is the **core / organism / perception / replay / survival** side that maintains a life-like field before meaning.
- AETERNA may emit observable patterns and derived packets, but it does **not** directly assign semantic labels or object identity.
- Semantic structuring belongs to bridge-side or later layers, even when those layers consume AETERNA outputs.

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
