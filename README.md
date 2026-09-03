# AETERNA-NATURAL

**Torus Field Observation Lab**

---

## はじめに（日本語）

AETERNA-NATURAL は、トーラス場の中で起きる流れ・位相・渦候補・膜痕跡・媒質履歴・比率比較を観測する研究プロトタイプです。

これは**意識・生命・知性・癒し・神秘的真理を証明するものではありません**。

見えているものは、場の変化を観測しやすくするための可視化です。

- **場（Field）** — トーラス上のスカラー場のパターンを観測します
- **渦候補** — 位相の回り込みと振幅の谷から検出される構造候補です（確定ではありません）
- **弱い媒質履歴** — 繰り返し通過した場所に残る微弱な累積変化です（記憶ではありません）
- **関連候補** — 同時に変化した観測値の候補です（因果証明ではありません）
- **観測ガイド** — 観測の読み方を補助するガイドです（AETERNA 本体の発話ではありません）

UI の用語・説明は日本語ファーストで整理されています。
研究者モードでは英語名、開発者モードでは内部IDも確認できます。

---

Observe how patterns, traces, phase changes, and candidate structures appear in a torus-based field.

---

## Overview

AETERNA-NATURAL is a torus-field observation lab.
It lets you observe flow, phase, vortex candidates, membrane traces, weak plasticity traces, ratio comparisons, and time-based changes in a torus-based field.
It does not claim to prove consciousness, life, intelligence, healing, or mystical truth.

---

## What you can observe

- **Field flow** — continuity, energy throughput, return strength
- **Geometry / curvature** — torus metric, Ricci curvature, curvature-vortex correlation
- **Complex phase** — scalar and complex-mode field, phase coherence
- **Vortex candidates** — topological charge, signed total charge, lifetime
- **Membrane traces** — two-sidedness, integrity, boundary exchange
- **Weak plasticity traces** — accumulation, saturation risk (observation only)
- **Observed ratios** — ratio match strength, resonance proxy (observer-side only)
- **Replay snapshots** — recorded tick-by-tick observation history
- **Causal trace candidates** — indirect signal relationship candidates
- **Layer correlations** — cross-layer observational relationships

---

## What this is not

**Not a proof of consciousness, life, intelligence, healing, or mystical truth.**

- Vortex candidates are phase-defect candidates, not minds
- Weak plasticity traces are medium-history proxies, not semantic memory
- Observed ratio matches are comparisons, not proof
- No emergence is a valid observation
- Not a chatbot or AI personality

---

## Quick Start

1. **Start Safe Observation** — safeBaseline preset, quietBaseline scenario
2. **Run Quiet Baseline** — seed=1000, ticks=2000
3. **Tap a cell** — open Cell Inspector
4. **Open a Visual Lens** — select a metric to visualize
5. **Ask the Guide** — "これなに？" or "どう仮説できる？"
6. **Export Markdown** — reproducible record with seed / config / scenario / ticks

---

## Public Research Mode

Public Research Mode is the default for first-time users. It provides the safest, most conservative configuration.

Defaults:
- Preset: `safeBaseline`
- Scenario: `quietBaseline`
- Experimental modes: disabled
- Advanced panels: hidden
- Export: enabled

See `docs/public-research-mode.md` for the full specification.

---

## Super Observation System

The Super Observation System provides:

- **Cell Inspector** — all metrics for a selected cell
- **Visual Lens** — field-wide visualization of any metric
- **Replay Panel** — recorded snapshot playback
- **Causal Trace Panel** — indirect signal relationship candidates
- **Layer Correlation Panel** — cross-layer observational data
- **Observation Guide** — rule-based question-and-answer helper (no LLM)
- **Now Summary Panel** — v2.7: 8-section observer-side summary panel (Japanese-first, no LLM)

---

## Reproducibility

Every observation export includes:
- `seed` — the random seed for this run
- `config` — the runtime preset configuration
- `scenario` — the scenario definition
- `ticks` — number of simulation steps

Formats: JSON (machine-readable), Markdown (human-readable).

---

## Guardrails

The following claims are permanently prohibited in all copy, UI, docs, and exports:

- Identity-alive claims: (the system) "is alive", "feels", "wants"
- "[X] proved" claims: consciousness / life / intelligence
- soul / healing guarantee / mystical truth claim
- Parts = awareness claims: vortex=mind, plasticity=memory, ratio=truth

