# Open-State Principles

AETERNA v0.5 / Quantum-Inspired Q1-1

## Overview

**Open-State Snapshot** は AETERNA の複数内部傾向の混合状態を観測・保持するための器である。

## Important Clarifications

### NOT Literal Quantum State

Open-State は literal な量子状態や qubit ではない。

- 量子計算機上の literal qubit ではない
- 量子回路モデルではない
- entanglement の実装ではない
- 量子ゲート操作ではない

### What Open-State Actually Is

Open-State は以下の3つの混合比的 snapshot を持つ:

1. **Felt-State Mix**: organism の felt-state の混合
   - depletion / overload / coherence / boundary / restoration / perturbation / openness

2. **Activation Mix**: 活動・前景化の混合
   - arousal / awareness / salience / foreground pressure

3. **Drive Mix**: need / motivation の混合
   - energy need / safety need / restoration need
   - novelty / repetition / exploration motivation

## Derived Indices (Proxy / Approximate)

### Stability Index

今の mixed-state がどれくらい安定しているかの proxy 指標。

算出要素:
- coherence (高 = 安定)
- boundaryIntegrity (高 = 安定)
- restorationReadiness (中〜高 = 安定)
- overload (低 = 安定)
- safetyNeed (過大でない = 安定)
- awarenessWindow (極端でない = 安定)

Range: 0 (unstable) ~ 1 (stable)

**これは derived / proxy である。**

### Mixture Entropy

混ざり具合 / 一極集中していない度合いの rough 指標。

算出方法:
- 代表的な軸を正規化して確率分布を作る
- Shannon entropy 風に -Σ(p * log2(p)) を計算する

Range: 0 (single pole) ~ 2.0+ (highly mixed)

**これは literal quantum entropy ではなく、proxy である。**

### Dominant Pole (Optional)

便宜的な優勢軸のラベル。observer / debug 用。

Values:
- `'restoration'` - restoration 優勢
- `'overload'` - overload 優勢
- `'exploration'` - exploration 優勢
- `'safety'` - safety 優勢
- `'neutral-mixed'` - 混合状態

**これは runtime の主決定器ではない。行動分岐には使わない。**

## Current Role (Q1-1)

Open-State Snapshot は **観測層** のみ。

- 毎 tick 生成される
- scenario runner で summary される
- observer で表示される
- **まだ causal driver にはなっていない**

## Future Role (Q1-2+)

次 Phase 以降で:
- touch backaction の土台になる
- modulation の弱い返却が始まる
- 徐々に organism core との対話が深まる

## What This Is NOT

- 主ループの置き換えではない
- organism を量子モデルにするものではない
- 量子要素は支持層であり主役ではない
- backbone を壊すものではない

## Integration Points

### runScenario.ts

- `MetricsSnapshot` に `openState_*` フィールドが追加されている
- `ScenarioResult.summary` に avgStabilityIndex / avgMixtureEntropy / dominantPoleDistribution が追加されている

### deriveOpenStateSnapshot.ts

- `FeltStateVector` + `ArousalAwarenessState` + `NeedMotivationState` から `OpenStateSnapshot` を純粋関数的に生成する
- stabilityIndex と mixtureEntropy を計算する
- dominantPole を判定する

### Tests

- `src/tests/openStateSnapshot.test.ts` で動作確認
- NaN が出ないこと
- finite であること
- pole detection が動作すること
- extreme values に対して robust であること

## Design Principles

1. **No Behavior Break**: 既存の動作を壊さない
2. **Pure Functions**: deriveOpenStateSnapshot は副作用なし
3. **Observation Only**: 今は観測のみ、modulation は次以降
4. **Proxy / Derived**: stabilityIndex / mixtureEntropy は厳密ではなく proxy
5. **No Label Branching**: dominantPole で行動分岐しない
6. **Minimal Integration**: 主ループへの影響は最小限

## References

- AETERNA 段階的設計書 v0.2 §A 実装時の禁止事項
- AETERNA 段階的設計書 v0.2 §B 誤解されやすい用語の定義
- 量子インスパイア統合設計図 v0.1
- Beautiful Loop L1/L2/L3
- A1 Felt-State / Interoception Expansion
- A2 Arousal / Awareness Split
- A4 Need / Motivation Split
