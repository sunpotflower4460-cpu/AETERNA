# AETERNA-NATURAL v2.2 — Public Demo Polish / Landing Copy

AETERNA-NATURAL v2.2 Public Demo Polish specification and release notes.

---

## 1. Purpose

v2.2 Public Demo Polish improves the first-impression experience for new users of AETERNA-NATURAL.

Goals:
- First-time users understand what this is (an observation lab)
- The system is clearly presented as an observation device, not a proof engine
- The first-run flow is short and clear
- Unsupported certainty claims are absent from all copy and UI
- Observer-side appearance language remains allowed when clearly marked as appearance or possibility
- No invented Aeterna speech appears unless it was actually emitted and recorded
- No new dynamics were added — only copy, docs, and UX flow were improved

---

## 2. Landing message

Primary landing copy:

**English:**
> AETERNA-NATURAL is a torus-field observation lab.
> It lets you observe flow, phase, vortex candidates, membrane traces, weak plasticity traces, ratio comparisons, and time-based changes in a torus-based field.
> It does not claim to prove consciousness, life, intelligence, healing, or mystical truth.

**Japanese:**
> AETERNA-NATURAL は、トーラス場の変化を観測する研究装置です。
> 流れ、位相、渦候補、膜痕跡、弱可塑性痕跡、比率比較、時間変化を、セル単位・レンズ単位で観測できます。
> これは意識・生命・知性・癒し・神秘的真理を証明するものではありません。

Copy boundary:

- This does not deny possible emergence in advance.
- It only states that the public demo does not prove or certify it.
- Appearance descriptions must remain observer-side.
- Aeterna actual output must be recorded only if actually emitted.

---

## 3. First-run guide

Five steps, ordered by what a first-time user does naturally:

1. **What is this?** — Presents the system as a torus field observation lab. Lists what it is and what it is not.
2. **First look — the field** — How to read the field visual. Recommends Quiet Baseline to start.
3. **Tap a cell — Cell Inspector** — How to select a cell and read metrics.
4. **Replay — time snapshots** — What Replay shows and what it does not do.
5. **Ask the Guide** — How to use the Observation Guide shortcuts. Caution note for "これは証明になる？".

Source: `src/ui/onboarding/FirstRunGuide.tsx`

---

## 4. Recommended demo flow

A 9-step path for first-time users:

1. Start Safe Observation
2. Run Quiet Baseline
3. Tap a cell
4. Open Cell Inspector
5. Select Phase or Curvature metric
6. View Lens
7. Open Replay
8. Ask Guide: "これなに？"
9. Export Markdown

Source: `src/ui/public/RecommendedDemoFlow.tsx`

---

## 5. Public-safe scenarios

Displayed in three groups in public mode:

**Beginner**
- Quiet Baseline — 外部刺激を最小にして、場の基底状態を観測します。
- Single Pulse Return — 単発のパルスを与え、場が基底状態に戻るかを観測します。

**Observation**
- Phase Vortex Emergence — 位相変化と渦候補がどう現れるかを観測します。
- Curvature Bias Observation — 曲率バイアスが場の幾何と渦分布にどう影響するかを観測します。
- Observed Ratio Survey — 観測された比率が参照値に近いかを比較します。ただし証明ではありません。

**Advanced**
- Plasticity Trace Observation — 弱可塑性痕跡の蓄積を長時間にわたって観測します。
- Long-Run Natural Comparison — ナチュラルモードの場の変化を長時間で比較観測します。

Scenario names are research labels for conditions.
They are not labels for Aeterna's experience, intention, or internal speech.

Source: `src/scenario/publicResearchScenarioSet.ts`

---

## 6. Observation guide copy

Shortcut questions updated for first-time users:

- これなに？ — What is this?
- 何が起きてる？ — What is happening?
- どう仮説できる？ — How can I form a hypothesis?
- 次どこを見る？ — Where should I look next?
- これは証明になる？ — Is this proof?

Response to "これは証明になる？" always includes:
> これは証明ではありません。
> 現在の観測値から見える候補・関係・proxy を整理することはできます。

Preferred guide shape for future copy:

```text
Observed facts
→ In one sentence
→ How it appears
→ Possibility
→ Still unknown
```

