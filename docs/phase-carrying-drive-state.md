# AETERNA Coherence Emergence v5.1.0 Phase-carrying Drive State

## Purpose

v5.1.0 starts the phase-carrying drive route.

This phase creates the structure for a complex external drive field and local injection mask.

It does not inject anything into the wave medium yet.

It does not try to create coherence.

## Position

```text
v5.0.x
  wave-capable medium foundation

v5.1.x
  phase-carrying external drive route
```

v5.1.0 only creates the drive-side vessel:

```text
complex drive fields
spatial phase field
injection mask
creation diagnostics
no wave-medium injection yet
no drive waveform yet
no coherence metric yet
```

## What this phase adds

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

That means the structure exists, but no external work is performed.

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

## What this deliberately does not add

- no periodic phase waveform yet
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

The drive route may define local phase, local mask, and later local coupling, but it must not define a target global order outcome.

## Valid language

```text
Phase-carrying drive state created.
Spatial phase field initialized.
Injection mask initialized.
Drive diagnostic derived.
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
v5.1.1 Periodic Phase Drive
```

That phase can add a rotating real/imag drive waveform using local phase information, while still avoiding wave-medium injection.
