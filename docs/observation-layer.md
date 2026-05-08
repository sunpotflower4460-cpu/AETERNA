# AETERNA Observation Layer v0.2

## Purpose

The Observation Layer is an independent observation instrument.

It is not the life/organism layer.

It reads, measures, compares, records, and displays what happened without mutating runtime state.

## Layer boundary

```text
AETERNA Core / Substrate
  fields, transfer, storage, conservation

Observation Layer
  read-only measurement, summaries, responsive display, audit wording

Life / Organism Layer
  not touched in this phase
```

## Design principle

```text
same observation data
responsive presentation
```

The observation report should be shared across layouts. Mobile and desktop only change presentation.

## Responsive layout rules

```text
< 768px
  mobile layout
  bottom-tab style structure
  one purpose per screen
  card-first display
  warnings easy to reach

768px - 1199px
  tablet layout
  dashboard-style structure can be used with fewer columns

>= 1200px
  desktop observatory layout
  multi-panel dashboard
  snapshot / ledger / audit / raw inspector can be viewed together
```

## v3.8 scope

v3.8 adds only the foundation:

- `ObservationReport` types
- `FieldSnapshot` types
- `FieldSnapshotObserver`
- responsive shell renderer
- mobile tabs structure
- desktop dashboard structure
- read-only tests

It does not yet add full transfer panel, timeline, attribution, anomaly detector, or export.

Those are later phases.

## Field snapshot

A field snapshot reports:

```text
fieldName
total
min
max
mean
nonZeroCount
cellCount
peakCellIndex
distributionSpread
metricKind = measured
```

The observer must not mutate the input field.

Non-finite values are treated as zero in the snapshot and must not become hidden energy.

## UI wording guard

Do not use life-like claims in the observation layer.

Avoid:

```text
alive
breath
heartbeat
pulse
metabolic
lifeDrive
呼吸
鼓動
生命
心拍
```

Use:

```text
Observation only
measured
derived
ledger
field snapshot
storage
transfer
residual
boundary exchange
unverified
```

## Next phases

```text
v3.9 Transfer Observation Panel
v4.0 Observation Timeline
v4.1 Flow Attribution Observer
v4.2 Observation Anomaly Detector
v4.3 Raw Inspector / Export
```

## Important boundary

This phase does not change:

- AeternaNetwork
- dynamicCore
- livingState
- runtime dynamics
- internal buffers
- transfer behavior
- SpatialWorldMedium update rules

It only adds read-only observation foundation and responsive presentation structure.
