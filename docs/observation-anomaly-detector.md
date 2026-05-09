# AETERNA Observation Layer v4.2 Observation Anomaly Detector

## Purpose

v4.2 adds an anomaly detector to the Observation Layer.

The goal is to convert suspicious observation-side conditions into explicit audit findings.

This phase does not change runtime behavior.

## Position

```text
AETERNA Core / Substrate
  fields, transfer, storage, conservation

Observation Layer
  snapshots, transfer observation, timeline, flow attribution, anomaly detector

Life / Organism Layer
  not touched in this phase
```

## What this phase adds

- `src/observer/observationAnomalyDetector.ts`
- `src/components/observation/AnomalyPanel.ts`
- anomaly types in `src/types/observation.ts`
- anomaly panel rendering inside `ObservationShell`
- tests for anomaly detection and panel rendering

## Detector inputs

The detector can inspect:

```text
transferObservation
timelineFrames
flowAttribution
```

It remains observation-side only.

## Detected conditions

The first anomaly detector covers:

```text
pairLedgerOpen
pairResidualTooHigh
unknownChange
zeroTransferMoved
destinationInputMismatch
negativeTotal
missingTimeline
upstreamWarning
```

## Severity

```text
info
  Missing optional observation context, such as no timeline frames yet.

warning
  Suspicious but not necessarily impossible observations, such as open ledger or unknown change.

critical
  Strong accounting violation or impossible storage condition, such as residual too high, source/destination mismatch, or negative storage total.
```

## Unknown changes

If the Flow Attribution Observer emits:

```text
kind = unknownChange
```

then the anomaly detector turns it into a warning-level audit item.

The change is not hidden.

## Pair ledger anomalies

If the pair ledger is open or its residual is above tolerance, the anomaly detector emits an explicit audit item.

This preserves the rule:

```text
Do not call movement verified unless source out and destination input match.
```

## Zero-transfer movement

If transfer energy is zero but source or destination movement is reported, the detector emits:

```text
kind = zeroTransferMoved
severity = critical
```

This protects the v3.6 transferCoefficient = 0 invariant.

## UI presentation

Mobile:

```text
Audit tab
  anomaly count
  severity
  tick
  message
  suspected cause
```

Desktop:

```text
Audit panel
  info / warning / critical counts
  anomaly list
  related fields
```

## What it deliberately does not add

- no runtime changes
- no transfer behavior changes
- no SpatialWorldMedium update behavior changes
- no auto-fix
- no export yet
- no AETERNA internal buffer coupling
- no center-buffer injection
- no AeternaNetwork / dynamicCore / livingState changes
- no life-like framing

## Valid language

Valid:

```text
Observation anomaly detected.
Pair ledger is open.
Unknown field change detected.
Negative storage-like total detected.
Zero-transfer movement detected.
```

Not valid:

```text
AETERNA is sick.
AETERNA feels wrong.
AETERNA is breathing incorrectly.
AETERNA is alive.
```

## Next phase

```text
v4.3 Raw Inspector / Export
```

The next phase should let the observation report be exported as JSON, CSV, or summary text without changing runtime behavior.
