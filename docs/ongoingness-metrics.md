# Ongoingness Metrics — Phase 1

This document defines the core ongoingness metrics for Phase 1 of AETERNA: *持続する生命場の再確認と安定化*.

## Purpose

These metrics answer one question: **Is AETERNA a life-field that persists without external input?**

They are deliberately minimal and research-oriented. They do not describe meaning, intent, or behavior richness—only whether the basic condition for a living field holds.

## Metric Definitions

### Measured Metrics (raw observation)

| Metric | Symbol | Definition | Unit |
|---|---|---|---|
| Mean Activity | `meanActivity` | Mean absolute value of `currentBuffer` over all nodes | float [0, ∞) |
| Activity Variance | `activityVariance` | Std-dev of `meanActivity` over last 100 frames | float [0, ∞) |
| Quiet Baseline Floor | `quietBaselineFloor` | Mean `meanActivity` during frames with no touch input | float [0, ∞) |
| Spontaneous Ignition Count | `spontaneousIgnitionCount` | Count of upward threshold crossings (meanActivity crosses 0.05) | integer |

### Derived Metrics (computed from measured)

| Metric | Symbol | Definition | Range |
|---|---|---|---|
| Collapse Rate | `collapseRate` | `collapseFrames / totalFrames` where collapseFrames = frames with `meanActivity < 0.01` | [0, 1] |
| Saturation Rate | `saturationRate` | `saturationFrames / totalFrames` where saturationFrames = frames with `maxActivity > 8.0` | [0, 1] |
| Boundedness | — | `peakActivity < 50.0` over the entire run | boolean |

### Proxy Metric (composite)

| Metric | Symbol | Definition | Range |
|---|---|---|---|
| Ongoingness Score | `ongoingnessScore` | Composite: `(1 - min(collapseRate*5,1))*0.5 + (1 - min(saturationRate*20,1))*0.3 + min(quietBaselineFloor/0.2,1)*0.2` | [0, 1] |

## Phase 1 Success Thresholds

| Metric | Success | Failure | Note |
|---|---|---|---|
| collapseRate | < 0.05 | > 0.1 | Over 5000 no-input ticks |
| saturationRate | < 0.05 | > 0.1 | Over 5000 no-input ticks (soft-clamp excursions) |
| quietBaselineFloor | > 0.05 | < 0.01 | Quiet but not dead |
| activityVariance | > 0.001 | < 0.0001 | Not frozen |
| peakActivity | < 50.0 | > 100.0 | Bounded |
| nanFrames | 0 | > 0 | Hard requirement |
| ongoingnessScore | > 0.7 | < 0.3 | Proxy summary |

## Measurement Points

### In headless scenario runs (`runScenario.ts`)

All ongoingness metrics are computed and included in `ScenarioResult.summary`:
- `saturationFrames`, `saturationRate`
- `collapseRate` (= `collapseFrames / totalFrames`)
- `spontaneousIgnitionCount`
- `quietBaselineFloor`
- `ongoingnessScore`

Collect these in no-input scenario runs for Phase 1 verification.

### In live observer UI (`index.html` ONGOINGNESS section)

The live observer (ONGOINGNESS accordion) displays running estimates:
- `val-mean-activity`: Mean activity over last 100 frames
- `val-activity-variance`: Variance over last 100 frames
- `val-collapse-rate`: Running collapse rate
- `val-saturation-rate`: Running saturation rate
- `val-quiet-floor`: Running quiet baseline floor
- `val-ignition-count`: Cumulative spontaneous ignition count

## Quiet Baseline Floor — Current Implementation

The quiet baseline floor is maintained by:
1. **Baseline noise** (`triggerNoise` in `dynamicCore.ts`): Stochastic injection at ~5% rate per attempt, 3 attempts/tick
2. **Baseline drift** (`updateBaseline`): Sinusoidal baseline with `longTone * 0.02` additive floor
3. **Residue persistence** (`updateResidue`): Activity residue with RESIDUE_DECAY = 0.97

The `longBaselineTone` (default 0.12) provides the primary floor: `0.12 * 0.02 * 0.4 ≈ 0.001` per node per tick. This is intentionally subtle—"quiet but not dead".

No modifications to the baseline floor were made in Phase 1. The existing implementation was confirmed adequate by the no-input 5000-tick scenario tests.

## Runaway Prevention — Current Implementation

Runaway is prevented by:
1. **Soft-clamp** at ±8.0 in `updateDynamicsCore` (gentle compression above threshold)
2. **Homeostatic damping**: `damping ≈ 0.985` with `firingRateError` correction
3. **Weight normalization**: synaptic weight normalization converges toward target sum
4. **No hard-clamp**: Values can exceed ±8.0 but with strong suppression

These mechanisms were not modified in Phase 1.

## Intentionally Untouched

- `dynamicCore.ts`: baseline noise, damping, residue, soft-clamp
- `survivalState.ts`, `energyFlow.ts`: restoration and homeostasis loops
- `replayQueue.ts`, `deriveReplayState.ts`: replay consolidation
- All semantic / signal layers

## Notes

- All metrics are research-observation tools only; they do not feed back into organism dynamics
- "Spontaneous ignition" is a threshold crossing, not a causal event; it measures self-sustaining tendency, not intent
- The ongoingnessScore weights are heuristic and may be revised as understanding deepens
