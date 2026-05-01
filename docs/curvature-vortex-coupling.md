# Curvature × Vortex Coupling (N3)

## 1. Purpose

N3 combines the torus geometry from N1 (`TorusGeometry`) with the phase-defect
vortex candidates from N2 (`VortexObservationState`) and asks a single
observational question:

> **Do vortex candidates appear more often in high-curvature, low-curvature, or
> uniformly distributed regions of the torus?**

This is a **read-only, observer-side observation**.  It does not modify
runtime dynamics.  It does not feed back into the field update equations.
It is not connected to weak plasticity (that is N5).

The coupling state is derived by `deriveCurvatureVortexCoupling()` and
expressed as a `CurvatureVortexCouplingState`.

---

## 2. Inputs: TorusGeometry and VortexObservation

| Source | Key fields used |
|---|---|
| `TorusGeometry` (N1) | `cells[].gaussianCurvature`, `cells[].minorAngle`, `cells[].innerOuterBias`, `config.segments` |
| `VortexObservationState` (N2) | `candidates[].topologicalCharge`, `candidates[].confidence`, `candidates[].amplitudeMinimum`, `candidates[].lifetimeTicks`, `candidates[].i`, `candidates[].j` |

Both inputs are optional.  When either is `null` or empty, the function returns
a safe fallback `CurvatureVortexCouplingState` with zero counts, empty arrays,
and `observationConfidence = 0`.

---

## 3. Signed Topological Charge on a Torus

On a torus the Euler characteristic is **0**.  In idealized settings, the
signed sum of topological defects is expected to balance toward 0.

AETERNA records the following observational checks:

```
signedTotalCharge  = Σ candidate.topologicalCharge
expectedSignedCharge = 0          (fixed; Euler characteristic of torus)
chargeDeviation    = |signedTotalCharge − 0|
```

Deviations arise from:
- discretization artefacts (finite grid resolution)
- detection threshold effects (confidence cutoff)
- boundary sampling asymmetries

`signedTotalCharge` and `chargeDeviation` are **observational checks**,
not consciousness or meaning indicators.  A non-zero deviation does not
indicate failure; it is informative about the finite-resolution observation.

---

## 4. Vortex Density by Curvature Band

Gaussian curvature values from the geometry are divided into five bands:

| Band ID | Description |
|---|---|
| `negativeHigh` | K < 25th percentile of range |
| `negativeLow`  | 25th percentile ≤ K < −near-zero |
| `nearZero`     | \|K\| < 5% of total range |
| `positiveLow`  | near-zero < K ≤ 75th percentile |
| `positiveHigh` | K > 75th percentile of range |

For each band, the following are recorded:

- `regionCount` — torus cells in this band
- `vortexCount` — candidates whose cell falls in this band
- `positiveChargeCount` / `negativeChargeCount`
- `averageVortexConfidence`
- `averageAmplitudeMinimum`
- `averageVortexLifetime`
- `vortexDensity = vortexCount / max(1, regionCount)`

In flat-metric mode, all cells have `gaussianCurvature = 0`, so all cells
fall in the `nearZero` band.  Curvature-band statistics are less informative
in flat mode — this is expected and noted.

---

## 5. Region-Based Vortex Statistics

The torus is divided into five geometric regions based on minor-angle
`cos(v)` and `sin(v)`:

| Region | Classification criterion |
|---|---|
| `outerRim` | cos(v) > 0.5 (v ≈ 0, outer equator) |
| `innerRim` | cos(v) < −0.5 (v ≈ π, inner equator) |
| `upperRim` | sin(v) > 0.5, \|cos(v)\| ≤ 0.5 (v ≈ π/2) |
| `lowerRim` | sin(v) < −0.5, \|cos(v)\| ≤ 0.5 (v ≈ −π/2) |
| `neutral`  | all remaining cells |

For each region, the following are recorded:

- `vortexCount`
- `positiveChargeCount` / `negativeChargeCount`
- `averageConfidence`
- `averageLifetime`
- `density = vortexCount / max(1, cellCount_in_region)`

These are purely geometric labels.  `innerRim` is **not** a mystical center.
`outerRim` is **not** superior or more significant.

---

## 6. Curvature–Vortex Correlation

`curvatureVortexCorrelation` is the Pearson correlation between the
Gaussian curvature at each vortex candidate site and the candidate's
confidence value:

