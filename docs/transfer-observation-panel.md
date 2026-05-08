# AETERNA Observation Layer v3.9 Transfer Observation Panel

## Purpose

v3.9 makes the v3.7 transfer visible in the Observation Layer.

This phase does not change transfer behavior.

It only observes and displays the transfer pair ledger:

```text
ExternalDriveField sourceOutEnergy
=
SpatialWorldMedium destinationInputEnergy
± tolerance
```

## Position

This is observation-side work only.

It belongs to:

```text
Observation Layer
```

It does not belong to:

```text
Life / Organism Layer
```

## What this phase adds

- `src/observer/transferObservation.ts`
- `src/components/observation/TransferLedgerPanel.ts`
- `src/components/observation/FlowArrowCard.ts`
- transfer observation types in `src/types/observation.ts`
- responsive shell integration
- tests for observer and panels

## TransferObservation

A transfer observation reports:

```text
sourceName
destinationName
sourceOutEnergy
destinationInputEnergy
transferEnergy
residual
signedResidual
pairLedgerStatus
matched
mapping
metricKind = ledger
summaryLine
warnings
```

`metricKind` is `ledger`, not `visual` or `proxy`.

## Mobile presentation

Mobile shows the transfer as cards:

```text
ExternalDriveField
-1.000
↓ 1.000
SpatialWorldMedium
+1.000
Pair Ledger: closed
Residual: 0.000
```

The goal is one purpose per panel: flow first, ledger details separately.

## Desktop presentation

Desktop shows the transfer in the observatory dashboard:

```text
Transfer Pair Ledger
Source Out            1.000000
Destination Input     1.000000
Residual              0.000000
Mapping               same-index
Status                closed
```

The desktop layout can display the flow card, ledger panel, snapshot, audit, and raw inspector together.

## What it deliberately does not add

- no transfer behavior changes
- no SpatialWorldMedium update step
- no timeline
- no flow attribution logic beyond the transfer card
- no anomaly detector
- no AETERNA internal buffer coupling
- no center-buffer injection
- no AeternaNetwork / dynamicCore / livingState changes
- no life-like framing

## Valid language

Valid:

```text
Transfer matched.
Source out equals destination input.
Pair Ledger closed.
Stored drive was transferred into spatial medium storage.
```

Not valid:

```text
AETERNA received energy internally.
AETERNA responded.
AETERNA is breathing.
AETERNA is alive.
```

## Next phase

```text
v4.0 Observation Timeline
```

The next phase should record tick-by-tick observation frames so transfers and field totals can be compared over time.
