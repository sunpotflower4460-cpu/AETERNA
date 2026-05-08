# AETERNA-NATURAL v2.9.3 Ledger Visibility in Scenario Metrics

## Purpose

v2.9.3 adds a small observer-side scenario metrics projection for Energy Ledger visibility.

It preserves the agreed flow:

```text
v2.7 Now Summary Panel
v2.8 Energy Reality Audit
v2.9 Energy Ledger / ConservationResidual
v2.9.2 Ledger Visibility
v2.9.3 Ledger Visibility in Scenario Metrics
v3.0 Local Conservation Substrate
v3.1 Spatial World Medium
v3.2 ExternalDriveField = 0
v3.3 Steady ExternalDrive
v3.4 Supply Cutoff Test
v3.5 PeriodicDrive
```

## What this phase does

This phase adds helper functions that can project `EnergyLedgerState` into scenario-style metric fields:

- `energyLedgerStatus`
- `energyLedgerConservationResidual`
- `energyLedgerMissingTermCount`
- `energyLedgerWarningCount`
- `energyLedgerVerifiedModeledFlow`

It also summarizes ledger visibility over frames:

- insufficient count
- open count
- nearClosed count
- closed count
- verified modeled-flow count
- max / average conservation residual
- max missing term count

## Files

- `src/observer/deriveEnergyLedgerScenarioMetrics.ts`
- `src/tests/observer/deriveEnergyLedgerScenarioMetrics.test.ts`

## Important boundary

This is not a runtime replacement phase.

Allowed:

- read an EnergyLedgerState
- project it into scenario metric fields
- count insufficient/open/closed frames
- format a compact scenario summary line

Not allowed:

- modify AeternaNetwork
- modify dynamicCore
- infer missing energy terms from proxy labels
- add ExternalDriveField
- add Spatial World Medium
- add steady drive / pulse / periodic drive
- claim visual activity is verified energy flow

## Conservative display line

If any frame is insufficient, open, or nearClosed, the conservative display remains:

```text
Energy flow is not yet verified. Current values are diagnostic/proxy readings.
```

This protects the transition period where AETERNA may visually move while the energy ledger is still incomplete.

## Remaining follow-up

A later PR may wire these helper fields into the existing `runScenario` metrics interface.

That wiring should still be observer-side only and should avoid large runtime edits.
