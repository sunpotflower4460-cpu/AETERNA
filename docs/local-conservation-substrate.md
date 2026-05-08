# AETERNA-NATURAL v3.0 Local Conservation Substrate

## Purpose

v3.0 introduces a standalone Local Conservation Substrate.

This is the first implementation step after the v2.8/v2.9 audit and ledger work. It follows the sequence shown in the roadmap screenshot:

```text
v2.7 Now Summary Panel
v2.8 Energy Reality Audit
v2.9 Energy Ledger / ConservationResidual
v3.0 Local Conservation Substrate
v3.1 Spatial World Medium
v3.2 ExternalDriveField = 0
v3.3 Steady ExternalDrive
v3.4 Supply Cutoff Test
v3.5 PeriodicDrive
```

## Position

This phase is not the external energy hose yet.

It creates the local conservation substrate that an external drive can later feed into.

## What it adds

- `src/types/localConservationSubstrate.ts`
- `src/substrate/localConservationSubstrate.ts`
- `src/tests/substrate/localConservationSubstrate.test.ts`

## Core rule

Do not write the desired result.

Write local exchange, storage, named dissipation, named residue conversion, and named outflow. Then observe what happens.

## Fields

`LocalConservationSubstrateState` contains:

- `storageField`
- `dissipationField`
- `residueField`
- `outflowField`

These are local fields with the same dimensions.

## Local rules

The current standalone substrate supports:

- torus boundary wrapping
- local neighbor exchange
- local dissipation into `dissipationField`
- local residue conversion into `residueField`
- local outflow into `outflowField`
- EnergyLedger / ConservationResidual report per step

## What it deliberately does not add

- no ExternalDriveField yet
- no spatial World Medium yet
- no pulse drive
- no periodic drive
- no life-metaphor input
- no runtime connection to AeternaNetwork
- no center-buffer injection
- no global decay outcome rule
- no rhythm / recovery / saturation target outcome

## Supply-cutoff principle

This phase does not implement:

```text
if supply is zero, decay activity
```

Instead, there is currently no supply at all. If storage decreases, it is only because local dissipation, residue conversion, or outflow terms are nonzero and accounted in the ledger.

If those local destination coefficients are zero, storage should not decrease merely because input is zero.

This is intentional.

## Conservation check

Each update returns a report with:

- `inputEnergy`
- `internalEnergyBefore`
- `internalEnergyAfter`
- `internalAccumulationDelta`
- `dissipatedEnergy`
- `actuationOutputEnergy`
- `residueConvertedEnergy`
- `measuredOutflowEnergy`
- `clampLossOrOverflow`
- `exchangeMagnitude`
- `ledger`

For this phase, `inputEnergy = 0` and `actuationOutputEnergy = 0`.

The ledger should close when all losses are accounted as named destinations.

## Why this matters

Previous dynamics may visually decrease because values are multiplied by a decay factor or pulled toward a baseline. That can be useful as a proxy, but it is not a local conservation substrate.

This substrate instead asks:

```text
If a quantity leaves storage, where did it go?
```

The answer must be a named field.

## Relationship to runtime

This module is standalone. It is not wired into AETERNA runtime yet.

That is deliberate. The first goal is to make a small, testable conservation kernel before replacing or touching existing dynamics.

## Next phase

v3.1 Spatial World Medium should build on this idea by replacing scalar world-medium quantities with a spatial field.

The next phase should still avoid external drive. ExternalDriveField remains v3.2 and should initially be fixed to zero.
