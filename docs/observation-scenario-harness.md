# AETERNA Observation Layer v4.4 Observation Scenario Harness

## Purpose

v4.4 adds a small repeatable observation scenario harness.

The goal is to run one simple transfer scenario and feed the result through the full Observation Layer pipeline:

```text
snapshot
transfer observation
timeline
flow attribution
anomaly detector
export
```

This is observation-side experiment wiring only.

It does not change runtime behavior.

## Position

```text
AETERNA Core / Substrate
  existing ExternalDriveField and SpatialWorldMedium primitives

Observation Layer
  scenario harness, snapshot, transfer observation, timeline, attribution, anomaly, export

Life / Organism Layer
  not touched in this phase
```

## What this phase adds

- `src/experiments/observationScenarioHarness.ts`
- `src/tests/experiments/observationScenarioHarness.test.ts`

## Scenario steps

The harness performs a minimal deterministic sequence:

```text
1. create ExternalDriveField
2. apply steady external drive
3. create empty SpatialWorldMedium
4. take baseline field snapshots
5. create baseline timeline frame
6. transfer stored drive to SpatialWorldMedium using v3.7 transfer
7. observe transfer pair ledger
8. take final field snapshots
9. create transfer timeline frame
10. derive timeline summary
11. derive flow attribution
12. derive anomaly report
13. export JSON / CSV / summary text
```

## What it deliberately does not run

The harness does not run `updateSpatialWorldMedium`.

That means it does not apply:

```text
dissipation
residue conversion
outflow
membrane exchange
```

This keeps v4.4 focused on transfer observation only.

A later phase can observe SpatialWorldMedium after-transfer behavior separately.

## Output

The harness returns:

```text
report
frames
exports.json
exports.csv
exports.summaryText
```

The report is a normal `ObservationReport` and can be rendered by the ObservationShell.

## Valid expectations

For the default scenario:

```text
pairLedgerStatus = closed
transferEnergy > 0
timelineFrames = 2
unknownChangeCount = 0
anomalyReport has no warning/critical anomaly
```

## What it deliberately does not add

- no runtime changes
- no transfer behavior changes
- no SpatialWorldMedium update behavior changes
- no medium dissipation/residue/outflow/membrane behavior
- no UI state persistence
- no network upload
- no file download side effect
- no auto-fix
- no AETERNA internal buffer coupling
- no center-buffer injection
- no AeternaNetwork / dynamicCore / livingState changes
- no life-like framing

## Valid language

Valid:

```text
Observation scenario report generated.
Transfer scenario passed through the observation pipeline.
Observation exports generated.
```

Not valid:

```text
AETERNA responded to the transfer.
AETERNA learned from the scenario.
AETERNA is alive.
```

## Next phase

A safe next step is:

```text
v4.5 Observation UI Sample / Demo Report
```

That phase can render the harness report in the responsive ObservationShell and make it easier to visually inspect on mobile and desktop.
