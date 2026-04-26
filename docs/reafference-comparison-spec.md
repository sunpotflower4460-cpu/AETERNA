# Reafference Comparison Spec

> **Status**: W5 — Reafference Comparison 最小実装完了

## Reafference Comparison とは

Reafference Comparison は、AETERNA が自分で出した作用と、
世界から戻ってきた入力の差分を見る層である。

これは言語的自己認識ではない。
「自分が出した波がどう返ってきたか」を見るだけの、pre-semantic な差分処理である。

## efference copy との関係

Reafference Comparison は efference copy 的な考えに近い。
ただし AETERNA では pre-semantic に扱う。

- self / world の違いは「意味」ではなく「差分」として扱う
- 自己認識・自己同一性とは直接関係しない
- 差分が将来の trace / mismatch / recovery に影響する

## 処理フロー

```
AETERNA が Actuation Pulse を出す
     ↓
World Medium が変化する
     ↓
Sensory Return が戻ってくる
     ↓
Reafference Comparison
     ↓
selfCausedMatch / worldCausedDifference / unresolvedReturn
     ↓
prediction mismatch / recovery / trace に影響
```

## フィールド定義（候補）

| フィールド名 | 意味 | 分類 |
|---|---|---|
| `expectedReturn` | AETERNA が予期した Sensory Return | Derived |
| `actualReturn` | 実際に戻ってきた Sensory Return | Measured |
| `returnDelay` | 作用から Sensory Return までの遅延 | Measured |
| `returnMismatch` | expected と actual の差分 | Derived |
| `selfCausedMatch` | 自分が起こしたと判断される一致度 | Derived |
| `worldCausedDifference` | 外界が独自に変化した差分 | Derived |
| `unresolvedReturn` | 帰属不明の戻り入力 | Derived |

## 重要原則

- Reafference Comparison は言語的自己認識ではない
- self / world の区別は意味ではなく差分として扱う
- efference copy 的な考えに近いが、AETERNA では pre-semantic に扱う
- 差分は将来の prediction mismatch / trace / replay に使われる

## 実装ロードマップ

- ✅ W5: Reafference Comparison の最小実装（完了）
- W6: Closure Metrics への接続
- W7: proto-neuron 観測への活用

## W5 実装内容

### 型定義

`src/types/reafferenceComparisonState.ts`:
- `ReafferenceComparisonState` interface
- 8 個の必須フィールド + 4 個のオプショナルフィールド

必須フィールド:
- `expectedReturn`: Actuation Pulse から予測される戻り
- `actualReturn`: 実際に戻った Sensory Return の強度
- `returnDelay`: 出力から戻りまでの遅延
- `returnMismatch`: expected と actual の差分
- `selfCausedMatch`: 自分由来と思われる proxy 指標
- `worldCausedDifference`: 外界由来と思われる proxy 指標
- `unresolvedReturn`: 帰属不明の戻り
- `comparisonConfidence`: 比較の信頼度 proxy

オプショナルフィールド:
- `pulseReturnCorrelation`: pulse と return の相関
- `returnAttenuation`: 減衰度
- `returnAmplification`: 増幅度
- `delayedEchoScore`: 遅延エコー指標

### 導出関数

`src/closure/deriveReafferenceComparison.ts`:
- `deriveReafferenceComparison()`: メイン関数
- `deriveExpectedReturn()`: pulse から expected を計算
- `deriveActualReturn()`: return packets から actual を計算
- `deriveSelfCausedMatch()`: self-caused proxy を計算
- `deriveWorldCausedDifference()`: world-caused proxy を計算
- `deriveUnresolvedReturn()`: unresolved proxy を計算

### expectedReturn の計算方針

Actuation Pulse の以下を使用:
- `intensity` × 0.4
- `coherence` × 0.2
- `outputReadiness` × 0.2
- `locality` × 0.2

合計で [0, 1] 範囲の値を返す。

### actualReturn の計算方針

SensoryReturnPacket 配列から:
- 各 packet の `intensity × worldOriginStrength` を計算
- 平均値を取る
- [0, 1] 範囲でクランプ

### selfCausedMatch の判定方針

HIGH になる条件:
- pulse が存在する
- pulse channel と return channel が対応している（visual → simulatedLight など）
- return delay が適度（0.7 未満）
- expectedReturn ≈ actualReturn（低ミスマッチ）
- medium stability が極端に低くない

重み付け:
- channel match: 0.35
- match quality: 0.3
- delay reasonable: 0.2
- stability: 0.15

### worldCausedDifference の判定方針

HIGH になる条件:
- pulse がないのに return が強い
- actualReturn >> expectedReturn（増幅）
- return delay が異常に高い（0.65 超）
- medium stability が低い
- motion drift が高い

重み付け:
- no pulse, strong return: 0.4
- amplification: 0.3
- unusual delay: 0.15
- instability: 0.1
- drift: 0.05

### unresolvedReturn の判定方針

HIGH になる条件:
- selfCausedMatch と worldCausedDifference がともに低い
- 中程度のミスマッチ（0.2〜0.6）
- channel correspondence が曖昧
- 複数の return が重なる

### テスト

`src/tests/scenario/reafferenceComparisonScenario.ts`:
- W5-A: matched return（selfCausedMatch が高い）
- W5-B: no pulse world return（worldCausedDifference が高い）
- W5-C: delayed return（returnDelay が高い）
- W5-D: amplified return（returnMismatch が高い、増幅）
- W5-E: weak return（returnMismatch が高い、減衰）
- W5-F: weak feedback only（dynamics を圧倒しない）
- W5-G: no semantic self claim（semantic フィールドなし）

`src/tests/behavioral/reafferenceComparison.test.ts`:
- 基本機能テスト
- null pulse / 空 returns の安全処理
- NaN / Infinity 排除
- channel matching テスト
- 各シナリオの behavioral テスト

### まだ実装していないこと

W5 では以下を実装していない:
- Reafference Comparison の本体 dynamics への feedback（微弱にも戻していない）
- observer / metrics への表示
- proto-neuron 実装
- semantic node / object label / same-object detection
- teacher binding / LLM teacher
- Node bridge 本格接続

## 禁止事項

Reafference Comparison は以下であってはならない。

- 言語的な自己認識装置
- semantic な自己モデル
- LLM が使う自己記述フィールドの生成源
