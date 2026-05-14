# AETERNA v6.0 / v6.1 Nonlinear Potential Field Route

## Purpose

v6.0 prepares a local nonlinear-potential-field observation layer for the wave-capable medium.

v6.1 adds a read-only nonlinear potential force preview. It converts the v6.0 local potential gradient into a negative-gradient force candidate, but it does not apply that force to acceleration, velocity, position, damping, drive, synchronization, or any runtime update.

These phases are intentionally read-only.

## Position

```text
v5.0.x wave-capable medium foundation
v5.1.x phase-carrying external drive route
v6.0   nonlinear potential field preparation
v6.1   nonlinear potential force preview
```

v6.x begins a new route after the v5.1 transfer boundary audit.

v6.0 and v6.1 should be treated as preparation/preview layers, not as the first nonlinear runtime.

## Added files

v6.0 added:

- `src/types/nonlinearPotentialField.ts`
- `src/observer/nonlinearPotentialFieldPreparation.ts`
- `src/tests/observer/nonlinearPotentialFieldPreparation.test.ts`

v6.1 adds:

- `src/observer/nonlinearPotentialForcePreview.ts`
- `src/tests/observer/nonlinearPotentialForcePreview.test.ts`
- `NonlinearPotentialForcePreviewConfig`
- `NonlinearPotentialForcePreviewReport`

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

## v6.1 Force preview definition

v6.1 reads the v6.0 gradient and derives a local negative-gradient force candidate:

```text
previewForceReal = -effectivePreviewForceScale * gradientReal
previewForceImag = -effectivePreviewForceScale * gradientImag
```

`previewForceScale` is not a target order parameter. It is a local preview-only coefficient for checking the shape and magnitude of a future possible force term.

If `previewForceScale` is non-finite, v6.1 treats it as zero and emits a warning.

If `previewForceScale` is negative, v6.1 clamps it to zero and emits a warning.

## v6.0 Report fields

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

## v6.1 Report fields

`deriveNonlinearPotentialForcePreview` returns:

```text
source = nonlinear-potential-force-preview
mediumTick
preparation
requestedPreviewForceScale
effectivePreviewForceScale
previewForceRealField
previewForceImagField
maxPreviewForceMagnitude
previewForceEnergyProxy
finiteCellCount
nonFiniteCellCount
mediumChangedFieldCount
warnings
metricKind = derived
```

`mediumChangedFieldCount` must remain zero in this phase.

The preview force field is not counted as medium input energy, because no medium mutation occurs in v6.1.

## Boundary rules

v6.0 and v6.1 must not:

- mutate `WaveCapableMediumState`
- increment medium `tick`
- write into velocity fields
- write into position fields
- write into dissipation, residue, or outflow fields
- apply nonlinear acceleration
- apply nonlinear force
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
local field state -> local potential -> local gradient -> preview force -> later audited applied force
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
Nonlinear potential force preview derived.
Preview force was computed from the negative local gradient.
Medium state was not mutated.
No nonlinear force was applied in v6.1.
```

## Invalid language

```text
The nonlinear field created coherence.
The potential synchronized the medium.
The gradient pulled the system toward a target state.
The force preview changed the medium.
The medium became more alive.
The nonlinear field is now a life force.
```

## Next safe phase

A safe next phase is:

```text
v6.2 Nonlinear Potential Acceleration Preview
```

That phase may convert the preview force into a preview acceleration term, but it should still remain read-only until a later applied phase explicitly accounts energy and mutation boundaries.
