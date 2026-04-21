# A2 Arousal / Awareness Split Notes

## Scope

This phase adds a derived A2 state that separates:

- activation height
- foreground availability
- novelty passage openness
- foreground-forming pressure

## Implementation Shape

- `src/types/arousalAwareness.ts`
  - Defines `ArousalAwarenessState`
- `src/organism/deriveArousalAwareness.ts`
  - Pure derivation from snapshot + felt-state + living state + self/world packet

## Runtime Placement

In the main loop:

1. organism snapshot
2. interoception packet
3. self/world packet
4. felt-state derivation
5. A2 arousal/awareness derivation
6. observer exposure / scenario summaries

## Observer Exposure

Runtime `dyn` now exposes:

- `bl_arousalLevel`
- `bl_awarenessWindow`
- `bl_salienceOpenness`
- `bl_foregroundPressure`
- `bl_restDepth`
- `bl_hyperreactivity`
- `bl_settlingWindow`

Scenario summaries now expose:

- `avgArousalLevel`
- `avgAwarenessWindow`
- `avgSalienceOpenness`
- `avgForegroundPressure`
- `maxArousalLevel`
- `minAwarenessWindow`

## Design Constraints Preserved

- no direct mode control
- no anthropomorphic runtime labels
- no self-report mechanism
- no large organism-core refactor
- no hard global workspace layer

## Validation Focus

The most important validation is dissociation:

- overload should raise arousal
- depletion should narrow awareness
- coherent conditions should support awarenessWindow
- arousalLevel and awarenessWindow must not collapse into the same value
