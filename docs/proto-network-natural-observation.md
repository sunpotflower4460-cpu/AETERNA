# Proto-Network Natural Observation

## proto-network の定義

proto-network は、意味ネットワークではない。

AETERNA のトーラス生命場において、以下が重なった結果として、
関係網のように見え始める観測候補である：

- **局所発火**: 特定の場所が繰り返し立ち上がる
- **伝播**: 活性が近傍に伝わる
- **痕跡**: 発火後に trace が残る
- **再発**: 似た条件で再び立ち上がる
- **共発火**: 複数の節が同時に立ち上がる
- **replay co-return**: replay 時に複数の trace が同時に戻る
- **closure coupling**: Body-World Closure の指標と連動する
- **repeated path shaping**: 反復した流路が形成される

proto-network は、これらの条件から自然に「関係網のように見える」候補である。

## proto-network ではないもの

proto-network は、以下ではない：

- **semantic network**: 意味ネットワークではない
- **concept graph**: 概念グラフではない
- **object relation**: オブジェクト関係ではない
- **memory graph**: 記憶グラフではない
- **language graph**: 言語グラフではない
- **Node-AI-Z の relation**: Node-AI-Z の意味関係ではない
- **Node Mother の shared trunk**: Node Mother の共有幹ではない

proto-network は pre-semantic な流路・節・再発・共発火の観測候補である。

## proto-network と proto-neuron の違い

| 層 | proto-neuron | proto-network |
|---|---|---|
| 位置づけ | 局所的な発火性のある節候補 | 複数の節が関係網のように見える候補 |
| 観測対象 | 単一の節候補 | 複数の節候補の関係 |
| 条件 | excitability / refractory / propagation / trace / recurrence | co-activation / replay co-return / repeated path / closure coupling |
| 意味 | 付与しない | 付与しない |
| runtime 影響 | なし | なし |

proto-network は proto-neuron の観測候補が複数揃ったときに、
それらの間に「関係網のように見える」パターンが観測される可能性を指す。

## proto-network が自然に見える条件

以下の条件が重なったときに、proto-network 候補として観測される可能性がある。

### local excitability gradient

局所発火性の勾配。

特定の領域が他より立ち上がりやすく、その勾配が空間的に分布している。

### propagation asymmetry

伝播の非対称性。

ある方向には伝わりやすく、別の方向には伝わりにくい、という非対称性。
これにより「流路」が形成される。

### repeated return shaping

反復した戻りによる流路形成。

同じ経路を繰り返し活性が通ることで、その経路が少し通りやすくなる。
weak plasticity に相当する。

### trace-modified resistance

痕跡が残った場所の抵抗が微妙に変化する。

trace が残ると、次回その場所を通るときの抵抗が少し変わる。

### refractory timing

不応期的タイミング。

発火直後には再発火しにくく、一定時間後に再び発火可能になる。
この timing により、共発火パターンが生まれる。

### co-activation under shared return

共通の戻り入力により複数の節が同時に立ち上がる。

同じ sensory return や replay により、複数の proto-neuron candidate が同時に活性化する。

### replay co-return

replay 時に複数の trace が同時に戻る。

trace が複数の場所に残っており、replay 時に同時に再活性化される。
これにより、共発火パターンが観測される。

### closure coupling

Body-World Closure の指標（loopGain / returnStrength / closureStability）と
proto-neuron candidate の活性が連動する。

閉ループが安定しているときに、特定の proto-neuron candidate が立ち上がりやすい、など。

### weak path plasticity

反復した流路が少し通りやすくなる。

同じ経路を繰り返し通ることで、その経路の resistance が微妙に下がる。
これは強い学習ではなく、weak な可塑性である。

## 観測の原則

これらの条件を満たしたとき、proto-network 候補として観測される可能性がある。

ただし、以下の原則を守る：

- **observer-side candidate として扱う**: runtime に network node を配置しない
- **proxy として扱う**: 確信ではなく、「このように見える可能性がある」という観測
- **semantic meaning を付与しない**: label / concept / relation を追加しない
- **Node bridge はまだ行わない**: Node-AI-Z / Node Mother との接続はまだしない

## proto-network candidate の導出

proto-network candidate は、以下の観測から導出される：

1. **proto-neuron candidate が複数存在する**
2. **それらの間に co-activation が観測される**
3. **共通の replay co-return がある**
4. **repeated path が形成されている**
5. **closure coupling が見られる**

これらの条件が重なったとき、proto-network candidate として記録する。

