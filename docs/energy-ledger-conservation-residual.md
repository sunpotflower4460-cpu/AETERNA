# AETERNA-NATURAL v2.9 Energy Ledger / ConservationResidual Check

## Purpose

v2.9 adds an observer-side Energy Ledger and ConservationResidual Check.

This phase does not replace runtime dynamics, does not add external drive, and does not claim that modeled energy flow is verified.

It only provides a diagnostic accounting surface so AETERNA can distinguish:

- measured/known accounting,
- incomplete accounting,
- open ledger residuals,
- verified ledger closure for the supplied terms.

## Core equation

```text
input = internal accumulation + dissipation + actuation output + residue conversion ± tolerance
```

Optional known loss/outflow terms may be included:

```text
input = internal accumulation
      + dissipation
      + actuation output
      + residue conversion
      + clamp/overflow loss
      + measured outflow
      ± tolerance
```

If required terms are missing, the ledger is `insufficient`. Missing values are not treated as zero.

## Files

- `src/types/energyLedger.ts`
- `src/observer/deriveEnergyLedger.ts`
- `src/tests/observer/deriveEnergyLedger.test.ts`

## EnergyLedgerState

`EnergyLedgerState` is a Check-kind diagnostic with:

- `inputEnergy`
- `internalEnergyBefore`
- `internalEnergyAfter`
- `internalAccumulationDelta`
- `dissipatedEnergy`
- `actuationOutputEnergy`
- `residueConvertedEnergy`
- `clampLossOrOverflow`
- `measuredOutflowEnergy`
- `accountedEnergy`
- `signedResidual`
- `conservationResidual`
- `status`
- `confidence`
- `verifiedModeledFlow`
- `missingTermIds`
- `warnings`
- `notes`

## Status values

- `closed`: all required terms are present and residual is within tolerance.
- `nearClosed`: all required terms are present and residual is small but outside tolerance.
- `open`: all required terms are present but residual is large.
- `insufficient`: required terms are missing or residual cannot be calculated.

## Important guardrails

- This is observer-side only.
- It does not modify runtime dynamics.
- It does not prove life, consciousness, intelligence, or selfhood.
- It does not add an ExternalDriveField.
- It does not add periodic drive or pulse drive.
- It does not silently convert missing terms to zero.
- It does not present energy flow as verified unless the supplied ledger closes.

## Buffer energy estimate

`estimateBufferEnergy` provides a simple diagnostic helper for future instrumentation.

It can estimate:

- squared energy-like magnitude
- absolute magnitude

It ignores non-finite samples and reports finite/non-finite counts.

This estimate is a diagnostic proxy. It is not a complete physical energy model.

## Next phase

v3.0 should introduce a Local Conservation Substrate only after v2.9 diagnostic accounting is visible enough to reveal what is currently missing.

The expected order remains:

1. Energy Ledger / ConservationResidual Check
2. Local Conservation Substrate
3. Spatial World Medium
4. ExternalDriveField = 0 structure
5. Steady ExternalDrive
6. Supply Cutoff Test
7. PeriodicDrive Spectral Comparison
