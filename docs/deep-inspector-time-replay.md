# AETERNA-NATURAL v1.7 Deep Inspector / Time Replay

## 1. Purpose

v1.7 connects the v1.6 Cell Inspector / Metric Visual Lens / Lens Context infrastructure to
actual observable experience:

- Select a cell on the torus → see its observation data in the Cell Inspector
- Click a metric row → activate the corresponding Visual Lens
- Selected cell is marked on the torus
- Camera can focus toward the selected cell (observation aid only)
- Use the Time Replay panel to review past observation snapshots
- See recent events associated with the selected cell

This phase adds **no new runtime dynamics**. It is entirely UI-side observation infrastructure.

---

## 2. Cell Picking

### Files
- `src/ui/render/cellPicking.ts` — projection-based approximate picking
- `src/ui/observation/useCellPicking.ts` — pointer event → cellIndex hook

### How it works
1. On pointer-up (mouse or touch) on the canvas, pointer coordinates are normalised to NDC.
2. Each cell's 3D position is projected to 2D screen space using the projection × view matrices.
3. The cell with the smallest NDC distance within `hitRadius` is selected.
4. If no camera matrices are available, picking returns null (graceful fallback).

### Constraints
- **Fake cells are never created.** Only existing geometry cells are pickable.
- Picking a miss returns `null` — the selection is either unchanged or cleared.
- Mobile touch is supported via `pointerup` events.

---

## 3. Selected Cell Marker

### File
- `src/ui/render/SelectedCellMarker.tsx`

### Design
- An SVG circle ring is overlaid on the canvas at the selected cell's projected screen position.
- The ring is thin, semi-transparent, and varies slightly in color by the active lens.
- `pointer-events: none` — does not block canvas interaction.
- **No fake energy glow, no fake vortex ring, no fake deformation effect.**

### Guardrail
> The selected cell marker is an observation aid.
> It does NOT represent fake energy, fake vortex, or fake deformation.

---

## 4. Cell Inspector

### Files
- `src/ui/observation/CellInspectorPanel.tsx` — full panel renderer
- `src/ui/observation/CellMetricRow.tsx` — single metric row

### Connected to
- `deriveCellObservation` / `CellObservation` (v1.6 infrastructure)
- `CellInspectorState` / `SelectedObservationState` (v1.7)

### Display items
| Item | Source |
|------|--------|
| Cell index | CellObservation.cellIndex |
| Grid position (i, j) | CellObservation.geometry.i, .j |
| u / v angles | CellObservation.geometry.majorAngle, .minorAngle |
| Gaussian Curvature | CellObservation.geometry.gaussianCurvature |
| Area Element | CellObservation.geometry.areaElement |
| Inner–Outer Bias | CellObservation.geometry.innerOuterBias |
| Field Amplitude | CellObservation.field.amplitude |
| Field Phase | CellObservation.field.phase |
| Local Phase Coherence | CellObservation.field.phaseCoherenceLocal |
| Local Flow Continuity | CellObservation.field.flowContinuityLocal |
| Vortex Candidate Confidence | CellObservation.vortex.candidateConfidence |
| Topological Charge | CellObservation.vortex.topologicalCharge |
| Membrane Deformation | CellObservation.membrane.deformation |
| Membrane Tension | CellObservation.membrane.tension |
| Plasticity Trace | CellObservation.plasticity.accumulatedTrace |
| Resistance Scale | CellObservation.plasticity.resistanceScale |
| Observed Ratio Match | CellObservation.ratios.strongestMatchStrength |
| Recent Events | see §9 |

### Missing values
- `undefined` / `null` values are shown as **"(not observed)"**
- `undefined` is NEVER substituted with `0` or any fake value
- Missing observer groups are noted with a "fields not observed" message

### Metric row click
Clicking a metric row:
1. Dispatches `inspector:metricClick` CustomEvent with `{metricId, lensId}`
2. Consumer updates `SelectedObservationState.activeLensId`
3. `MetricSpotlightPanel` updates to show the active lens

---

## 5. Metric Spotlight Connection

### File
- `src/ui/observation/MetricSpotlightPanel.tsx`

### What it shows
- Active lens label, value, valueKind badge
- Lens description and disclaimer
- Recommended field layers (advisory)

### Preferred field layer mapping
| Lens | Preferred Layer |
|------|----------------|
| gaussianCurvature | torusCurvature |
| fieldAmplitude | energyActivity |
| fieldPhase | fieldPhase |
| vortexConfidence | vortexCandidate |
| membraneDeformation | membraneState |
| plasticityTrace | weakPlasticityTrace |
| resistanceScale | weakPlasticityTrace |
| observedRatioMatch | (none) |

### Layer activation
- Layer switching is **advisory only**: a "Show recommended layer" button is shown.
- If the layer is unavailable, "layer unavailable" is displayed.
- **No automatic layer switching** — user decides.
- **No fake layers are created.**

---

## 6. Camera Focus and Free Orbit