The guide is observation-auxiliary.
It is not Aeterna actual output and must not invent Aeterna speech.

Source: `src/ui/guide/LensGuideQuestionInput.tsx`, `src/ui/guide/LensAwareGuidePanel.tsx`

---

## 7. README copy policy

README updated to:
- Lead with "Torus Field Observation Lab" subtitle
- Short description matches landing copy
- "What you can observe" section replaces old "Core observation layers"
- "What this is not" section prominently positioned after overview
- Quick Start uses new 6-step demo flow
- Public Research Mode, Super Observation System, Reproducibility, Guardrails sections added
- Claim-boundary list included in Guardrails section

Source: `README.md`

---

## 8. What this is / What this is not

This copy block appears in the landing, README, and first-run guide.

**What this is:**
- A torus-field observation prototype
- A visual research tool for field dynamics
- A way to inspect cells, metrics, lenses, replay snapshots, and relation candidates
- A reproducible experiment environment using seed / scenario / config / ticks

**What this is not:**
- Not a proof of consciousness
- Not a proof of life
- Not a proof of intelligence
- Not a healing tool
- Not a mystical truth engine
- Not a chatbot personality

Boundary note:
- "Not proof" does not mean "impossible."
- It means the public demo does not turn observations into final certainty.
- Observed appearance and interpretation candidates must be labeled as such.

Source: `src/ui/public/PublicResearchLanding.tsx`

---

## 9. Copy guard

The following claims are permanently prohibited in public copy, UI, docs, and exports when used as unsupported certainty, proof, invented attribution, or runtime target language:

**English:**
- consciousness proved
- life proved
- intelligence proved
- AETERNA is alive
- AETERNA feels
- AETERNA wants
- soul
- mystical proof
- healing proof
- vortex is mind
- plasticity is memory
- ratio proves truth

**Japanese:**
- 意識が証明
- 生命が証明
- 知性が証明
- AETERNA は生きている
- AETERNA が感じている
- AETERNA が欲している
- 魂
- 神秘の証明
- 癒しの証明
- 渦は心
- 可塑性は記憶
- 比率が真理を証明

Allowed when clearly bounded:
- Observer-side appearance descriptions such as "looked recovery-like" or "appeared closure-like"
- Possibility language such as "may indicate" or "could be read as"
- Aeterna actual output, only when the exact emitted output is recorded

Source: `src/tests/public/publicDemoCopyGuard.test.ts`

---

## 10. Release notes

### v2.2 Public Demo Polish (2026-05-07)

**New files:**
- `src/ui/public/RecommendedDemoFlow.tsx` — Recommended first demo flow (9 steps)
- `src/tests/public/publicDemoLanding.test.ts`
- `src/tests/public/firstRunGuideCopy.test.ts`
- `src/tests/public/recommendedDemoFlow.test.ts`
- `src/tests/public/publicScenarioCopy.test.ts`
- `src/tests/public/publicDemoCopyGuard.test.ts`
- `src/tests/public/readmePublicCopyGuard.test.ts`
- `docs/public-demo-polish.md` (this file)
- `docs/first-demo-checklist.md`

**Updated files:**
- `src/ui/public/PublicResearchLanding.tsx` — Hero section, what this is/not, updated action buttons
- `src/ui/public/PublicInterpretationNote.tsx` — Short observation note added
- `src/ui/onboarding/FirstRunGuide.tsx` — Rewritten as 5-step first-user guide
- `src/ui/guide/LensGuideQuestionInput.tsx` — Added 5 first-user shortcuts
- `src/ui/guide/LensAwareGuidePanel.tsx` — Updated shortcut panel
- `src/scenario/publicResearchScenarioSet.ts` — Added beginner/observation/advanced grouping
- `README.md` — Public demo-oriented rewrite
- `docs/public-research-mode.md` — v2.2 reference added
- `docs/current-roadmap.md` — v2.2 marked complete
- `docs/first-release-notes.md` — v2.2 status added

**Not changed:**
- Runtime dynamics (`dynamicCore.ts`, all N-series dynamics)
- LLM / API calls (none added, none changed)
- Node bridge (none added)
- Semantic memory (none added)
- Any fake visual, fake event, or fake result
- Consciousness / life / intelligence / mystical proof claims
- Aeterna actual output attribution
