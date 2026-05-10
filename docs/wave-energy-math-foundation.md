# AETERNA Coherence Emergence v5.0.0 / v5.0.1 / v5.0.2 Wave Energy Foundation

## Purpose

v5.0.0 starts the v5 wave/coherence route by adding wave-energy math only.

v5.0.1 adds a no-op wave update shell.

v5.0.2 adds local acceleration preview.

These phases do not try to create coherence. They define the local wave-field state, quadratic energy diagnostics, a no-op step, and a read-only acceleration preview before leap-frog dynamics are enabled.

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
no drive injection yet
no coherence metric yet
```

## What these phases add

- `src/types/waveCapableMedium.ts`
- `src/world/waveCapableMedium.ts`
- `src/tests/world/waveCapableMedium.test.ts`

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

The real/imag fields define a complex scalar field. The velocity fields define its time derivative for later leap-frog updates. The destination fields are named accounting destinations for later phases.

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

It exists so the next phase can add leap-frog dynamics behind a tested local-force calculation.

## What this deliberately does not add

- no leap-frog wave update yet
- no phase-carrying drive
- no injection mask
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
Elastic energy is derived from local neighbor differences.
```

## Next phase

A safe next step is:

```text
v5.0.3 Wave Medium Leap-frog Step Zero-damping Preview
```

That phase can apply the tested local acceleration through a conservative leap-frog step and verify wave-energy behavior without drive injection.
