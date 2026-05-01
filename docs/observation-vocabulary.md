# AETERNA Observation Vocabulary

Phase 5: Observation Layer Purification

This document defines the observer-side vocabulary used to describe structural candidates that appear naturally in the AETERNA life-field. These terms are **research shorthand** for observable patterns — they are not semantic labels, object identifiers, or concept nodes.

---

## Important: What This Vocabulary Is Not

- These terms do **not** assign meaning to the organism's activity.
- They do **not** become runtime action selectors.
- They do **not** represent discovered concepts or objects.
- They are **not** passed to any teacher, LLM, or semantic binding layer.
- They are observer-side derived proxies for structural patterns that a researcher might notice from the outside.

> AETERNA does not yet have meaning. This vocabulary is for observing what *might become* meaning-bearing structure — from the outside, at a distance, as a rough proxy only.

---

## Vocabulary Definitions

### knot

局所的に何度も立ち上がるまとまり。  
意味ではない。  
繰り返し発生する場の結び目。

**Definition**: A locally recurrent activity cluster. A region of the field that repeatedly rises above its neighbors across multiple ticks or events.

**Proxy conditions**:
- `recurrenceWeight` is elevated
- `replayReadiness` suggests the pattern is near re-entry
- `recentPatternWeight` indicates recent presence
- Not fully suppressed by external input

**What it is not**: A named node. A semantic anchor. A concept. An object.

---

### path

何度も通りやすい流路。  
意味ではない。  
エネルギーや活性が流れやすい経路。

**Definition**: A candidate propagation channel — a route through the field that activity consistently follows across multiple perturbations or replay events.

**Proxy conditions**:
- High `recentReplaySalience` (activity repeatedly activates along a similar channel)
- Active replay count > 0 suggests a path is being re-traced
- `consolidationGain` suggests the channel is becoming easier to re-enter
- Repeated perturbation history shows consistent directionality

**What it is not**: A semantic association. A connection between named concepts. A learned route in a cognitive sense.

---

### recurrence locus

繰り返し戻ってくる場所。  
意味ではない。  
再発の座標・領域。

**Definition**: A region of the field that re-activates across multiple independent events, perturbations, or quiet recovery periods.

**Proxy conditions**:
- `recurrenceWeight` is high
- `recentPatternWeight` persists across frames
- Positive perturbation history trend
- Trace strength remains above floor

**What it is not**: A memorized location. A meaningful place. A category or feature detector.

---

### basin

乱されても戻りやすい安定帯。  
意味ではない。  
場の安定候補。

**Definition**: A stability zone — a range of field states that the organism tends to return to after perturbation. Not a proven mathematical attractor; a rough proxy.

**Proxy conditions**:
- `stabilizationPull` is elevated (system is being pulled toward a stable range)
- `restorationBias` is high
- `relaxationLevel` is positive
- `collapseRisk` is low (system is not near collapse)

**What it is not**: A fixed point in a formal dynamical systems sense. A preferred state that the organism "chooses." A concept the organism "prefers."

---

### collapse profile

崩れ方の型。  
意味ではない。  
どの条件で弱まるかの観測形。

**Definition**: A characteristic pattern of how the field weakens under stress. Observed as the shape of `collapseRisk` rise, not as a failure mode.

**Proxy conditions**:
- `collapseRisk` exceeds threshold
- Distinguishable from soft_collapse / hard_collapse / runaway via trajectory

**What it is not**: An error state. A failure mode to be avoided. A labeled failure category.

---

### recovery profile

戻り方の型。  
意味ではない。  
どの条件で回復するかの観測形。

**Definition**: A characteristic pattern of how the field re-establishes stability after disturbance. Observed as the shape of `recoveryPressure` and `relaxationLevel` dynamics.

**Proxy conditions**:
- `recoveryPressure` > 0.30 or `boundaryRepairPressure` > 0.20
- Recovery trajectory classifiable as `recover`, `shift`, `degrade`, or `partial_repair`

**What it is not**: A learned recovery strategy. A semantic response. A planned action.

---

### long-lived anomaly

長く残る偏りや異常。  
意味ではない。  
持続的な差分。

**Definition**: A deviation from baseline that persists across multiple events, recovery cycles, or quiet periods. Not a "bad" state — just a sustained difference.

**Proxy conditions**:
- Mean activity is persistently above baseline + margin
- `salienceResidue` remains elevated
- `mismatchLevel` and `surprisePressure` persist

**What it is not**: An error. A bug. A pathology. A named condition.

> **Note**: anomaly here is observer shorthand. From the life-field's perspective, this is simply a persistent difference — the individual character of this particular field instance.

---

### proto-point candidate

最初から置かれた点ではなく、  
場の中で自然に節として観測された候補。  
まだ node ではない。意味も持たない。

**Definition**: A field region that simultaneously meets multiple observation criteria — recurrence, basin overlap, trace persistence, and replay re-entry. A candidate for eventually being observed as a structural node, but not yet one.

**Proxy conditions** (all must hold):
- knotCount > 0 OR recurrenceLocusCount > 0
- basinCount > 0 OR `recoveryLinkedResidue` > 0.15 OR `settlingResidue` > 0.12
- `traceStrength` > 0.18 AND `recurrenceWeight` > 0.22

