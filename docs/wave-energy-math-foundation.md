# AETERNA Coherence Emergence v5.0.0 / v5.0.1 / v5.0.2 / v5.0.3 / v5.0.4 Wave Energy Foundation

## Purpose

v5.0.0 starts the v5 wave/coherence route by adding wave-energy math only.

v5.0.1 adds a no-op wave update shell.

v5.0.2 adds local acceleration preview.

v5.0.3 adds a zero-damping leap-frog preview.

v5.0.4 adds local damping with named wave-energy dissipation accounting.

These phases do not try to create coherence. They define the local wave-field state, quadratic energy diagnostics, a no-op step, a read-only acceleration preview, a first conservative wave step, and a damping ledger before drive injection is enabled.

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
local damping ledger
no drive injection yet
no coherence metric yet
```

## What these phases add

- `src/types/waveCapableMedium.ts`
- `src/world/waveCapableMedium.ts`
- `src/world/waveCapableMediumLeapfrogPreview.ts`
- `src/world/waveCapableMediumDampingLedger.ts`
- `src/tests/world/waveCapableMedium.test.ts`
- `src/tests/world/waveCapableMediumLeapfrogPreview.test.ts`
- `src/tests/world/waveCapableMediumDampingLedger.test.ts`

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

The real/imag fields define a complex scalar field. The velocity fields define its time derivative for leap-frog updates. The destination fields are named accounting destinations.

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

## v5.0.2 Local acceleration preview

`deriveWaveAccelerationPreview` reads the local force implied by the current wave state:

```text
acceleration = localElasticCoupling * neighborDeltaSum - localWaveDamping * velocity
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

Zero field and uniform velocity cases must keep the wave-energy ledger closed. Nontrivial finite-amplitude cases are allowed to show numerical energy residuals at this stage; those residuals are diagnostic and are not hidden.

## v5.0.4 Local damping ledger

`updateWaveCapableMediumDampingLedger` allows local damping after the conservative leap-frog part.

The step is:

```text
conservative leap-frog position/velocity proposal
energyBeforeDamping = wave energy after conservative proposal
dampingFactor = clamp(1 - localWaveDamping * dt, 0, 1)
velocityAfter = velocityBeforeDamping * dampingFactor
energyAfter = wave energy after damping
dissipatedEnergy = energyBeforeDamping - energyAfter
waveEnergyDissipationField += dissipatedEnergy / cellCount
ledger checks energyBeforeDamping -> energyAfter with dissipatedEnergy
```

This is intentionally local and accounting-first:

```text
localWaveDamping is a material-like coefficient
removed wave energy goes to a named destination field
residue and outflow remain untouched
no drive input
no coherence metric feedback
```

## What this deliberately does not add

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
Zero-damping leap-frog preview advanced the wave field.
Local damping moved wave energy into the named dissipation field.
Elastic energy is derived from local neighbor differences.
```

## Next phase

A safe next step is:

```text
v5.1.0 Phase-carrying Drive State
```

That phase can add complex drive fields and injection masks without connecting them to the wave medium yet.
