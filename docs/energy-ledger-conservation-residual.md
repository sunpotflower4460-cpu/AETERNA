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

Negative energy-like destination terms are also not silently clamped into the ledger. They are treated as invalid/missing diagnostic inputs and must produce warnings. This avoids a second-order clamp-loss problem inside the ledger itself.

## Files

- `src/types/energyLedger.ts`
- `src/observer/deriveEnergyLedger.ts`
- `src/observer/deriveEnergyLedgerFromRuntimeSnapshot.ts`
- `src/tests/observer/deriveEnergyLedger.test.ts`
- `src/tests/observer/deriveEnergyLedgerFromRuntimeSnapshot.test.ts`

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
- `insufficient`: required terms are missing, invalid, or residual cannot be calculated.

## Runtime snapshot adapter

`deriveEnergyLedgerFromRuntimeSnapshot` lightly connects the ledger to observable runtime buffers without changing runtime behavior.

It can estimate internal storage before/after from previous/current buffers using:

- squared magnitude
- absolute magnitude

This adapter deliberately does not infer missing input, dissipation, actuation, or residue conversion terms from scalar proxy state.

If those terms are not explicitly supplied, the ledger remains `insufficient`. This is intentional.

The adapter exists to answer:

```text
What can we currently account for?
What is still missing?
Where does the ledger fail to close?
```

It does not answer:

```text
Is energy really flowing through AETERNA?
```

unless the required terms are present and the ledger closes.

## Required visibility step

The ledger must not remain an unused helper.

Before replacing existing dynamics or adding external drive, runtime or scenario observation should surface the ledger status so the current system can visibly report:

- `insufficient`: required accounting terms are still missing.
- `open`: terms are present but the ledger does not close.
- `closed`: supplied terms close within tolerance.

This visibility should be added as observer-side reporting only. It must not modify the runtime dynamics.

Recommended display copy when status is not `closed`:

```text
Energy flow is not yet verified. Current values are diagnostic/proxy readings.
```

The UI must avoid implying that visible motion equals verified energy flow.

## Mixed-period warning

During the transition period, existing result-coded dynamics may still visually move while the ledger reports `insufficient` or `open`.

That is not a contradiction. It means AETERNA is still displaying or simulating dynamics that have not yet been proven as ledgered modeled flow.

The UI should keep these separated:

- visual activity / proxy dynamics
- ledger status
- verified modeled flow

## Principle drift control

The project now has strong principle documents. They must not become detached from code.

Future audits should periodically list code paths that violate or bypass the Energy Realness principles, especially:

- baseline-seeking scalar world medium
- clock-driven sine drift
- direct damping without named destination
- direct residue decay without named destination
- clamp loss without overflow accounting
- living/proxy modifiers that alter substrate behavior without ledgered energy support

This list should guide replacement priority after ledger visibility exists.

## Important guardrails

- This is observer-side only.
- It does not modify runtime dynamics.
- It does not prove life, consciousness, intelligence, or selfhood.
- It does not add an ExternalDriveField.
- It does not add periodic drive or pulse drive.
- It does not silently convert missing terms to zero.
- It does not silently clamp negative ledger terms into zero-valued accounting.
- It does not present energy flow as verified unless the supplied ledger closes.
- It does not infer physical flow terms from proxy labels.

## Buffer energy estimate

`estimateBufferEnergy` provides a simple diagnostic helper for future instrumentation.

It can estimate:

- squared energy-like magnitude
- absolute magnitude

It ignores non-finite samples and reports finite/non-finite counts.

This estimate is a diagnostic proxy. It is not a complete physical energy model.

## Next phase

The next safest implementation step is not another drive source.

First, wire ledger visibility into observer/scenario/Now Summary reporting so current dynamics can reveal how often the ledger is `insufficient`, `open`, or `closed`.

Only after that should v3.0 Local Conservation Substrate or later spatial medium work continue to replace result-coded dynamics with local exchange/storage/dissipation fields.

The expected order remains:

1. Energy Ledger / ConservationResidual Check
2. Ledger visibility in observer/scenario/Now Summary reporting
3. Local Conservation Substrate
4. Spatial World Medium
5. ExternalDriveField = 0 structure
6. Steady ExternalDrive
7. Supply Cutoff Test
8. PeriodicDrive Spectral Comparison