**What it is not**:
- A semantic node
- An object with a label
- A point passed to any LLM or teacher
- A concept or memory
- A Node in the AETERNA Node system (Phase 8+ only)

> **Critical**: Proto-point candidate status does NOT trigger any runtime action change. It is a read-only observation that a researcher may note from the outside. No label is ever attached.

---

## Observation Confidence

`observationConfidence` is a rough proxy for how reliable the current observation window is. It is:
- Higher when more history frames are available
- Higher when trace, replay, and recovery state are all available
- Lower when state is incomplete or activity contains non-finite values

This is not a probability. It is not a certainty estimate. It is a signal quality proxy for research use.

---

## Usage Note for Researchers

When reading observation pattern output:

- Treat all counts as **rough proxy estimates**, not confirmed structure counts.
- A `knotCount: 1` means "the proxy conditions for a knot candidate were met this frame" — not "there is definitely a knot."
- These values are appropriate for long-run scenario analysis, not frame-by-frame semantic interpretation.
- Do not build downstream systems that treat these counts as ground truth.

---

## Phase Reference

This vocabulary is introduced in **Phase 5: Observation Layer Purification** and will remain observer-side vocabulary through at least Phase 7. Node bridge (Phase 8+) is explicitly out of scope for this phase.

---

## Planned vocabulary / future observation terms

以下は **N-Series で将来使う予定の観測語彙** です。  
この段階では、まだ実装済みの runtime feature として扱わないでください。  
名前は研究用 observation term であり、semantic claim ではありません。

These are planned future observation terms for the N-Series roadmap.  
At N0 they must be treated as vocabulary only, not as already implemented runtime structures.

## N2 update: implemented complex-field observation terms

The following N-series observation terms are now implemented as observer/runtime
complex-field vocabulary in N2:

- `complexField`
- `realComponent`
- `imaginaryComponent`
- `amplitude`
- `phase`
- `phaseGradient`
- `phaseWinding`
- `vorticity`
- `topologicalCharge`
- `vortexCenter`
- `vortexCandidate`
- `vortexLifetime`
- `vortexPair`

These remain observer-side research terms. They are still not semantic labels,
not selfhood terms, and not consciousness claims.

### Geometry / metric terms

- `majorRadius`
- `minorRadius`
- `areaElement`
- `gaussianCurvature`
- `meanCurvature`
- `majorAngle`
- `minorAngle`

### Boundary / membrane terms

- `membraneState`
- `membraneCell`
- `membranePermeability`
- `membraneTension`
- `membraneDeformation`
- `membraneRecovery`
- `actuationImprint`
- `returnImprint`
- `twoSidedness`
- `actuationReturnOverlap`
- `membraneIntegrity`
- `boundaryMediation`

These are implemented observer-side membrane / boundary mediation terms in N4.
They describe a computational mediating layer between `BodySurfaceState` and `WorldMediumState`.
They do not describe soul, self, or consciousness boundaries.

### Plasticity / comparison terms

- `weakPlasticityTrace`
- `plasticityAccumulation`
- `plasticityAblationFlag`
- `observedRatio`
- `referenceRatioDistance`
- `emergentResonance`

### Guardrail

- plasticity / comparison terms は **planned vocabulary / future observation terms** であり、N5/N6 より前に「すでにある」と書かない
- `phase` を emotion や meaning と結びつけない
- `vortex` を self / mind / soul と結びつけない
- `membrane` を soul / self / consciousness boundary と結びつけない

---

## Phase 7 Addition: Detailed Proto-Point Observation

**Phase 7: proto-point の観測導入** extends the proto-point candidate vocabulary with
per-candidate detail. The `ProtoPointObservationState` provides:

- Per-candidate records (`ProtoPointCandidate`) with individual sub-scores
- Observer-side lifecycle tracking (`new` / `recurring` / `persistent` / `decaying`)
- Confidence distribution (average, max)
- Stable/persistent candidate counts

This complements the coarse `protoPointCandidateCount` in `ObservationPatternState`.

**Phase 7 proto-point observation does NOT**:
- Assign semantic labels or categories
- Bridge to any Node system (Phase 8+ only)
- Affect organism dynamics
- Detect same-object relations
- Use LLM teacher outputs

See `docs/proto-point-observation-principles.md` for full Phase 7 principles.


---

### proto-neuron candidate

proto-point より一段進み、  
発火しやすさ・不応期的挙動・局所伝播・痕跡保持・再発・共発火・弱い可塑性・closure coupling が重なった **pre-semantic excitable locus**。

**Definition**: An observer-side candidate for a naturally arising excitable field locus inside the closed body-world loop. It is still not a semantic node, concept, object, or label.

**Proxy conditions**:
- `excitability` from repeated rise above local baseline
- `refractoryPattern` from suppression/recovery cadence
- `localPropagation` from propagation/path support
- `traceRetention` from trace/residue persistence
- `recurrenceScore` from repeated re-entry
- `coActivationScore` from concurrent rise with other candidates
- `weakPlasticityScore` from repeated co-activation + replay/consolidation support
- `closureCoupling` from loopGain / returnMismatch / closureDrift / self/world loop signals

**What it is not**:
- a semantic node
- a neural-network runtime node
- a Node-AI-Z semantic node
- a concept, label, category, or same-object detector
- a trigger that changes organism action
