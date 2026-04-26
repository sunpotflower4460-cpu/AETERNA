# World Medium Spec

> **Status**: W3 — Simulated World Medium 導入完了。Sensory Return (W4) / Reafference Comparison (W5) はまだ未実装。

## World Medium とは

World Medium は、AETERNA の作用（Actuation Pulse）が一度入る「外界」である。

AETERNA の一部ではない。AETERNA の作用を受ける外側の場である。
World Medium の変化が Sensory Return として AETERNA に戻る。

## World Medium は AETERNA の一部ではない

```
AETERNA (Torus Life Field)
     ↓ Actuation Pulse
[ World Medium ]
     ↓ Sensory Return
AETERNA (Torus Life Field)
```

World Medium は AETERNA と分離した外部モジュールとして設計する。
AETERNA が World Medium の内部状態を直接読み書きしてはならない。

## 方針：まず simulated world から始める

最初は real sensor ではなく simulated world を優先する。

- real camera: 後段
- real mic / audio input: 後段
- device motion (IMU): 後段

Simulated World Medium はソフトウェア上で擬似的な外界パラメータを提供する。

## World Medium 候補値

| フィールド名 | 意味 | 分類 |
|---|---|---|
| `ambientLight` | 環境光レベル | Simulated |
| `ambientNoise` | 環境ノイズレベル | Simulated |
| `surfaceResistance` | 表面抵抗（作用への応答性） | Simulated |
| `echoLevel` | 作用のエコー・反射強度 | Simulated |
| `motionDrift` | 外界のドリフト / 揺らぎ | Simulated |
| `fieldTemperature` | 場の温度（活性度） | Simulated |
| `feedbackDelay` | Sensory Return が戻るまでの遅延 | Simulated |

## Sensory Return

World Medium の変化は **Sensory Return** として AETERNA の知覚入力に戻る。
Sensory Return は Reafference Comparison によって処理される。

- AETERNA が自分で起こした変化（self-caused）
- 外界が独自に変化した部分（world-caused）

の区別が Reafference Comparison の仕事である。

## 実装ロードマップ

- ✅ W3: Simulated World Medium 導入（完了）
  - `WorldMediumState` 型定義
  - `initializeWorldMediumState()` 初期化関数
  - `updateWorldMedium()` 更新関数
  - Actuation Pulse による影響（visual / simulatedForce）
  - 自然減衰・ドリフト
  - scenario / behavioral tests
- ✅ W4: Sensory Return 導入（完了）
  - `SensoryReturnPacket` 型定義
  - `deriveSensoryReturn()` 導出関数
  - `sensoryReturnToPerturbation()` 変換関数
  - World Medium の変化から pre-semantic signal を生成
  - perturbation pipeline への弱い接続
  - scenario / behavioral tests
- W5: Reafference Comparison 導入（未実装）
- （後段）: real sensor との接続

## W3 実装内容

### ファイル構成

- `src/types/worldMediumState.ts` — WorldMediumState 型定義
- `src/world/initializeWorldMediumState.ts` — 初期化関数
- `src/world/updateWorldMedium.ts` — 更新関数（pulse 受け取り + 自然変化）
- `src/tests/scenario/worldMediumScenario.ts` — W3-A〜E シナリオテスト
- `src/tests/behavioral/worldMedium.test.ts` — ユニットテスト

### WorldMediumState 項目

| フィールド名 | 意味 | 範囲 |
|---|---|---|
| `timestamp` | フレームタイムスタンプ | number |
| `ambientLight` | 環境光レベル | 0–1 |
| `ambientNoise` | 環境ノイズレベル | 0–1 |
| `surfaceResistance` | 表面抵抗（作用への応答性） | 0–1 |
| `echoLevel` | 作用のエコー・反射強度 | 0–1 |
| `motionDrift` | 外界のドリフト / 揺らぎ | 0–1 |
| `fieldTemperature` | 場の温度（活性度・変化しやすさ） | 0–1 |
| `feedbackDelay` | Sensory Return が戻るまでの遅延（W4 用） | 0–1 |
| `lastPulseImpact` | 直近の Actuation Pulse 影響度 | 0–1 |
| `mediumStability` | World Medium の安定度 | 0–1 |
| `visualResidue` | visual pulse の残留 | 0–1 |
| `forceResidue` | simulatedForce pulse の残留 | 0–1 |
| `worldTurbulence` | 世界の乱流度 | 0–1 |
| `returnReadiness` | Sensory Return 準備度（W4 用） | 0–1 |

