# Ledger Visibility Next Step

## Purpose

This note integrates external review feedback after v2.8/v2.9 and before continuing deeper replacement work.

The main point is simple:

```text
The ledger must not remain an unused helper.
```

Before adding external drive or replacing large dynamics, AETERNA should make current ledger status visible in observer/scenario/Now Summary reporting.

## Why this matters

v2.8 and v2.9 created the right tools:

- Energy Reality Audit
- Energy Realness Principles
- Energy Ledger
- ConservationResidual Check
- Runtime snapshot adapter

But the existing runtime still contains transitional/result-coded dynamics, such as scalar world-medium proxies, baseline-seeking behavior, direct damping, residue decay, and clock-driven drift.

Therefore, the next visibility step should show that the current system is likely `insufficient` or `open`, rather than pretending that visible motion means verified modeled flow.

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

## Negative term handling

Negative energy-like terms should not be silently clamped to zero inside the ledger.

They should be treated as invalid/missing diagnostic inputs and produce warnings.

This prevents the ledger from creating its own silent clamp loss.

## Next recommended PR

A focused next PR should be:

```text
v2.9.2 Ledger Visibility in Scenario / Now Summary
```

Expected additions:

- scenario metrics fields for ledger status / residual / missing term count
- summary counts for insufficient/open/closed ledger frames
- optional Now Summary section or line with valueKind `check`
- tests ensuring visible activity does not imply verified energy flow

Only after this visibility layer exists should v3.0+ replacement work proceed further.
