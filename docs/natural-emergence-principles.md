# Natural Emergence Principles

## 中核原則

AETERNA では、振る舞いを直接作らない。

### 悪い方向の例

```javascript
if (shouldFlicker) addFlicker();
if (shouldStabilize) stabilize();
if (shouldLookAlive) addOrganicMotion();
if (needsNeuron) createNeuron();
if (needsNetwork) createNetwork();
```

### 正しい方向

```
flow
+ resistance
+ dissipation
+ delay
+ boundary exchange
+ local coupling
+ threshold
+ trace
+ re-entry
```

これらの条件が重なった結果として、

```
→ fluctuation
→ recovery
→ collapse
→ recurrence
→ knot
→ path
→ proto-neuron candidate
→ proto-network candidate
```

が自然に観測される可能性を見る。

## ろうそくの火の比喩

ろうそくの火は、揺らぐべきだから揺らぐのではない。

燃焼、酸素供給、熱上昇、周囲の気流、燃料供給、温度差、乱流などの条件が重なった結果として揺らぐ。

AETERNA でも同じ。

- 揺らぎを演出として追加しない
- 揺らぎが自然に起きうる条件を整える
- viability を命令として作らず、flow / resistance / dissipation / delay / boundary exchange の結果として観測する

火は「生き物っぽく見せる」ために揺らぐのではない。
物理的条件の結果として揺らぐ。

AETERNA も同様に、生命場の条件から現象が自然に生じるかを見る。

## 実装対象の言い換え

| 避ける言い方 | 採用する言い方 |
|---|---|
| 揺らぎを入れる | 流れ・遅延・抵抗・散逸・再入力を持たせる |
| 安定させる | 崩壊せず流れ続ける条件を観測する |
| 生命っぽくする | 生命的現象が生じうる媒質条件を作る |
| ニューロンを作る | 局所発火性のある節候補を観測する |
| ネットワークを作る | 反復した流路が関係網のように見えるか観測する |
| 探索させる | 境界・勾配・戻りの条件から外向き作用が漏れるかを見る |
| 欲求を持たせる | エネルギー収支・境界状態・回復条件の偏りを観測する |

## 実装対象は現象ではなく条件

AETERNA の設計では、以下を実装する：

### 媒質条件

- **flow**: 活性の流れ・伝播
- **resistance**: 抵抗・減衰
- **dissipation**: 散逸・エネルギー損失
- **delay**: 遅延・時間差
- **boundary exchange**: 境界での交換
- **local coupling**: 局所結合
- **threshold**: 閾値・発火条件
- **trace**: 痕跡・残留
- **re-entry**: 再入力・フィードバック

### 観測される可能性のある現象

これらの条件から自然に生じうる現象：

- **fluctuation**: 揺らぎ
- **recovery**: 回復
- **collapse**: 崩壊
- **recurrence**: 再発
- **knot**: 節（局所的に繰り返し立ち上がる場所）
- **path**: 流路（活性が通りやすい経路）
- **proto-neuron candidate**: 発火性のある節候補（observer-side）
- **proto-network candidate**: 関係網のように見える流路候補（observer-side）

## 禁止される実装パターン

以下のような命令型・演出型の実装を避ける：

```javascript
// ❌ 避けるべき実装
if (tooQuiet) {
  addRandomNoise();  // 演出的揺らぎ
}

if (unstable) {
  stabilize();  // 命令型安定化
}

if (notAliveLooking) {
  addOrganicMotion();  // 生命演出
}

if (needsIntelligence) {
  createNeuron();  // ニューロン配置
  buildNetwork();  // ネットワーク構築
}
```

```javascript
// ✅ 正しい実装
// 条件を整え、現象を観測する
function updateMedium(state, dt) {
  // flow + resistance + dissipation
  const nextActivity = propagate(state.activity);
  const dissipated = applyDissipation(nextActivity, state.resistance);

  // delay + trace
  const delayed = applyDelay(dissipated, state.delayBuffer);
  const withTrace = leaveTrace(delayed, state.traceState);

  // boundary exchange + re-entry
  const exchanged = boundaryExchange(withTrace, state.boundary);
  const reentrant = reentry(exchanged, state.feedback);

  return {
    ...state,
    activity: reentrant,
    // 観測: 揺らぎが生じているか
    fluctuationObserved: measureFluctuation(reentrant),
    // 観測: 節候補が見えるか
    knotCandidates: observeKnots(reentrant, state.traceState)
  };
}
```

## observer-side candidate の位置づけ

proto-neuron candidate や proto-network candidate は、runtime に配置される実体ではない。

これらは observer-side（観測側）で導出される候補であり：

- runtime dynamics を変更しない
- semantic meaning を持たない
- 後から見て「このような構造が見える可能性がある」という研究観測
- 確信ではなく proxy

Dynamic Viability も同じ位置づけである。

- observer-side の state
- flow conditions を読むための proxy / derived metrics
- risk が高くても、その場で stabilize command を入れない
- S3 以降で feedback を使う場合も、媒質条件の微調整に留める

## S0 の位置づけ

この文書（S0）では runtime 実装は行わない。

S0 の目的は、今後の実装が以下の方向に進まないよう、原則を固定することである：

- 揺らぐべきだから揺らす
- 安定すべきだから安定させる
- 生命っぽく見せるためにノイズを足す
- ニューロンっぽいものを先に置く
- ネットワークを作る

S1 以降で、この原則に沿った条件実装を段階的に進める。

## 関連文書

