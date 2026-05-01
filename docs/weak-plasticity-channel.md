# Weak Plasticity Channel

N5: Observer-to-Medium Feedback — Minimum Viable Trace

---

## 1. Purpose

The Weak Plasticity Channel introduces the first, minimal observer-to-medium feedback path in AETERNA.

Prior to N5 (N0–N4), all observation candidates — VortexCandidate, RepeatedFlowPathCandidate, LocalExcitabilityField, MembraneObservation — were strictly observer-side. They observed field conditions but fed nothing back to the runtime medium.

N5 opens one tiny, tightly gated, read-only-by-default door:

> When flow concentrates repeatedly in a region, the medium resistance at that region changes by an amount on the order of 10^-4 or below.

This is analogous to a riverbed being very slightly eroded by flow — the smallest possible geological layering.

---

## 2. Why Weak Plasticity

The motivation for N5 is not to implement learning, memory, or adaptation. It is to explore whether:

- Very small, observation-derived resistance traces alter field dynamics at all
- The difference between ablation-on (no feedback) and ablation-off (weak feedback) is measurable
- The system can remain stable under continuous very-small accumulation

All three questions are open. N5 does not presuppose their answers.

---

## 3. Observer-to-Medium Feedback Boundary

The observer-to-medium boundary in N5 is precisely defined:

| Gate | Condition for runtime feedback |
|------|-------------------------------|
| Master switch | `config.enabled === true` |
| Ablation gate | `config.ablationEnabled === false` |
| Mode gate | `config.mode === 'resistanceOnly'` |

All three gates must be open simultaneously for `resistanceScale` to be available to runtime code. Default configuration has all three gates closed or set to the ablated/observe-only position.

When gates are closed, `WeakPlasticityState` and `WeakPlasticityObservationState` are computed for diagnostic and observational purposes only, and are not fed to the runtime.

---

## 4. Allowed Sources

The following observer-side candidates may contribute to weak plasticity trace accumulation:

| Source | Trace channel | Notes |
|--------|---------------|-------|
| VortexCandidate | `vortexTrace` | Both positive and negative topological charge treated equally as flow concentration. Not a consciousness-centre indicator. |
| RepeatedFlowPathCandidate | `repeatedFlowTrace` | from/to regions only. No runtime edge is created. |
| LocalExcitabilityCell | `localExcitabilityTrace` | High excitability + high thresholdProximity + low refractoryDepth only. |
| MembraneObservationState | `membraneTrace` | Global (N4 membrane is not region-level). Applied as uniform weak global trace. |

Each source contributes only when candidate confidence exceeds `requireConfidenceAbove` (default: 0.6).

---

## 5. Trace Accumulation

Each coarse region on the torus has four independent trace channels:

```
vortexTrace
repeatedFlowTrace
localExcitabilityTrace
membraneTrace
```

Per tick, each channel is:

1. Decayed: `trace *= (1 - accumulationDecayRate * dt)`
2. Incremented by contribution from matched observer candidates
3. Clamped to [0, 1]

The combined trace:

```
accumulatedTrace = vortexTrace + repeatedFlowTrace + localExcitabilityTrace + membraneTrace
```

Default rates:

| Parameter | Default | Notes |
|-----------|---------|-------|
| learningRate | 0.0001 | 10^-4 |
| maxDeltaPerTick | 0.0001 | Hard clamp per tick |
| accumulationDecayRate | 0.00001 | Very slow forgetting |

Accumulation does not saturate indefinitely because decay is always active.

---

## 6. Resistance-Only Coupling

When all three gates are open (see §3), local resistance is modulated as:

```
resistanceDelta = -clamp(accumulatedTrace, 0, maxDeltaRange)
resistanceScale = clamp(1 + resistanceDelta, minResistanceScale, maxResistanceScale)
effectiveResistance = baseResistance * resistanceScale
```

Physical interpretation:

> A region where flow was concentrated becomes very slightly more permeable.

Constraints:

- `resistanceScale` is clamped to [0.95, 1.05] by default
- The maximum effect is a 5% reduction in local resistance
- This is a very small modulation; no sudden structural changes occur

---

## 7. Ablation Policy

Ablation is a core design principle of N5.

When `config.ablationEnabled === true`:

- All trace accumulation proceeds normally (for observation)
- `resistanceScale` is computed (for observation)
- No runtime code sees `resistanceScale` — the medium is unaffected
- This is the default state

Purpose of ablation:

- Compare dynamics with and without weak plasticity under identical conditions
- Confirm that the system is stable without feedback
- Verify that differences (if any) between ablation-on and ablation-off are small and well-behaved

Important: the absence of a measurable difference between ablation-on and ablation-off is a valid and informative result.

---

## 8. Runtime Safety

The following runtime properties are guaranteed:

| Property | Guarantee |
|----------|-----------|
| No behaviour change | `enabled=false` is a strict no-op |
| No NaN / Infinity | All values guarded; `nanOrInfinityCount` tracked |
| Resistance clamp | resistanceScale ∈ [0.95, 1.05] by default |
| No threshold change | waveSpeed, threshold are NOT modified |
| No graph creation | No edges, nodes, or proto-network runtime connections |
| No semantic content | No labels, concepts, or meaning nodes |
| Config-gated | All runtime feedback requires explicit triple-gate unlock |

---

## 9. Visualization Policy

The `weakPlasticityTrace` field layer is:

- Registered in `fieldLayerRegistry.ts` with `defaultVisible: false`
- Allowed only in `overlay` and `diagnostic` render modes
- Rendered with `multiply` blend mode at very low opacity (≤ 0.28)
- Color: subtle green/cyan for `accumulatedTrace`; faint blue-green for `resistanceDelta`; amber only when `plasticitySaturationRisk` is elevated

What the layer must NOT show:

- Fake "learning glow" or "memory formation glow"
- Bright highlights suggesting semantic significance
- Any visual claim about consciousness, awareness, or intent

The layer is a diagnostic residue map, not a reward or achievement indicator.

---

## 10. Guardrails

The following are hard constraints on N5 and all future phases that extend it:

1. **Weak plasticity is NOT semantic memory.** It does not store concepts, objects, meanings, or relations.
2. **Do not assert learning.** The system may or may not show learning-like behaviour; this is an open observation, not a claim.
3. **Do not create runtime graph edges.** No `createEdge()`, `addEdge()`, or equivalent.
4. **Do not connect to Node-AI-Z / Node Mother.** Observer candidates are not bridged to external systems.
5. **Resistance is the only permitted runtime effect.** threshold, waveSpeed, coupling strength, and all other runtime parameters are not modified.
6. **10^-4 order is the baseline.** Higher values require explicit justification and new ablation study.
7. **ablation flag is mandatory.** Any future extension of N5 must preserve ablation capability.
8. **clamp is mandatory.** resistanceScale must always be bounded.
9. **Default is off or observeOnly.** Production default must never be `resistanceOnly` without explicit user/researcher decision.
10. **Semantic / consciousness / emotion claims are prohibited.** This applies to code comments, UI text, event text, summary text, and documentation.
