# Ledger Visibility Next Step

## Purpose

This note integrates external review feedback after v2.8/v2.9 and before continuing deeper replacement work.

The main point is simple:

```text
The ledger must not remain an unused helper.
```

Before adding external drive or replacing large dynamics, AETERNA should make current ledger status visible in observer/scenario/Now Summary reporting.

## v2.9.2 implementation status

v2.9.2 adds the first visibility layer:

- `src/types/energyLedgerVisibility.ts`
- `src/observer/deriveEnergyLedgerVisibility.ts`
- `src/tests/observer/deriveEnergyLedgerVisibility.test.ts`

This is still observer-side only.

It does not modify runtime dynamics and does not add an external drive.

## Why this matters

v2.8 and v2.9 created the right tools:

- Energy Reality Audit
- Energy Realness Principles
- Energy Ledger
- ConservationResidual Check
- Runtime snapshot adapter

But the existing runtime still contains transitional/result-coded dynamics, such as scalar world-medium proxies, baseline-seeking behavior, direct damping, residue decay, and clock-driven drift.

Therefore, the visibility layer should show that the current system may be `insufficient` or `open`, rather than pretending that visible motion means verified modeled flow.

## Required display distinction

Any observer or UI view should distinguish:

1. visual activity / proxy dynamics
2. energy ledger status
3. verified modeled flow

Recommended copy when the ledger is not closed:

```text
Energy flow is not yet verified. Current values are diagnostic/proxy readings.
```

Avoid:

```text
Energy is flowing through AETERNA.
```

## Runtime integration boundary

The visibility step may read runtime buffers and metrics, but it must not modify runtime dynamics.

Allowed:

- derive ledger status from previous/current buffers
- report missing terms
- report non-finite samples
- report insufficient/open/closed counts in scenario summaries
- add Now Summary lines or sections marked `check`

Not allowed:

- infer missing dissipation/input/residue/output from proxy labels
- set missing terms to zero
- change AeternaNetwork dynamics
- add ExternalDriveField
- add Spatial World Medium
- claim energy flow is verified because visuals are moving

## What v2.9.2 derives

`deriveEnergyLedgerVisibility` converts an `EnergyLedgerState` into a conservative visible line:

- `status`
- `conservationResidual`
- `missingTermCount`
- `verifiedModeledFlow`
- `warningCount`
- `NowSummaryLine` with `valueKind: 'check'`

`deriveEnergyLedgerVisibility` only uses verified ledger state. It does not infer physical flow from visual activity.

`summarizeEnergyLedgerVisibility` counts ledger states across frames:

- insufficient frames
- open frames
- near-closed frames
- closed frames
- verified modeled-flow frames
- max/average conservation residual
- max missing term count

If any frame is insufficient/open/nearClosed, the recommended display remains:

```text
Energy flow is not yet verified. Current values are diagnostic/proxy readings.
```

## Negative term handling

Negative energy-like terms should not be silently clamped to zero inside the ledger.

They should be treated as invalid/missing diagnostic inputs and produce warnings.

This prevents the ledger from creating its own silent clamp loss.

## Remaining integration work

v2.9.2 creates the visibility derivation and tests, but it still avoids invasive runtime wiring.

Future follow-up can attach this to:

- scenario metrics fields
- scenario summary counts
- Now Summary panel display
- Observation Workspace display

That follow-up should still be observer-side only.

## Next recommended PR

After v2.9.2, the next focused PR should be:

```text
v2.9.3 Ledger Visibility in Scenario Metrics
```

Expected additions:

- scenario metrics fields for ledger status / residual / missing term count
- summary counts for insufficient/open/closed ledger frames
- tests ensuring visible activity does not imply verified energy flow

Only after this visibility layer is actually surfaced in scenario/Now Summary should v3.0+ replacement work continue.
