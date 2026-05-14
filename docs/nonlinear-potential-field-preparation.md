# AETERNA v6.0 / v6.1 / v6.2 / v6.3 / v6.4 Nonlinear Potential Field Route

## Purpose

v6.0 prepares a local nonlinear-potential-field observation layer for the wave-capable medium.

v6.1 adds a read-only nonlinear potential force preview. It converts the v6.0 local potential gradient into a negative-gradient force candidate, but it does not apply that force to acceleration, velocity, position, damping, drive, synchronization, or any runtime update.

v6.2 adds a read-only nonlinear potential acceleration preview. It converts the v6.1 force candidate into an acceleration candidate using a preview-only positive mass divisor, but it does not integrate acceleration into velocity or position.

v6.3 adds a boundary audit for the v6.0-v6.2 preview chain. It checks whether the chain remains read-only, whether every preview report declares zero medium changes, and whether non-finite preview cells are visible as warnings.

v6.4 adds an applied update proposal. It proposes future velocity-delta candidates and required mutation/accounting boundaries, but it does not mutate the medium and does not authorize runtime application.

These phases are intentionally read-only through v6.4.

## Position

```text
v5.0.x wave-capable medium foundation
v5.1.x phase-carrying external drive route
v6.0   nonlinear potential field preparation
v6.1   nonlinear potential force preview
v6.2   nonlinear potential acceleration preview
v6.3   nonlinear potential boundary audit
v6.4   nonlinear potential applied update proposal
```

v6.x begins a new route after the v5.1 transfer boundary audit.

v6.0, v6.1, v6.2, v6.3, and v6.4 should be treated as preparation/preview/audit/proposal layers, not as the first nonlinear runtime.

## Added files

v6.0 added:

- `src/types/nonlinearPotentialField.ts`
- `src/observer/nonlinearPotentialFieldPreparation.ts`
- `src/tests/observer/nonlinearPotentialFieldPreparation.test.ts`

v6.1 added:

- `src/observer/nonlinearPotentialForcePreview.ts`
- `src/tests/observer/nonlinearPotentialForcePreview.test.ts`
- `NonlinearPotentialForcePreviewConfig`
- `NonlinearPotentialForcePreviewReport`

v6.2 added:

- `src/observer/nonlinearPotentialAccelerationPreview.ts`
- `src/tests/observer/nonlinearPotentialAccelerationPreview.test.ts`
- `NonlinearPotentialAccelerationPreviewConfig`
- `NonlinearPotentialAccelerationPreviewReport`

v6.3 added:

- `src/observer/nonlinearPotentialBoundaryAudit.ts`
- `src/tests/observer/nonlinearPotentialBoundaryAudit.test.ts`
- `NonlinearPotentialBoundaryAuditStatus`
- `NonlinearPotentialBoundaryAuditReport`

v6.4 adds:

- `src/observer/nonlinearPotentialAppliedUpdateProposal.ts`
- `src/tests/observer/nonlinearPotentialAppliedUpdateProposal.test.ts`
- `NonlinearPotentialAppliedUpdateProposalStatus`
- `NonlinearPotentialAppliedUpdateProposalConfig`
- `NonlinearPotentialAppliedUpdateProposalReport`

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

## v6.2 Acceleration preview definition

v6.2 reads the v6.1 force preview and derives a local acceleration candidate:

```text
previewAccelerationReal = previewForceReal / effectivePreviewMass
previewAccelerationImag = previewForceImag / effectivePreviewMass
```

`previewMass` is not a target order parameter. It is a preview-only positive mass divisor for checking how a later local force term might be converted into acceleration.

If `previewMass` is non-finite, v6.2 treats it as `1` and emits a warning.

If `previewMass` is zero or negative, v6.2 clamps it to `1` and emits a warning.

v6.2 recomputes finite/non-finite cell counts after mass division so overflow in acceleration preview remains visible.

## v6.3 Boundary audit definition

v6.3 runs the nonlinear potential preview chain and audits three boundaries:

```text
actual medium field changes
preview-reported medium changes
non-finite preview diagnostics
```

It returns one of three statuses:

```text
pass    = no medium change, no preview-reported medium change, no warnings
warning = read-only boundary held, but numeric or normalization warnings exist
fail    = actual medium fields changed or preview reports declare medium changes
```

`appliedRuntimeReady` is always `false` in v6.3. This audit locks the current boundary; it does not authorize runtime application.

## v6.4 Applied update proposal definition

