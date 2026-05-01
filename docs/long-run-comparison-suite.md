# Long-Run Comparison Suite

N7: AETERNA-NATURAL Long-Run Comparison Suite

---

## 1. Purpose

The Long-Run Comparison Suite (N7) runs the N1–N6 variant configurations side-by-side over a shared seed, shared scenario, and shared tick count.

The purpose is to observe **which changes introduced in N1–N6 produce measurable differences in long-run field dynamics**, and to what degree.

This is a **pre-semantic comparison of field, vortex, trace, closure, ratio, and candidate structure statistics**. It is not a proof of consciousness, life, intelligence, or meaning.

---

## 2. Why a comparison suite

N1–N6 introduced:

| Phase | Change |
|---|---|
| N1 | Curved torus metric |
| N2 | Complex scalar field |
| N3 | Curvature × vortex coupling observation |
| N4 | Boundary as mediating layer (membrane) |
| N5 | Weak plasticity channel |
| N6 | External constants removal / observed ratios |

Each change was introduced conservatively with observer-only defaults. The comparison suite allows distinguishing:

- Which changes produce measurable differences (and which do not)
- How large those differences are
- Whether the differences behave as expected (or unexpectedly)
- Whether any change introduces instability (saturation risk, NaN/Infinity)

The comparison is designed to answer: **"Does N-series actually change anything observable, and where?"**

---

## 3. Variants

Nine variants are defined, covering a progression from the pre-N-series baseline to the full N1–N6 natural configuration:

| ID | Metric | Field | Membrane | Plasticity | Constants |
|---|---|---|---|---|---|
| `legacyFlatScalar` | flat | scalar | off | off | legacy |
| `curvedOnly` | curved | scalar | off | off | neutral |
| `complexOnly` | flat | complexObserver | off | off | neutral |
| `curvedComplex` | curved | complexObserver | off | off | neutral |
| `curvedComplexMembrane` | curved | complexObserver | observerOnly | off | neutral |
| `curvedComplexPlasticityObserveOnly` | curved | complexObserver | observerOnly | observeOnly (ablation on) | neutral |
| `curvedComplexPlasticityResistanceOnly` | curved | complexObserver | observerOnly | resistanceOnly (ablation off) | neutral |
| `neutralConstantsFullNatural` | curved | complexObserver | observerOnly | observeOnly | neutral |
| `legacyConstantsFullNatural` | curved | complexObserver | observerOnly | observeOnly | legacy |

### Notes

- `legacyFlatScalar` is the **comparison reference baseline**, not a "worse" version.
- `legacyConstantsFullNatural` is **comparison use only** — not the default runtime.
- `curvedComplexPlasticityResistanceOnly` is the **highest-risk variant** — clamp and saturation guard must be verified before running.

---

## 4. Shared seed / shared scenario policy

All variants in a single comparison run share:

- **seed**: same pseudo-random seed
- **ticks**: same number of simulation ticks
- **scenarioId**: same scenario preset

This ensures that any observed differences are attributable to variant configuration alone, not to different initial conditions.

---

## 5. Metrics

### Summary metrics (per variant)

| Metric | Description |
|---|---|
| `averageVortexCount` | Mean vortex candidate count across snapshots |
| `averageVortexLifetime` | Estimated mean vortex lifetime in ticks |
| `averagePhaseCoherence` | Mean phase coherence (complex field variants only) |
| `signedTotalChargeAbsMean` | Mean absolute signed topological charge |
| `averageCurvatureVortexCorrelation` | Curvature–vortex correlation (proxy) |
| `averageClosureStability` | Mean closure loop stability |
| `averageMembraneTwoSidedness` | Mean membrane two-sidedness (membrane variants) |
| `totalPlasticityAccumulation` | Total plasticity trace accumulation over run |
| `averageObservedRatioMatchStrength` | Mean observed ratio match strength |
| `maxSaturationRisk` | Maximum saturation risk across run |
| `semanticLeakCount` | Count of semantic layer activations (always 0) |
| `nanOrInfinityCount` | Count of NaN/Infinity values (should always be 0) |

### Snapshot metrics (per tick sample)

Per-tick snapshots are taken every `sampleEveryTicks` ticks, bounded by `maxSnapshotsPerVariant`.

### Comparison metrics

| Metric | Description |
|---|---|
| `differenceMagnitude` | Absolute difference between strongest and weakest variant |
| `strongestVariantId` | Variant with highest value for this metric |
| `weakestVariantId` | Variant with lowest value for this metric |
| `comparisonConfidence` | Overall confidence score for the comparison [0, 1] |

---

## 6. Difference highlights

The suite generates difference highlights for metrics where the cross-variant range exceeds a threshold.

Example highlight interpretations:

> Curved + complex variants showed higher vortex lifetime than flat scalar baseline.

> Weak plasticity resistance-only variant showed higher trace persistence, but also increased saturation risk.

> Neutral constants variant still produced observed ratio matches, suggesting reference similarity is not solely caused by legacy constants.

All interpretations are **observational** — they describe what was measured, not what it means in terms of life, consciousness, or intelligence.

---

## 7. Dashboard policy

The Comparison Dashboard displays:

- Run metadata (name, seed, ticks, scenario)
- Safety checks (semantic layer inactive, Node bridge inactive, LLM/API inactive, etc.)
- Run button and status
- Per-variant summary cards
- Metric comparison table (one column per variant, one row per metric)
- Difference highlights

The dashboard does **not** display:

- Consciousness claims
- Life proof claims
- Intelligence claims
- Mystical proof claims
- Fake results or fake events

---

## 8. Export policy

Two export formats are available:

- **JSON**: full `LongRunComparisonResult` object
- **Markdown**: human-readable report with metric table and difference highlights

Exports include interpretation guardrails in the header.

---

## 9. Interpretation guardrails

These guardrails apply to all UI displays, exports, and documentation:

| Observation | What it IS | What it is NOT |
|---|---|---|
| High `averageVortexCount` | A count of phase-defect candidates | Consciousness |
| High `averageObservedRatioMatchStrength` | Observer-side ratio proximity | Mystical proof |
| High `totalPlasticityAccumulation` | Trace accumulation over time | Semantic memory |
| High `averageClosureStability` | Loop continuity proxy | Self-awareness |
| Low / absent emergence | A valid observation | A failure |
| High `signedTotalCharge` | Topological imbalance | Spiritual charge |

**Absence of emergence is a valid observation — it is not a failure.**

**Results must not be adjusted to match expected patterns.**

---

## 10. Future extensions

Potential future work (not in N7):

- Integration with live `dynamicCore` scenario runner (replacing stub sampling)
- Longer default tick counts (10,000+)
- Per-snapshot detailed field dumps (opt-in)
- Cross-comparison between multiple seeds
- Statistical confidence intervals across repeated runs
- Automated regression comparison against a stored baseline

These extensions would require careful review against the no-behavior-break policy and guardrails in `docs/agent-guardrails.md`.
