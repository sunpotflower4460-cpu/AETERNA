# Body-World Closure Metrics（雛形）

> **Status**: W0 — 定義の固定のみ。W6（Body-World Closure Metrics）まで実装しない。

## 目的

閉ループが本当に機能しているかを見る研究指標を定義する。

これらは意識の証明ではない。
閉ループの成立度を観測するための研究指標であり、exact claim をしない。

## 指標一覧

### loopGain
- **意味**: AETERNA の作用が世界を経由して戻ってくる際の増幅・減衰比
- **分類**: Derived
- **注意**: > 1.0 は増幅（不安定リスク）、< 1.0 は減衰（閉ループ維持コスト）

### roundTripDelay
- **意味**: Actuation Pulse から Sensory Return までの往復遅延
- **分類**: Measured
- **注意**: 遅延が長すぎると feedback が遅れ、ループが機能しにくくなる

### returnStrength
- **意味**: Sensory Return の強度（どれだけ強く戻ってくるか）
- **分類**: Measured
- **注意**: returnStrength が低すぎると閉ループが機能しない

### selfCausedMatch
- **意味**: Sensory Return のうち自己起因と判断される割合
- **分類**: Derived
- **注意**: Reafference Comparison から導かれる

### worldMismatch
- **意味**: 外界が独自に変化した差分の強度
- **分類**: Derived
- **注意**: AETERNA の作用以外の外乱を示す

### closureStability
- **意味**: 閉ループの安定度（時系列的な揺らぎ）
- **分類**: Derived
- **注意**: 高いほど閉ループが持続的に成立している

### closureDrift
- **意味**: 閉ループの中心点のゆっくりとした移動
- **分類**: Proxy
- **注意**: ループが徐々に変質・逸脱していないかを見る

### unresolvedReturn
- **意味**: 帰属不明の Sensory Return の量
- **分類**: Derived
- **注意**: 高い場合、self / world 区別が困難になっている

### feedbackSaturationRisk
- **意味**: フィードバックループが飽和・暴走するリスク指標
- **分類**: Proxy
- **注意**: loopGain と returnStrength の組み合わせから導かれる

## 分類の定義

| 分類 | 意味 |
|---|---|
| **Measured** | 直接計測できる値 |
| **Derived** | 他の指標から計算される値 |
| **Proxy** | 間接的な代理指標 |

## 重要な注意

- これらは閉ループの成立度を観測するための研究指標である
- 意識・主観性・知性の証明には使わない
- exact claim をしない
- Observer-side のみ。organism core の変更には直接使わない

## 実装ロードマップ

- W6: Body-World Closure Metrics の基本実装 ✅
- W7: proto-neuron 観測との組み合わせ ✅
- W8: 閉ループシナリオテストへの活用 ✅

---

## W8: Closed-Loop Scenario Tests での活用（追記）

W8 では、これらの指標を複数の scenario 条件で横断的に検証した。

### 検証した scenario 条件

| Scenario | 条件 | 検証対象指標 |
|---|---|---|
| W8-A: no world return | world から return がない | loopGain 低, closureStability 低 |
| W8-B: delayed return | return が遅延して届く | roundTripDelay 高, closureDrift 増加 |
| W8-C: amplified return | return が増幅されて届く | feedbackSaturationRisk 高, loopGain 高 |
| W8-D: weak return | return が弱い | loopGain 低〜中 |
| W8-E: repeated self-pulse | AETERNA が反復作用 | closureStability 安定しやすい |
| W8-F: world perturbation only | AETERNA の pulse なし | worldMismatch 高, selfCausedMatch 低 |
| W8-G: self vs world | 同強度だが起因が違う return | selfCausedMatch vs worldCausedDifference の分離 |
| W8-H: closure-coupled proto-neuron | 安定閉ループで候補観測 | closureCoupling, proto-neuron candidate |
| W8-I: feedback saturation guard | 強い閉ループ | feedbackSaturationRisk 検出 |
| W8-J: semantic leak full check | W1〜W8 全体 | semanticLeakCount = 0 |

### 重要注意

- これらの指標は閉ループの成立度を測る研究指標であり、意識・主観性・知性の証明ではない
- feedbackSaturationRisk が高い場合、これは「暴走の証明」ではなく「暴走リスクの観測値」
- proto-neuron candidate は observer-side のまま — runtime neuron node への変換は行わない
- semanticLeakCount は 0 であることが必須条件


### closureCoupling（W7 observer proxy）
- **意味**: proto-neuron candidate が body-world loop とどれだけ結びついて立ち上がっているか
- **分類**: Proxy
- **入力例**: `loopGain`, `returnStrength`, `returnMismatch`, `selfCausedMatch`, `worldMismatch`, `closureDrift`, `closureStability`
- **注意**: proto-neuron の意味の確信ではなく、閉ループ由来の立ち上がり proxy
