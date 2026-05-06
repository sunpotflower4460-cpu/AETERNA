# Public Research Mode

AETERNA-NATURAL v1.4 — Public Research Mode specification and defaults.

---

## 1. Purpose

Public Research Mode is the default operating mode for first-time and general users of AETERNA-NATURAL. It provides a conservative, safe entry point into the torus field observation lab.

Goals:
- Present the system as a field observation tool, not a proof of anything
- Default to the safest preset and scenario
- Hide experimental, legacy, and advanced options behind explicit confirmation
- Make export and reproducibility prominent
- Show interpretation guardrails at all times

---

## 2. Public mode defaults

| Field | Value |
|---|---|
| `enabled` | `true` |
| `defaultPresetId` | `safeBaseline` |
| `defaultScenarioId` | `quietBaseline` |
| `allowExperimentalMode` | `false` |
| `allowComplexRuntime` | `false` |
| `allowWeakPlasticityResistanceOnly` | `false` |
| `allowLegacyConstants` | `false` |
| `showAdvancedPanels` | `false` |
| `showRawDiagnostics` | `false` |
| `showExportActions` | `true` |
| `showLongRunComparison` | `true` |
| `requireWarningBeforeExperimental` | `true` |

---

## 3. Hidden experimental options

The following are NOT available in default public mode:

- `allowExperimentalMode` — enables safetyMode=experimental presets
- `allowComplexRuntime` — enables fieldRuntimeMode=complexRuntime
- `allowWeakPlasticityResistanceOnly` — enables weakPlasticityMode=resistanceOnly
- `allowLegacyConstants` — enables externalConstantsMode=legacy
- `showAdvancedPanels` — shows hidden configuration panels
- `showRawDiagnostics` — shows unfiltered raw diagnostic output

These can be enabled by a researcher who explicitly confirms they understand the limitations and accepts the associated risks.

---

## 4. Public-safe scenarios

The following scenarios are available to all public users:

| ID | Title |
|---|---|
| `quietBaseline` | Quiet Baseline |
| `singlePulseReturn` | Single Pulse Return |
| `repeatedGentlePulse` | Repeated Gentle Pulse |
| `phaseVortexEmergence` | Phase Vortex Emergence |
| `curvatureBiasObservation` | Curvature Bias Observation |
| `observedRatioSurvey` | Observed Ratio Survey |

**Cautious** (handle with prior knowledge):
- `plasticityTraceObservation`
- `neutralVsLegacyConstants`
- `longRunNaturalComparison`

**Advanced** (hidden/gated):
- `fullNaturalLongRun`

---

## 5. Public-safe experiments

The following experiments (E01–E09, E13) are available to all public users:

- `E01_quietBaselineSafe`
- `E02_quietBaselineNatural`
- `E03_singlePulseReturn`
- `E04_repeatedGentlePulse`
- `E05_repeatedGentlePulsePlasticity`
- `E06_phaseVortexEmergence`
- `E07_phaseVortexNatural`
- `E08_curvatureBiasGeometry`
- `E09_membraneOverlap`
- `E13_observedRatioSurvey`

**Advanced** (hidden/gated):
- `E10_plasticityTraceLongRun`
- `E11_neutralConstants`
- `E12_legacyConstants`
- `E14_longRunNaturalComparison`

---

## 6. Interpretation notes

These notes apply to all observations and are always visible:

- Vortex candidates are phase-defect candidates in the field — not minds, not aware entities.
- Weak plasticity traces are medium-history proxies — not semantic memory, not learned meaning.
- Observed ratio matches are comparisons between field measurements — not proof of anything.
- No emergence is a valid observation. Absence of a result is a result.
- This system is not proof of consciousness, life, intelligence, healing, or mystical truth.

---

## 7. Export policy

All exports include:
- `seed` — the random seed for this run
- `config` — the runtime preset configuration
- `scenario` — the scenario definition
- `ticks` — number of simulation steps

Formats: JSON (machine-readable), Markdown (human-readable summary).

Raw field data is not exported by default. The export is observation-context only.

---

## 8. Guardrails

The following are permanently enforced in all modes, including experimental:

- Semantic layer: inactive
- Node bridge: inactive
- LLM / API calls: inactive
- Observed ratios: observer-side only, never used as runtime feedback
- `semanticLeakCount` must be 0
- `nanOrInfinityCount` must be 0
- Fake results, fake events, and fake visuals are prohibited
