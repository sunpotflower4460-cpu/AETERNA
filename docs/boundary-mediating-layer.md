# Boundary as Mediating Layer

## 1. Purpose

N4 introduces a membrane layer between `BodySurfaceState` and `WorldMediumState`.
The membrane is an observer-visible computational boundary layer for actuation, return, attenuation, resistance, and recovery.

## 2. Why membrane layer

The body-world loop now has an explicit thin layer where outward actuation and inward return can leave compatible imprints.
This helps observe how body-side and world-side changes are coupled through the same boundary state without replacing either side.

## 3. Relationship to BodySurface and WorldMedium

- `BodySurfaceState` remains the body-side boundary state.
- `WorldMediumState` remains the external medium state.
- `MembraneState` sits between them as a mediating layer.
- The membrane does not replace `BodySurfaceState` or `WorldMediumState`.

## 4. Membrane state fields

`MembraneState` tracks per-cell and aggregate membrane values:

- permeability
- tension
- deformation
- recovery
- actuationImprint
- returnImprint
- twoSidedness
- localResistance
- localAttenuation
- membraneIntegrity
- membraneConfidence
- nanOrInfinityCount

## 5. Actuation imprint

`actuationImprint` records where actuation pulse influence is observed on the membrane.
It is an interaction trace on the mediating layer, not an intention or semantic output.

## 6. Return imprint

`returnImprint` records where sensory return influence is observed on the membrane.
It is a return-side trace on the same layer, not a message or interpretation.

## 7. Two-sidedness proxy

`twoSidedness` measures how strongly actuation and return imprints coexist on the same membrane cells.
`actuationReturnOverlap` is an observer-side overlap proxy that supports closure and reafference inspection.

## 8. Weak coupling policy

`MembraneConfig` defaults to `observerOnly`.
`weakCoupling` exists as a config-gated mode, but the default policy keeps `couplingToWorld = 0` and `couplingToBody = 0` so prior runtime behavior is preserved.

## 9. Visualization policy

The `membraneState` field layer is observer-side and diagnostic.
Display uses actual membrane values only: deformation, permeability, tension, actuation imprint, return imprint, and overlap/two-sidedness.
No fake deformation or fake return is added.

## 10. Guardrails

- Membrane is not a soul, self, or consciousness boundary.
- `twoSidedness` is not self-recognition.
- `actuationImprint` is not intention.
- `returnImprint` is not a message.
- weak coupling is default off, clamp-bounded, and ablation-capable.
- Membrane does not replace `BodySurfaceState` or `WorldMediumState`.
