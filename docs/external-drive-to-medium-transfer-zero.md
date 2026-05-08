# AETERNA-NATURAL v3.6 ExternalDrive to SpatialWorldMedium TransferCoefficient = 0

## Purpose

v3.6 creates the transfer boundary between `ExternalDriveField` and `SpatialWorldMedium` while keeping the accepted transfer coefficient at zero.

This follows the safer pattern already used earlier:

```text
structure exists first
accepted movement remains zero
pair ledger must close at 0 = 0
non-zero drive/transfer comes later
```

## Position

This phase is not a real transfer phase yet.

It is a transfer-structure verification phase.

The goal is to prove that the bridge can exist without secretly moving stored drive into the medium.

## What this phase adds

- `src/types/externalDriveToMediumTransfer.ts`
- `src/world/externalDriveToMediumTransfer.ts`
- `src/tests/world/externalDriveToMediumTransfer.test.ts`

## Core rule

In v3.6:

```text
acceptedTransferCoefficient = 0
transferEnergy = 0
sourceOutEnergy = 0
destinationInputEnergy = 0
pairLedger.matched = true
```

If a non-zero `transferCoefficient` is supplied in this phase, it is rejected and reported. It must not move energy.

## Pair Ledger

The transfer pair ledger checks only the relationship between the source and destination of the transfer:

```text
ExternalDriveField sourceOutEnergy
=
SpatialWorldMedium destinationInputEnergy
± tolerance
```

In v3.6, this should close as:

```text
0 = 0
```

This pair ledger is separate from the EnergyLedger of each individual field.

## Cell mapping

v3.6 supports only:

```text
cellMapping = same-index
```

That means:

```text
ExternalDriveField.driveField[i]
corresponds to
SpatialWorldMedium.mediumStorageField[i]
```

No boundary projection, nearest-cell mapping, interpolation, torus-shell mapping, or membrane mapping is introduced yet.

## What it deliberately does not add

- no non-zero transfer
- no movement from ExternalDriveField to SpatialWorldMedium
- no runtime dynamics change
- no AeternaNetwork / dynamicCore / livingState change
- no internal-buffer coupling
- no center-buffer injection
- no pulse/periodic behavior change
- no visual or life-like effect
- no breath / heartbeat / life rhythm framing
- no energy-flow proof claim through AETERNA

## Valid observation

If ExternalDriveField contains stored drive and SpatialWorldMedium contains storage, both should remain unchanged after v3.6 transfer.

That is expected.

The important verification is that the bridge exists and the pair ledger closes cleanly at zero transfer.

## Next phase

v3.7 should enable:

```text
transferCoefficient > 0
```

Only then should a bounded amount of stored drive move from `ExternalDriveField.driveField` to `SpatialWorldMedium.mediumStorageField`, with the same transfer amount used atomically on both sides and verified by the pair ledger.