### Files
- `src/ui/camera/focusCameraOnCell.ts` — focus on a cell's 3D position
- `src/ui/camera/useObservationCameraControls.ts` — wrapper with lock/unlock/reset

### Design
- `focusCameraOnCell()` calls `setCameraTarget(x, y, z)` on the existing camera controls
- After focusing, the user retains **full free orbit / zoom / pan**
- `lockToCell` is opt-in; `unlockFromCell` returns to free orbit
- `resetView()` returns to the default camera position
- **No semantic animation**: the camera moves toward the observation target, not to "reveal meaning"

### Guardrail
> Camera focus is an observation aid.
> It does NOT imply semantic meaning or consciousness claim.

### UI controls
| Action | Description |
|--------|-------------|
| Focus Cell | Move camera look-at to selected cell |
| Free Orbit | Default: always available after focus |
| Lock to Cell | Opt-in orbit lock to cell position |
| Reset View | Return to default camera |

---

## 7. Time Replay Snapshots

### File
- `src/types/timeReplay.ts` — `TimeReplaySnapshot` and `ReplayUIState` types

### TimeReplaySnapshot fields
```typescript
{
    tick: number;
    timestamp: number;
    selectedCellObservation: CellObservation | null;
    activeLensId: MetricLensId | null;
    focusedMetricId: string | null;
    globalSummary: {
        phaseCoherence?: number;
        vortexCandidateCount?: number;
        membraneOverlap?: number;
        plasticityAccumulation?: number;
        observedRatioMatchStrength?: number;
        nanOrInfinityCount?: number;
    };
    eventIds: string[];
}
```

### What is NOT stored
- Raw field buffers (`Float32Array`, `Uint8Array`, etc.)
- Full AeternaEvent objects (only IDs)
- Any unbounded arrays

---

## 8. Replay Mode vs Runtime Rewind

### File
- `src/replay/timeReplayBuffer.ts`

### TimeReplayBuffer
- `maxSnapshots` limit enforced: oldest snapshots are dropped
- `pushReplaySnapshot()`: immutable update, returns new buffer
- `getReplaySnapshotByTick()`: returns `null` for missing ticks — no interpolation
- `getAvailableTickRange()`: reports the stored tick range

### CRITICAL GUARDRAIL

> **Time Replay is the re-display of recorded observation snapshots.**
> **It does NOT imply the runtime itself has moved backward.**

In Replay Mode:
- The runtime **continues advancing** in the background
- The UI **shows a recorded snapshot** from the buffer
- The live tick counter continues to increment
- "Replay Mode" and "Live Mode" are always clearly distinguished in the UI

Displayed in all Replay UI components:
> "Replay Mode shows recorded observation snapshots.
>  It does not imply the runtime itself has moved backward."

---

## 9. Recent Events

### File
- `src/observer/getRecentEventsForCell.ts`

### getRecentEventsForCell()
Filters AeternaEvents by cell regionId (`uI-vJ` format).

1. Match `event.source === cellRegionId` (e.g. `"u2-v3"`)
2. If no cell-specific match and `fallbackToGlobal=true`, returns most recent global events

### Guardrail
> Recent events are observation log entries, not intent or emotion claims.
> Events are NEVER fabricated.
> Only events from the provided input array are returned.

### Display in Cell Inspector
- Shown in the "Recent Events" section at the bottom of the panel
- Each event shows: tick, event ID, event text (if available)
- Clicking an event row dispatches `inspector:eventClick` for replay navigation

---

## 10. Guardrails

The following guardrails apply to all v1.7 code and documentation.

### Replay
> Time Replay is the re-display of recorded observation snapshots.
> It does NOT imply the runtime itself has moved backward.
> runtime 自体が過去へ戻ったことを意味しません。

### Selected cell marker
> The selected cell marker is an observation aid.
> It does NOT represent fake energy, fake vortex, or fake deformation.

### Camera focus
> Camera focus is an observation aid.
> It does NOT imply semantic meaning or a consciousness claim.

### Recent events
> Recent events are observation log entries.
> They do NOT represent intent, emotion, memory, or decision-making.

### Metric spotlight
> Metric Spotlight shows real observation values.
> It does NOT represent fake layer data or fabricated field values.

### General
- No consciousness / emotion / intelligence / life / mystical / healing proof claims
- No LLM / external API calls
- No Node bridge / semantic memory
- No runtime dynamics modification
- No fake events, fake replay, fake visual, fake results

---

## 11. Future Phases

| Phase | Plan |
|-------|------|
| v1.8 | Causal Trace / Layer Correlation: event path drawing, causal chain visualisation |
| v1.9 | Lens-aware AI Guide: LLM integration using AiGuideContext (interface defined in v1.6) |

---

## Reference

- `docs/super-observation-architecture.md` — v1.6 Cell Inspector / Lens / Guide base
- `docs/visualization-integrity-principles.md` — Visual layer guardrails
- `docs/scientific-ui-ux-principles.md` — UI text guardrails
- `docs/implementation-language-guardrails.md` — Language guardrails
