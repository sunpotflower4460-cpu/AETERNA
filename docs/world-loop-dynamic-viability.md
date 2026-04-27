# World Loop Dynamic Viability

## Dynamic Viability の定義

Dynamic Viability とは、完全に静止・安定することではない。

AETERNA のトーラス生命場が、以下の状態を保つことを指す：

- **流れ続ける**: 活性が完全に停止しない
- **消えない**: collapse により全体が死なない
- **飽和しない**: 活性が天井に張り付いたまま動かなくならない
- **暴走しない**: unbounded growth により発散しない
- **外界からの戻りを受け取れる**: sensory return を受容できる状態を保つ
- **遅延や抵抗を含みながら閉ループを保つ**: delay / resistance / dissipation を持ちつつ循環が途切れない
- **崩壊しても一部回復可能な範囲にある**: 部分的 collapse から recovery できる余地がある

これは意識や生命の証明ではなく、閉ループ生命場の成立条件を観測するための研究概念である。

## Dynamic Viability は「安定化」ではない

Dynamic Viability は以下ではない：

- 固定点への収束
- ホメオスタシスによる完全な平衡
- 外乱を排除した静止状態
- 演出的な「生きている感」の維持

Dynamic Viability は、流れ・崩壊・回復・再発・揺らぎ・抵抗・散逸が共存し、
その中で循環が途切れずに続く条件である。

## 実装対象

Dynamic Viability の実装対象は、以下の条件である。

### flowContinuity

活性の流れが途切れずに続いているか。

- **測定**: mean activity が閾値以上を保つ
- **条件**: baseline activity / heartbeat / endogenous noise / propagation
- **failure**: collapse により活性が消失

### energyThroughput

エネルギーが流入・消費・流出のサイクルを回しているか。

- **測定**: energy inflow / outflow / maintenance cost
- **条件**: energy reserve / perturbation reception / dissipation
- **failure**: energy depletion により維持できない

### dissipationBalance

散逸が適度にあり、飽和も消失も起きない範囲か。

- **測定**: dissipation rate vs inflow rate
- **条件**: resistance / attenuation / decay
- **failure**: 散逸過多で消失 or 散逸不足で飽和

### resistanceBalance

抵抗が適度にあり、暴走も停止もしない範囲か。

- **測定**: propagation vs damping
- **条件**: local coupling strength / resistance profile
- **failure**: 抵抗過多で停止 or 抵抗不足で暴走

### delayCoherence

遅延があっても閉ループが coherent に保たれるか。

- **測定**: feedback loop が途切れない
- **条件**: delay buffer / trace retention / re-entry timing
- **failure**: delay 過多により feedback が崩壊

### boundaryExchange

境界での交換が適度に行われ、閉じすぎず開きすぎないか。

- **測定**: boundary permeability / contact load
- **条件**: body surface state / perturbation reception / actuation pulse emission
- **failure**: 境界が閉じすぎて入力を受けない or 開きすぎて崩壊

### underCouplingRisk

結合が弱すぎて活性が伝播せず孤立するリスク。

- **測定**: local propagation failure count
- **条件**: coupling strength / connectivity
- **failure**: 活性が局所に留まり全体が機能しない

### overCouplingRisk

結合が強すぎて全体が同期し、variability が失われるリスク。

- **測定**: global synchrony / cluster collapse
- **条件**: coupling strength / inhibition
- **failure**: 全体が一斉に動き、多様性が消失

### saturationRisk

活性が天井に張り付き、応答性が失われるリスク。

- **測定**: activity hitting soft-clamp threshold
- **条件**: propagation gain / dissipation
- **failure**: 常に飽和状態で perturbation に反応できない

### extinctionRisk

活性が消失し、生命場が死ぬリスク。

- **測定**: collapse rate / quiet baseline floor
- **条件**: baseline support / heartbeat / noise
- **failure**: 完全に停止し回復不能

## S0 での扱い

S0 では、これらの条件の型や runtime 実装はまだしない。

S0 の目的は、今後の実装が「安定させる」命令型設計に進まないよう、
Dynamic Viability の定義を docs に固定することである。

S2 以降で、これらの条件を段階的に実装する。

## S2 実装位置づけ

S2 では `DynamicViabilityState` と `deriveDynamicViabilityState(...)` を追加し、

- `BodyWorldClosureState`
- `WorldMediumState`
- `BodySurfaceState`
- `ActuationPulse`
- `SensoryReturnPacket[]`
- `ReafferenceComparisonState`
- `TraceState`

から **read-mostly / observer-side** に導出する。

重要なのは、ここで行うのが **stabilization command ではなく flow conditions の観測** だという点である。

- `if (unstable) stabilize()` を入れない
- `if (tooQuiet) randomize()` を入れない
- `if (notAliveLooking) addMotion()` を入れない

