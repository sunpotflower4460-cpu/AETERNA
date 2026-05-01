# Curved Torus Metric

## 1. Purpose

N1 introduces geometry-derived torus metric data so AETERNA can compare a flat periodic grid with a geometric torus without rewriting the runtime core.

## 2. Flat torus vs curved torus

- **Flat torus**: periodic `segments × segments` grid, uniform area, zero curvature, legacy runtime behavior.
- **Curved torus**: same topology, but each grid cell also carries area element, curvature, tangent, and normal data derived from `majorRadius` and `minorRadius`.

## 3. Torus parameterization

For grid cell `(i, j)`:

- `u = 2π * i / segments`
- `v = 2π * j / segments`
- `x = (R + r cos v) cos u`
- `y = (R + r cos v) sin u`
- `z = r sin v`

`R = majorRadius`, `r = minorRadius`.

## 4. Area element

- `areaElement = r * (R + r cos v)`
- Validation requires `R > r > 0`
- If `majorRadius <= minorRadius`, geometry generation warns and falls back to a safe `majorRadius`

## 5. Gaussian curvature

- `K = cos v / (r * (R + r cos v))`
- Outer rim (`v ≈ 0`) is positive
- Inner rim (`v ≈ π`) is negative

## 6. Mean curvature

- `H = (R + 2r cos v) / (2r * (R + r cos v))`
- This implementation follows the same sign convention everywhere in code and docs

## 7. Tangent / normal vectors

- `normal = [cos u cos v, sin u cos v, sin v]`
- `majorTangent = [-sin u, cos u, 0]`
- `minorTangent = [-cos u sin v, -sin u sin v, cos v]`
- All vectors are normalized before validation succeeds

## 8. Runtime integration policy

- Default runtime metric mode remains `flat`
- `curvatureInfluence = 0` preserves old dynamics exactly
- N1 keeps geometry connected to network state, diagnostics, and observers only
- Large `dynamicCore` rewrites are deferred

## 9. Visualization policy

- `torusCurvature` is a geometry-derived layer, not a decorative effect
- Flat/Curved toggle is explicit
- Curved mode is labeled **observation only** whenever `curvatureInfluence = 0`

## 10. Guardrails

Forbidden:

- fake curvature visuals
- fake energy or fake trace overlays
- consciousness / emotion / self explanations based on curvature
- inner-rim mystification

Preferred:

- geometry-derived metric
- area-normalized observation
- curvature asymmetry
- explicit flat vs curved ablation
