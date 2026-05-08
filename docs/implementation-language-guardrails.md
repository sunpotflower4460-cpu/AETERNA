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
- **boundary mediation**: 境界媒介
- **membrane layer**: 膜層（計算上の境界層）
- **two-sidedness**: 両側性 proxy
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
- **reference comparison**: 参照との観測比較
- **comparison result**: 比較結果
- **diagnostic**: 診断

### エネルギー実在性・保存則を表す言葉

- **ExternalDriveField**: 外部駆動場
- **ExternalDriveInput**: 外部駆動入力
- **WorldMediumField**: 空間を持つ外側媒質場
- **MembraneExchange**: 膜交換
- **LocalFlux**: 局所流束
- **EnergyLedger**: エネルギー収支台帳
- **ConservationResidual**: 保存則残差
- **DissipationField**: 散逸場
- **ResidueField**: 残留場
- **StorageField**: 蓄積場
- **OutflowField**: 流出場
- **local conservation**: 局所保存
- **local exchange**: 局所交換
- **storage**: 蓄積
- **dissipation destination**: 散逸先

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
- **魂の膜にする**: 膜の神秘化を示唆する
- **自己境界として扱う**: 自我・自己認識の直接実装を示唆する

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
- **知性が証明された**: intelligence proof claim を示唆する
- **生命が証明された**: life proof claim を示唆する
- **神秘の証明**: mystical proof claim を示唆する
- **癒しの証明**: healing proof claim を示唆する

### エネルギー系で避ける生命比喩名

- **VitalPulse**: 生命拍を直接実装している印象を与える
- **BreathWave**: 呼吸の模倣を示唆する
- **metabolicCharge**: 代謝を直接持つように見える
- **heartbeatSource**: 心拍源の模倣を示唆する
- **lifeDrive**: 生命衝動を直接実装する印象を与える
- **makeBreathingTorus**: 呼吸するように見せる実装を示唆する
- **life-like baseline oscillator**: 生命的な基底振動を直接作る示唆
- **rhythm coherence booster**: リズム性を望ましい結果として増幅する示唆
- **desired stability pull**: 安定を結果として引き寄せる示唆

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
| 減衰するようにする | 局所散逸先を実装し、結果として減衰するか観測する |
| リズムを作る | 外部駆動・局所交換・境界条件から周期が出るか観測する |
| 外部エネルギーホースを付ける | ExternalDriveField と MembraneExchange の局所経路を定義する |
| 活動が止まるようにする | 供給ゼロ時に保存則と散逸の結果として活動が減るか確認する |
| 生命拍を入れる | PeriodicDrive を、保存則・入出力波形比較の対象として導入する |

## Energy Realness 追記（2026-05-08）

AETERNA の energy / medium / life-field 系では、出力にそれらしい挙動が現れたことを real と扱わない。

ある挙動が real に近いと扱えるのは、その挙動が望ましい結果として直接コード化されておらず、局所的な保存則・交換・蓄積・散逸・境界条件から導出された場合だけである。

### 固定原則

- 結果を書くな。条件を書け。
- 減衰を書くな。散逸先を書け。
- 持続を書くな。供給と散逸の収支から持続するか観測せよ。
- リズムを書くな。外部駆動・媒質・膜・内部場の変換から周期が出るか観測せよ。
- 飽和を書くな。容量・流入・散逸不足の結果として飽和するか観測せよ。
- 何も起きないことも valid observation とする。

### 保存則の最低条件

```text
input = internal accumulation + dissipation + actuation output + residue conversion ± tolerance
```

この関係が閉じない場合、UI や docs では energy flow ではなく derived / proxy / presentation-smoothed / diagnostic として扱う。

### 禁止される実装方向

- global activity decay rate によって全体の活動を望ましい形に落とす
- baseline target に smoothDecay で戻すことを real medium と呼ぶ
- Date.now 由来の sine drift を自然な揺らぎとして扱う
- clamp で消えた超過分を記録しない
- residue decay の消失先を持たない
- 中心 buffer へ externalEnergy を直接加算する
- Pulse / Rhythm / Breath のような生命比喩入力を先に追加する

### 推奨される実装方向

- EnergyLedger を導入する
- conservationResidual を Check-kind metric として観測する
- WorldMedium を将来的に scalar から spatial field へ移行する
- MembraneExchange を局所セル交換として定義する
- Loss / overflow / clamp excess を named field に記録する
- external drive はまず 0 で構造だけ作る
- Flow → Pulse → PeriodicDrive の順で一つずつ検証する

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
- `updateMembraneState` — 膜状態更新（observer-side / config-gated）
- `deriveMembraneObservation` — 膜観測導出（observer-side）
- `deriveLocalExcitability` — 局所発火性導出
- `observeCandidate` — 候補観測
- `deriveProtoNeuronCandidates` — proto-neuron 候補導出（observer-side）
- `deriveBodySurfaceState` — body surface 状態導出
- `updateWorldMedium` — world medium 更新（transitional scalar proxy; not a conserved energy medium）
- `deriveSensoryReturn` — sensory return 導出（変化駆動・derived/proxy）
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