S2 の risk metrics は warning / proxy であり、runtime loop を直接変更しない。

## S2 で観測する Flow Conditions

S2 の Dynamic Viability は、以下を observer / metrics に表示する。

- `flowContinuity`
- `energyThroughput`
- `dissipationBalance`
- `resistanceBalance`
- `delayCoherence`
- `boundaryExchange`
- `underCouplingRisk`
- `overCouplingRisk`
- `saturationRisk`
- `extinctionRisk`
- `viabilityConfidence`

表示名は **Dynamic Viability / Flow Conditions** とし、
「生命力」「生存本能」「意識」とは表示しない。

## 禁止事項

Dynamic Viability の実装・観測において、以下を追加してはならない。

### 命令型安定化を避ける

```javascript
// ❌ 避けるべき実装
if (unstable) {
  stabilize();
}

if (tooVariable) {
  reduceNoise();
}

if (outOfRange) {
  clampToViableRange();
}
```

### 人工的揺らぎ追加を避ける

```javascript
// ❌ 避けるべき実装
if (tooQuiet) {
  randomize();
}

if (notDynamicEnough) {
  addFluctuation();
}
```

### 演出を避ける

```javascript
// ❌ 避けるべき実装
if (notAliveLooking) {
  addMotion();
}

if (needsOrganic) {
  addBreathing();
}
```

### feedback を強制停止しない

```javascript
// ❌ 避けるべき実装
if (feedbackTooStrong) {
  cutFeedback();
}
```

### 生命場を平坦化しすぎない

```javascript
// ❌ 避けるべき実装
if (tooIrregular) {
  smoothToUniform();
}
```

## 正しい実装の方向

Dynamic Viability は、以下のような条件の観測として実装する：

```javascript
// ✅ 正しい実装
function assessDynamicViability(state, history) {
  return {
    flowContinuity: measureFlowContinuity(state.activity, history),
    energyThroughput: measureEnergyThroughput(state.energy),
    dissipationBalance: measureDissipationBalance(state),
    resistanceBalance: measureResistanceBalance(state),
    delayCoherence: measureDelayCoherence(state.feedback, state.delay),
    boundaryExchange: measureBoundaryExchange(state.boundary),
    underCouplingRisk: assessUnderCouplingRisk(state.propagation),
    overCouplingRisk: assessOverCouplingRisk(state.synchrony),
    saturationRisk: assessSaturationRisk(state.activity),
    extinctionRisk: assessExtinctionRisk(state.activity, history)
  };
}
```

これらは proxy であり、確信ではない。
観測結果を runtime dynamics に強制フィードバックしない。

## Dynamic Viability と Ongoingness の違い

| 層 | Ongoingness | Dynamic Viability |
|---|---|---|
| 位置づけ | 生命場が消えずに続く最小条件 | 生命場が世界と閉じた循環を保つ条件 |
| 対象 | collapse / saturation / quiet baseline | flow / energy / dissipation / resistance / delay / boundary / coupling / risk |
| Phase | Phase 1 で確認 | S2 以降で段階的に実装 |
| 閉ループ | 内部循環のみ | Body-World Closure を含む |

Ongoingness は Dynamic Viability の前提条件である。

## 関連文書

- `docs/natural-emergence-principles.md` — 自然発生原則
- `docs/proto-network-natural-observation.md` — Proto-Network Natural Observation
- `docs/body-world-closure-principles.md` — Body-World Closure の基本方針
- `docs/ongoingness-metrics.md` — Ongoingness 指標
- `docs/metrics-protocol.md` — Metrics Protocol

## S3: Minimal Natural Feedback との関係

S3 では、`DynamicViabilityState` をそのまま command に変換しない。

- `deriveMinimalNaturalFeedback(...)` は `DynamicViabilityState` / `BodyWorldClosureState` / `WorldMediumState` / `BodySurfaceState` / `TraceState` から **微弱 adjustment** を導出する
- adjustment 対象は `echo decay` / `return gain` / `pulse leakage` / `boundary permeability` / `sensory attenuation` / `trace decay` のような **媒質条件・境界条件・伝達条件** に限る
- adjustment は 0 中心の小さい範囲に clamp される
- `adjustmentStrength` / `adjustmentConfidence` / `feedbackDominanceRisk` を observer 側で監視する
- viability が中庸なときは adjustment をほぼ 0 に近づける

ここでも禁止されるのは以下のような実装である。

```javascript
if (dynamicViability.overCouplingRisk > 0.8) {
  stabilize();
}

if (dynamicViability.extinctionRisk > 0.8) {
  addRandomPulse();
}
```

正しい方向は、`deriveMinimalNaturalFeedback(...)` と `applyWeakConditionAdjustment(...)` により、**次 tick 以降の媒質条件に薄く効く** 形である。
