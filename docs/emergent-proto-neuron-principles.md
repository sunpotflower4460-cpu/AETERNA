# Emergent Proto-Neuron Principles

## proto-neuron とは

proto-neuron は、最初から配置される neuron node ではない。  
Body-World Closure を持つトーラス生命場の中で、発火しやすさ・痕跡保持・再発・共発火・弱い可塑性が重なったときに、observer-side から見える **pre-semantic excitable locus** である。

proto-neuron は以下ではない。

- semantic node
- object label
- concept
- category
- same-object detection
- teacher binding
- language meaning
- runtime neuron node
- Node-AI-Z / Node Mother bridge payload

## proto-point との違い

| 層 | proto-point | proto-neuron |
|---|---|---|
| 位置づけ | 局所的な節候補が見え始めた段階 | 発火性・不応期・伝播・痕跡・再発・共発火・弱い可塑性が重なった段階 |
| 要求 | 局所的な重なりの観測 | 複数条件の合成による発火節候補の観測 |
| 意味 | 付与しない | 付与しない |
| runtime 影響 | なし | なし |

proto-neuron は proto-point より一段進んだ観測候補だが、まだ semantic ではない。

## proto-neuron candidate の条件

### excitability（発火性）
局所領域が繰り返し立ち上がりやすい。

### refractory-like behavior（不応期的挙動）
発火直後に即座に再発火しすぎず、抑制・回復の周期が見える。

### local propagation（局所伝播）
近傍へ活性が伝わりやすいが、全体飽和にはならない。

### trace retention（痕跡保持）
発火後に trace / residue が残る。

### recurrence（再発性）
似た条件で再び立ち上がる。

### co-activation（共発火）
他の候補と同時に立ち上がりやすい。

### weak plasticity（弱い可塑性）
繰り返し起きた流路が少し通りやすくなる。

### closure coupling（Body-World Closure 結合）
loopGain / returnMismatch / closureDrift / selfCausedMatch / worldMismatch のような world loop の指標と一緒に立ち上がる。

## confidence score

W7 の confidence は derived / proxy であり、意味の確信ではない。

```txt
confidence =
  0.16 * excitability +
  0.12 * refractoryPattern +
  0.14 * localPropagation +
  0.14 * traceRetention +
  0.14 * recurrenceScore +
  0.12 * coActivationScore +
  0.10 * weakPlasticityScore +
  0.08 * closureCoupling
```

- conservative threshold を通った候補だけを表示する
- 高 confidence でも meaning を意味しない
- 全項目は rough proxy である

## observer-side lifecycle

W7 では observer 側だけの lifecycle を使ってよい。

- `new`
- `recurring`
- `stabilizing`
- `persistent`
- `decaying`

これは観測上の整理であり、成長演出ではない。runtime behavior を変えない。

## co-activation summary

W7 では proto-network 本実装は行わない。  
ただし observer summary として以下を持ってよい。

- `coActivationClusterCount`
- `averageCoActivationScore`
- `repeatedCoActivationCount`
- `strongestCoActivationPair`

relation / concept link にはしない。

## 観測の原則

- proto-neuron candidate は observer-side の候補であり、organism core に直接フィードバックされない
- proto-neuron candidate は proto-point 観測と Body-World Closure 指標の重なりから自然に現れる
- runtime neuron node は置かない
- semantic node / label / concept / same-object は追加しない
- Node bridge 本格接続はまだ行わない
- LLM teacher は使わない

## このフェーズ（W7）での位置づけ

W7 では proto-neuron を **観測する**。  
W7 では proto-neuron を **配置しない**。  
W7 では Node bridge しない。  
W7 では meaning を与えない。
