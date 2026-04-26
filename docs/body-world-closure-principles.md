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

## W1: Body Surface 導入

W1 では、AETERNA が世界と接するための Body Surface を導入した。

### Body Surface の位置づけ

Body Surface は、Body-World Closure ループの入口に位置する。

```
Torus Life Field
↓
[Body Surface]  ← W1 で導入
↓
Actuation Pulse  ← W2 で導入
↓
World Medium  ← W3 で導入
↓
...
```

Body Surface は、外界からの perturbation を受け取り、
将来的に外界へ Actuation Pulse を返すための身体境界である。

## W2: Actuation Pulse 導入

W2 では、Body Surface の `outputReadiness` を自然に使いながら、
`visual` / `simulatedForce` の最小 Actuation Pulse を observer-side に導出する。

```
Torus Life Field
↓
Body Surface
↓
Actuation Pulse  ← W2 で導出
↓
World Medium     ← W3 で接続
```

- Actuation Pulse は発話ではない
- 意思表示でもない
- 世界へ漏れる最小の身体的作用である
- W2 では World Medium / Sensory Return / Reafference Comparison をまだ本実装しない
- 出力しないことも自然な反応として扱う

## W3: Simulated World Medium 導入（完了）

W3 では、AETERNA の Actuation Pulse を受け取る小さな外界「Simulated World Medium」を導入した。

### World Medium の位置づけ

```
Torus Life Field
↓
Body Surface (W1)
↓
Actuation Pulse (W2)
↓
[World Medium]  ← W3 で導入
↓
Sensory Return  ← W4（未実装）
↓
Reafference Comparison  ← W5（未実装）
↓
Perturbation + Mismatch
↓
Torus Life Field
```

### W3 で実装したこと

- `WorldMediumState` 型定義（14 項目）
- `initializeWorldMediumState()` 初期化関数
- `updateWorldMedium()` 更新関数
  - Actuation Pulse による微弱な影響
  - pulse がない時も自然減衰・ドリフト
- scenario / behavioral tests (W3-A〜E)

### W3 で実装していないこと

まだ以下は実装していない：

- Sensory Return（W4）
- Reafference Comparison（W5）
- World Medium から AETERNA への feedback
- real sensor 接続
- semantic interpretation

### World Medium は AETERNA の外部

World Medium は AETERNA の一部ではなく、AETERNA の作用を受ける外界である。

- World Medium の状態を AETERNA が直接読み書きしない
- Actuation Pulse のみが World Medium に影響する
- World Medium 自体も時間で自然に変化する
- W4 で Sensory Return として初めて AETERNA に戻る

### W1 の実装内容

- `src/types/bodySurfaceState.ts`: BodySurfaceState 型定義
- `src/body/deriveBodySurfaceState.ts`: 既存 state からの純粋導出関数

### W1 の設計原則

- Body Surface は UI ではない
- Body Surface は身体境界・膜・皮膚のような pre-semantic layer である
- 入力（外乱の受け取り）と出力準備（outputReadiness）の両方に関係する
- W1 では出力本体（Actuation Pulse）は実装しない
- outputReadiness は W2 Actuation Pulse の準備値として計算のみ行う
- semantic node / object label / language meaning は含まない
- 既存の boundary / recovery / pressure / perturbation と自然につながる
- 既存の touch pipeline を全面置換しない
