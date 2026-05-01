# External Constants Removal

## 1. Purpose

N6 introduces **External Constants Removal / Observed Ratios** to AETERNA.

The goal is to move constants such as φ (golden ratio), φ⁻¹ (phi inverse), and Schumann resonance values out of the **causal pathway** of core dynamics, and into an **observer-side reference** layer.

This change increases the scientific integrity of AETERNA: the system no longer secretly encodes these constants as hidden causes, but instead observes its own emerging dynamics and compares them against reference values.

**Key principle:** φ and Schumann are not denied or removed. They are simply moved from "hidden cause" to "observer-side reference."

---

## 2. Why Remove External Constants from Core Dynamics

Prior to N6, `dynamicCore.ts` contained the following:

```typescript
const freqRatio = (state.disk.omega_t - SCHUMANN_RES) / (GAMMA_SYNC - SCHUMANN_RES);
const waveSpeed = 0.1 + 0.15 * freqRatio;
const damping = 0.985 - (1.0 - PHI_INV) * 0.02 * (1.0 - freqRatio);
```

This has two problems:

1. **SCHUMANN_RES** (7.83) was used as the lower normalisation bound for frequency. This makes the dynamics subtly anchored to Schumann frequency without any physical justification.
2. **PHI_INV** (≈0.618) was used as a damping weight. This silently bakes the golden ratio into the wave dynamics.

When these constants "happen to appear" in the observed dynamics, it is not because they emerged — they were planted as hidden causes.

N6 removes this by:

- In **neutral mode** (default): replacing the constant names with explicit `CoreDynamicsConstantsConfig` parameters.
- In **legacy mode** (comparison only): preserving the pre-N6 formula for before/after comparison.

---

## 3. Runtime-Causal vs Observer-Reference Constants

### Runtime-causal constants (pre-N6)

These constants were directly influencing runtime updates:

| Constant | Value | Location | Effect |
|---|---|---|---|
| `PHI_INV` | ≈0.618 | `dynamicCore.ts:136` | Damping weight |
| `SCHUMANN_RES` | 7.83 | `dynamicCore.ts:134` | Frequency normalisation lower bound |

### Observer-reference constants (N6+)

These constants are now located in `src/observer/referenceRatios.ts` and are used **only for comparison**:

| Reference | Value | Category | Caution |
|---|---|---|---|
| Golden Ratio φ | 1.618... | mathematical | Reference only |
| φ inverse | 0.618... | mathematical | Reference only |
| Schumann fundamental | 7.83 | geophysical | Reference only |
| Schumann 2nd harmonic | 14.3 | geophysical | Reference only |
| 432 Hz | 432 | musical | Reference only |
| 528 Hz | 528 | musical | Reference only |

### UI/documentation constants

These appear in display text and comparison labels only. They carry no causal effect.

---

## 4. Legacy Mode and Neutral Mode

### Neutral mode (default)

Core dynamics use only explicit `CoreDynamicsConstantsConfig` parameters:

```typescript
const rangeSpan = Math.max(cfg.freqRangeMax - cfg.freqRangeMin, 1e-6);
const freqRatio = clamp((omega_t - cfg.freqRangeMin) / rangeSpan, 0, 1);
const waveSpeed = cfg.waveSpeedBase + cfg.waveSpeedFreqScale * freqRatio;
const damping = cfg.dampingBase - cfg.dampingLoss * (1.0 - freqRatio);
```

The numeric defaults in neutral mode (`freqRangeMin = 7.83`, `dampingLoss = 0.00764`) are chosen to preserve runtime continuity, but they are unnamed configuration parameters — not φ or Schumann by name.

### Legacy mode (for comparison only)

Legacy mode restores the pre-N6 behaviour exactly, using `PHI_INV` and `SCHUMANN_RES` directly. This is provided for **before/after research comparison only** and must not be used as the production default.

To enable legacy mode:

```typescript
import { legacyCoreDynamicsConstantsConfig } from './config/coreDynamicsConstantsConfig.ts';
network.coreDynamicsConstantsConfig = legacyCoreDynamicsConstantsConfig;
```

Legacy mode is labelled `"legacy comparison only"` in all UI that exposes it.

---

## 5. Reference Ratios

Reference ratios are defined in `src/observer/referenceRatios.ts`.

Each `ReferenceRatio` has:
- `id`: unique string identifier
- `label`: human-readable name
- `value`: numeric value
- `category`: `'mathematical' | 'geophysical' | 'musical' | 'custom'`
- `description`: neutral description
- `caution`: mandatory caution note displayed in UI

**Important:** `referenceRatios.ts` must never be imported by `dynamicCore.ts` or any other runtime update file.

---

## 6. Observed Ratios

Observed ratios are derived from field dynamics by `src/observer/deriveObservedRatios.ts`.

Current observed ratio candidates:

| ID | Source | Description |
|---|---|---|
| `amplitudePeakToAverage` | Complex field | max amplitude / average amplitude |
| `vortexDensityMaxMin` | Curvature-vortex coupling | max vortex density band / min vortex density band |
| `flowConfidenceMaxAvg` | Repeated flow paths | max path confidence / average path confidence |
| `closureReturnToStability` | Body-world closure | return strength / closure stability |
| `phaseCoherenceRatio` | Complex field | phase coherence / (1 − phase coherence) |

---

## 7. Reference Ratio Distance

For each observed ratio × reference ratio pair:

```
absoluteDistance = |observed − reference|
relativeDistance = absoluteDistance / |reference|
centsDistance    = 1200 × log₂(observed / reference)   [only when both > 0]
matchStrength    = clamp(1 − relativeDistance / tolerance, 0, 1)
```

Default `matchTolerance = 0.3`.

---

## 8. Emergent Resonance Proxy

```
emergentResonanceProxy = average(top-5 matches by matchStrength)
```

**CAUTION:** This proxy measures "are observed ratios numerically close to reference values?" — nothing more. It does NOT prove resonance, life, consciousness, or mystical meaning.

---

## 9. Visualization / UI Policy

- Reference ratios appear in the **Research Panel → Observed Ratios** section.
- Each reference ratio row shows its `caution` note.
- Match tables show: Observed ratio, Source, Value, Closest reference, Relative distance, Match strength, Confidence.
- The panel includes the mandatory note:

> Reference match is observational only. It is not used as a causal ingredient and does not prove meaning, life, or consciousness.

- No ratio overlays are rendered on the torus surface by default (diagnostic overlay only, default OFF).

---

## 10. Guardrails

- φ, Schumann resonance, 432 Hz, and 528 Hz are not denied or removed.
- They are reference values for comparison only.
- Core dynamics do not reference them by name in neutral mode.
- A match between an observed ratio and a reference ratio is an observational fact only.
- A high `matchStrength` is not a proof of anything.
- A low `matchStrength` is not a failure.
- `emergentResonanceProxy` is a similarity proxy, not a proof of resonance.
- `observedRatio` values are never fed back into runtime dynamics.
- `referenceRatios.ts` must not be imported by `dynamicCore.ts`.
- No consciousness, life, or healing claims are made.
- Legacy mode is for research comparison only; it is not the default.