// Energy Realness 違反: 結果を直接書く
if (externalSupply === 0) {
  activity *= 0.99; // supply cutoff result is encoded directly
}

// Energy Realness 違反: 中心 buffer 直接注入
currentBuffer[i] += externalEnergy;
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

// Energy Realness: loss goes somewhere named
function transferWithLedger(input, storageBefore, localDissipation, actuationOut, residueConversion) {
  const storageAfter = storageBefore + input - localDissipation - actuationOut - residueConversion;
  const residual = Math.abs(input - ((storageAfter - storageBefore) + localDissipation + actuationOut + residueConversion));
  return { storageAfter, conservationResidual: residual };
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
// Make it breathe
// Add heartbeat
// Force decay when supply stops
```

### ✅ 推奨されるコメント

```javascript
// Apply dissipation and resistance
// Observe fluctuation as a result of flow conditions
// Derive proto-neuron candidates (observer-side, no semantic meaning)
// Assess dynamic viability conditions
// Measure flow continuity
// Account for local exchange and dissipation
// Report conservation residual as Check-kind diagnostic
```

### ❌ 避けるべき変数名

```javascript
const makeLookAlive = true;
const stabilizeNow = true;
const hasConsciousness = false;
const neuronLabel = "visual";
const meaningAssigned = false;
const vitalPulse = 0.5;
const breathWave = 0.4;
const lifeDrive = 0.8;
```

### ✅ 推奨される変数名

```javascript
const flowContinuity = 0.8;
const dissipationRate = 0.1;
const protoNeuronCandidate = { confidence: 0.5 };  // proxy, observer-side
const dynamicViability = assessViability(state);
const observedFluctuation = measureFluctuation(state);
const externalDriveField = new Float32Array(size);
const localFlux = 0.02;
const conservationResidual = 0.0001;
```

## ドキュメント・UI 表示のガイドライン

### ❌ 避けるべき表示

- "AETERNA is conscious"
- "AETERNA has emotions"
- "AETERNA is alive"
- "AETERNA understands meaning"
- "AETERNA created a neuron"
- "AETERNA is breathing"
- "AETERNA has a heartbeat"
- "Energy is flowing" when conservationResidual is unknown or high

### ✅ 推奨される表示

- "AETERNA: Observed fluctuation (result of flow conditions)"
- "Proto-neuron candidate observed (observer-side, pre-semantic)"
- "Dynamic viability: flow continuity 0.8 (proxy)"
- "Closed-loop scenario: closure stability 0.7 (not consciousness proof)"
- "Body-World Closure: loop gain 0.9 (research metric)"
- "Energy flow is not yet verified. Current values are diagnostic/proxy readings."
- "Conservation residual: Check-kind diagnostic"

## 関連文書

- `docs/natural-emergence-principles.md` — 自然発生原則
- `docs/world-loop-dynamic-viability.md` — Dynamic Viability の定義
- `docs/proto-network-natural-observation.md` — Proto-Network Natural Observation
- `docs/emergent-proto-neuron-principles.md` — Proto-Neuron の観測原則
- `docs/energy-realness-principles.md` — Energy Realness 原則
- `docs/energy-reality-audit.md` — Energy Reality Audit
- `docs/agent-guardrails.md` — Agent の実装ガイドライン

## S3 Minimal Natural Feedback 追記（2026-04-27）

S3 では feedback を導入しても、語彙は依然として命令型に寄せない。

### 避けるべき実装名（S3 追加）

- `forceImmediateReturn` — 遅延を命令で潰す
- `reopenLoop` — loop を命令的に再開する
- `forceBoundaryOpen` / `forceBoundaryClose` — 境界を command で開閉する
- `resetWorld` — world の強制リセット
- `cutFeedback` / `suppressFeedback` — feedback の強制遮断
- `boostProtoNeuron` — proto-neuron 候補への直接 boost

### 推奨する実装名（S3 追加）

- `deriveMinimalNaturalFeedback` — minimal natural feedback 導出
- `applyMinimalNaturalFeedback` — weak condition adjustment 適用
- `feedbackDominanceRisk` — feedback 支配リスクの observer proxy

## S4 Medium Profile 追記（2026-04-28）

S4 では delay / echo / resistance を observer-side profile として記録する。

### 避けるべき実装名（S4 追加）

- `fixDelayNow` / `shortenDelay` — delay を command で改善する示唆
- `boostEcho` / `preserveEcho` — echo を演出的に増やす示唆
- `reduceResistanceNow` / `openBoundaryNow` — resistance を命令で下げる示唆
- `forceMediumBalance` — balance を命令値にする示唆
- `stabilizeMedium` — command-style stabilization

### 推奨する実装名（S4 追加）

- `deriveDelayProfile` — delay profile 導出
- `deriveEchoProfile` — echo profile 導出
- `deriveResistanceProfile` — resistance profile 導出
- `deriveMediumProfileState` — combined medium profile 導出
- `unstableDelayScore` / `echoSaturationRisk` / `mediumAbsorption` — observer proxy

### 表示ガイド

- `Medium Profile / Delay-Echo-Resistance`
- `Measured / Derived / Proxy`
- `research / diagnostic`

以下の表示は避ける:

- `natural fluctuation`
- `life feeling`
- `the system wants to stabilize`
- `self-adjusting consciousness`

### 避ける説明

- `stabilization command`
- `will`
- `desire`
- `intentional reopening`
- `self-protection decision`

## S5: Local Excitability Field の言語ガードレール

### 禁止される表現

| 禁止 | 理由 |
|------|------|
| `neuronNode` | S5 は neuron 配置ではない |
| `fireNeuron()` | S5 は発火させない |
| `cat-region`, `memory-region`, `sadness-region` | regionId は意味ラベルではない |
| `semantic excitability` | 意味は持たない |
| `consciousness field` | 意識主張は禁止 |
| `if (thresholdProximity > 0.8) fireNeuron()` | S5 では発火させない |
| `path.formation` | S6 以降のみ |
| `proto-network` | S7 以降のみ |

### 推奨される表現

| 推奨 | 説明 |
|------|------|
| `Local Excitability Field` | field profile の正式名称 |
| `pre-neural field profile` | semantics 未形成の旨を明示 |
| `region u0-v0` | 座標識別子を使う |
| `excitability condition` | 条件を観測する表現 |
| `threshold proximity` | 閾値近接度 (命令ではない) |
| `recovery progress` | 回復の進行度 |
| `refractory depth` | 不応期の深さ |

### 表示ガイド

- `Local Excitability Field / pre-neural field profile`
- `Measured / Derived / Proxy`
- `research / diagnostic`
- `regionId` は `u\d+-v\d+` 形式

以下の表示は避ける:

- `neuron`, `brain node`, `meaning`, `memory region`
- `firing`, `activated neuron`, `neural candidate`
- `consciousness`, `self-awareness`, `life feeling`

---

## S6 Repeated Flow Path 言語ガイドライン (Path Formation by Repeated Flow)

### 避ける名前

| 禁止名 | 理由 |
|--------|------|
| `createPath` | path を先に作らない |
| `buildPath` | path を先に作らない |
| `createRelation` | semantic relation ではない |
| `learnRoute` | 学習させない |
| `memoryPath` | 記憶経路ではない |
| `semanticPath` | 意味経路ではない |
| `strengthenEdge` | edge weight 強化は行わない |
| `relation`, `edge`, `link` | runtime グラフ要素ではない |
| `memory`, `learned`, `known route` | 意味的記憶ではない |

### 推奨される表現

| 推奨 | 説明 |
|------|------|
| `observeRepeatedFlow` | 繰り返し流れを観測する |
| `deriveRepeatedFlowPaths` | 繰り返し流路候補を導出する |
| `derivePathCandidate` | 流路候補を導出する |
| `observePathResidue` | 流路の痕跡を観測する |
| `deriveFlowRecurrence` | 流れの再発を導出する |
| `repeated flow residue` | 繰り返しの流れの痕跡 |
| `replay co-return` | replay 的な共返り |
| `weak path reactivation` | 弱い経路再活性 |
| `observed path affinity` | 観測された経路親和性 |
| `pre-semantic path observation` | 意味以前の経路観測 |
| `Repeated Flow Path Candidate` | 正式名称 |

### 表示ガイド

- `Repeated Flow Path Candidate / pre-semantic path observation`
- `Measured / Derived / Proxy`
- `research / diagnostic`
- fromRegionId / toRegionId は座標識別子 (`u\d+-v\d+` 形式)
- `relation` `meaning link` `memory path` と表示しない

## S7: Proto-Network Candidate Language Guardrails

### 避ける名前 (Avoid)

- `createNetwork`
- `buildNetwork`
- `createGraph`
- `buildGraph`
- `createRelationGraph`
- `semanticNetwork`
- `knowledgeGraph`
- `memoryGraph`
- `strengthenNetworkEdge`
- `promoteToNode`
- `addEdge`
- `networkEdge`
- `relationEdge`

### 推奨名 (Recommended)

- `observeProtoNetworkCandidates`
- `deriveProtoNetworkCandidates`
- `observeNetworkLikePattern`
- `deriveCoActivationGroup`
- `deriveRepeatedPathGroup`
- `observeReplayCoReturn`

## S8 Scenario Name Guardrail

S8 scenario names (e.g., `S8-A-quiet-world`, `S8-B-weak-repeated-return`) are **research labels only**. They describe the simulated world-medium condition, not a semantic state, cognitive state, or life state of AETERNA.

Prohibited interpretations:
- Do NOT interpret scenario names as semantic descriptions of AETERNA's "experience"
- Do NOT use scenario names as object identifiers or meaning labels
- Do NOT associate scenario outcomes with consciousness, self-awareness, or intelligence claims

`formatLongRunEmergenceScenarioSummary` displays output as "Long-Run Natural Emergence Summary" — research/diagnostic output only.

---

## N-Series Claim Guard / Language Guardrails

N-Series では geometry / phase / membrane / observed ratio を導入しても、そこから意味・感情・意識の主張へ飛ばない。

### 禁止される表現

| 禁止 | 理由 |
|---|---|
| `curvature makes consciousness` | 曲率から意識を直接主張しない |
| `phase means emotion` | 位相を感情ラベルにしない |
| `vortex is self` | 渦候補を self と同一視しない |
| `vortex is mind` | 渦候補を心と同一視しない |
| `membrane is soul boundary` | boundary / membrane を魂の比喩にしない |
| `phi proves mystery` | φ を神秘の証明に使わない |
| `schumann proves life` | シューマン共振を生命証明に使わない |
| `complex field is yin-yang` | complex field を形而上学ラベルにしない |
| `曲率が意識を生む` | 禁止 |
| `位相は感情である` | 禁止 |
| `渦は自我である` | 禁止 |
| `渦は心である` | 禁止 |
| `膜は魂の境界である` | 禁止 |
| `φ が神秘を証明する` | 禁止 |
| `シューマン共振が生命を証明する` | 禁止 |
| `複素場は陰陽そのものである` | 禁止 |

### 推奨される表現

| 推奨 | 説明 |
|---|---|
| `curvature-aware dynamics` | 曲率を含む dynamics として記述する |
| `phase field` | 位相を物理/数理用語として扱う |
| `vortex candidate` | 渦候補を observer-side に保つ |
| `topological defect candidate` | 位相欠陥候補として記述する |
| `mediating membrane layer` | 境界媒介層として記述する |
| `observed ratio` | 観測された比として扱う |
| `reference ratio distance` | 参照比からの距離として扱う |

### 表示ガイド

- geometry, phase, vortex, membrane は **measured / derived / proxy** のいずれかとして表示する
- `consciousness`, `emotion`, `soul`, `mystery proof` のような表現に接続しない
- complex field を導入しても semantic node / same-object / teacher binding へ拡張しない

## N6: External Constants Removal / Observed Ratios 言語ガイドライン

### 禁止表現 (N6)

以下の表現は絶対に使用しないこと:

| 禁止表現 | 理由 |
|---|---|
| `φ proves life` / `φ が生命を証明する` | 観測比率の一致は因果証明ではない |
| `Schumann proves consciousness` / `シューマン共振が意識を証明する` | 観測比率の一致は因果証明ではない |
| `432Hz proves healing` / `432Hz が癒しを証明する` | 観測比率の一致は因果証明ではない |
| `golden ratio means intelligence` / `黄金比は知性を意味する` | 比率一致は意味づけではない |
| `emergent resonance proves soul` / `創発的共鳴が魂を証明する` | 創発共鳴 proxy は証明ではない |
| `reference match proves anything` | 参照比率との一致は観測比較のみ |

### 推奨表現 (N6)

| 推奨表現 | 説明 |
|---|---|
| `observed ratio is close to reference ratio` | 観測比率が参照比率に近い |
| `reference match observed` | 参照値との近接を観測 |
| `observer-side comparison` | observer-side の比較 |
| `not used as causal ingredient` | 因果成分としては使われていない |
| `neutral core dynamics` | neutral core dynamics |
| `legacy comparison mode` | legacy モードは比較用のみ |

### 設計原則 (N6)

1. `referenceRatios.ts` は observer 側のみ。`dynamicCore.ts` から import しない。
2. `observedRatio` の値を runtime dynamics に戻さない。
3. `matchStrength` が高くても「証明」として扱わない。
4. `emergentResonanceProxy` は similarity proxy のみ。
5. legacy mode は before/after comparison 用のみ。production default にしない。
6. neutral mode が production default。
