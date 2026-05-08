# AETERNA-NATURAL v2.9.4 Ledger runScenario Minimal Wiring

## Purpose

v2.9.4 adds the smallest safe connection between existing `runScenario` output and Energy Ledger visibility.

It follows the agreed sequence:

```text
v2.7 Now Summary Panel
v2.8 Energy Reality Audit
v2.9 Energy Ledger / ConservationResidual
v2.9.2 Ledger Visibility
v2.9.3 Ledger Visibility in Scenario Metrics
v2.9.4 runScenario minimal wiring
v3.0 Local Conservation Substrate
v3.1 Spatial World Medium
v3.2 ExternalDriveField = 0
v3.3 Steady ExternalDrive
v3.4 Supply Cutoff Test
v3.5 PeriodicDrive
```

## What this phase adds

- `src/experiments/runScenarioWithEnergyLedgerVisibility.ts`
- `src/tests/experiments/runScenarioWithEnergyLedgerVisibility.test.ts`

The wrapper runs the existing `runScenario` and attaches `energyLedgerVisibility` as observer-side output.

## Important boundary

This is not a runtime dynamics change.

Allowed:

- run the existing scenario runner
- read the returned metrics frames
- attach ledger visibility status as observer-side reporting
- show that current frames are `insufficient` until real accounting terms are instrumented

Not allowed:

- modify AeternaNetwork
- modify dynamicCore
- modify livingState
- infer input/dissipation/actuation/residue from proxy metrics
- add ExternalDriveField
- add Spatial World Medium
- add steady drive / pulse / periodic drive
- claim visual movement equals verified modeled energy flow

## Why the wrapper currently reports insufficient

The current wrapper deliberately calls `deriveEnergyLedger` without inventing missing flow terms.

This means current scenario frames should normally report:

```text
insufficient
```

That is not a failure. It is the point of this phase.

AETERNA may visibly move while the ledger is insufficient. That means visible/proxy dynamics and verified modeled energy flow are still distinct.

## Next step

After this, a later phase may instrument real accounting terms:

- inputEnergy
- dissipatedEnergy
- actuationOutputEnergy
- residueConvertedEnergy
- clampLossOrOverflow
- measuredOutflowEnergy

Until then, the correct display remains:

```text
Energy flow is not yet verified. Current values are diagnostic/proxy readings.
```