Observation and expression rules distinguish Aeterna actual output, observer-side appearance, interpretation candidates, and unknowns.
See `docs/observation-and-expression-boundary.md` and `docs/auto-experiment-report-format.md`.

---

## Public Research Scenarios

**Beginner**
- `quietBaseline` — Observe the resting-state field with minimal external input
- `singlePulseReturn` — Apply a single gentle pulse and observe the field response

**Observation**
- `phaseVortexEmergence` — Observe how phase changes and vortex candidates appear
- `curvatureBiasObservation` — Observe how curvature bias affects field geometry
- `observedRatioSurvey` — Compare observed ratios against reference values (not proof)

**Advanced**
- `plasticityTraceObservation` — Observe weak plasticity trace accumulation
- `longRunNaturalComparison` — Compare natural-mode field behaviour over extended runs

---

## Status

Research prototype — v2.7 Now Summary Panel.
See `docs/first-release-notes.md` for current status, limitations, and what not to claim.
See `docs/now-summary-panel.md` for v2.7 Now Summary Panel specification.

---

## Safety / integrity

All observation values carry a kind label:
- **Raw** — direct field output, not smoothed
- **Derived** — computed from raw values
- **Proxy** — indirect indicator
- **Check** — integrity invariant (must be 0 or inactive)
- **Reference** — baseline for comparison only, never fed back into dynamics

---

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test:run
npm run check:release
```

---

## Release Checks

Before deploying, run:

```bash
npm run check:release
```

See `docs/deployment-readiness.md` for the full deployment guide and `docs/manual-release-checklist.md` for the manual QA checklist.

---

## Docs

- `docs/public-research-mode.md` — Public Research Mode specification
- `docs/public-demo-polish.md` — v2.2 Public Demo Polish notes
- `docs/first-demo-checklist.md` — First demo QA checklist
- `docs/lens-aware-ai-guide.md` — Lens-aware AI Guide
- `docs/super-observation-architecture.md` — Super Observation Architecture
- `docs/deployment-readiness.md` — Deployment readiness guide
- `docs/agent-guardrails.md` — Agent rules for safe changes
- `docs/pure-physics-core-design.md` — AETERNA PURE PHYSICS core design
- `docs/pure-physics-implementation-plan.md` — staged implementation plan for `src/pure/`
- `docs/vessel/VESSEL_CHARTER.md` — Vessel Charter (K0): what "completing AETERNA as a vessel" means, and what it does not claim
- `docs/vessel/vessel-roadmap.md` — K-Series roadmap (K0-K8), completion conditions, and decisive falsifiers
- `docs/vessel/closed-life-loop-design.md` — Physical closure (K5) vs life-like closure (K6) design
- `docs/vessel/anti-delusion-apparatus.md` — The four rings that guard against misreading observations
- `docs/vessel/claim-ladder.md` — Claim ladder (C0-C5) integrating existing value kinds
- `docs/vessel/white-ceilings.md` — Hypothesized reachable emergence levels per white, before measurement
- `docs/vessel/imports-from-siblings.md` — What is and is not adopted from sibling repositories
- `docs/observation-and-expression-boundary.md` — Boundary rules for Aeterna actual output, observer records, interpretation candidates, and unknowns
- `docs/auto-experiment-report-format.md` — Intuitive report format for automated experiment observations
- `docs/current-roadmap.md` — Current roadmap
- `docs/implementation-language-guardrails.md` — Forbidden claim list
- `docs/implementation-language-boundary-addendum.md` — Addendum clarifying appearance language, actual output, and certainty boundaries

---

## UI / UX

AETERNA's visualization is not decorative.
It translates actual field activity, trace, return, closure, local excitability, and observed candidates into human-readable visual form.
Fake energy, fake fluctuation, and fake life-like motion are prohibited.
Raw, derived, proxy, and presentation-smoothed values remain distinguishable.

AETERNA の可視化は装飾ではありません。
実際の場の活動、痕跡、戻り、閉ループ、局所励起、観測候補を、人間が理解できる形へ翻訳するものです。
存在しないエネルギー、嘘の揺らぎ、生命っぽく見せるだけの動きは禁止します。
Raw / Derived / Proxy / Presentation-smoothed は区別します。
