# priorBias Dependency Note — Phase C0

Short memo on how `priorBias` is updated and how it depends on `priorChannels`.
Produced as part of **Phase C0** (no behavior changed).

---

## Current update path

```
rewrite fires (applyStructuredPriorRewrite)
  └─ priorChannels[type][idx] += delta          ← per-type per-node record
  └─ priorBias[idx]           += delta * 0.7    ← scalar per-node accumulator

each frame (decayStructuredPriorRewrite)
  └─ priorChannels[type][i] *= REWRITE_PRIOR_DECAY   ← all types decay
  └─ priorBias[i]           *= REWRITE_PRIOR_DECAY   ← same constant
```

`priorBias` is therefore a **scalar shadow** of the combined per-type channel history.
It does not read `priorChannels` — both are written by the same call.

Downstream consumers of `priorBias`:
- `updateLocalPrediction` — raises `adaptiveAlpha` (prediction update speed)
- `applyDreamReplay` (`modeState.ts`) — `priorSeed` score for replay candidate selection
- `applyDreamReplay` (`modeState.ts`) — amplifies `localPrediction` during replay
- `buildRewriteDebugSummary` — produces `priorBiasMean` → packet → UI display

---

## Future target path (Phase C direction)

```
resonance result (to be defined in Phase C)
  └─ priorBias[idx] updated from resonance output
     (priorChannels remain as observation labels, not the update source)
```

Goal: `priorBias` accumulation is driven by resonance trace rather than directly by rewrite events.
`priorChannels[type]` continue to be written on rewrite events (class B — intermediate record), but they no longer serve as the _source_ for `priorBias` updates.

---

## Risk

| Risk | Detail |
|------|--------|
| Co-write coupling | `priorBias` and `priorChannels` are incremented in the same line of `applyStructuredPriorRewrite`; changing one without the other may produce divergent state |
| Downstream breakage | `priorBiasMean` feeds `ember` in mode drive and the `val-prior-bias` UI panel; if the update path changes, those consumers may need recalibration |
| Decay symmetry | Both decay with `REWRITE_PRIOR_DECAY`; if priorBias moves to a resonance path, its decay constant may need to differ |
