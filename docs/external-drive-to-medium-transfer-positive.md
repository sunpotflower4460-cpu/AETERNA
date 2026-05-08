# AETERNA-NATURAL v3.7 ExternalDrive to SpatialWorldMedium TransferCoefficient > 0

## Purpose

v3.7 is the first phase where stored drive can move from `ExternalDriveField` into `SpatialWorldMedium`.

This follows the staged transfer pattern:

```text
v3.6 transferCoefficient = 0
v3.7 transferCoefficient > 0
```

v3.6 proved that the bridge can exist with zero transfer and a closed pair ledger.

v3.7 enables bounded transfer while keeping the same accounting discipline.

## Core rule

For each same-index cell:

```text
transferRate = min(1, transferCoefficient * dt)
transferAmount[i] = min(source[i], source[i] * transferRate)
nextExternalDriveField[i] = source[i] - transferAmount[i]
nextSpatialWorldMedium[i] = destination[i] + transferAmount[i]
```

The same `transferAmount[i]` is used on both sides.

This is the atomicity rule for this phase.

## Pair Ledger

The transfer pair ledger checks:

```text
sourceOutEnergy = destinationInputEnergy ± tolerance
```

Where:

```text
sourceOutEnergy = externalDriveEnergyBefore - externalDriveEnergyAfter
destinationInputEnergy = mediumEnergyAfter - mediumEnergyBefore
```

The pair ledger must close for a valid transfer.

## Cell mapping

v3.7 still supports only:

```text
cellMapping = same-index
```

That means:

```text
ExternalDriveField.driveField[i]
corresponds to
SpatialWorldMedium.mediumStorageField[i]
```

No interpolation, projection, membrane mapping, or runtime coupling is introduced in this phase.

## What it deliberately does not add

- no SpatialWorldMedium update step is run inside this transfer
- no medium dissipation/residue/outflow is applied here
- no AETERNA internal buffer coupling
- no center-buffer injection
- no AeternaNetwork / dynamicCore / livingState changes
- no visual or life-like effect
- no breath / heartbeat / life rhythm framing
- no claim that energy is flowing through AETERNA

## Valid observation

After this phase, it is valid to say:

```text
Stored drive was transferred into the spatial medium storage field.
```

It is not yet valid to say:

```text
Energy reached AETERNA's internal field.
AETERNA responded to energy.
AETERNA is breathing.
AETERNA is alive.
```

The transfer reaches the spatial medium only.

## Next phase

After v3.7, the next natural boundary is not immediate internal coupling.

A safer next step is to observe what the spatial medium does after receiving transferred storage:

```text
v3.8 SpatialWorldMedium after-transfer observation
```

That phase can run the existing SpatialWorldMedium update after transfer and verify how storage moves into dissipation, residue, outflow, and membrane exchange without touching AETERNA internals.
