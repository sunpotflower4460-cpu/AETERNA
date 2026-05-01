# Observed Ratios

## Purpose

AETERNA's field dynamics produce emergent numerical patterns — amplitude distributions, vortex spacings, flow delays, closure timings, and phase coherence distributions.

**Observed Ratios** captures these patterns as ratios (A/B) and compares them against known reference values (φ, Schumann, etc.) on the observer side.

This answers the question: *Do the dynamics produce ratios that happen to be close to known reference values — without those reference values being planted as causes?*

---

## Types

### ObservedRatio

```typescript
export interface ObservedRatio {
    id: string;
    label: string;
    numerator: number;
    denominator: number;
    value: number;     // numerator / denominator, guarded against NaN/Infinity
    source: 'amplitudePeak' | 'vortexSpacing' | 'flowDelay' | 'closureTiming' | 'phaseCoherence' | 'other';
    confidence: number; // 0–1
}
```

### ReferenceRatioMatch

```typescript
export interface ReferenceRatioMatch {
    observedRatioId: string;
    referenceRatioId: string;
    observedValue: number;
    referenceValue: number;
    absoluteDistance: number;
    relativeDistance: number;
    centsDistance: number | null;  // only when both > 0
    matchStrength: number;         // 0–1
}
```

### ObservedRatiosState

Aggregates all observed ratios, reference matches, summary statistics, and safety checks.

Key fields:
- `observedRatios` — list of observed ratios
- `referenceMatches` — list of all observed × reference comparisons
- `strongestMatch` — match with highest `matchStrength`
- `averageMatchStrength` — 0–1
- `emergentResonanceProxy` — 0–1 (top-N match strength average)
- `observationConfidence` — 0–1
- `nanOrInfinityCount` — always 0 in normal operation
- `externalConstantsMode` — `'neutral'` or `'legacy'`

---

## Derivation

`deriveObservedRatios(params)` is a pure function that:

1. Collects observed ratios from available field states
2. Computes reference ratio matches
3. Derives summary statistics
4. Returns an `ObservedRatiosState`

It does NOT:
- Modify any runtime state
- Feed results back into dynamics
- Claim any meaning from the results

---

## Distance Calculation

```
absoluteDistance  = |observed − reference|
relativeDistance  = absoluteDistance / max(|reference|, ε)
centsDistance     = 1200 × log₂(observed / reference)   [only when both > 0]
matchStrength     = clamp(1 − relativeDistance / tolerance, 0, 1)
```

- Default tolerance: 0.3 (30% relative error → matchStrength = 0)
- `centsDistance` is `null` when observed ≤ 0 or reference ≤ 0
- NaN and Infinity are guarded throughout

---

## Emergent Resonance Proxy

```
emergentResonanceProxy = average(top-5 matches by matchStrength)
```

**CAUTION:**
- This is a similarity proxy.
- High value = several observed ratios are numerically close to reference values.
- It does NOT prove resonance, life, consciousness, or mystical meaning.
- It is NOT fed back into runtime dynamics.
- Low value is not a failure. High value is not a success or proof.

---

## Current Ratio Candidates

| ID | Source | Formula |
|---|---|---|
| `amplitudePeakToAverage` | Complex field | maxAmplitude / averageAmplitude |
| `vortexDensityMaxMin` | Curvature-vortex coupling | max band density / min band density |
| `flowConfidenceMaxAvg` | Repeated flow paths | max path confidence / average confidence |
| `closureReturnToStability` | Body-world closure | returnStrength / closureStability |
| `phaseCoherenceRatio` | Complex field | phaseCoherence / (1 − phaseCoherence) |

Additional ratio candidates can be added in future phases without changing the type system.

---

## Reference Ratios

Reference ratios are defined in `src/observer/referenceRatios.ts`.

| ID | Value | Category |
|---|---|---|
| `goldenRatio` | 1.6180339887... | mathematical |
| `phiInverse` | 0.6180339887... | mathematical |
| `sqrt2` | 1.41421356... | mathematical |
| `schumannFundamental` | 7.83 | geophysical |
| `schumannSecond` | 14.3 | geophysical |
| `hz432` | 432 | musical |
| `hz528` | 528 | musical |
| `hz440` | 440 | musical |
| `octave` | 2.0 | musical |
| `fifthRatio` | 1.5 | musical |

All reference ratios carry a mandatory `caution` note stating they are reference-only and not causal ingredients.

---

## UI Display

The Research Panel → Observed Ratios section shows:

| Column | Description |
|---|---|
| Observed | `ObservedRatio.id` / label |
| Source | `ObservedRatio.source` |
| Value | `ObservedRatio.value` |
| Closest reference | `ReferenceRatioMatch.referenceRatioId` |
| Relative distance | `ReferenceRatioMatch.relativeDistance` |
| Match strength | `ReferenceRatioMatch.matchStrength` |
| Confidence | `ObservedRatio.confidence` |

The mandatory panel note:

> Reference match is observational only. It is not used as a causal ingredient and does not prove meaning, life, or consciousness.

---

## Guardrails

- Never feed observed ratios back into runtime dynamics
- Never claim φ-match proves life, consciousness, or meaning
- Never claim Schumann-match proves healing or resonance with nature
- A match is an observational comparison only
- A non-match is not a failure
- `emergentResonanceProxy` is a numerical proxy, not a proof
- `referenceRatios.ts` must not be imported by `dynamicCore.ts`
