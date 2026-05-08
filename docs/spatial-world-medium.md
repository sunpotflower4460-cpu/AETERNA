# AETERNA-NATURAL v3.1 Spatial World Medium

## Purpose

v3.1 introduces a standalone Spatial World Medium.

This follows the agreed flow:

```text
v2.7 Now Summary Panel
v2.8 Energy Reality Audit
v2.9 Energy Ledger / ConservationResidual
v2.9.2 Ledger Visibility
v2.9.3 Ledger Visibility in Scenario Metrics
v2.9.4 runScenario minimal wiring
v3.0 Local Conservation Substrate
v3.1 Spatial World Medium
v3.2 ExternalDriveField = 0
v3.3 Steady ExternalDrive
v3.4 Supply Cutoff Test
v3.5 PeriodicDrive
```

## Position

This phase is still not the external energy hose.

It creates a spatial medium layer that can later receive an ExternalDriveField, but in v3.1 there is no external supply.

## What it adds

- `src/types/spatialWorldMedium.ts`
- `src/world/spatialWorldMedium.ts`
- `src/tests/world/spatialWorldMedium.test.ts`

## Why this phase exists

Earlier scalar world-medium values such as ambientLight / ambientNoise / fieldTemperature are useful transitional proxies, but they are not a conserved spatial medium.

v3.1 begins the replacement direction by adding a standalone field-based world medium:

- local cells
- torus wrapping
- local exchange
- named dissipation
- named residue conversion
- named outflow
- named membrane exchange
- EnergyLedger / ConservationResidual report

## Fields

`SpatialWorldMediumState` contains:

- `mediumStorageField`
- `mediumDissipationField`
- `mediumResidueField`
- `mediumOutflowField`
- `membraneExchangeField`

These are spatial fields with the same dimensions.

## Local rules

The current standalone medium supports:

- local neighbor exchange
- medium dissipation into `mediumDissipationField`
- residue conversion into `mediumResidueField`
- outflow into `mediumOutflowField`
- membrane-side exchange into `membraneExchangeField`
- EnergyLedger / ConservationResidual report per step

## What it deliberately does not add

- no ExternalDriveField yet
- no external supply
- no steady drive
- no pulse drive
- no periodic drive
- no life-metaphor input
- no runtime replacement of the existing scalar WorldMedium
- no AeternaNetwork / dynamicCore / livingState changes
- no center-buffer injection
- no global decay outcome rule
- no rhythm / recovery / saturation target outcome

## Input is zero by design

For v3.1:

```text
inputEnergy = 0
```

That is deliberate.

If medium storage decreases, it must be because local dissipation, residue conversion, outflow, or membrane exchange moved quantity into named destination fields.

If all destination coefficients are zero, zero input alone must not force decrease.

## Membrane exchange in v3.1

`membraneExchangeField` is only a named destination field in this phase.

It does not inject into AETERNA's internal buffer and does not modify runtime dynamics.

This preserves the rule:

```text
No center-buffer injection.
```

## Conservation check

Each update returns a report with:

- `inputEnergy`
- `mediumEnergyBefore`
- `mediumEnergyAfter`
- `mediumAccumulationDelta`
- `dissipatedEnergy`
- `residueConvertedEnergy`
- `measuredOutflowEnergy`
- `membraneExchangeEnergy`
- `clampLossOrOverflow`
- `localExchangeMagnitude`
- `ledger`

The ledger should close when all decreases are accounted as named destinations.

## Next phase

v3.2 should add `ExternalDriveField = 0` structure.

That means the external drive field can exist structurally, but it must supply zero energy at first. The purpose is to prove the new structure does not break conservation before any drive is turned on.
