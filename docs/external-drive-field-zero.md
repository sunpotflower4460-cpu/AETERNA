# AETERNA-NATURAL v3.2 ExternalDriveField = 0

## Purpose

v3.2 introduces the structure of an `ExternalDriveField`, but keeps accepted external input at zero.

This follows the agreed flow:

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

## Position

This phase is still not the external energy hose.

The point is to make the external drive structure exist while proving that the structure itself does not introduce energy.

## What this phase adds

- `src/types/externalDriveField.ts`
- `src/world/externalDriveField.ts`
- `src/tests/world/externalDriveField.test.ts`

## Core rule

In v3.2:

```text
acceptedDriveEnergy = 0
inputEnergy = 0
```

Any attempted non-zero drive is rejected into `rejectedDriveField` and is not accepted into the modeled input ledger.

## Why this matters

A common failure mode would be to create the external drive field and immediately let it move the world.

That would skip the crucial proof step.

This phase instead asks:

```text
Can the external drive structure exist without changing the energy ledger?
```

The correct answer should be yes.

## Fields

`ExternalDriveFieldState` contains:

- `driveField`
- `rejectedDriveField`

`driveField` must remain all zeros in v3.2.

`rejectedDriveField` records attempted non-zero drive values for diagnostics.

## Step report

`ExternalDriveFieldZeroStepReport` contains:

- `inputEnergy`
- `attemptedDriveEnergy`
- `rejectedDriveEnergy`
- `acceptedDriveEnergy`
- `ledger`
- `warnings`

## Ledger behavior

The ledger should close with zero accepted input:

```text
inputEnergy = 0
internalAccumulationDelta = 0
dissipatedEnergy = 0
actuationOutputEnergy = 0
residueConvertedEnergy = 0
```

Attempted non-zero drive is not ledger input. It is rejected and reported separately.

## What it deliberately does not add

- no accepted external supply
- no steady drive
- no pulse drive
- no periodic drive
- no coupling into SpatialWorldMedium
- no coupling into AETERNA internal buffers
- no AeternaNetwork / dynamicCore / livingState changes
- no center-buffer injection
- no visual or life-like effect
- no energy-flow proof claim

## Valid observation

If nothing changes when the field exists, that is the expected valid observation.

The structure exists, but it does not supply energy yet.

## Next phase

v3.3 should introduce Steady ExternalDrive.

Only then should a small constant accepted drive be allowed into the external drive field, and only with explicit EnergyLedger accounting.

Pulse and PeriodicDrive remain later phases.