### Actuation Pulse による影響

#### Visual Pulse 影響

- `ambientLight` 増加（微弱）
- `visualResidue` 増加
- `echoLevel` 増加
- `ambientNoise` 微増
- `worldTurbulence` 微増

#### Simulated Force Pulse 影響

- `surfaceResistance` 増加
- `motionDrift` 増加
- `fieldTemperature` 増加
- `forceResidue` 増加
- `worldTurbulence` 増加
- `echoLevel` 微増

### 自然減衰

pulse がない時も、World Medium は以下の自然変化を持つ：

- `echoLevel` → 0 へ減衰（速い）
- `lastPulseImpact` → 0 へ減衰（速い）
- `visualResidue` / `forceResidue` → 0 へ減衰（速い）
- `ambientLight` → baseline (0.5) へ戻る
- `ambientNoise` → baseline (0.2) へ戻る
- `surfaceResistance` → baseline (0.4) へ戻る
- `fieldTemperature` → baseline (0.35) へ戻る
- `mediumStability` → baseline (0.7) へ戻る
- `motionDrift` 小さく揺れる（sin 波ベース）
- `worldTurbulence` → baseline (0.15) へ戻る
- `returnReadiness` → baseline (0.3) へ戻る

### W3 重要原則

- World Medium は AETERNA の外部である
- pulse 影響は微弱（単一 pulse で大きく変えない）
- NaN / Infinity を出さない
- すべての値を [0, 1] 範囲に維持
- まだ Sensory Return を AETERNA に返さない
- まだ Reafference Comparison を実装しない
- semantic interpretation を行わない

## W4 実装内容（W4: Sensory Return）

### ファイル構成

- `src/types/sensoryReturnPacket.ts` — SensoryReturnPacket 型定義
- `src/perception/deriveSensoryReturn.ts` — World Medium 変化から Sensory Return 生成
- `src/perception/sensoryReturnToPerturbation.ts` — PerturbationEvent への変換関数
- `src/tests/scenario/sensoryReturnScenario.ts` — W4-A〜F シナリオテスト
- `src/tests/behavioral/sensoryReturn.test.ts` — ユニットテスト

### SensoryReturnPacket 項目

| フィールド名 | 意味 | 範囲 |
|---|---|---|
| `timestamp` | フレームタイムスタンプ | number |
| `channel` | 感覚チャンネル（simulatedLight / simulatedNoise / simulatedPressure / simulatedMotion / simulatedEcho） | enum |
| `intensity` | 戻り信号の強さ | 0–1 |
| `novelty` | 前回までとの新規性 | 0–1 |
| `locality` | 局所性（local 変化か global 変化か） | 0–1 |
| `rhythm` | 周期性・リズム性 | 0–1 |
| `worldOriginStrength` | World Medium 由来である強度（W4 では self/world 判定なし） | 0–1 |
| `returnDelayHint` | 遅延ヒント（feedbackDelay から導出） | 0–1 |
| `mediumStabilityHint` | World Medium 安定度ヒント | 0–1 |

### World Medium から Sensory Return への対応

| World Medium フィールド | Sensory Return Channel |
|---|---|
| `ambientLight` + `visualResidue` | simulatedLight |
| `ambientNoise` + `worldTurbulence` | simulatedNoise |
| `surfaceResistance` + `forceResidue` | simulatedPressure |
| `motionDrift` + `fieldTemperature` | simulatedMotion |
| `echoLevel` + `lastPulseImpact` | simulatedEcho |

### W4 設計原則

- Sensory Return は **意味入力ではない**
- World Medium から戻る **pre-semantic signal** として扱う
- W4 では **simulated return のみ**（real sensor はまだ使わない）
- **Reafference Comparison はまだ本実装しない**（W5）
- World Medium の変化が小さい時は packet を出さない
- 複数 channel を同時に返せる
- NaN / Infinity を出さない
- すべての値を [0, 1] 範囲に維持
- PerturbationEvent への変換は **弱い**（overwhelming しない）

### W4 で実装していないこと

以下は W4 では実装していない：

- Reafference Comparison（W5）
- self-caused / world-caused 判定（W5）
- real camera / mic / IMU 接続（後段）
- semantic interpretation（禁止）
- proto-neuron 実装（Phase 7+）
- Node bridge 本格接続（Phase 8+）

## 禁止事項

World Medium は以下であってはならない。

- semantic label の発生源
- AETERNA の意味解釈装置
- LLM や言語モデルへの入力経路
