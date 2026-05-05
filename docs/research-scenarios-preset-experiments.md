# Research Scenarios / Preset Experiments

## 1. Purpose

AETERNA-NATURAL v1.3 adds a Research Scenarios / Preset Experiments layer.
The goal is to provide reproducible, named observation conditions so that
researchers know which scenario to use for a given observation target, and
can compare results across repeated runs with the same seed.

This is not a new runtime dynamics layer. No new field dynamics, emergence
mechanisms, or semantic features are introduced.

## 2. What this phase adds

- `ResearchScenario` type with explicit seed / ticks / sampleEveryTicks / preset
- `RESEARCH_SCENARIO_REGISTRY` — 10 named research scenarios
- `PresetExperiment` type — a concrete runnable observation unit
- `PRESET_EXPERIMENT_REGISTRY` — 14 named preset experiments
- Lookup helpers: `getResearchScenario`, `getPresetExperiment`, `getExperimentsForScenario`
- Tests: `src/tests/scenario/researchScenarios.test.ts`

## 3. Research Scenarios

Each research scenario has:
- A fixed `defaultSeed` and `defaultTicks` for reproducibility
- A `researchQuestion` and `observationGoal`
- `expectedObservationKinds` — observation targets (not guaranteed results)
- `nonGuaranteedNotes` — clarifies what absence of expected observations means
- `safetyLevel` — 'safe' | 'research' | 'experimental'

### Scenario list

| ID | Title | Safety | Primary Preset |
|---|---|---|---|
| `quietBaseline` | Quiet Baseline | safe | safeBaseline |
| `singlePulseReturn` | Single Pulse Return | research | naturalObserverSuite |
| `repeatedGentlePulse` | Repeated Gentle Pulse | research | naturalObserverSuite |
| `phaseVortexEmergence` | Phase Vortex Emergence | research | complexObserverPreview |
| `curvatureBiasObservation` | Curvature Bias Observation | research | geometryPreview |
| `membraneOverlapObservation` | Membrane Overlap Observation | research | naturalObserverSuite |
| `plasticityTraceObservation` | Plasticity Trace Observation | research | plasticityObserveOnly |
| `neutralVsLegacyConstants` | Neutral vs Legacy Constants | research | naturalObserverSuite |
| `observedRatioSurvey` | Observed Ratio Survey | research | naturalObserverSuite |
| `longRunNaturalComparison` | Long-Run Natural Comparison | research | naturalObserverSuite |

## 4. Preset Experiments

Each preset experiment binds a ResearchScenario to a specific:
- `runtimePresetId` — which AeternaNaturalPreset to use
- `seed` — explicit random seed for reproducibility
- `ticks` — number of simulation ticks
- `sampleEveryTicks` — snapshot sampling interval

### Experiment list

| ID | Scenario | Preset | Seed | Ticks |
|---|---|---|---|---|
| E01_quietBaselineSafe | quietBaseline | safeBaseline | 1000 | 2000 |
| E02_quietBaselineNatural | quietBaseline | naturalObserverSuite | 1000 | 2000 |
| E03_singlePulseReturn | singlePulseReturn | naturalObserverSuite | 1001 | 1000 |
| E04_repeatedGentlePulse | repeatedGentlePulse | naturalObserverSuite | 1002 | 3000 |
| E05_repeatedGentlePulsePlasticity | repeatedGentlePulse | plasticityObserveOnly | 1002 | 3000 |
| E06_phaseVortexEmergence | phaseVortexEmergence | complexObserverPreview | 1003 | 2000 |
| E07_phaseVortexNatural | phaseVortexEmergence | naturalObserverSuite | 1003 | 2000 |
| E08_curvatureBiasGeometry | curvatureBiasObservation | geometryPreview | 1004 | 2000 |
| E09_membraneOverlap | membraneOverlapObservation | naturalObserverSuite | 1005 | 2000 |
| E10_plasticityTraceLongRun | plasticityTraceObservation | plasticityObserveOnly | 1006 | 3000 |
| E11_neutralConstants | neutralVsLegacyConstants | naturalObserverSuite | 1007 | 2000 |
| E12_legacyConstants | neutralVsLegacyConstants | legacyComparison | 1007 | 2000 |
| E13_observedRatioSurvey | observedRatioSurvey | naturalObserverSuite | 1008 | 2000 |
| E14_longRunNaturalComparison | longRunNaturalComparison | naturalObserverSuite | 1009 | 5000 |

## 5. expectedObservationKinds policy

`expectedObservationKinds` lists the metric kinds that are the focus of
observation for a given scenario. These are NOT guaranteed outcomes.

- Absence of an expected observation is a valid result.
- Results must not be interpreted as proof of consciousness, life,
  intelligence, semantic memory, or mystical causality.
- No fake results are generated to satisfy expected observation kinds.

## 6. nonGuaranteedNotes policy

Every scenario includes `nonGuaranteedNotes` that clarify:
- What absence of the expected observations means (valid result).
- What the observations do and do not demonstrate.
- Which comparisons should be run for context.

These notes must be surfaced in any UI that displays scenario results.

## 7. Connection to v1.2 export / reproducibility

Each experiment stores:
- `seed` — for deterministic replay
- `ticks` — total run length
- `sampleEveryTicks` — sampling interval
- `runtimePresetId` — which preset was active

These fields map directly to `ResearchRunMetadata` fields from v1.2
(`seed`, `ticks`, `sampleEveryTicks`, `presetId`) for export compatibility.

## 8. Connection to N7 Long-Run Comparison Suite

The `longRunNaturalComparison` scenario and `E14_longRunNaturalComparison`
experiment are designed to connect directly to the N7 Long-Run Comparison
Suite. They use the shared seed / scenario / ticks protocol established in
N7 and expose the same variant summary and difference highlight metrics.

## 9. Guardrails

The following claims must never appear in any UI or export output derived
from these scenarios or experiments:

- consciousness / emotion / self-awareness / soul
- semantic memory / learning / meaning
- intelligence / life proof
- mystical / healing proof
- high vortex count = consciousness
- high ratio match = mystical proof
- high plasticity accumulation = memory
- high closure stability = self-awareness

Absence of emergence is always a valid observation.
