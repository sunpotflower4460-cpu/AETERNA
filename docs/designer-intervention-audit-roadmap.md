# Designer Intervention Audit Roadmap

## Status

This document defines a future purification track for AETERNA.
It is not an instruction to remove existing stabilizers immediately.

The goal is to identify, measure, isolate, and only then reduce designer intervention.

## Why this exists

AETERNA already contains many valuable observation tools.
However, some existing runtime paths may still contain designer-authored pulls or scripts, such as:

- target pulls toward preferred values
- forced injections after elapsed time
- hardcoded state thresholds
- baseline drift driven by wall-clock time or sine functions
- hidden clamps that suppress overflow without recording loss

These may be useful transitional scaffolding, but they can also prevent natural field behavior from being observed.

The audit track exists to separate scaffold from physics.

## Core rule

```text
Do not cut every string at once.
First map the string, then measure it, then gate it, then compare it, then remove or replace it.
```

## Intervention categories

### 1. Target pull

A target pull moves a value toward a designer-selected target.

Example pattern:

```text
next = previous * 0.92 + target * 0.08
```

This is not automatically wrong, but it is not natural emergence unless the target is derived from physical capacity, local statistics, or explicit ledgered exchange.

Audit metric:

- `targetPullMagnitude`
- `targetPullDirection`
- `targetPullEnergyProxy`

### 2. Forced injection

A forced injection creates a disturbance because a timer or condition says so.

Example pattern:

```text
if tensionDuration > fixedFrames then injectMassiveError()
```

This is likely scaffolding, not physical emergence.

Audit metric:

- `forcedInjectionCount`
- `suppressedForcedInjectionCount`
- `forcedInjectionMagnitude`

### 3. Hardcoded state transition

A hardcoded transition switches qualitative state based on fixed thresholds.

Example pattern:

```text
if overload > 0.56 then state = withdraw
```

AETERNA may eventually use thresholds, but they should be based on substrate capacity, local field history, or named experimental config.

Audit metric:

- `hardTransitionCount`
- `transitionThresholdMargin`
- `transitionSourceKind`

### 4. External metronome drift

A wall-clock or sine source creates baseline motion.

Example pattern:

```text
Math.sin(Date.now() * frequency)
```

This can imitate ongoingness while hiding whether the substrate itself can sustain dynamics.

Audit metric:

- `externalClockContribution`
- `baselineDriftMagnitude`
- `substrateGroundedRatio`

### 5. Hidden clamp

A clamp limits values without recording what was lost.

Example pattern:

```text
next = clamp(next, 0, 1)
```

Clamping may be necessary for display or numerical safety, but hidden loss prevents collapse, saturation, and overflow from being observed.

Audit metric:

- `clampLoss`
- `overflowMagnitude`
- `saturationDuration`

## Required implementation order

## H0: Audit docs only

### Goal

List intervention sites without changing runtime behavior.

### Allowed changes

- docs only
- file inventory
- risk classification

### Forbidden changes

- no runtime edits
- no test expectation changes
- no default behavior changes

### Completion condition

A document lists known intervention sites, their category, and whether they are transitional scaffold, safety guard, or physics candidate.

## H1: String influence metrics

### Goal

Add observer-side metrics showing how strongly designer intervention contributes per tick.

### Allowed changes

- observer-only metric functions
- reports / diagnostics
- tests for metric calculation

### Forbidden changes

- do not disable interventions yet
- do not use metrics to control runtime

### Completion condition

A scenario can report how much of observed behavior came from target pulls, forced injection, transitions, clock drift, and clamps.

## H2: Experimental no-pull flag

### Goal

Add an experimental flag without changing the default path.

Recommended flag:

```text
naturalRuntimeMode: "legacy" | "no-pull-preview"
```

### Allowed changes

- config types
- scenario-only option
- test that default remains legacy

### Forbidden changes

- do not switch default to no-pull
- do not remove legacy path

### Completion condition

Legacy and no-pull preview can be compared in a controlled scenario.

## H3: Survival target pull preview

### Goal

Disable survival target pulls only in no-pull preview mode.

Targets to audit include energy, stability, rest drive, orienting drive, comfort bias, and similar smoothing-to-target paths.

### Allowed changes

- no-pull branch in update logic
- diagnostic report of suppressed pulls
- scenario comparison

### Forbidden changes

- do not delete the legacy path
- do not claim no-pull is more natural just because it is less stable

### Completion condition

A scenario compares legacy vs no-pull and reports which behaviors depended on target pull.

## H4: Forced injection suppression preview

### Goal

Suppress forced injection in no-pull preview mode while recording that it would have occurred.

### Allowed changes

- `suppressedForcedInjectionEvent`
- scenario report

### Forbidden changes

- no silent removal
- no replacement with another hidden injection

### Completion condition

Long-tension scenarios can show behavior with and without forced injection.

## H5: Action / mode transition softening

### Goal

Replace fixed behavioral thresholds with accumulated activity competition, but only after the earlier audit phases.

### Allowed future direction

- seeded stochastic competition
- accumulated local activation
- transition margin diagnostics

### Forbidden changes

- no unseeded randomness
- no direct state scripts
- no immediate default behavior switch

## H6: Passive world medium mode

### Goal

Create an experimental mode in which the world medium does not return to fixed baselines or wall-clock drift unless driven by explicit inputs.

### Allowed future direction

- passive medium scenario
- substrate-grounded drift only
- named dissipation routes

### Forbidden changes

- no Date.now-driven physics path
- no sine drift as naturalness
- no hidden baseline restoration

## H7: Clamp loss ledger

### Goal

Record value lost to clamp, overflow, or saturation.

### Allowed future direction

- `clampLossField`
- `overflowField`
- `saturationLedger`

### Forbidden changes

- no silent numeric clipping in physical accounting paths
- no collapse masking

## H8: Passive torus long-run observation

### Goal

Run long scenarios with no-pull preview and passive world options to observe whether structure appears, disappears, or fails.

### Observations

- vortex candidates
- proto-point candidates
- repeated flow paths
- proto-network candidates
- phase winding observations
- phase path overlap observations
- saturation / collapse / NaN events

### Completion condition

The system produces a report even when nothing appears or numerical instability is observed.

## H9: Substrate-grounded oscillation only if needed

### Goal

If no structure appears in passive observation, test a minimal substrate-grounded discharge mechanism.

Allowed form:

```text
if localStorage > localCapacity then release stored energy to neighbors through a ledgered route
```

Forbidden forms:

- sine heartbeat
- breathing oscillator
- life pulse
- timer-driven animation

### Completion condition

The report shows whether discharge, synchronization, or failure occurred under fixed reproducible conditions.

## Review checklist for Phase H PRs

- [ ] Does the PR change default runtime behavior? If yes, why is that safe?
- [ ] Does the PR distinguish scaffold from physics?
- [ ] Does the PR record intervention rather than silently removing it?
- [ ] Does the PR include a legacy comparison where applicable?
- [ ] Does the PR avoid life/self/consciousness claims?
- [ ] Does the PR report failure and no-emergence cases?
- [ ] Does the PR keep observer metrics from controlling runtime?

## Current recommendation

Do not start H3 or later until the v5.1 drive-to-wave transfer path and early v6 physics paths are stable.

The first allowed Phase H step is H0 docs-only after the v6 charter is in place.
