# AETERNA-NATURAL

## What this is

Torus field observation lab.

AETERNA-NATURAL implements a physical-geometry field simulation — torus metric, curvature, complex scalar field, vortex candidates, membrane layer, weak plasticity trace, and observed ratios — and lets you observe the resulting dynamics.

## What this is not

**Not a proof of consciousness, life, intelligence, healing, or mystical truth.**

- Vortex candidates are phase-defect candidates, not minds
- Weak plasticity traces are medium-history proxies, not semantic memory
- Observed ratio matches are comparisons, not proof
- No emergence is a valid observation

## Core observation layers

- **Geometry / curvature** — torus metric, Ricci curvature, curvature-vortex correlation
- **Complex field / phase** — scalar and complex-mode field, phase coherence
- **Vortex candidates** — topological charge, signed total charge, lifetime
- **Membrane layer** — two-sidedness, integrity, boundary exchange
- **Weak plasticity trace** — accumulation, saturation risk (observation only)
- **Observed ratios** — ratio match strength, resonance proxy (observer-side only)
- **Long-run comparison** — reproducible preset variant comparison suite

## Quick start

1. Start Safe Observation (safeBaseline preset + quietBaseline scenario)
2. Run Quiet Baseline (seed=1000, ticks=2000)
3. Open Overview panel
4. Confirm semanticLeakCount = 0 and nanOrInfinityCount = 0
5. Export as Markdown with seed / config / scenario / ticks

## Safety / integrity

All observation values carry a kind label:
- **Raw** — direct field output, not smoothed
- **Derived** — computed from raw values
- **Proxy** — indirect indicator
- **Check** — integrity invariant (must be 0 or inactive)
- **Reference** — baseline for comparison only, never fed back into dynamics

## Research scenarios

Public-safe scenarios:
- `quietBaseline` — Quiet Baseline (resting-state observation)
- `singlePulseReturn` — Single Pulse Return
- `repeatedGentlePulse` — Repeated Gentle Pulse
- `phaseVortexEmergence` — Phase Vortex Emergence
- `curvatureBiasObservation` — Curvature Bias Observation
- `observedRatioSurvey` — Observed Ratio Survey

See `docs/public-research-mode.md` for the full scenario and experiment classification.

## Export / reproducibility

Every export includes:
- `seed` — random seed for the run
- `config` — runtime preset configuration
- `scenario` — scenario definition
- `ticks` — number of simulation steps

Formats: JSON (machine-readable) and Markdown (human-readable).

## Development status

Research prototype — v1.4 Public Research Mode.  
See `docs/first-release-notes.md` for current status, limitations, and what not to claim.

## Current source of truth

- Active code: `src/`
- Preserved prototypes and displaced notes: `archive/`
- Core development principles: `docs/aeterna-core-principles.md`
- Current roadmap: `docs/current-roadmap.md`
- N-series roadmap: `docs/aeterna-natural-roadmap.md`
- Geometry / dynamics audit baseline: `docs/geometry-dynamics-audit.md`
- Agent rules for small safe changes: `docs/agent-guardrails.md`
- Current structure map: `docs/system-map.md`

## UI / UX

AETERNA's visualization is not decorative.  
It must translate actual field activity, trace, return, closure, local excitability, and observed candidates into human-readable visual form.  
Fake energy, fake fluctuation, and fake life-like motion are prohibited.  
Raw, derived, proxy, and presentation-smoothed values should remain distinguishable.

AETERNA の可視化は装飾ではありません。  
実際の場の活動、痕跡、戻り、閉ループ、局所励起、観測候補を、人間が理解できる形へ翻訳するものです。  
存在しないエネルギー、嘘の揺らぎ、生命っぽく見せるだけの動きは禁止します。  
Raw / Derived / Proxy / Presentation-smoothed は区別します。

- `docs/scientific-ui-ux-principles.md` — Scientific UI/UX 原則（U0）
- `docs/visualization-integrity-principles.md` — 可視化の整合性原則
- `docs/ui-information-architecture.md` — UI 3層アーキテクチャ
- `docs/torus-visualization-requirements.md` — トーラス表示要件
- `docs/default-guide-principles.md` — Default Guide 方針（API なしでも動く）
- `docs/ui-ux-roadmap.md` — U0〜U8 ロードマップ

## Body-World Closure（W-Series）

AETERNA は内側だけで完結する生命場ではなく、世界と閉じた循環を持つ生命場を目指す。
ただし意味形成はしない。proto-neuron は最初から置かず、トーラス生命場の流れから自然に観測される節候補として扱う。

## Natural Emergence（S-Series）

AETERNA は「揺らぐべきだから揺らす」のではありません。
流れ、抵抗、散逸、遅延、境界交換、局所結合、閾値、痕跡、再入力を持つ場を作り、その結果として揺らぎ・安定・崩壊・再発・節・流路・proto-neuron / proto-network 候補が自然に観測されるかを見ます。

実装対象は現象ではなく、現象が生じうる条件です。

- `docs/natural-emergence-principles.md` — Natural Emergence の中核原則（S0）
- `docs/world-loop-dynamic-viability.md` — Dynamic Viability の定義（S0）
- `docs/proto-network-natural-observation.md` — Proto-Network Natural Observation（S0）
- `docs/implementation-language-guardrails.md` — 実装言語の禁止事項（S0）
- `docs/body-world-closure-principles.md` — Body-World Closure の設計原則
- `docs/emergent-proto-neuron-principles.md` — 自然発生する proto-neuron の原則
- `docs/world-medium-spec.md` — World Medium の設計境界（雛形）
- `docs/actuation-pulse-spec.md` — Actuation Pulse の設計境界（雛形）
- `docs/reafference-comparison-spec.md` — Reafference Comparison の設計境界（雛形）
- `docs/body-world-closure-metrics.md` — 閉ループ観測指標（雛形）

## AETERNA-NATURAL N-Series

N-series は geometry / complex field / vortex / membrane / weak plasticity / observed ratios / comparison suite を段階的に実装するフェーズ。

- `docs/aeterna-natural-roadmap.md` — N0〜N7 + v1.0 Stabilization ロードマップ
- `docs/aeterna-natural-v1-stabilization.md` — v1.0 Stabilization 詳細仕様
- `docs/aeterna-natural-observation-ux-polish.md` — v1.1 Observation UX Polish
- `docs/aeterna-natural-integration-review.md` — N0–N7 統合レビュー

### v1.0 Stabilization (完了)

N0〜N7 実装後のコード・UI・docs・tests を安定化。

新規追加: `AeternaNaturalRuntimeConfig` / 7 presets / safety gate (validateAeternaNaturalConfig) / `NaturalDiagnosticState` / long-run execution profiles / 5 stabilization tests / Runtime Mode HUD

**安全方針:**
- default config は安全側 (flat / scalar / observerOnly / plasticity off / neutral / safe)
- complexRuntime / resistanceOnly / weakCoupling は experimental mode のみ
- observedRatio は runtime feedback に使わない
- referenceRatios は dynamicCore に import しない
- No Node bridge, No LLM/API, No semantic claims

### v1.1 Observation UX Polish

- Observation Dashboard を追加し、runtime mode / geometry / vortex / membrane / weak plasticity / observed ratios / comparison / diagnostics を整理
- Runtime Mode Badge と Value Kind Badge を強化
- Guide / comparison copy を observation-only に統一
- mobile でも runtime badges と guide が読みやすい形へ調整

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test:run
```
