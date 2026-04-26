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

## W4: Sensory Return 導入（完了）

W4 では、World Medium の変化を AETERNA に戻す Sensory Return を導入した。

### Sensory Return の位置づけ

```
Torus Life Field
↓
Body Surface (W1)
↓
Actuation Pulse (W2)
↓
World Medium (W3)
↓
[Sensory Return] ← W4 で導入
↓
[Reafference Comparison] ← W5 で導入
↓
Perturbation + Mismatch
↓
Torus Life Field
```

### W4 で実装したこと

- `SensoryReturnPacket` 型定義（9 項目 + optional 5 項目）
- `deriveSensoryReturn()` 関数
  - World Medium の変化から Sensory Return packet を生成
  - 変化が小さい時は packet を出さない
  - 複数 channel を同時に返せる
- `sensoryReturnToPerturbation()` 関数
  - PerturbationEvent への弱い変換
  - overwhelming しない設計
- scenario / behavioral tests (W4-A〜F)

### W4 で実装していないこと

まだ以下は実装していない：

- Reafference Comparison（W5）
- self-caused / world-caused 判定（W5）
- real sensor 接続（後段）
- semantic interpretation（禁止）

### Sensory Return は意味入力ではない

Sensory Return は World Medium から戻る **pre-semantic simulated signal** である。

- 意味ノードではない
- object label ではない
- same-object detection ではない
- teacher binding ではない
- language meaning ではない

W4 で戻るのは：

```
simulatedLight
simulatedNoise
simulatedPressure
simulatedMotion
simulatedEcho
```

のような、世界側から返ってきた pre-semantic sensory signal である。

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

## W5: Reafference Comparison 導入（完了）

W5 では、Actuation Pulse と Sensory Return を比較する Reafference Comparison を導入した。

### Reafference Comparison の位置づけ

```
Torus Life Field
↓
Body Surface (W1)
↓
Actuation Pulse (W2)
↓
World Medium (W3)
↓
Sensory Return (W4)
↓
[Reafference Comparison] ← W5 で導入
↓
(Perturbation + Mismatch)
↓
Torus Life Field
```

W5 で、最小限の閉ループ比較が入った。
ただし、W5 では reafference の結果を本体 dynamics に強く返していない。

### W5 で実装したこと

- `ReafferenceComparisonState` 型定義（8 必須 + 4 optional）
- `deriveReafferenceComparison()` 関数
  - Actuation Pulse から expectedReturn を導出
  - Sensory Return から actualReturn を導出
  - returnMismatch を計算
  - selfCausedMatch / worldCausedDifference / unresolvedReturn を proxy として導出
- scenario / behavioral tests (W5-A〜G)
- AeternaNetwork.js への統合
  - World Medium state の初期化・管理
  - updateDynamics 内で W3→W4→W5 の順序で処理
- observer / metrics UI への表示追加
  - World Medium 状態
  - Sensory Return パケット数
  - Reafference Comparison 全指標

### W5 で実装していないこと

まだ以下は実装していない：

- 強い feedback ループ（観測中心、feedback は意図的に最小限に保つ）
- proto-neuron 実装（W7+）
- semantic node / object label / same-object detection
- teacher binding / LLM teacher
- Node bridge 本格接続

### Reafference Comparison は自己認識ではない

Reafference Comparison は **pre-semantic comparison** である。

- 言語的な「私がやった」判断ではない
- selfCausedMatch / worldCausedDifference は proxy indicator であって意味判断ではない
- 自己同一性・自己認識とは無関係
- efference copy 的な比較だが、意味化しない

W5 で導出されるのは：

```
expectedReturn: pulse から予測される戻り
actualReturn: 実際に戻った return
returnMismatch: expected と actual の差分
selfCausedMatch: 自分由来と思われる proxy
worldCausedDifference: 外界由来と思われる proxy
unresolvedReturn: 帰属不明の proxy
```

すべて [0, 1] の連続値であり、意味ラベルではない。
