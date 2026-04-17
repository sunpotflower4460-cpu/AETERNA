# priorChannels Usage Map — Phase C0

Inventory of every place `priorChannels` is read, written, or displayed in the repo.
Produced as part of **Phase C0** (mapping only — no behavior changed).

---

## Classification key

| Class | Label | Disposition |
|-------|-------|-------------|
| A | observation-only | **keep** |
| B | intermediate record / state maintenance | **keep for now** (replace later is possible) |
| C | direct behavioral dependency | **weaken / remove in Phase C** |

---

## Usage table

| # | file | function | read / write / display | usage class | current role | keep / weaken / remove later | note |
|---|------|----------|-----------------------|-------------|--------------|------------------------------|------|
| 1 | `src/core/AeternaNetwork.js` | `initializePlasticityRewriteState` | write (init) | B | Allocates the four channel arrays (`novelty`, `recurrence`, `persistence`, `directionality`) as `Float32Array(numNodes)` | keep for now | Structural init; aligns with priorBias init in the same function |
| 2 | `src/core/dynamicCore.ts` | `updateResidue` | read | C | `persistence[i]` shifts `activityResidue` decay rate and intake; directly alters how residue accumulates each frame | weaken in Phase C | Most direct single-channel behavioral path |
| 3 | `src/perception/touchPerception.ts` | `updateTouchPerception` | read | C | `novelty[i]`, `recurrence[i]`, `persistence[i]` modulate `traceDecay` and `traceIntake` inside the touch-trace update loop | weaken in Phase C | Three channels gate touch-trace dynamics |
| 4 | `src/perception/touchPerception.ts` | `projectTouchToNetwork` | read | C | All four channels modulate `projDecay`, `onsetCoefficient`, `offsetCoefficient`, and `repeatDamp` inside the projection loop | weaken in Phase C | Highest channel fan-in (all 4 labels used) |
| 5 | `src/perception/localPrediction.ts` | `updateLocalPrediction` | read | C | `novelty[idx]` boosts `adaptiveAlpha` (prediction-update rate); also uses `priorBias[idx]` additively | weaken in Phase C | Couples channel label directly to prediction speed |
| 6 | `src/organism/rewrite.ts` | `decayStructuredPriorRewrite` | write | B | Decays all four channel arrays each frame using `REWRITE_PRIOR_DECAY`; mirrors priorBias decay | keep for now | Maintenance decay; symmetrical to priorBias decay in same loop |
| 7 | `src/organism/rewrite.ts` | `applyStructuredPriorRewrite` | write | B | Increments `priorChannels[rewriteType][idx]` when a rewrite fires; co-increments `priorBias[idx]` | keep for now | Recording rewrite events per channel; future resonance may replace this write path |
| 8 | `src/organism/rewrite.ts` | `buildRewriteDebugSummary` | read | A | Sums each channel across all nodes → `priorBiasSummary` sent to packet and UI | keep | Pure observation; no behavioral branch |

---

## priorBias vs priorChannels — relationship summary

`priorBias[i]` is a scalar per-node value; `priorChannels[type][i]` are four per-node values, one per rewrite type.

- Both are **written together** in `applyStructuredPriorRewrite`: when a rewrite of type T fires at node i, `priorChannels[T][i]` gains `delta` and `priorBias[i]` gains `delta * 0.7`.
- Both **decay together** in `decayStructuredPriorRewrite` using the same decay constant.
- `priorBias` is therefore approximately the combined historical intensity across all types; `priorChannels[type]` carries the per-type breakdown.
- See `docs/priorbias-dependency-note.md` for the full dependency map.

---

## Phase C — behavioral dependency sites (shortlist)

Functions that must be revisited when weakening label-driven behavior in Phase C:

1. `updateResidue` — `dynamicCore.ts` (class C, site #2)
2. `updateTouchPerception` — `touchPerception.ts` (class C, site #3)
3. `projectTouchToNetwork` — `touchPerception.ts` (class C, site #4)
4. `updateLocalPrediction` — `localPrediction.ts` (class C, site #5)
5. `applyStructuredPriorRewrite` — `rewrite.ts` (class B, site #7) — priorBias co-write to be re-routed from resonance result

See `docs/next-pr-scope.md` for the ordered shortlist.
