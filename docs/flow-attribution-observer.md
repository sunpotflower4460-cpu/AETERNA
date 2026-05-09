# AETERNA Observation Layer v4.1 Flow Attribution Observer

## Purpose

v4.1 adds flow attribution to the Observation Layer.

The goal is to explain why observed totals increased or decreased without changing runtime state.

This is observation-side work only.

## Position

```text
AETERNA Core / Substrate
  fields, transfer, storage, conservation

Observation Layer
  snapshots, transfer observation, timeline, flow attribution

Life / Organism Layer
  not touched in this phase
```

## What this phase adds

- `src/observer/flowAttribution.ts`
- `src/components/observation/FlowAttributionPanel.ts`
- flow attribution types in `src/types/observation.ts`
- flow attribution rendering inside `ObservationShell`
- tests for attribution logic and panel rendering

## Attribution rule

The observer compares two timeline frames:

```text
previous frame
current frame
```

Then it explains known changes when possible.

Examples:

```text
ExternalDriveField decreased because transfer source out matched SpatialWorldMedium destination input.
SpatialWorldMedium increased because transfer destination input matched ExternalDriveField source out.
Dissipation increased because named dissipation storage accumulated.
Residue increased because named residue storage accumulated.
Outflow increased because measured outflow accumulated.
MembraneExchange increased because boundary-side exchange accumulated.
```

## Unknown change rule

If a field total changes by an amount not explained by transfer or named destination fields, the observer emits:

```text
kind = unknownChange
confidence = low
```

This does not hide the change.

It marks the change as suspicious for later anomaly detection.

## Confidence

```text
high
  Closed pair ledger or named destination change explains the amount.

medium
  Baseline or incomplete context.

low
  Change exists but is not explained by the known observation inputs.
```

## What it deliberately does not add

- no runtime changes
- no transfer behavior changes
- no SpatialWorldMedium update behavior changes
- no anomaly detector yet
- no export yet
- no AETERNA internal buffer coupling
- no center-buffer injection
- no AeternaNetwork / dynamicCore / livingState changes
- no life-like framing

## Valid language

Valid:

```text
ExternalDriveField decreased because transfer occurred.
SpatialWorldMedium increased because transfer input matched source out.
SpatialWorldMedium decreased into named destination fields.
Unexplained field change detected.
```

Not valid:

```text
AETERNA responded.
AETERNA felt energy.
AETERNA is breathing.
AETERNA is alive.
```

## Next phase

```text
v4.2 Observation Anomaly Detector
```

The next phase should convert unknown changes, open ledgers, and impossible conditions into explicit audit findings.
