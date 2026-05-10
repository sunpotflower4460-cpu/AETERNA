# AETERNA Coherence Emergence v5.0.0 / v5.0.1 / v5.0.2 / v5.0.3 Wave Energy Foundation

## Purpose

v5.0.0 starts the v5 wave/coherence route by adding wave-energy math only.

v5.0.1 adds a no-op wave update shell.

v5.0.2 adds local acceleration preview.

v5.0.3 adds a zero-damping leap-frog preview.

These phases do not try to create coherence. They define the local wave-field state, quadratic energy diagnostics, a no-op step, a read-only acceleration preview, and a first conservative wave step before drive injection is enabled.

## Position

```text
v3.x
  energy transfer rail

v4.x
  observation layer

v5.x
  wave-capable medium and coherence observation route
```

The current safe foundation is:

```text
wave fields
wave energy calculation
wave-energy ledger check
no-op step
local acceleration preview
zero-damping leap-frog preview
no drive injection yet
no coherence metric yet
```

## What these phases add

- `src/types/waveCapableMedium.ts`
- `src/world/waveCapableMedium.ts`
- `src/world/waveCapableMediumLeapfrogPreview.ts`
- `src/tests/world/waveCapableMedium.test.ts`
- `src/tests/world/waveCapableMediumLeapfrogPreview.test.ts`

## Wave state

`WaveCapableMediumState` contains:

```text
mediumRealField
mediumImagField
mediumRealVelocityField
mediumImagVelocityField
waveEnergyDissipationField
waveEnergyResidueField
waveEnergyOutflowField
```

The real/imag fields define a complex scalar field. The velocity fields define its time derivative for leap-frog updates. The destination fields are named accounting destinations for later phases.

## Energy definition

The snapshot reports:

```text
kineticEnergy
elasticEnergy
totalEnergy
finiteCellCount
nonFiniteCellCount
metricKind = derived
```

Kinetic energy is computed from local real/imag velocity components. Elastic energy is computed from local same-field differences across torus-neighbor edges.

The elastic coefficient is:

```text
localElasticCoupling
```

This is a local material-like coefficient, not a target outcome.

## Ledger check

`deriveWaveEnergyLedgerCheck` wraps the shared `deriveEnergyLedger` with source:

```text
wave-energy-math-foundation
```

For these foundation phases, actuation output is always zero.

A zero-input zero-change wave-energy ledger must close. A wave-energy decrease can close only when it is accounted into named destinations such as dissipation.

## v5.0.1 No-op step

`updateWaveCapableMediumNoop` does exactly one safe thing:

```text
clone wave state
advance tick by 1
leave every field sample unchanged
derive energy before/after
close the wave-energy ledger
```

The report includes:

```text
tick
energyBefore
energyAfter
energyCheck
changedFieldCount
warnings
metricKind = derived
```

`changedFieldCount` must remain zero because the step is not a wave update. This lets later phases add real dynamics behind a tested step boundary.

## v5.0.2 Local acceleration preview

`deriveWaveAccelerationPreview` reads the local force implied by the current wave state:

```text
acceleration = localElasticCoupling * neighborDeltaSum - localWaveDamping * velocity
```

It returns:

```text
realAccelerationField
imagAccelerationField
maxAccelerationMagnitude
accelerationEnergyProxy
finiteCellCount
nonFiniteCellCount
warnings
metricKind = derived
```

This preview is read-only. It does not update position, velocity, energy, or destination fields.

## v5.0.3 Zero-damping leap-frog preview

`updateWaveCapableMediumLeapfrogPreview` applies the tested local acceleration through a velocity-Verlet style step:

```text
velocityHalf = velocity + 0.5 * dt * accelerationBefore
fieldNext = field + dt * velocityHalf
accelerationAfter = acceleration(fieldNext)
velocityNext = velocityHalf + 0.5 * dt * accelerationAfter
```

This phase is conservative-preview only:

```text
localWaveDamping > 0 is rejected with a warning
no drive input
no destination-field accounting
no amplitude clamp side effect
```

The report includes:

```text
tick
energyBefore
energyAfter
accelerationBefore
accelerationAfter
energyCheck
changedFieldCount
warnings
metricKind = derived
```

Zero field and uniform velocity cases must keep the wave-energy ledger closed. Nontrivial finite-amplitude cases are allowed to show numerical energy residuals at this stage; those residuals are diagnostic and are not hidden.

## What this deliberately does not add

- no phase-carrying drive
- no injection mask
- no damping accounting yet
- no amplitude clamp side effect
- no membrane reflection/transmission
- no internal wave substrate
- no coherence observation metrics
- no runtime dynamics changes
- no transfer behavior changes
- no SpatialWorldMedium update behavior changes
- no AETERNA internal buffer coupling
- no center-buffer injection
- no life-like framing

## Forbidden result-coded terms

Do not add result-coded coherence controls such as:

```text
coherenceTarget
phaseLockingRate
naturalFrequencyPull
desiredOrderParameter
globalDecayRate
```

The v5 route may add local material coefficients, but not target-order controls.

## Valid language

```text
Wave energy snapshot calculated.
Wave-energy ledger check closed.
No-op wave step preserved all field samples.
Local acceleration preview calculated from neighbor differences.
Zero-damping leap-frog preview advanced the wave field.
Elastic energy is derived from local neighbor differences.
```

## Next phase

A safe next step is:

```text
v5.0.4 Wave Medium Damping Ledger
```

That phase can allow localWaveDamping and account the energy decrease into named wave-energy destination fields.
