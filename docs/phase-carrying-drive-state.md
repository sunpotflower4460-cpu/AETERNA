# AETERNA Coherence Emergence v5.1.0 / v5.1.1 / v5.1.2 / v5.1.3 Phase-carrying Drive Route

## Purpose

v5.1.0 starts the phase-carrying drive route.

v5.1.1 adds a periodic real/imag phase-drive waveform on the drive side only.

v5.1.2 adds drive-side energy observation and a no-medium-transfer ledger check.

v5.1.3 adds the first drive-to-wave-medium boundary skeleton, with effective coupling held at zero.

These phases create the structure for a complex external drive field, local injection mask, rotating drive waveform, drive-side diagnostics, and a checked transfer boundary.

v5.1.3 still does not transfer anything into the wave medium.

They do not try to create coherence.

## Position

```text
v5.0.x
  wave-capable medium foundation

v5.1.x
  phase-carrying external drive route
```

The current drive-side route contains:

```text
complex drive fields
spatial phase field
injection mask
creation diagnostics
periodic real/imag drive waveform
drive-side energy observation
no-medium-transfer ledger check
drive-to-wave transfer boundary skeleton
effective drive coupling = 0
no applied wave-medium transfer yet
no coherence metric yet
```

## What these phases add

- `src/types/phaseCarryingDrive.ts`
- `src/types/phaseDriveEnergyObservation.ts`
- `src/types/phaseDriveToWaveTransfer.ts`
- `src/world/phaseCarryingDrive.ts`
- `src/observer/phaseDriveEnergyObservation.ts`
- `src/observer/phaseDriveToWaveTransferSkeleton.ts`
- `src/tests/world/phaseCarryingDrive.test.ts`
- `src/tests/observer/phaseDriveEnergyObservation.test.ts`
- `src/tests/observer/phaseDriveToWaveTransferSkeleton.test.ts`

## State

`PhaseCarryingDriveState` contains:

```text
driveRealField
driveImagField
spatialPhaseField
injectionMask
tick
```

The drive real/imag fields are initialized to zero in v5.1.0.

v5.1.1 may fill them with a periodic real/imag waveform, but the waveform remains on the drive side.

## Spatial phase default

The spatial phase field must not silently default to all zero.

If no phase field is provided, v5.1.0 creates a deterministic seeded phase field:

```text
spatialPhaseMode = seededNoise
```

This prevents accidental same-phase full-field drive in later phases.

A provided all-same phase field is allowed, but the report emits a warning.

## Injection mask default

The injection mask must not silently default to all cells.

If no mask is provided, v5.1.0 creates a center-point mask:

```text
injectionMaskMode = centerPoint
```

A full-field mask is allowed, but the report emits a warning.

A zero mask is allowed, but the report emits a warning.

## Diagnostics

`derivePhaseCarryingDriveDiagnostic` reports:

```text
driveMagnitudeTotal
driveMagnitudeMax
activeInjectionCellCount
injectionMaskTotal
phaseSpread
warnings
metricKind = derived
```

This is read-only.

It does not mutate the drive state.

## v5.1.1 Periodic phase drive

`updatePeriodicPhaseDrive` creates a rotating real/imag drive waveform from local spatial phase:

```text
baseTurns = (tick + phaseOffsetTicks) / periodTicks
cellTurns = baseTurns + spatialPhaseField[cell]
driveRealField[cell] = amplitude[cell] * cos(2π * cellTurns)
driveImagField[cell] = amplitude[cell] * sin(2π * cellTurns)
```

By default, amplitude is weighted by the injection mask:

```text
amplitude[cell] = driveAmplitude * injectionMask[cell]
```

This keeps the waveform local by default and prevents accidental full-field driving.

Disabling mask weighting is allowed for experiments, but emits a warning.

The update clones state before writing, so the previous drive state is not mutated.

## v5.1.2 Drive energy observation

`derivePhaseDriveEnergyObservation` reads the drive-side field only:

```text
driveEnergy[cell] = 0.5 * (driveRealField[cell]^2 + driveImagField[cell]^2)
maskWeightedDriveEnergy[cell] = driveEnergy[cell] * injectionMask[cell]
```

It reports:

```text
driveEnergyTotal
driveEnergyMax
maskWeightedDriveEnergyTotal
activeDriveCellCount
activeMaskedDriveCellCount
finiteCellCount
nonFiniteCellCount
warnings
metricKind = derived
```

This is observation only.

It does not mutate the drive state.

It does not touch the wave medium.

`derivePhaseDriveNoMediumTransferCheck` checks that, at this phase, nothing is transferred into the wave medium:

```text
mediumInputEnergy = 0
driveToMediumTransferredEnergy = 0
ledger.status = closed
```

The observed drive energy is kept as a diagnostic value. It is not counted as medium input until a later transfer phase explicitly models the work term.

## v5.1.3 Drive-to-wave transfer skeleton

`derivePhaseDriveToWaveTransferSkeleton` creates the first checked boundary between the phase drive and wave medium.

It observes both sides:

```text
driveObservation = derivePhaseDriveEnergyObservation(driveState)
mediumEnergyBefore = deriveWaveEnergySnapshot(mediumState)
mediumEnergyAfter = deriveWaveEnergySnapshot(mediumState)
```

Then it explicitly keeps the effective coupling at zero:

```text
requestedDriveCoupling = user/config value
effectiveDriveCoupling = 0
candidateMaskedDriveEnergy = driveObservation.maskWeightedDriveEnergyTotal
transferredEnergy = 0
mediumInputEnergy = 0
mediumChangedFieldCount = 0
```

The ledger checks that the wave medium received no input and did not change:

```text
inputEnergy = 0
internalEnergyBefore = mediumEnergyBefore.totalEnergy
internalEnergyAfter = mediumEnergyAfter.totalEnergy
boundaryExchangeEnergy = 0
ledger.status = closed
```

If a nonzero requested coupling is passed, the skeleton records it and emits a warning, but still applies zero effective coupling.

This creates the transfer boundary without yet applying a work term.

## What this deliberately does not add

- no applied drive-to-medium transfer
- no nonzero effective drive coupling
- no transfer work calculation
- no wave medium mutation
- no coherence observation metrics
- no runtime dynamics changes
- no transfer behavior changes
- no SpatialWorldMedium update behavior changes
- no AETERNA internal buffer coupling
- no center-buffer injection
- no life-like framing

## Forbidden result-coded terms

Do not add result-coded controls such as:

```text
coherenceTarget
phaseLockingRate
naturalFrequencyPull
desiredOrderParameter
driveSyncStrength
globalDecayRate
```

The drive route may define local phase, local mask, local amplitude, diagnostics, and later local coupling, but it must not define a target global order outcome.

## Valid language

```text
Phase-carrying drive state created.
Spatial phase field initialized.
Injection mask initialized.
Drive diagnostic derived.
Periodic phase drive waveform generated.
Drive-side energy observation derived.
No-medium-transfer ledger closed.
Drive-to-wave transfer boundary skeleton checked.
```

## Invalid language

```text
Coherence was created.
The drive synchronized the medium.
AETERNA became coherent.
AETERNA is alive.
```

## Next phase

A safe next step is:

```text
v5.1.4 Drive-to-Wave Work Term Preview
```

That phase can introduce a nonzero effective drive coupling in a separate preview path and account any medium energy change through an explicit work term.
