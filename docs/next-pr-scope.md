# Next PR Scope

- Phase 0 complete → recommended order:
  1. Phase B1: sound sensory
  2. Phase B2: light / motion / time sensory
  3. Phase C0: priorChannels usage mapping ✓
  4. Phase C: resonance
  5. Phase D: margin
  6. Phase E1: minimal two-layer hierarchy
  7. Phase E2: bidirectional hierarchy
  8. Phase F: informational energy exchange

---

## Phase C — first-touch shortlist

Functions to review first when implementing Phase C (resonance / weakening label-driven behavior).
All are classified C (direct behavioral dependency) in `docs/priorchannels-usage-map.md`.

| priority | file | function | reason |
|----------|------|----------|--------|
| 1 | `src/core/dynamicCore.ts` | `updateResidue` | `persistence[i]` directly shifts residue decay/intake |
| 2 | `src/perception/touchPerception.ts` | `updateTouchPerception` | `novelty`, `recurrence`, `persistence` gate touch-trace dynamics |
| 3 | `src/perception/touchPerception.ts` | `projectTouchToNetwork` | all 4 channels modulate touch projection (highest fan-in) |
| 4 | `src/perception/localPrediction.ts` | `updateLocalPrediction` | `novelty[idx]` + `priorBias[idx]` set prediction update speed |
| 5 | `src/organism/rewrite.ts` | `applyStructuredPriorRewrite` | co-writes priorChannels and priorBias; priorBias reroute target |
| 6 | `src/organism/rewrite.ts` | `decayStructuredPriorRewrite` | if priorBias decay path changes, audit here too |

Reference: `docs/priorbias-dependency-note.md` for the priorBias update-path dependency map.
