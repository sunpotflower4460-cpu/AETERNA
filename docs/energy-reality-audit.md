# AETERNA-NATURAL v2.8 Energy Reality Audit

## Purpose

This audit reviews the current AETERNA dynamics through a stricter criterion:

> Do not write the desired result. Write the local conditions, then observe what follows.

The purpose is not to criticize existing work as invalid. The current implementation has strong observation guardrails, raw / derived / proxy separation, and careful language boundaries. However, the energy and medium dynamics need the same strictness as the observation layer.

This phase is documentation and audit only. It does not change runtime dynamics.

## Audit classification

Each item is classified as one of the following:

- **Local / closer to real**: behavior follows from local interaction, conservation, exchange, storage, dissipation, or boundary constraints.
- **Derived / observer-side**: a measured or computed reading from existing state; acceptable if labeled as derived/proxy and not treated as runtime substance.
- **Result-coded**: desired outcome is directly encoded, such as smooth decay to a baseline, rhythm generation, stability pull, or life-like motion.
- **Presentation / proxy**: useful for UI or analysis but not a modeled physical process.
- **Unknown / needs measurement**: cannot be classified without an energy ledger or runtime tracing.

## Executive summary

The current AETERNA has a sincere observer layer but a mixed dynamics layer.

Stronger areas:

- Torus field propagation contains local neighbor interaction via wave-like update logic.
- Body-World Closure is explicitly pre-semantic and avoids self-awareness claims.
- Proto-neuron / proto-network remain observer-side candidates.
- UI and documentation guardrails avoid affirmative consciousness/life/intelligence proof claims.

Weak or risky areas under the stricter energy criterion:

- World Medium is scalar and baseline-seeking, not a spatial conserved medium.
- Some fluctuation is generated from clock-driven sine waves.
- Some decay and residue loss appear as direct multiplicative disappearance rather than transfer to named fields.
- Some body/action/sensory-return states are long weighted sums, which should remain derived/proxy rather than being treated as real substrate.
- Global clamps may hide lost or created quantities unless overflow/loss is accounted for.

## Audit target: World Medium

Current risk pattern:

- baseline values such as ambientLight, ambientNoise, surfaceResistance, and fieldTemperature act as attractor targets.
- smoothDecay pulls values toward those targets.
- drift is generated from Date.now and sine composition.
- world state is mostly scalar rather than a spatial field.

Classification:

- Current World Medium is useful as a simulated/proxy environment.
- It should not be treated as a real modeled energy medium.
- It should be labeled as scalar proxy until replaced by a spatial WorldMediumField with local exchange and conservation checks.

Why this matters:

A baseline target means the world has an externally declared preferred state. A conserved medium should instead settle, destabilize, or remain structured as a consequence of supply, exchange, storage, dissipation, and boundaries.

Future replacement direction:

```text
WorldMediumField[cell]
  stores local quantities
  exchanges with adjacent cells
  exchanges through membrane boundary
  dissipates into named DissipationField
  never silently clamps away excess
```

## Audit target: dynamic core baseline and residue

Current risk pattern:

- baseline activity can include sine-driven components.
- residue decay may directly multiply by decay factors.
- damping can remove energy without transferring it into a named store or dissipation field.

Classification:

- Torus propagation itself is closer to real/local.
- Baseline oscillation, direct residue decay, and global damping are result-coded or incomplete energy accounting until losses are ledgered.

Future replacement direction:

- Treat baseline-like activity as a consequence of available internal storage and local exchange.
- Convert damping/loss into explicit dissipation entries.
- Convert residue decay into transfer from ResidueField to DissipationField or OutflowField.
- Track conservationResidual every tick.

## Audit target: Sensory Return

Current risk pattern:

- return packets are derived from world state changes.
- novelty, locality, and rhythm are computed by formulas.

Classification:

- Acceptable as observer-side derived/proxy metrics.
- Not acceptable as evidence that novelty or rhythm exists in the substrate.

Required labeling:

