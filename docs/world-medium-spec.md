# World Medium Spec（雛形）

> **Status**: W0 — 設計境界の固定のみ。W3（Simulated World Medium 導入）まで実装しない。

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

- W3: Simulated World Medium 導入（最小インターフェース）
- W4: Sensory Return 導入
- W5: Reafference Comparison 導入
- （後段）: real sensor との接続

## 禁止事項

World Medium は以下であってはならない。

- semantic label の発生源
- AETERNA の意味解釈装置
- LLM や言語モデルへの入力経路
