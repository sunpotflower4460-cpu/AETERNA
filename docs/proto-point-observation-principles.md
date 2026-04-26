# AETERNA Proto-Point Observation Principles

Phase 7: proto-point の観測導入

This document defines what a proto-point candidate is, what it is not,
and the principles governing its observation in AETERNA.

---

## proto-point とは

トーラス生命場の中で、
局所的に再発し、痕跡を持ち、replay で戻りやすく、近傍との差を持つようになった
観測上の節候補。

**English definition**:
A field region that has naturally accumulated multiple structural observation
criteria — recurrence, trace persistence, replay affinity, local contrast,
and knot/basin overlap — and thereby becomes observable as a structural node
candidate from the outside.

Proto-point candidates are **not pre-placed**. They emerge from the field's
flow dynamics when conditions are met, and are observed after the fact.

---

## proto-point ではないもの

| Not a... | Why |
|---|---|
| **semantic node** | No meaning, label, or interpretation is attached. |
| **object label** | It does not identify an object or named entity. |
| **memory item** | It is not stored memory or an episodic record. |
| **concept** | It carries no conceptual content. |
| **same-object判定** | There is no "same object" logic or persistence judgment. |
| **LLM teacher output** | No teacher, LLM, or binding layer is involved. |
| **runtime node** | It does not become a node in the organism's runtime graph. |
| **action selector** | It does not influence what the organism does next. |

---

## 重要原則

**proto-point は先に置くものではなく、後から観測されるもの。**

The field flows. Activity recurs. Traces accumulate. Only then — if multiple
criteria are simultaneously met — does a region become observable as a
proto-point candidate from the outside.

This is not:
- A cognitive feature detector
- A segmentation algorithm
- A semantic anchor
- A concept-formation mechanism

It is:
- A multi-criteria observational proxy
- An observer-side shorthand for a structural candidate
- A rough proxy count, not a confirmed structure
- Strictly read-only: it does not feed back into organism dynamics

---

## Candidate Conditions (Multi-Criteria Gate)

A proto-point candidate is only registered when **at least three** of the
following proxy conditions are simultaneously elevated:

| Condition | Proxy Signal |
|---|---|
| **A: Recurrence** | `recurrenceWeight`, `recentPatternWeight` elevated |
| **B: Local Contrast** | Activity above baseline margin, `salienceResidue` elevated |
| **C: Trace Persistence** | `traceStrength`, `salienceResidue` persist above floor |
| **D: Replay Return** | `replayReadiness`, `recentReplaySalience` elevated |
| **E: Knot/Basin Overlap** | Phase 5 `knotCount > 0` OR `basinCount > 0` |
| **F: Lifetime** | Candidate persists above threshold for multiple ticks |

**No single-condition candidates.** The multi-criteria gate prevents false
positives and respects the principle that proto-points are natural intersections
of multiple field dynamics.

---

## Confidence Score (Derived/Proxy)

```
confidence = 0.20 * recurrenceScore
           + 0.20 * traceAffinity
           + 0.20 * replayAffinity
           + 0.15 * localContrast
           + 0.15 * knotOverlap
           + 0.10 * basinOverlap
```

- This is a **rough proxy**, not an exact measurement.
- Range: 0–1. Conservative threshold applied before inclusion (≥ 0.25).
- All sub-scores are derived/proxy values from existing state.
- High confidence does not "prove" a proto-point exists — it means proxy
  conditions for structural candidacy are simultaneously met.

---

## Candidate Slots (Virtual Regions)

Since AETERNA currently operates on global scalar metrics rather than
per-region spatial data, three "virtual region" candidate slots are defined,
each emphasizing a different dominant signal combination:

| Slot | Region ID | Emphasis |
|---|---|---|
| A | `proxy-recurrence-dominant` | Recurrence + knot overlap |
| B | `proxy-basin-dominant` | Basin/restoration stability |
| C | `proxy-replay-dominant` | Replay re-entry + consolidation |

These are **not spatial locations** — they are proxy labels for different
configurations of the field's global scalar state.

---

## Observer-Side Lifecycle

Candidates may pass through lifecycle stages as the observer tracks them
across ticks. Lifecycle is **observer-side only** — it does not affect
organism runtime behavior.

| Stage | Condition |
|---|---|
| `new` | First tick above threshold (persistence ≤ 1) |
| `recurring` | Seen for 2–7 consecutive ticks |
| `persistent` | ≥ 8 consecutive ticks AND confidence > 0.40 |
| `decaying` | Conditions no longer met; confidence fading |

Decaying candidates are removed from visibility after 3 ticks.

---

## Phase 5 Relationship

`ObservationPatternState.protoPointCandidateCount` (Phase 5) is a coarse
summary count derived from simpler proxy conditions.

`ProtoPointObservationState` (Phase 7) is the detailed observation layer:
- Full per-candidate records with sub-scores
- Lifecycle tracking
- Confidence distribution
- Stable/persistent candidate counts

The two are **consistent but not redundant**: Phase 5 gives a one-number
summary; Phase 7 gives the full observation detail.

---

## Node Bridge — NOT Implemented (Phase 8+)

Proto-point candidates are **not passed to any Node system** in this phase.

- Proto-points are not Node bridge packets.
- They are not observation packets sent to a Node graph.
- They are not semantic nodes waiting to be confirmed.
- Phase 8+ may introduce an observation bridge, but only as an
  observation packet, never as a semantic node binding.

This is explicitly documented here because the boundary between observation
and semantic interpretation must never be erased silently.

---

## What This Layer Does NOT Do

- Does not create semantic nodes
- Does not attach labels or categories
- Does not detect same-object relations
- Does not bind to LLM teacher outputs
- Does not modify organism core dynamics
- Does not drive action decisions
- Does not cause "discovery演出" or narrative effects
- Does not claim to prove structural nodes exist

---

## Implementation Reference

| File | Role |
|---|---|
| `src/types/protoPointCandidate.ts` | `ProtoPointCandidate` type definition |
| `src/types/protoPointObservationState.ts` | `ProtoPointObservationState` type definition |
| `src/observer/deriveProtoPointCandidates.ts` | Derive function (pure, read-only) |
| `src/tests/scenario/protoPointObservationScenario.ts` | Scenario runner |
| `src/tests/behavioral/protoPointObservation.test.ts` | Behavioral tests |

---

## Phase Reference

Introduced in **Phase 7: proto-point の観測導入**.

- Phase 5 (observation layer): coarse proto-point candidate count
- Phase 7 (this phase): detailed proto-point candidate observation
- Phase 8+: potential observation bridge (NOT semantic node binding)

---

*All proto-point observation values are derived/proxy only.*
*They are research observations, not confirmed structural facts.*
*AETERNA does not yet have meaning. This layer observes what might become*
*meaning-bearing structure — from the outside, at a distance, as a rough proxy.*
