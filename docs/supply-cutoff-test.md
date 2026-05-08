# AETERNA-NATURAL v3.4 Supply Cutoff Test

## Purpose

v3.4 verifies what happens when the steady external drive is stopped.

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

## Core rule

The cutoff phase must not implement:

```text
if supply is zero, then decay
```

Instead, accepted input becomes zero and existing stored drive is carried forward unless there is an explicit destination term.

In this phase there is still no destination for the stored drive, so stored drive should remain.

That is a valid observation.

## What this phase adds

- `SupplyCutoffStepReport`
- `SupplyCutoffStepResult`
- `updateSupplyCutoffDrive`
- cutoff tests in `src/tests/world/externalDriveField.test.ts`

## Ledger behavior

During cutoff:

```text
inputEnergy = 0
internalEnergyBefore = stored drive before cutoff
internalEnergyAfter = stored drive after cutoff
dissipatedEnergy = 0
actuationOutputEnergy = 0
residueConvertedEnergy = 0
```

Because no destination terms exist yet, the ledger closes only if stored drive does not secretly disappear.

## Valid observation

If stored drive remains after cutoff, that is expected.

It means no special decay rule has been added.

A later phase may add explicit transfer, dissipation, or outflow from drive storage, but that must be modeled as a named destination and accounted in the ledger.

## What it deliberately does not add

- no forced decay
- no supply-zero outcome rule
- no pulse drive
- no periodic drive
- no rhythm/modulation
- no coupling into SpatialWorldMedium yet
- no coupling into AETERNA internal buffers
- no center-buffer injection
- no AeternaNetwork / dynamicCore / livingState changes
- no visual or life-like effect
- no energy-flow proof claim through AETERNA

## Next phase

v3.5 PeriodicDrive should come only after cutoff behavior is verified.

PeriodicDrive should compare input waveform, field storage, and output/transfer waveform explicitly. It must not be introduced as a life-like rhythm or heartbeat.
