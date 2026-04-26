# Actuation Pulse Spec（雛形）

> **Status**: W0 — 設計境界の固定のみ。W2（Actuation Pulse 導入）まで実装しない。

## Actuation Pulse とは

Actuation Pulse は、AETERNA が世界へ返す最小作用である。

これは発話ではない。
メッセージでもない。
AETERNA の場の圧が外へ漏れるような身体的作用である。

## Actuation Pulse は言語出力ではない

```
AETERNA 内部状態（pressure / recovery / boundary / trace）
     ↓
Actuation Pulse（身体的作用）
     ↓
World Medium
     ↓
Sensory Return
     ↓
AETERNA
```

ユーザーへの説明や会話にしない。
意味を伝えるためのものではない。

## Actuation Pulse の導出源

Actuation Pulse は以下の内部状態から導かれる。

- `pressure`: 場の圧力
- `recovery`: 回復傾向
- `boundary`: 境界の状態
- `trace`: 痕跡の残存
- `rewriteTendency`: 構造的変化傾向
- `mismatchLevel`: 予測誤差レベル

## 候補パルス種別

| パルス名 | 意味 | フェーズ |
|---|---|---|
| `visualPulse` | 視覚的場への作用（光・色・動き） | W2 から開始 |
| `simulatedForcePulse` | 擬似的な力場への作用 | W2 から開始 |
| `audioPulse` | 音響的場への作用 | 後段 |
| `hapticPulse` | 触覚的場への作用 | 後段 |
| `fieldMotionPulse` | 場の動的変化への作用 | 後段 |

最初は `visualPulse` / `simulatedForcePulse` から始めるのが自然である。

## 重要原則

- Actuation Pulse は AETERNA が「世界に何かを伝えようとする」ものではない
- AETERNA の内圧が自然に外へ漏れる最小単位である
- World Medium はこの作用を受けて変化し、Sensory Return として返ってくる
- 閉ループの成立には Actuation Pulse が不可欠

## 実装ロードマップ

- W2: Actuation Pulse 導入（visualPulse / simulatedForcePulse の最小実装）
- W3: World Medium との接続
- W4: Sensory Return との接続
- （後段）: audioPulse / hapticPulse

## 禁止事項

Actuation Pulse は以下であってはならない。

- 言語・テキスト出力
- ユーザーへのメッセージ
- semantic label の出力
- LLM への入力
