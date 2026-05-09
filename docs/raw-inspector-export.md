# AETERNA Observation Layer v4.3 Raw Inspector / Export

## Purpose

v4.3 adds raw inspection and export helpers to the Observation Layer.

The goal is to make the current observation report reviewable outside the UI as JSON, CSV, or compact summary text.

This is observation-side work only.

It does not change runtime behavior.

## Position

```text
AETERNA Core / Substrate
  fields, transfer, storage, conservation

Observation Layer
  snapshots, transfer observation, timeline, flow attribution, anomaly detector, raw inspector/export

Life / Organism Layer
  not touched in this phase
```

## What this phase adds

- `src/observer/exportObservationReport.ts`
- `src/components/observation/RawInspector.ts`
- export types in `src/types/observation.ts`
- Raw Inspector rendering inside `ObservationShell`
- tests for JSON / CSV / summary export and shell integration

## Export formats

### JSON

JSON exports the complete `ObservationReport`.

Use it when preserving the full diagnostic state matters.

```text
format = json
mimeType = application/json
filename = <report-title>.json
```

### CSV

CSV exports timeline frames only.

Use it when comparing field totals over ticks.

```text
format = csv
mimeType = text/csv
filename = <report-title>-timeline.csv
```

Columns:

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
```

### Summary text

Summary text exports a compact human-readable report.

Use it for mobile review or quick copying.

```text
format = summaryText
mimeType = text/plain
filename = <report-title>-summary.txt
```

## Mobile presentation

Mobile shows the compact summary text inside the Audit tab.

This keeps the phone view readable and avoids dumping huge JSON by default.

## Desktop presentation

Desktop shows the JSON raw inspector in the Raw panel.

This supports deeper debugging and review.

## What it deliberately does not add

- no runtime changes
- no transfer behavior changes
- no SpatialWorldMedium update behavior changes
- no file download side effect
- no persistence side effect
- no network upload
- no auto-fix
- no AETERNA internal buffer coupling
- no center-buffer injection
- no AeternaNetwork / dynamicCore / livingState changes
- no life-like framing

## Valid language

Valid:

```text
Observation report exported.
Timeline CSV generated.
Raw inspector rendered.
Summary text generated.
```

Not valid:

```text
AETERNA memory was saved.
AETERNA learned from the export.
AETERNA responded.
AETERNA is alive.
```

## Next phase

A safe next step is:

```text
v4.4 Observation Scenario Harness
```

That phase can generate a repeatable observation report from a small transfer scenario and feed it through the snapshot, transfer, timeline, attribution, anomaly, and export observers without touching runtime internals.