- SensoryReturnPacket fields such as novelty/rhythm must be documented as derived readings.
- If future energy flow uses rhythm, it must come from measured input/output waveform transformation, not from a desired rhythm score.

## Audit target: Body Surface / Actuation Pulse

Current risk pattern:

- body surface and actuation values may be weighted compositions of many signals.

Classification:

- Useful derived/control proxies.
- Should not be treated as a physically existing body surface or action force unless backed by local exchange fields.

Future replacement direction:

- Body surface should gradually become a boundary field with local storage, permeability, and exchange.
- Actuation output should become an accounted outflow from internal available energy, not only a derived decision score.

## Audit target: living influence

Current risk pattern:

- livingState can modify baselineGain or other dynamics through multipliers.

Classification:

- Useful adaptive proxy.
- Risky if interpreted as life causing activity.

Future replacement direction:

- Invert the causal interpretation: observed sustained activity and state-dependent exchange may later be summarized as living-like conditions.
- Avoid making a variable named livingState directly inject activity into the substrate without ledgered energy support.

## Audit target: Minimal Natural Feedback

Current risk pattern:

- feedback adjustments may compensate for missing naturalness.

Classification:

- Useful stabilization/proxy layer.
- Risky if presented as natural dynamics.

Future replacement direction:

- Treat such adjustments as transitional and clearly labeled.
- Prefer replacing compensatory adjustments with local medium and membrane conditions.

## Priority findings

### A. Must not be expanded as real substrate without audit

- scalar World Medium baseline returns
- sine-based ambient drift
- global damping without dissipation accounting
- residue decay without destination field
- clamp loss without overflow accounting
- life-metaphor named drive sources

### B. Can remain if labeled as observer/proxy

- novelty score
- rhythm score
- body surface derived summary
- action pulse derived summary
- livingState summary/influence, if not overclaimed
- closure metrics, if kept pre-semantic

### C. Good foundations to preserve

- torus topology and local neighbor propagation
- raw / derived / proxy / check separation
- no-emergence-is-valid posture
- proto-neuron as candidate, not runtime neuron
- proto-network as candidate, not semantic graph
- Observation Workspace as observer, not AETERNA speech

## Required next step

Before adding any ExternalDriveField or Energy Intake Port, AETERNA should add an Energy Ledger and conservationResidual Check.

The initial ledger can be approximate and diagnostic. It must clearly label unknown or unaccounted terms instead of pretending the ledger closes.

Minimum fields:

```text
inputEnergy
internalEnergyBefore
internalEnergyAfter
internalAccumulationDelta
dissipatedEnergy
actuationOutputEnergy
residueConvertedEnergy
storageDelta
clampLossOrOverflow
unaccountedEnergy
conservationResidual
confidence
```

## Guardrail

If conservationResidual is large or unknown, any UI should say:

```text
Energy flow is not yet verified. Current values are diagnostic/proxy readings.
```

Not (the affirmative form that the visibility regulator forbids):

```text
Energy is flowing through `AETERNA`.
```

(The backtick around `AETERNA` is a documentation device that breaks the
exact-substring match used by the guard test. The phrase is referenced
here as something to **avoid**, not to assert.)

## Relationship to v2.9+

Recommended sequence:

1. v2.8 Energy Reality Audit — this document and labels.
2. v2.9 Energy Ledger / ConservationResidual — measure current accounting without changing dynamics.
3. v3.0 Local Conservation Substrate — introduce local exchange/storage/dissipation fields.
4. v3.1 Spatial World Medium — replace scalar medium with field-based medium.
5. v3.2 ExternalDriveField = 0 — add structure with no drive.
6. v3.3 Steady ExternalDrive — add only constant supply.
7. v3.4 Supply Cutoff Test — verify decay as consequence, not explicit rule.
8. v3.5 PeriodicDrive — compare input/output spectra.

## Non-goals

- Do not add external energy input in this phase.
- Do not add periodic drive in this phase.
- Do not rename proxy fields into life-metaphor identities.
- Do not claim life, consciousness, intelligence, or selfhood.
- Do not remove existing dynamics before ledger visibility exists.