ただし、これは runtime dynamics を変更しない。

## proto-network candidate の観測指標

以下の指標を observer-side で導出してよい：

### coActivationClusterCount

同時に活性化する proto-neuron candidate のクラスター数。

### averageCoActivationScore

平均的な共発火スコア。

複数の candidate が同時に立ち上がる頻度・強度。

### repeatedCoActivationCount

繰り返し共発火が観測された回数。

同じ組み合わせの candidate が繰り返し同時に立ち上がる回数。

### strongestCoActivationPair

最も強い共発火ペア。

どの candidate とどの candidate が最も強く共発火しているか。

### replay co-return cluster count

replay 時に同時に戻る trace のクラスター数。

### closure coupling cluster count

closure 指標と連動する candidate のクラスター数。

## S0 での扱い

S0 では、proto-network の runtime 実装は行わない。

S0 の目的は、今後の実装が「ネットワークを作る」命令型設計に進まないよう、
proto-network の定義を docs に固定することである。

S7 以降で、proto-network の観測を段階的に導入する。

## 禁止事項

proto-network の実装・観測において、以下を追加してはならない。

### semantic network を作らない

```javascript
// ❌ 避けるべき実装
if (protoNeuronExists) {
  createSemanticNode();
  addLabel();
  addMeaning();
}
```

### object relation を作らない

```javascript
// ❌ 避けるべき実装
if (coActivation) {
  createObjectRelation();
  addSameObjectDetection();
}
```

### Node bridge で意味化しない

```javascript
// ❌ 避けるべき実装
if (protoNetworkCandidate) {
  sendToNodeMother();
  receiveSemanticFeedback();
}
```

### runtime network node を配置しない

```javascript
// ❌ 避けるべき実装
if (protoNetworkCandidate) {
  createNetworkNode();
  wireConnections();
}
```

## 正しい実装の方向

proto-network は、以下のような観測として実装する：

```javascript
// ✅ 正しい実装
function observeProtoNetworkCandidates(
  protoNeuronCandidates,
  coActivationHistory,
  replayState,
  closureState
) {
  // 観測: 複数の candidate が同時に活性化しているか
  const coActivationClusters = findCoActivationClusters(
    protoNeuronCandidates,
    coActivationHistory
  );

  // 観測: replay 時に複数の trace が同時に戻っているか
  const replayCoReturnClusters = findReplayCoReturnClusters(
    replayState,
    protoNeuronCandidates
  );

  // 観測: closure 指標と連動しているか
  const closureCoupledClusters = findClosureCoupledClusters(
    protoNeuronCandidates,
    closureState
  );

  // observer-side candidate として記録
  return {
    coActivationClusterCount: coActivationClusters.length,
    averageCoActivationScore: computeAverageCoActivationScore(coActivationClusters),
    repeatedCoActivationCount: countRepeatedCoActivations(coActivationHistory),
    strongestCoActivationPair: findStrongestPair(coActivationClusters),
    replayCoReturnClusterCount: replayCoReturnClusters.length,
    closureCouplingClusterCount: closureCoupledClusters.length
  };
}
```

これらは proxy であり、確信ではない。
観測結果を runtime dynamics に強制フィードバックしない。

## proto-network と意味の分離

proto-network は pre-semantic である。

意味を与えるのは Node-AI-Z / Node Mother の役割であり、
AETERNA は意味を先に持たない。

AETERNA は、意味が自然に出てくるかもしれない前提の器として存在する。

## S7 Proto-Network Observation での位置づけ

S7 では proto-network を **観測する**。
S7 では proto-network を **配置しない**。
S7 では Node bridge しない。
S7 では meaning を与えない。

## 関連文書

- `docs/natural-emergence-principles.md` — 自然発生原則
- `docs/world-loop-dynamic-viability.md` — Dynamic Viability の定義
- `docs/emergent-proto-neuron-principles.md` — Proto-Neuron の観測原則
- `docs/body-world-closure-principles.md` — Body-World Closure の基本方針
- `docs/implementation-language-guardrails.md` — 実装言語の禁止事項

## S5: Local Excitability Field の位置づけ

S5 は proto-network の前段として局所 excitability 条件を観測する。

- Local Excitability Field は neuron node の配置ではない
- region は意味ラベルではない (u0-v0 形式の座標識別子)
- S5 では発火させない、path を作らない
- S5 は S6 Path Formation by Repeated Flow の前段である
- S7 Proto-Network の前段として位置づけられる
- proto-neuron / proto-network はまだ S5 では observer candidate のまま
