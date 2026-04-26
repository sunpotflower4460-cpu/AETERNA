# Reafference Comparison Spec（雛形）

> **Status**: W0 — 設計境界の固定のみ。W5（Reafference Comparison 導入）まで実装しない。

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

- W5: Reafference Comparison の最小実装（expectedReturn / actualReturn / returnMismatch）
- W6: Closure Metrics への接続
- W7: proto-neuron 観測への活用

## 禁止事項

Reafference Comparison は以下であってはならない。

- 言語的な自己認識装置
- semantic な自己モデル
- LLM が使う自己記述フィールドの生成源
