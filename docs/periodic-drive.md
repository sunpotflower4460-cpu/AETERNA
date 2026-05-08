# AETERNA-NATURAL v3.5 PeriodicDrive

## Purpose

v3.5 introduces an explicit periodic input waveform into the external drive field.

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

PeriodicDrive is a waveform accounting instrument.

It is not a heartbeat, breath, life rhythm, consciousness signal, or proof that energy is flowing through AETERNA.

The waveform is accepted into `ExternalDriveField.driveField` only. It does not yet couple into SpatialWorldMedium or AETERNA runtime buffers.

## What this phase adds

- `PeriodicExternalDriveConfig`
- `PeriodicExternalDriveStepReport`
- `PeriodicExternalDriveStepResult`
- `updatePeriodicExternalDrive`
- periodic-drive tests in `src/tests/world/externalDriveField.test.ts`

## Core rule

For each step:

```text
waveformValuePerCell = (baseDrivePerCell + amplitudeDrivePerCell * sine01) * dt
inputEnergy = waveformValuePerCell * cellCount
internalAccumulationDelta = increase in driveField storage
transferOutputEnergy = 0
```

The ledger should close because the accepted periodic input remains stored in the external drive field.

## What it deliberately does not add

- no coupling into SpatialWorldMedium yet
- no coupling into AETERNA internal buffers
- no center-buffer injection
- no AeternaNetwork / dynamicCore / livingState changes
- no visual or life-like effect
- no breath / heartbeat / life rhythm framing
- no energy-flow proof claim through AETERNA

## Valid observation

If `driveField` rises according to a periodic waveform while nothing else changes, that is expected.

At this phase, the correct comparison is:

```text
input waveform
field storage waveform
transfer/output waveform = 0
```

This makes the absence of transfer explicit rather than hiding it behind visuals.

## Next direction

After v3.5, a later phase can introduce an explicit, ledgered transfer from ExternalDriveField into SpatialWorldMedium.

That should be a separate phase because it changes the model from isolated input storage to coupled medium flow.
