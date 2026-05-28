# Phase 0 Safety Protocol

## 実装場所

- Safety module: `src/observer/safety/`
- Safety tests: `src/tests/safety/phase0Safety.test.ts`

## 1. 保存則チェッカー

- `deriveConservationResiduals` が以下を観測側で計算:
  - エネルギー保存残差
  - 運動量保存残差
  - 巻き数保存残差

## 2. 暴走検出器

`detectRunaway` は次を検出条件とする:

- 保存則残差が閾値超過かつ増加継続
- エネルギーの指数発散
- NaN/Inf 発生
- semanticLeakCount 閾値超過

検出時は以下を返す:

- `shouldStopExperiment: true`
- `shouldSaveSnapshot: true`
- `logDirectory: "logs/safety/"`

## 3. writeback フラグ

- `PHASE0_MECHANISM_WRITEBACK_FLAGS` に全機構の `writeback_enabled: false` を定義。
- weakPlasticityTrace 等は `requires_writeback_review: true` を付与。
