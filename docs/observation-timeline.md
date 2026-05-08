# AETERNA Observation Layer v4.0 Observation Timeline

## Purpose

v4.0 adds a timeline to the Observation Layer.

The goal is to record observation frames over ticks so field totals, transfer amounts, pair residuals, and ledger status can be compared over time.

This is observation-side work only.

It does not change runtime behavior.

## Position

```text
AETERNA Core / Substrate
  fields, transfer, storage, conservation

Observation Layer
  snapshots, transfer observation, timeline, summaries

Life / Organism Layer
  not touched in this phase
```

## What this phase adds

- `src/observer/observationTimeline.ts`
- `src/components/observation/TimelinePanel.ts`
- timeline types in `src/types/observation.ts`
- timeline rendering inside `ObservationShell`
- tests for timeline frame creation, append behavior, summary, and mobile/desktop panels

## Timeline frame

Each frame records:

```text
tick
externalDriveTotal
mediumStorageTotal
dissipationTotal
residueTotal
outflowTotal
membraneExchangeTotal
transferEnergy
pairResidual
pairLedgerStatus
metricKind = derived
```

The frame is derived from measured field snapshots plus optional transfer observation.

It should not mutate runtime state.

## Timeline summary

The summary records:

```text
frameCount
firstTick
lastTick
totalTransferred
maxPairResidual
openFrameCount
closedFrameCount
warningFrameCount
latestStatus
metricKind = derived
```

This lets the UI show long-running behavior without reading all details first.

## Mobile presentation

Mobile shows timeline frames as tick cards:

```text
tick 12
External  3.000
Medium    1.000
Transfer  1.000
Residual  0.000
status    closed
```

This follows the mobile rule:

```text
one screen, one purpose, cards first
```

## Desktop presentation

Desktop shows a wider table:

```text
tick | external | medium | transfer | dissipation | residue | outflow | membrane | residual | status
```

This follows the desktop rule:

```text
observatory dashboard, simultaneous comparison
```

## What it deliberately does not add

- no runtime changes
- no transfer behavior changes
- no SpatialWorldMedium update behavior changes
- no anomaly detector yet
- no flow attribution engine yet
- no export yet
- no AETERNA internal buffer coupling
- no center-buffer injection
- no AeternaNetwork / dynamicCore / livingState changes
- no life-like framing

## Valid language

Valid:

```text
Timeline frame recorded.
Total transferred across frames.
Max pair residual.
Open/closed ledger frame counts.
```

Not valid:

```text
AETERNA responded over time.
AETERNA is breathing.
AETERNA is alive.
```

## Next phase

```text
v4.1 Flow Attribution Observer
```

The next phase should explain why totals increased or decreased, for example:

```text
ExternalDriveField decreased because transfer occurred.
SpatialWorldMedium increased because transfer input matched source out.
SpatialWorldMedium decreased because named destination fields received storage.
```
