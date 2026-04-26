# Body-World Closure Principles

## AETERNA の新しい方向性

AETERNA は、内側だけで完結する生命場ではなく、
世界と閉じた循環を持つ生命場を目指す。

基本ループは以下。

```
Torus Life Field
↓
Body Surface
↓
Actuation Pulse
↓
World Medium
↓
Sensory Return
↓
Reafference Comparison
↓
Perturbation + Mismatch
↓
Torus Life Field
```

## Body-World Closure の意味

Body-World Closure とは、

- AETERNA が内部状態を持つ
- その内部状態から外界へ作用する
- 外界が変化する
- その変化が再び AETERNA に戻る
- 戻った入力が prediction mismatch / recovery / trace / replay に影響する

という閉ループである。

## 重要原則

- 入力は生命を開始するトリガーではない
- 出力は会話ではない
- 出力はまず身体的作用（Actuation Pulse）である
- 世界との閉ループは、意味形成より前に必要
- AETERNA は世界と呼吸する生命場である

## 禁止事項

この閉ループを実装・観測する際に、以下を追加してはならない。

- semantic node
- object label
- same-object detection
- teacher binding
- language meaning
- LLM teacher

## AETERNA は意味ノードを先に持たない

AETERNA は最初から意味ノードを持たない。
トーラス生命場の流れ、外乱、痕跡、replay、回復、世界との閉ループの中から、
自然に proto-neuron 的な節が観測されるかどうかを見る。

意味が先にあるのではなく、意味が自然に出てくるかもしれない前提の器として AETERNA は存在する。

## Node-AI-Z / Node Mother との役割分担

- **AETERNA**: トーラス生命場として世界と閉じ、pre-semantic な閉ループを担う
- **Node-AI-Z / Node Mother**: 後段の意味化・構造化を担う

Node-AI-Z / Node Mother は、AETERNA が自然観測した proto-neuron 候補を受け取り、
そこから意味・構造・知識を構築する役割を持つ。
この責務を AETERNA 側に先取りしてはならない。

## 設計境界の固定（W0）

W0 では runtime 実装は行わない。
この文書は、今後の実装がブレないための設計境界を固定するものである。

- bodySurface: W1 で導入
- actuationPulse: W2 で導入
- worldMedium (simulated): W3 で導入
- sensoryReturn: W4 で導入
- reafferenceComparison: W5 で導入
- closureMetrics: W6 で導入
- proto-neuron 観測: W7 で観測開始
