# Phase 0 Recording Protocol

## 1. experimentKind 必須化

- 型定義: `src/observer/experimentKind.ts`
- `ExperimentKind` は以下の 4 分類を必須とする:
  - `observation`
  - `intervention`
  - `scout`
  - `null_check`
- Preset 実験は `PresetExperiment.experimentKind` を必須化（`src/types/presetExperiment.ts`）。

## 2. Scout Explorer

- 実装: `src/observer/scoutExplorer/runScoutExplorer.ts`
- 入力: パラメータ範囲・サンプル数
- 出力: `results/scout/{experiment_id}/{point_id}.json`
- 各点を同一フォーマットで保存し、null 結果も欠落させない。

## 3. null 結果の標準化

- `normalizeObservationResult` を通して、未観測は必ず以下で記録する:

```json
{ "status": "no_emergence", "reason": "..." }
```

## 4. 仮説書テンプレート

- `docs/hypotheses/template.md` を使用する。
- scout / intervention / 判別不能(C) の判断が出た実験は必ずこのテンプレートで仮説書を残す。
