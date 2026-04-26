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
