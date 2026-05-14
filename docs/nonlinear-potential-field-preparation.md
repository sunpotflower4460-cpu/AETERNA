# AETERNA v6.0 Nonlinear Potential Field Preparation

## Purpose

v6.0 prepares a local nonlinear-potential-field observation layer for the wave-capable medium.

This phase is intentionally read-only. It derives local potential energy and gradient fields from the current medium position field, but it does not apply those gradients as force, acceleration, damping, drive, synchronization, or any runtime update.

## Position

```text
v5.0.x wave-capable medium foundation
v5.1.x phase-carrying external drive route
v6.0   nonlinear potential field preparation
```

v6.0 begins a new route after the v5.1 transfer boundary audit.

It should be treated as a preparation layer, not as the first nonlinear runtime.

## Added files

- `src/types/nonlinearPotentialField.ts`
- `src/observer/nonlinearPotentialFieldPreparation.ts`
- `src/tests/observer/nonlinearPotentialFieldPreparation.test.ts`

## Local potential definition

For each cell, v6.0 reads the complex medium position field:

```text
r² = mediumRealField[cell]² + mediumImagField[cell]²
```

Then it derives a local quadratic-quartic potential:

```text
V(cell) = 0.5 * localQuadraticCoefficient * r²
        + 0.25 * localQuarticCoefficient * r²²
```

The derived local gradient is:

```text
gradientScale = localQuadraticCoefficient + localQuarticCoefficient * r²
gradientReal = gradientScale * mediumRealField[cell]
gradientImag = gradientScale * mediumImagField[cell]
```

These values are diagnostic outputs only in v6.0.

## Report fields

`deriveNonlinearPotentialFieldPreparation` returns:

```text
source = nonlinear-potential-field-preparation
mediumTick
potentialEnergyTotal
potentialEnergyMax
potentialEnergyField
gradientRealField
gradientImagField
maxGradientMagnitude
gradientEnergyProxy
finiteCellCount
nonFiniteCellCount
mediumChangedFieldCount
warnings
metricKind = derived
```

`mediumChangedFieldCount` must remain zero in this phase.

## Boundary rules

v6.0 must not:

- mutate `WaveCapableMediumState`
- increment medium `tick`
- write into velocity fields
- write into position fields
- write into dissipation, residue, or outflow fields
- connect to phase-drive transfer
- connect to AETERNA internal buffers
- define a target order parameter
- define a synchronization target
- claim coherence or life-like behavior

## Why this exists

A nonlinear potential route may later allow the medium to have amplitude-dependent local stiffness. That can be useful for more natural emergence because the medium can have local shape-dependent response rather than a single linear elasticity everywhere.

However, this must remain a material-like local law, not a desired outcome.

The correct direction is:

```text
local field state -> local potential -> local gradient -> later audited force proposal
```

The incorrect direction is:

```text
desired coherence -> target order -> pull the medium toward that target
```

## Valid language

```text
Nonlinear potential field preparation derived.
Local quadratic-quartic potential observed.
Potential gradient field derived as diagnostic output.
Medium state was not mutated.
No nonlinear force was applied in v6.0.
```

## Invalid language

```text
The nonlinear field created coherence.
The potential synchronized the medium.
The gradient pulled the system toward a target state.
The medium became more alive.
The nonlinear field is now a life force.
```

## Next safe phase

A safe next phase is:

```text
v6.1 Nonlinear Potential Force Preview
```

That phase may compute a preview acceleration or force term from the gradient, but it should still remain read-only until a later applied phase explicitly accounts energy and mutation boundaries.
