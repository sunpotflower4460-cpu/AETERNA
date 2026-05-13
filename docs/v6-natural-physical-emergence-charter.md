# AETERNA v6 Natural Physical Emergence Charter

## Status

This document is a docs-only preparation layer for the next AETERNA phases.
It does not authorize runtime changes by itself.

Current foundation:

- v5.1.3 Drive-to-Wave Medium Transfer Skeleton is merged.
- The drive-to-wave boundary exists.
- Requested coupling may be recorded.
- Effective coupling is still zero.
- Transferred energy is still zero.
- Wave medium mutation is still forbidden at that stage.

The next implementation work must continue from this boundary without skipping the work-term preview and ledger checks.

## Core purpose

AETERNA v6 is not a plan to make the system look alive.

AETERNA v6 prepares physical and observational conditions under which life-like closure candidates may or may not appear from local field dynamics.

The correct target is:

```text
Build a physically accountable vessel in which closure-like, boundary-like, and recurrence-like candidates can be observed.
Do not directly implement life, will, selfhood, metabolism, consciousness, or meaning.
```

## Vessel, not organism claim

Use this distinction in every future PR:

| Term | Allowed meaning |
|---|---|
| vessel | A physical/observational substrate that can host field dynamics |
| closure candidate | An observer-side proxy for a recurrent exchange pattern |
| boundary phase field | A physical/proxy field for boundary mediation |
| cross-layer energy cycle | A ledgered exchange route across layers |
| organism | Do not claim this as an achieved fact |
| life | Do not claim this as an achieved fact |

A future observation may say:

```text
A closure-cycle candidate was observed under these conditions.
```

It must not say:

```text
AETERNA became alive.
```

## Fixed principles

### 1. Write conditions, not desired outcomes

Allowed:

```text
Add a local nonlinear potential term and observe whether bounded amplitude regions appear.
```

Forbidden:

```text
Make stable living knots appear.
```

### 2. Ledger before behavior

No new energetic effect is accepted unless the PR explains where the energy came from and where it went.

Minimum accounting form:

```text
input = storage_delta + dissipation + residue + outflow + boundary_exchange ± residual
```

If this cannot be checked yet, the value is diagnostic/proxy only.

### 3. Zero-effect path before nonzero effect

Every new runtime path should be introduced in this order unless there is a documented reason not to:

1. types only
2. read-only snapshot
3. read-only preview
4. zero-effect integration
5. small nonzero effect
6. scenario validation
7. failure-map validation

### 4. Observer-side candidates do not control runtime

Observer outputs such as closure candidates, winding observations, proto-point candidates, or boundary-maintenance proxies must not feed back into runtime dynamics.

Forbidden pattern:

```text
if closureCandidate.confidence > x then increase stability
```

Allowed pattern:

```text
record closureCandidate.confidence in a report
```

### 5. Deterministic before stochastic

The order is:

1. deterministic / no noise
2. seeded stochastic field
3. seed ensemble
4. optional external entropy only after reproducible scenarios exist

Do not use `Math.random()` or `Date.now()` as a naturalness source in v6 physics paths.

### 6. Failure is data

A valid result can be:

- nothing emerges
- the field dissipates
- the field saturates
- the field becomes numerically unstable
- conservation residual becomes too high
- a null model performs the same as the main model

Do not tune a phase until it produces the desired visual result.

### 7. No hidden clamp

Clamping for display is allowed only as presentation logic.

Runtime clamping or saturation must either:

- be a named physical capacity with a ledgered overflow/loss route, or
- be recorded as clamp loss / overflow / saturation diagnostic.

Do not silently remove excess energy or field value.

### 8. Existing designer intervention is an audit target

Existing target pulls, forced injections, hardcoded thresholds, baseline drifts, and hidden clamps must not be removed in one uncontrolled change.

The required order is:

1. audit where the intervention exists
2. measure its influence
3. add a legacy/no-pull preview flag
4. compare legacy and no-pull behavior
5. only then remove or replace it

## v6 naming policy

### Preferred names

- `nonlinearPotential`
- `boundaryPhaseField`
- `crossLayerEnergyLedger`
- `thermalBathExchange`
- `relaxationTimeField`
- `closureCycleCandidate`
- `statisticalBoundaryProxy`
- `supplyOffRelaxation`
- `boundaryDissolutionCandidate`
- `phaseWindingObservation`
- `phasePathOverlapObservation`
- `designerInterventionMetric`
- `noPullPreview`

### Avoided names

Avoid these in code, docs headings, UI copy, and test names unless the text is explicitly warning against them:

- `makeAlive`
- `becomesAlive`
- `selfMaintain`
- `autopoiesisRate`
- `metabolismRate`
- `deathThreshold`
- `lifeDrive`
- `heartbeat`
- `breath`
- `freeWillNoise`
- `consciousnessFluctuation`
- `selfBoundaryStrength`
- `livingTorus`
- `lifePulse`
- `soulMembrane`

## Numerical policy for future implementation PRs

This docs-only charter does not set final coefficients.

Future numeric changes must follow these rules:

1. New coupling coefficients begin at `0` in the first integration PR.
2. Nonzero coefficients must be config-visible, named, and scenario-tested.
3. Each ledger test must declare its own tolerance and explain the tolerance scale.
4. A tolerance must not be widened only to make a test pass.
5. Thresholds must be derived from physical capacity, local field statistics, or explicitly named experimental config.
6. Hardcoded behavior thresholds such as `if overload > 0.56 then withdraw` are designer-intervention candidates, not v6 natural physics.
7. Seeded stochastic tests must record the seed.
8. Ensemble results must report distribution, not only the best-looking run.

## Required review checklist for every v6 PR

Before merging a v6 PR, verify:

- [ ] The PR states whether it is docs-only, observer-only, preview-only, zero-effect, or applied.
- [ ] The PR states whether runtime behavior changes.
- [ ] The PR states whether any energy transfer occurs.
- [ ] If energy transfer occurs, ledger accounting is present.
- [ ] Observer metrics do not feed back into runtime dynamics.
- [ ] No life/consciousness/selfhood proof claim is introduced.
- [ ] Any new numbers are named and justified.
- [ ] Failure and null-model behavior are not hidden.
- [ ] Existing tests are not weakened to accept desired visuals.

## Current next step

After this charter, the next safe implementation step is:

```text
v5.1.4 Drive-to-Wave Work Term Preview
```

This must remain preview-only: nonzero effective coupling may be computed in a separate report path, but the wave medium should not be mutated until the applied-transfer phase.
