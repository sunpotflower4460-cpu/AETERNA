# AETERNA Coherence Emergence v5.0.0 Wave Energy Math Foundation

## Purpose

v5.0.0 starts the v5 wave/coherence route by adding wave-energy math only.

This phase does not try to create coherence.

It only defines the local wave-field state and a quadratic energy diagnostic that later wave updates must conserve or account for.

## Position

```text
v3.x
  energy transfer rail

v4.x
  observation layer

v5.x
  wave-capable medium and coherence observation route
```

v5.0.0 is the smallest safe first step:

```text
wave fields
wave energy calculation
wave-energy ledger check
no wave update yet
no drive injection yet
no coherence metric yet
```

## What this phase adds

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

The real/imag fields define a complex scalar field.

The velocity fields define its time derivative for later leap-frog updates.

The destination fields are named accounting destinations for later phases.

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

Kinetic energy is computed from local real/imag velocity components.

Elastic energy is computed from local same-field differences across torus-neighbor edges.

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

The accounting equation remains:

```text
inputEnergy
= internalAccumulationDelta
+ dissipatedEnergy
+ actuationOutputEnergy
+ residueConvertedEnergy
+ clampLossOrOverflow
+ measuredOutflowEnergy
± tolerance
```

For v5.0.0, actuation output is always zero.

A zero-input zero-change wave-energy ledger must close.

A wave-energy decrease can close only when it is accounted into named destinations such as dissipation.

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

Valid:

```text
Wave energy snapshot calculated.
Wave-energy ledger check closed.
Elastic energy is derived from local neighbor differences.
```

Not valid:

```text
Coherence was created.
AETERNA became coherent.
AETERNA is alive.
AETERNA is breathing.
```

## Next phase

A safe next step is:

```text
v5.0.1 Wave-capable Medium State No-op Step
```

That phase can add a zero/no-op wave update shell that proves zero fields remain zero and existing transfer rails are not touched before leap-frog dynamics are enabled.
