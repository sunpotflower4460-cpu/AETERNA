# Causal Trace / Layer Correlation

AETERNA-NATURAL v1.8 — Causal Trace / Layer Correlation

---

## 1. Purpose

Causal Trace and Layer Correlation are observation-side analysis tools that help
researchers identify possible contributing signals and statistical patterns within
AETERNA's simulation data.

These tools are designed for scientific investigation only. They do not modify
runtime dynamics. They do not imply causation. They do not claim consciousness,
life, intelligence, or any semantic or emotional property of the system.

---

## 2. Causal Trace is not causal proof

**This is the most important principle of this entire module.**

Causal Trace identifies *possible contributing signals* — not causal relationships.

- A "signal" in this system means: "this metric changed, or an event occurred, near the time
  and place where the selected cell metric changed."
- That does not mean the signal caused the change.
- Correlation between two metrics over time does not prove that one caused the other.
- Temporal proximity does not prove causation.

**All causal trace output carries the caution:**
> "This is a possible contributing signal, not causal proof."

Researchers must not interpret high confidence scores, strong correlations, or
many signals as evidence of causation, consciousness, life, or intelligence.

---

## 3. Possible contributing signals

Signals are extracted using rule-based logic from observation snapshots. No LLM
or API is called. Signals are only emitted when real data supports them.

Signal types:

| `relationKind`          | Description |
|-------------------------|-------------|
| `same_cell`             | Metric changed in the selected cell between previous and current snapshot |
| `temporal_nearby`       | Events occurred within 10 ticks of the current tick |
| `threshold_near`        | A metric exceeds 0.8 of its operational threshold |
| `ratio_component`       | The cell is in the component list of an observed ratio |
| `neighbor_cell`         | Metric change in a neighbouring cell (future) |
| `same_region`           | Metric change in same geometric region (future) |
| `co_change`             | Two metrics changed together (future) |
| `comparison_difference` | Metric differed in a long-run comparison variant (future) |

Confidence levels: `low` | `medium` | `high` | `insufficient`

`insufficient` is returned when no snapshots or cell observation are available.

---

## 4. Layer correlation

Layer Correlation computes Pearson correlation coefficients between pairs of
`globalSummary` metrics over a configurable time window.

Default pairs:

- Phase Coherence × Vortex Candidate Count
- Vortex Candidate Count × Plasticity Accumulation
- Plasticity Accumulation × Observed Ratio Match Strength

**Rules:**

- Fewer than 3 samples → `confidence: 'insufficient'`, `correlation: null`
- Zero-variance input → `correlation: null` (not NaN)
- Correlation range: `[-1, 1]`. NaN is never returned.
- Correlation ≥ 20 samples → `confidence: 'medium'`. Otherwise `'low'`.

**Caution always displayed:**
> "Correlation is not causal proof."

---

## 5. Difference view

Difference View computes `delta = afterValue - beforeValue` for all observation
metrics between two selected ticks.

- `relativeDelta = delta / |beforeValue|` (null when beforeValue is 0 or unavailable)
- `largestChanges`: top 5 items by `|delta|`, descending
- Null/undefined values are preserved — never substituted with 0
- No interpolation between ticks

The difference view is useful for identifying which metrics changed the most
between two observation points. It does not imply causation.

---

## 6. Observed ratio involvement

Observed Ratio Involvement identifies which observed ratios include a selected
cell as a structural component.

- Component cell lists are taken directly from observer data — never fabricated.
- When `componentCellIndices` is absent, a caution is shown:
  > "Component cell data unavailable. Involvement is inferred from ratio source, not direct component list."
- Ratio involvement is a structural/geometric relationship, not a semantic one.
- Match strength is a similarity proxy only — not proof of resonance or significance.

---

## 7. Rule-based guide integration

When `causalTraceAvailable: true` is set in `LensGuideContext`, the rule-based
guide includes `causalTraceLines` in its output.

`causalTraceLines` always includes:
- Summary lines from `causalTraceSummary`
- The mandatory caution: "This is a possible contributing signal, not causal proof."
- Any additional cautions from `causalTraceCautions`

When `causalTraceAvailable` is false or not set, `causalTraceLines` is null.

---

## 8. Visualization policy

All UI panels in this module follow the existing visualization integrity principles:

- No fake data is ever displayed.
- Unavailable values are shown as "—" or "(unavailable)".
- Disclaimers are always shown prominently.
- No decorative or emotionally suggestive language.
- XSS safety is enforced via `_esc()` in all HTML renderers.

---

## 9. Guardrails

The following are hard prohibitions for this entire module:

- **No LLM / API calls** of any kind.
- **No runtime dynamics changes.** These are observer-side tools only.
- **No fabricated signals.** Signals are only built when real data supports them.
- **No causal claims.** All signals use "possible contributing signal" language.
- **No NaN in correlation output.** Return `null` instead.
- **No consciousness / emotion / intelligence / life / soul / mystical claims.**
- **No Node bridge.** This module does not integrate with any semantic memory system.

---

## 10. Future phases

The following signal types and features are planned for future phases:

- `neighbor_cell` signals: detect changes in geometrically adjacent cells
- `same_region` signals: aggregate signals within the same torus region
- `co_change` signals: detect metrics that co-vary across multiple cells
- `comparison_difference` signals: highlight metrics that differed between long-run comparison variants
- Temporal lag correlation: measure correlation at non-zero tick offsets
- Spatial correlation heatmap: visualise correlation strength across torus surface

All future features will follow the same guardrails listed in §9.
