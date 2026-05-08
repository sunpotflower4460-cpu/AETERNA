# AETERNA-NATURAL v3.3 Steady ExternalDrive

## Purpose

v3.3 introduces a small constant accepted drive into the external drive field.

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

This is the first phase where accepted external drive can be non-zero.

It is still not a pulse drive and not a periodic drive.

The drive is accepted into `ExternalDriveField.driveField` only. It does not yet couple into SpatialWorldMedium or AETERNA runtime buffers.

## What this phase adds

- `SteadyExternalDriveConfig`
- `SteadyExternalDriveStepReport`
- `SteadyExternalDriveStepResult`
- `updateSteadyExternalDrive`
- steady-drive tests in `src/tests/world/externalDriveField.test.ts`

## Core rule

In v3.3:

```text
inputEnergy = acceptedDriveEnergy
internalAccumulationDelta = increase in driveField storage
```

The ledger should close because the accepted drive remains stored in the external drive field.

## What it deliberately does not add

- no pulse drive
- no periodic drive
- no rhythm or modulation
- no coupling into SpatialWorldMedium yet
- no coupling into AETERNA internal buffers
- no center-buffer injection
- no AeternaNetwork / dynamicCore / livingState changes
- no visual or life-like effect
- no energy-flow proof claim through AETERNA

## Why this matters

v3.2 proved the external drive structure can exist while accepting zero energy.

v3.3 allows a simple steady input, but only into the external drive field itself. This keeps the first non-zero accepted drive small, explicit, ledgered, and isolated.

## Valid observation

If the drive field accumulates while nothing else changes, that is expected.

The structure is now receiving steady input, but AETERNA itself is not yet receiving that input.

## Next phase

v3.4 Supply Cutoff Test should verify that when steady input is stopped, no special outcome rule forces decay.

If stored drive remains because no destination terms exist, that is a valid observation.

A later phase may introduce transfer from ExternalDriveField to SpatialWorldMedium, but that should be explicit and ledgered.
