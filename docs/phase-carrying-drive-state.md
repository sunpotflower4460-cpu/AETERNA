# AETERNA Coherence Emergence v5.1.0 / v5.1.1 Phase-carrying Drive Route

## Purpose

v5.1.0 starts the phase-carrying drive route.

v5.1.1 adds a periodic real/imag phase-drive waveform on the drive side only.

These phases create the structure for a complex external drive field, local injection mask, and rotating drive waveform.

They do not inject anything into the wave medium yet.

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
no wave-medium injection yet
no drive energy ledger yet
no coherence metric yet
```

## What these phases add

- `src/types/phaseCarryingDrive.ts`
- `src/world/phaseCarryingDrive.ts`
- `src/tests/world/phaseCarryingDrive.test.ts`

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

The report includes:

```text
tickBefore
tickAfter
periodTicks
phaseOffsetTicks
driveAmplitude
applyInjectionMask
activeDriveCellCount
driveMagnitudeTotal
driveMagnitudeMax
warnings
metricKind = derived
```

## What this deliberately does not add

- no drive energy ledger yet
- no drive-to-medium injection
- no injection work calculation
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

The drive route may define local phase, local mask, local amplitude, and later local coupling, but it must not define a target global order outcome.

## Valid language

```text
Phase-carrying drive state created.
Spatial phase field initialized.
Injection mask initialized.
Drive diagnostic derived.
Periodic phase drive waveform generated.
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
v5.1.2 Drive Energy Observation
```

That phase can add drive-side energy diagnostics and ledger checks while still avoiding wave-medium injection.