- `docs/world-loop-dynamic-viability.md` — Dynamic Viability の定義
- `docs/proto-network-natural-observation.md` — Proto-Network Natural Observation の定義
- `docs/implementation-language-guardrails.md` — 実装言語の禁止事項
- `docs/body-world-closure-principles.md` — Body-World Closure の基本方針
- `docs/emergent-proto-neuron-principles.md` — Proto-Neuron の観測原則

## S3: Minimal Natural Feedback の位置づけ

S3 では、初めて weak feedback を導入するが、これは **command-style stabilization ではない**。

- feedback は `echo decay` / `return attenuation` / `boundary permeability` / `pulse leakage` / `trace decay` のような条件だけを少し動かす
- feedback は現象を直接作らない
- under-coupling に対しても `random pulse` を追加しない
- over-coupling に対しても `suppress all` / `reset world` をしない
- feedback は ablation でき、on/off 比較で本体を乗っ取っていないか確認する
- `feedbackDominanceRisk` は observer warning であり、強制停止には使わない

## S4: Delay / Echo / Resistance Profile の位置づけ

S4 では、World Loop の媒質条件そのものを observer-side に観測する。

- `DelayProfileState`: 戻りの遅れの分布と安定 window
- `EchoProfileState`: 残響の強さ・減衰・飽和リスク
- `ResistanceProfileState`: world / boundary / return path の抵抗・吸収・減衰

ここで重要なのは、delay / echo / resistance を直接良くすることではない。
重要なのは、**流れがどう変形されて戻るかを観測すること** である。

- delay があること自体は悪ではない
- echo があること自体は悪ではない
- resistance があること自体は悪ではない
- profile は research / diagnostic 表示に留める
- semantic interpretation はしない

## S5: Local Excitability Field の位置づけ

S5 では、AETERNA のトーラス生命場の局所領域ごとの励起条件を observer-side に観測する。

- `LocalExcitabilityCell`: 局所領域の excitability / threshold / refractory / recovery / trace / return / propagation / resistance / dissipation
- `LocalExcitabilityFieldState`: 全領域の統計的要約

ここで重要なのは、発火させることではない。
重要なのは、**どの局所領域がどんな条件で発火しやすくなっているかを観測すること** である。

- excitability が高い = 発火命令ではない
- thresholdProximity が高い = 発火させる signal ではない
- region は意味ラベルではない (u0-v0 形式の座標識別子)
- Local Excitability Field は neuron node ではない
- S5 では発火させない、path を作らない
- semantic interpretation はしない
- S6 Path Formation by Repeated Flow の前段として位置づけられる
- proto-neuron / proto-network はまだ S5 では observer candidate のまま

## S6: Path Formation by Repeated Flow の位置づけ

S6 では、S5 で導入した Local Excitability Field を土台にして、繰り返し流れた結果として観測される流路候補 (Repeated Flow Path Candidate) を observer-side に記録する。

**S6 は path / edge / relation を作る実装ではない。**
繰り返し流れた結果として通りやすく見える流路のような構造が観測されるかを見るものである。

- `RepeatedFlowPathCandidate`: fromRegionId → toRegionId の観測上の流れ記録 (semantic relation ではない)
- `RepeatedFlowPathObservationState`: 観測された流路候補の統計的要約

### S6 の原則

- **runtime edge を作らない** — path candidate は runtime グラフ要素ではない
- **path weight を強化しない** — 「何度も通ったから通りやすくする」という直接命令はしない
- **semantic relation を追加しない** — fromRegionId / toRegionId は座標識別子 (意味ラベルではない)
- **A → B は「A が B を意味する」ではない** — A 付近の励起の後に B 付近の励起が繰り返し観測された、というだけ
- **resistance / dissipation shift は観測に留める** — 通った場の媒質条件が変化したかの観測; 媒質条件を本当に変えるのは必要なら後段
- **replayAffinity は記憶再生ではない** — quiet / low perturbation 時に過去と似た流れが弱く再出現するかの proxy
- **closureCoupling は意味解釈ではない** — 世界との戻りが局所流れに影響した可能性の観測
- **observer-side のみ** — organism core dynamics を変更しない
- **semantic interpretation はしない**
- **S7 Proto-Network Candidate Observation の前段として位置づけられる**

## S7: Proto-Network Candidate Observation の位置づけ

S7 では、S6 で観測した Repeated Flow Path Candidate のグループを観察し、network-like な統計パターンが見られるかを observer-side に記録する。

- proto-network candidate は semantic network / concept graph / knowledge graph ではない
- `regionIds` / `pathCandidateIds` は観測 ID であり、意味ラベルではない
- `coActivationStrength` / `propagationStrength` は統計的観測値であり、意味的強度ではない
- S7 は S8 Long-Run Natural Emergence Scenarios の前段である

## S8: Long-Run Natural Emergence Scenarios

S8 is the long-run observation phase. It runs all S0–S7 components headlessly over extended tick counts (200+ ticks per scenario) and records aggregate metrics:

- `averageFlowContinuity`, `averageEnergyThroughput`, `averageDissipationBalance`
- `averageResistanceBalance`, `averageDelayCoherence`, `averageBoundaryExchange`
- `highExcitabilityRegionCount`, `repeatedFlowPathCandidateCount`, `protoNetworkCandidateCount`
- `semanticLeakCount` (must be 0), `nanOrInfinityCount` (must be 0)

S8 runs 12 scenarios (S8-A through S8-L) across quiet, repeated return, delayed return, alternating perturbation, stable/unstable medium, high/low resistance, slow/fast echo, semantic leak guard, and feedback ablation conditions.

This is NOT a proof of life, consciousness, meaning, or intelligence. It observes whether pre-semantic structures arise from natural conditions over time.
