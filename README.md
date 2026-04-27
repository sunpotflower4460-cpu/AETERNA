# AETERNA

AETERNA is a repo for growing a primitive-organism-like brain with ongoing baseline activity rather than a stimulus-only reactive device.

## Current source of truth

- Active code: `src/`
- Preserved prototypes and displaced notes: `archive/`
- Core development principles: `docs/aeterna-core-principles.md`
- Current roadmap: `docs/current-roadmap.md`
- Agent rules for small safe changes: `docs/agent-guardrails.md`
- Current structure map: `docs/system-map.md`

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

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test:run
```
