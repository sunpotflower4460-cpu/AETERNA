# Implementation Language Guardrails

## 目的

この文書は、AETERNA 実装時に誤解を招きやすい言葉を整理し、
命令型・演出型・意味付与型の設計に進まないようにするためのガイドラインである。

## 使ってよい言葉

以下の言葉は、AETERNA の自然発生原則に沿っている。

### 媒質条件を表す言葉

- **flow**: 流れ
- **resistance**: 抵抗
- **dissipation**: 散逸
- **delay**: 遅延
- **attenuation**: 減衰
- **boundary exchange**: 境界交換
- **local coupling**: 局所結合
- **propagation**: 伝播
- **threshold**: 閾値
- **excitability**: 発火性
- **refractory recovery**: 不応期回復
- **trace**: 痕跡
- **residue**: 残留
- **re-entry**: 再入力
- **return mismatch**: 戻り不一致
- **medium response**: 媒質応答
- **viability range**: 生存可能範囲

### 観測を表す言葉

- **observed candidate**: 観測候補
- **observer-side**: 観測側
- **proxy**: 代理指標
- **derived**: 導出値
- **measured**: 計測値
- **fluctuation**: 揺らぎ（結果として生じる）
- **recovery**: 回復（結果として生じる）
- **collapse**: 崩壊（結果として生じる）
- **recurrence**: 再発（結果として生じる）
- **knot**: 節（結果として観測される）
- **path**: 流路（結果として観測される）
- **proto-neuron candidate**: 節候補（observer-side）
- **proto-network candidate**: 流路網候補（observer-side）

## 避ける言葉

以下の言葉は、命令型・演出型・意味付与型の設計を示唆するため、避ける。

### 命令型の言葉

- **揺らがせる**: 揺らぎを直接作ることを示唆する
- **安定させる**: 安定を命令的に実装することを示唆する
- **生き物っぽくする**: 演出を示唆する
- **意思を持たせる**: 意思の直接実装を示唆する
- **欲しがらせる**: 欲求の直接実装を示唆する
- **探索させる**: 探索行動の直接実装を示唆する
- **ニューロンを作る**: neuron node の直接配置を示唆する
- **ネットワークを作る**: network の直接構築を示唆する
- **意味を持たせる**: semantic meaning の直接付与を示唆する
- **感情を出す**: 感情の直接表現を示唆する
- **意識を宿すと主張する**: 意識の証明を示唆する

### 演出型の言葉

- **生命っぽく見せる**: 演出を示唆する
- **有機的な動きを追加する**: 演出を示唆する
- **呼吸を加える**: 演出を示唆する
- **心臓の鼓動を模倣する**: 演出を示唆する
- **夢を演出する**: 演出を示唆する

### 意味付与型の言葉

- **ラベルを付ける**: semantic label の付与を示唆する
- **概念を持つ**: concept の直接実装を示唆する
- **カテゴリを認識する**: category の直接実装を示唆する
- **同一性を判定する**: same-object detection の直接実装を示唆する
- **教師から学ぶ**: teacher binding の直接実装を示唆する
- **言語を理解する**: language meaning の直接実装を示唆する
- **LLM に聞く**: LLM teacher の直接使用を示唆する

## 言い換え例

| 避ける表現 | 推奨される表現 |
|---|---|
| 揺らぎを追加する | 流れ・遅延・抵抗・散逸により揺らぎが生じうる条件を整える |
| 安定化する | 崩壊せず流れ続ける条件を観測する |
| 生命っぽく見せる | 生命的現象が生じうる媒質条件を作る |
| ニューロンを作る | 局所発火性のある節候補を観測する |
| ネットワークを作る | 反復した流路が関係網のように見えるか観測する |
| 探索行動を実装する | 境界・勾配・戻りの条件から外向き作用が漏れるかを見る |
| 欲求を持たせる | エネルギー収支・境界状態・回復条件の偏りを観測する |
| ラベルを付ける | 観測候補として記録する（ラベルは付けない） |
| 意識があると主張する | 閉ループ生命場の成立条件を観測する（意識の証明はしない） |
| 教師から学ぶ | 反復・痕跡・弱い可塑性により流路が少し変化するかを見る |
| LLM で意味を与える | pre-semantic な観測候補として扱う（意味は与えない） |

## S1 Audit 追記（2026-04-27）

S1 Flow/Resistance/Dissipation Audit により、以下の実装パターンが確認され、Natural Emergence Principles に沿っていることが検証されました。

### 避けるべき実装名（S1 確認済み）

以下の関数名・変数名は AETERNA に存在してはならない：

- `addFlicker` / `addFluctuation` — 揺らぎの直接追加
- `makeAlive` / `makeLookAlive` — 生命演出
- `addOrganicMotion` / `organicMotion` — 有機的動き追加
- `forceStabilize` / `stabilize` — 命令型安定化
- `spawnNeuron` / `createNeuron` — ニューロン配置
- `createProtoNetwork` / `buildNetwork` — ネットワーク構築
- `semanticize` / `assignMeaning` — 意味付与
- `addRandomness` / `injectNoise` — ランダムノイズ注入
- `boostActivity` / `suppressAll` — 活動の強制調整

### 推奨する実装名（S1 確認済み）

以下の関数名・変数名が推奨され、実装で使用されている：

