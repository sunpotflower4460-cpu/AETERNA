# Complex Scalar Field

## 1. Purpose

N2 introduces a single complex field `ψ` on the torus so AETERNA can observe amplitude, phase, wrapped phase gradients, and observer-side vortex candidates without removing the existing scalar runtime.

## 2. Why complex field

The scalar field remains the default runtime. The complex field is added so closed torus flow can be inspected through:

- amplitude drop
- phase rotation
- local winding
- phase-defect / vortex candidates

This is observation scaffolding for later geometry × vortex work, not a semantic layer.

## 3. Complex field is one field, not two semantic fields

`real` and `imag` are two numerical components of one complex field `ψ`.

- They are not separate meaning-bearing channels.
- They are not yin/yang semantics.
- They are not emotion, intention, self, or consciousness axes.

## 4. Update equation

The observer/runtime helper uses:

`ψ_next = ψ + iα∇²ψ + βψ - γ|ψ|²ψ`

Implemented in split real / imag form:

- `nextReal = real + dt * (-alpha * lapImag + beta * real - gamma * |ψ|² * real)`
- `nextImag = imag + dt * ( alpha * lapReal + beta * imag - gamma * |ψ|² * imag)`

Flat Laplacian is the default. Curved metric scaling is optional and weak.

## 5. Amplitude and phase

- `amplitude = sqrt(real² + imag²)`
- `phase = atan2(imag, real)`
- `phaseCoherence` = mean unit-phase-vector length
- `phaseGradient` = wrapped local phase-gradient magnitude

Initial seeding is quiet and reproducible:

- `real` is seeded from the current scalar buffer when the observer is activated
- `imag` gets a tiny deterministic perturbation
- no hidden `Math.random()` drift is added

## 6. Phase winding and vortex candidates

Vortex candidates are observer-side only.

For each plaquette:

1. compute wrapped phase differences around the loop
2. sum the wrapped differences
3. estimate `topologicalCharge = round(winding / 2π)`
4. require local amplitude reduction and sufficient winding confidence

Outputs include:

- `vorticity`
- `topologicalCharge`
- `vortexCandidate`
- per-candidate confidence and lifetime

## 7. Runtime modes

- `scalar`: legacy default
- `complexObserver`: complex field updates in parallel and does not drive the main runtime
- `complexRuntime`: guarded mode for explicit experiments; default coupling remains `0`

Default configuration stays safe:

- `enabled: false`
- `mode: observerOnly`
- `fieldRuntimeMode: scalar`

## 8. Visualization policy

- `fieldPhase` maps actual phase to hue
- amplitude controls brightness / opacity
- low amplitude stays dark
- `vortexCandidate` markers are separate proxy overlays
- no fake phase animation
- no fake vortex markers

## 9. Guardrails

- do not assign semantic meaning to `real` / `imag`
- do not treat phase as emotion, intention, or consciousness
- do not treat vortex as self, soul, memory, or mind
- vortex candidates remain observer-side
- complex field introduction does not prove life or consciousness
- no external LLM / API calls
- existing scalar runtime remains present and is still the default
