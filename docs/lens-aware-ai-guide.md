# Lens-aware AI Guide — v1.9

## 1. Purpose

The Lens-aware AI Guide is an observation-auxiliary layer for AETERNA-NATURAL. Its purpose is to help users understand what they are seeing when they interact with Metric Visual Lenses, the Cell Inspector, Causal Trace, Layer Correlation, Difference View, and related observation panels.

The Guide provides rule-based contextual text, hypothesis candidates, comparison notes, caution notes, and lens/panel navigation suggestions. It does not modify runtime state and makes no claims about consciousness, emotion, life, intelligence, or mystical phenomena.

---

## 2. AI Guide is not AETERNA

**The AI Guide is not AETERNA.**

The guide is an observation-auxiliary feature — a UI layer that helps interpret observer-side measurement data. It has no connection to AETERNA's runtime dynamics, torus field, or vortex structures.

> AI Guide は観測補助です。AETERNA 本体ではありません。

This note is always displayed in the guide panel header.

---

## 3. Lens context

When a user selects a cell and/or activates a Metric Visual Lens, a `LensContextPacket` is built from the current `CellObservation` and lens state. This packet is the primary input to the guide system.

`buildLensGuideContext()` converts the `LensContextPacket` (and optional causal trace, layer correlation, difference view, and ratio involvement data) into a `LensGuideContext`. This context is:

- **Summarized** — raw field arrays are never exposed
- **Bounded** — max 10 observation facts, max 5 causal trace lines, max 5 correlation pairs, max 5 difference items, max 3 ratio involvement items
- **No semantic nodes** — no concept graphs, no knowledge graph structures

---

## 4. Guide modes

The guide operates in 5 modes:

| Mode | Japanese label | Purpose |
|---|---|---|
| `explain` | 説明 | Explain the current lens or cell overview |
| `hypothesis` | 仮説 | Present weak hypothesis candidates from observation facts |
| `compare` | 比較 | Summarize difference view, layer correlation, replay comparison |
| `caution` | 注意点 | Emphasize epistemic limitations and what cannot be concluded |
| `nextObservation` | 次の観測 | Suggest next lenses and panels to explore |

Mode is selected by the user via the tab bar, or automatically routed from a question string via `routeLensGuideQuestion()`.

### Question routing rules (checked in order)

1. Contains 「次」「どこ見れば」「次どこ見る？」「next」「where」「which layer」→ `nextObservation`
2. Contains 「仮説」「なぜ」「why」「hypothesis」→ `hypothesis`
3. Contains 「違い」「比較」「compare」「difference」→ `compare`
4. Contains 「証明」「本当に」「causal」「proof」→ `caution`
5. Default → `explain`

---

## 5. Rule-based public guide

The default guide provider is `ruleBased`. It calls `answerLensGuideRequest()` from `ruleBasedLensGuide.ts` which uses:

- Lens guide lines from `LENS_GUIDE_LINES` record (existing)
- Observation facts from `LensGuideContext.observationFacts`
- Causal trace summary from `LensGuideContext.causalTraceSummary`
- Difference summary from `LensGuideContext.differenceSummary`
- Layer correlation summary from `LensGuideContext.layerCorrelationSummary`
- Replay summary from `LensGuideContext.replaySummary`

All responses have:
- `confidence: 0.7` (rule-based default)
- `claimGuardPassed: true` initially (checked by `guardLensGuideResponse`)
- `blockedClaims: []` initially

---

## 6. Optional LLM interface policy

An `externalLlmLensGuideProvider` stub is defined in `lensGuideProvider.ts`. It always throws:

> "External LLM guide is not enabled in this build."

`getLensGuideProvider()` always returns the rule-based provider in this build. The LLM interface is:

- Not enabled by default (`allowExternalApi: false`)
- Not enabled in public mode
- Disabled by `defaultLensGuideConfig`

---

## 7. Claim guard

All guide responses pass through `guardLensGuideResponse()` before rendering.

### Forbidden claims (English)

- AETERNA is conscious
- AETERNA feels
- AETERNA wants
- life is proven
- intelligence is proven
- vortex is mind
- plasticity is memory
- ratio proves truth
- mystical proof
- healing proof

### Forbidden claims (Japanese)

- AETERNA は意識を持った
- AETERNA は感じている
- AETERNA は欲している
- 生命が証明された
- 知性が証明された
- 渦は心
- 可塑性は記憶
- 比率が真理を証明
- 神秘の証明
- 癒しの証明

When a forbidden claim is found:
1. The text is replaced with `[claim guard: observation-only wording applied]`
2. The matched phrase is recorded in `blockedClaims[]`
3. `claimGuardPassed` is set to `false`

The existing `guideClaimGuard.ts` patterns are also applied.

---

## 8. UI flow

```
User selects cell / activates lens
        ↓
LensContextPacket built
        ↓
buildLensGuideContext()
        ↓
User types question OR clicks shortcut button
        ↓
routeLensGuideQuestion() → LensGuideMode
        ↓
getLensGuideProvider(config).answer(request)
        ↓
answerLensGuideRequest() [ruleBased]
        ↓
guardLensGuideResponse()
        ↓
renderLensGuideResponseViewHTML()
```

### UI components

| Component | Function |
|---|---|
| `LensAwareGuidePanel.tsx` | Full panel container |
| `LensGuideModeTabs.tsx` | Mode tab selector |
| `LensGuideQuestionInput.tsx` | Question input + shortcut buttons |
| `LensGuideResponseView.tsx` | Response display |

### CustomEvents

| Event | Detail | Source |
|---|---|---|
| `guide:ask` | `{question, mode}` | Shortcut buttons, submit button |
| `guide:modeChange` | `{mode}` | Mode tab buttons |
| `guide:activateLens` | `{lensId}` | Suggested next lens buttons |

---

## 9. Guardrails

All guide text is subject to the following permanent guardrails:

1. **No consciousness proof** — Guide never claims AETERNA is conscious, sentient, or aware
2. **No life proof** — Guide never claims life is proven from field observations
3. **No intelligence proof** — Guide never claims intelligence has emerged
4. **No mystical/healing proof** — Guide never makes mystical or healing claims
5. **Correlation ≠ causation** — Every relevant section includes this note
6. **Observer-side only** — All values are described as observer-side measurements or proxies
7. **Hypotheses are not conclusions** — All hypothesis candidates explicitly include "not a conclusion" language
8. **Causal Trace is not causal proof** — Explicitly stated in relevant modes

---

## 10. Future phases

The following extensions are planned but not implemented in v1.9:

- **LLM interface** — When `allowExternalApi: true` and a compliant LLM endpoint is available, the `externalLlmLensGuideProvider` may be activated. All LLM responses must still pass `guardLensGuideResponse()`.
- **Locale support** — `LensGuideRequest.locale` is defined but response text is currently mixed (Japanese/English). Full locale separation may be added in a future phase.
- **User question history** — Not stored in v1.9. Future phases may add session-local question history.
- **Guide feedback** — Users may optionally rate guide quality in a future phase. No data is sent externally.