v6.4 reads the v6.3 boundary audit and proposes future velocity-delta candidates only when the audit status is `pass`.

```text
proposedVelocityDeltaReal = previewAccelerationReal * effectiveProposedDt * effectiveProposedVelocityUpdateScale
proposedVelocityDeltaImag = previewAccelerationImag * effectiveProposedDt * effectiveProposedVelocityUpdateScale
```

If the boundary audit returns `warning` or `fail`, the proposal is blocked and all proposed velocity-delta fields remain zero.

`proposedDt` and `proposedVelocityUpdateScale` are proposal-only parameters. They are not runtime parameters in v6.4.

v6.4 explicitly lists future allowed mutation fields:

```text
mediumRealVelocityField
mediumImagVelocityField
tick
```

v6.4 explicitly lists forbidden mutation fields:

```text
mediumRealField
mediumImagField
waveEnergyDissipationField
waveEnergyResidueField
waveEnergyOutflowField
phaseDriveState
internalBuffers
```

v6.4 also lists required future energy accounting fields before any applied update can be accepted.

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

## v6.2 Report fields

`deriveNonlinearPotentialAccelerationPreview` returns:

```text
source = nonlinear-potential-acceleration-preview
mediumTick
forcePreview
requestedPreviewMass
effectivePreviewMass
previewAccelerationRealField
previewAccelerationImagField
maxPreviewAccelerationMagnitude
previewAccelerationEnergyProxy
finiteCellCount
nonFiniteCellCount
mediumChangedFieldCount
warnings
metricKind = derived
```

`mediumChangedFieldCount` must remain zero in this phase.

The preview acceleration field is not counted as medium input energy, because no medium mutation occurs in v6.2.

## v6.3 Report fields

`deriveNonlinearPotentialBoundaryAudit` returns:

```text
source = nonlinear-potential-boundary-audit
mediumTick
accelerationPreview
boundaryAuditStatus
appliedRuntimeReady
mediumFieldChangeCount
previewReportChangeCount
boundaryViolationCount
numericWarningCount
findings
warnings
mediumChangedFieldCount
metricKind = derived
```

`mediumChangedFieldCount` must remain zero in this phase.

## v6.4 Report fields

`deriveNonlinearPotentialAppliedUpdateProposal` returns:

```text
source = nonlinear-potential-applied-update-proposal
mediumTick
boundaryAudit
proposalStatus
appliedRuntimeReady
requestedProposedDt
effectiveProposedDt
requestedProposedVelocityUpdateScale
effectiveProposedVelocityUpdateScale
proposedVelocityDeltaRealField
proposedVelocityDeltaImagField
maxProposedVelocityDeltaMagnitude
proposedVelocityDeltaEnergyProxy
proposedTickDelta
allowedMutationFields
forbiddenMutationFields
requiredEnergyAccounting
findings
warnings
mediumChangedFieldCount
metricKind = derived
```

`mediumChangedFieldCount` must remain zero in this phase.

`appliedRuntimeReady` must remain `false` in this phase.

## Boundary rules

v6.0, v6.1, v6.2, v6.3, and v6.4 must not:

- mutate `WaveCapableMediumState`
- increment medium `tick`
- write into velocity fields
- write into position fields
- write into dissipation, residue, or outflow fields
- apply nonlinear acceleration
- apply nonlinear force
- integrate acceleration into velocity
- integrate velocity into position
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
local field state -> local potential -> local gradient -> preview force -> preview acceleration -> boundary audit -> applied update proposal -> later audited applied update
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
Nonlinear potential acceleration preview derived.
Preview acceleration was computed from preview force divided by preview mass.
Nonlinear potential boundary audit derived.
Nonlinear potential applied update proposal derived.
Medium state was not mutated.
No nonlinear acceleration was applied in v6.4.
Applied nonlinear runtime remains locked behind a later audited phase.
```

## Invalid language

```text
The nonlinear field created coherence.
The potential synchronized the medium.
The gradient pulled the system toward a target state.
The force preview changed the medium.
The acceleration preview changed velocity.
The boundary audit authorized runtime application.
The applied update proposal changed the medium.
The medium became more alive.
The nonlinear field is now a life force.
```

## Next safe phase

A safe next phase is:

```text
v6.5 Nonlinear Potential Applied Velocity Update
```

That phase may implement the first applied nonlinear velocity update only if it includes explicit mutation boundaries, energy accounting, tick behavior, rollback-safe tests, and a closed ledger.