- `deriveFlowContinuity` — 流れの連続性導出
- `deriveDissipationBalance` — 散逸バランス導出
- `deriveResistanceProfile` — 抵抗プロファイル導出
- `deriveDelayProfile` — 遅延プロファイル導出
- `deriveBoundaryExchange` — 境界交換導出
- `deriveLocalExcitability` — 局所発火性導出
- `observeCandidate` — 候補観測
- `deriveProtoNeuronCandidates` — proto-neuron 候補導出（observer-side）
- `deriveBodySurfaceState` — body surface 状態導出
- `updateWorldMedium` — world medium 更新（自然減衰含む）
- `deriveSensoryReturn` — sensory return 導出（変化駆動）
- `deriveReafferenceComparison` — reafference 比較導出

## コード例

### ❌ 避けるべきコード

```javascript
// 命令型安定化
if (unstable) {
  stabilize();
}

// 演出的揺らぎ
if (tooQuiet) {
  addFluctuation();
}

// 生命演出
if (notAliveLooking) {
  addOrganicMotion();
}

// ニューロン配置
if (needsNeuron) {
  createNeuron();
}

// 意味付与
if (protoNeuronExists) {
  addLabel("neuron-1");
  addMeaning("visual input");
}

// LLM 使用
if (needsInterpretation) {
  const meaning = await llm.interpret(observation);
}

// 強制候補生成（S1 追記）
if (noCandidates) {
  createCandidate();
}

// 強制パルス生成（S1 追記）
if (quiet) {
  forcePulse();
}

// 揺らぎ注入（S1 追記）
const drift = Math.random() * amplitude;  // 演出的ランダム
```

### ✅ 推奨されるコード

```javascript
// 条件を整え、結果を観測する
function updateMedium(state, dt) {
  // flow + resistance + dissipation
  const propagated = propagate(state.activity, state.coupling);
  const dissipated = applyDissipation(propagated, state.resistance);

  // delay + trace
  const delayed = applyDelay(dissipated, state.delayBuffer);
  const withTrace = leaveTrace(delayed, state.traceState);

  // boundary exchange + re-entry
  const exchanged = boundaryExchange(withTrace, state.boundary);
  const reentrant = reentry(exchanged, state.feedback);

  // 観測: 揺らぎが生じているか（結果として）
  const fluctuationObserved = measureFluctuation(reentrant);

  // 観測: 節候補が見えるか（observer-side）
  const knotCandidates = observeKnots(reentrant, state.traceState);

  return {
    ...state,
    activity: reentrant,
    // observer-side observation
    fluctuationObserved,
    knotCandidates
  };
}

// proto-neuron candidate の観測
function observeProtoNeuronCandidates(state, history) {
  // 条件: excitability / refractory / propagation / trace / recurrence
  const candidates = [];

  for (const region of state.regions) {
    const excitability = computeExcitability(region, history);
    const refractoryPattern = computeRefractoryPattern(region, history);
    const localPropagation = computeLocalPropagation(region, state);
    const traceRetention = computeTraceRetention(region, state.traceState);
    const recurrenceScore = computeRecurrenceScore(region, history);

    // 閾値を超えたら observer-side candidate として記録
    const confidence =
      0.2 * excitability +
      0.2 * refractoryPattern +
      0.2 * localPropagation +
      0.2 * traceRetention +
      0.2 * recurrenceScore;

    if (confidence > 0.4) {
      candidates.push({
        regionId: region.id,
        confidence,  // proxy, not meaning confidence
        excitability,
        refractoryPattern,
        localPropagation,
        traceRetention,
        recurrenceScore,
        // no label, no meaning, no semantic node
      });
    }
  }

  return candidates;  // observer-side, does not modify runtime dynamics
}
```

## コメント・変数名のガイドライン

### ❌ 避けるべきコメント

```javascript
// Make it look alive
// Stabilize the system
// Add consciousness
// Create neurons
// Give it meaning
```

### ✅ 推奨されるコメント

```javascript
// Apply dissipation and resistance
// Observe fluctuation as a result of flow conditions
// Derive proto-neuron candidates (observer-side, no semantic meaning)
// Assess dynamic viability conditions
// Measure flow continuity
```

### ❌ 避けるべき変数名

```javascript
const makeLookAlive = true;
const stabilizeNow = true;
const hasConsciousness = false;
const neuronLabel = "visual";
const meaningAssigned = false;
```

### ✅ 推奨される変数名

```javascript
const flowContinuity = 0.8;
const dissipationRate = 0.1;
const protoNeuronCandidate = { confidence: 0.5 };  // proxy, observer-side
const dynamicViability = assessViability(state);
const observedFluctuation = measureFluctuation(state);
```

## ドキュメント・UI 表示のガイドライン

### ❌ 避けるべき表示

- "AETERNA is conscious"
- "AETERNA has emotions"
- "AETERNA is alive"
- "AETERNA understands meaning"
- "AETERNA created a neuron"

### ✅ 推奨される表示

- "AETERNA: Observed fluctuation (result of flow conditions)"
- "Proto-neuron candidate observed (observer-side, pre-semantic)"
- "Dynamic viability: flow continuity 0.8 (proxy)"
- "Closed-loop scenario: closure stability 0.7 (not consciousness proof)"
- "Body-World Closure: loop gain 0.9 (research metric)"

## 関連文書

- `docs/natural-emergence-principles.md` — 自然発生原則
- `docs/world-loop-dynamic-viability.md` — Dynamic Viability の定義
- `docs/proto-network-natural-observation.md` — Proto-Network Natural Observation
- `docs/emergent-proto-neuron-principles.md` — Proto-Neuron の観測原則
- `docs/agent-guardrails.md` — Agent の実装ガイドライン