```
curvatureVortexCorrelation = pearson(
  gaussianCurvature[vortex_i, vortex_j],
  candidate.confidence
)
```

Range: [−1, 1].  Returns 0 when fewer than 2 candidates are available.

`curvatureBiasStrength` measures how unevenly vortex candidates are
distributed across curvature bands:

```
curvatureBiasStrength = (maxBandDensity − meanBandDensity) / meanBandDensity
```

Clamped to [0, 1].

**Correlation ≠ causation.**  A non-zero correlation does NOT mean that
curvature "produces" or "causes" vortex candidates.  It is an observational
relationship only.

---

## 7. Vortex Pairs

Implemented in `deriveVortexPairs()` (see `src/observer/deriveVortexPairs.ts`).

A vortex pair candidate is a proximity-based pairing of:
- one candidate with `topologicalCharge > 0`
- one candidate with `topologicalCharge < 0`
- within `maxDistance = 3` grid cells (torus-wrapped)
- both candidates above `minConfidence = 0.3`

Each positive candidate is matched to the nearest eligible negative (greedy
nearest-neighbor).  Each candidate appears in at most one pair.

From pairs, `CurvatureVortexCouplingState` records:

- `vortexPairCount`
- `averageVortexPairLifetime`

Vortex pairs are **not** semantic pairs, memory edges, or relation nodes.
They are geometric proximity observations only.

---

## 8. Flat vs Curved Comparison Preparation

`compareFlatCurvedVortexStats()` (see `src/observer/compareFlatCurvedVortexStats.ts`)
accepts two `CurvatureVortexCouplingState` values — one derived under flat
metric mode and one under curved metric mode — and returns a
`FlatCurvedVortexComparison` snapshot.

Fields compared:
- `vortexCount`
- `signedTotalCharge`
- `averageVortexLifetime`
- `curvatureBiasStrength`

`differenceSummary` provides human-readable notes.

`CurvatureVortexCouplingState.flatVsCurvedComparisonAvailable` is set to
`true` when a caller has produced both flat and curved observations and
invoked the comparison function.

**Full long-run comparison is deferred to N7.**  In N3, this is a snapshot
capability only.

---

## 9. Visualization Policy

The `curvatureVortexCoupling` field layer is defined in
`src/ui/render/fieldLayerRegistry.ts` with:

- `valueKind: 'proxy'`
- `defaultVisible: false`
- `allowedModes: ['overlay', 'diagnostic']`

Intended visual design (to be implemented in the renderer):

- Faint curvature background (Gaussian curvature heat map, low opacity)
- Vortex candidate markers overlaid (positive = one colour, negative = another)
- Thin region boundary lines (outerRim / innerRim / upperRim / lowerRim)
- Panel sidebar showing: total charge, charge deviation, correlation,
  bias strength, region counts, pair count

The layer must **not** be overly bright or misleadingly prominent.
It belongs in Diagnostic / Overlay mode.

---

## 10. Guardrails

The following constraints are permanent and non-negotiable for this module
and any code that references it:

1. **Curvature and vortex observations are NOT causal proofs.**
   A vortex density difference across curvature bands is an observational
   finding; it does not prove that curvature creates vortex candidates.

2. **Vortex candidates are NOT consciousness, self, soul, or emotion.**
   They are observer-side phase-defect candidates derived from a mathematical
   complex scalar field.

3. **`signedTotalCharge` is a topological check.**
   It is not a mystical indicator, not a measure of system health, and not
   a consciousness metric.

4. **`innerRim` is not a mystical center.**
   It is the geometric region where `cos(v)` is strongly negative.

5. **`curvatureVortexCoupling` is NOT a runtime feedback path.**
   It does not modify `dynamicCore`, `resistance`, `plasticity`, or any
   runtime update equation.

6. **Weak plasticity is NOT implemented in N3.**
   The first runtime connection is planned for N5.

7. **No semantic / consciousness / emotion claims are permitted**
   in any description, label, comment, summary line, or doc string
   that references this module.

8. **No fake vortex, fake curvature effect, or artificial fluctuation**
   may be added to make the visualization appear more lively.

9. **Correlation ≠ causation.**
   `curvatureVortexCorrelation` is a statistical observation, not a
   mechanistic claim.

10. **`PHI_INV` and `SCHUMANN_RES` are not removed in N3.**
    That is planned for N6.
