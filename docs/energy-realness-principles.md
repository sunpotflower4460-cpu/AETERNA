# Energy Realness Principles

AETERNA の energy / medium / life-field 系は、見た目としてそれらしく動くことではなく、局所的な保存則・交換・蓄積・散逸・境界条件から挙動が導出されることを重視する。

この文書は、今後の external drive / world medium / membrane exchange / dissipation 系の実装判断に使う固定原則である。

## Core rule

A behavior is not considered real merely because it appears in the output.

A behavior is considered real only when it is not directly encoded as the desired result, and instead emerges from local conservation, exchange, storage, dissipation, and boundary conditions.

Decay, saturation, persistence, rhythm, recovery, and collapse must not be written as target outcomes. They must be observed as consequences of local rules.

日本語で言えば、AETERNA では以下を原則にする。

- 結果を書くのではなく、条件を書く。
- 減衰を書くのではなく、散逸先を書く。
- リズムを書くのではなく、供給・交換・境界・蓄積から周期が出るかを観測する。
- 持続を書くのではなく、供給と散逸の収支から持続するかを観測する。
- 飽和を書くのではなく、容量・流入・散逸不足の結果として飽和するかを観測する。
- 何も起きないことも valid observation とする。

## What counts as modeled energy flow

Energy flow must not be represented by visual or numerical effects alone.

An energy intake can be treated as a modeled flow only when the ledger closes:

```text
input = internal accumulation + dissipation + actuation output + residue conversion ± tolerance
```

If this relation does not close, the result must be labeled as derived / proxy / presentation-smoothed, not as energy flow.

## Allowed rates vs forbidden rates

Some rates are allowed. Others are result-coded and must be avoided.

Allowed:

- local membrane exchange coefficient
- local medium conductivity
- local dissipation coefficient
- local storage capacity
- local transfer loss into a named field
- local boundary permeability

Forbidden or suspicious:

- global activity decay rate
- force the system to calm down rate
- rhythm coherence booster
- life-like baseline oscillator
- recovery target rate
- desired stability pull
- direct collapse / persistence / saturation outcome rules

The difference is causal direction. A local material coefficient describes how a unit of modeled stuff moves or converts. A global behavior rate describes the desired whole-system result.

## Naming policy

Avoid life-metaphor names in core energy mechanics.

Avoid:

- VitalPulse
- BreathWave
- metabolicCharge
- heartbeatSource
- lifeDrive

Prefer:

- ExternalDriveField
- ExternalDriveInput
- WorldMediumField
- MembraneExchange
- LocalFlux
- EnergyLedger
- ConservationResidual
- DissipationField
- ResidueField
- StorageField
- OutflowField

UI or explanatory text may use metaphors only as explanation, not as implementation identity.

## No center-buffer injection

External energy must not be added directly to the internal core buffer as a global effect.

Forbidden pattern:

```text
currentBuffer += externalEnergy
```

Preferred causal path:

```text
ExternalDriveField
  -> WorldMediumField local cells
  -> MembraneExchange at boundary cells
  -> InternalStorage / LocalFlux
  -> Torus propagation
  -> DissipationField / OutflowField / ResidueField
```

## Conservation residual as a check kind

The system should expose a Check-kind metric:

```text
conservationResidual = abs(input - (internalAccumulation + dissipation + actuationOutput + residueConversion))
```

If this residual exceeds tolerance, the system must not present the behavior as modeled energy flow.

This check is not a proof of life, consciousness, or intelligence. It is a numerical integrity check for the energy model.

Until `conservationResidual` is within tolerance, any energy-related display must say:

```text
Energy flow is not yet verified. Current values are diagnostic/proxy readings.
```

## Supply cutoff principle

AETERNA should not implement `if supply is zero, then decay` as an outcome rule.

Instead:

- every tick has local dissipation into a named field,
- internal activity cannot exceed available modeled energy,
- intake can only use energy present in adjacent world-medium cells,
- if supply is zero, then no new energy arrives through the boundary,
- if dissipation continues, activity decreases as a consequence.

When supply cutoff causes no visible decrease, that is also valid observation. It may indicate stored energy, weak dissipation, numerical issues, or an audit gap.

## Input-output shape principle

Passing a waveform through the system unchanged is not enough to call it flow.

A modeled medium should allow phase shift, delay, attenuation, storage, local deformation, harmonic change, residue, and outflow — but these must be measured, not forced.

If input and output are identical in phase, shape, and amplitude except for a direct gain coefficient, the result should be treated as pass-through or presentation, not as evidence of modeled internal flow.

## Relationship to existing AETERNA guardrails

This is the energy-domain equivalent of the existing AETERNA rule that a vortex candidate is not a mind and a proto-neuron candidate is not a semantic neuron.

Likewise:

- an oscillation is not a breath,
- a pulse is not a heartbeat,
- a residual trace is not memory,
- a stable pattern is not life,
- a conservation check is not consciousness evidence.

AETERNA should observe candidates and conditions without claiming what they are beyond the measured layer.
