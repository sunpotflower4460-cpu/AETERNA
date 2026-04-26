# Current Roadmap

- PR1 repo hygiene
- PR2 baseline
- PR3 local prediction
- PR4 touch prediction error
- PR5 bridge
- PR6 metrics/tests
- PR7 touch pattern
- PR8-B proto-meaning bridge
- PR8-A structured prior rewrite
- PR9-A mode
- PR10-C state architecture
- PR11 minimal survival + action loop

## Phase 1: 持続する生命場の再確認と安定化

**目的**: AETERNAが外部刺激なしでも消えずに動き続ける生命場として成立しているかを確認し、必要なら最小修正で安定化する。

**位置づけ**: 意味形成・proto-point・Node bridge より前に、ongoingness (持続性) を最優先とする段階。

**Phase 1 の完了条件**:
- no-input 長時間シナリオ (5000 tick 以上) がある
- collapse しないことを確認できる (collapseRate < 5%)
- saturation しないことを確認できる (saturationRate < 2%)
- ongoingness 指標が整理されている
- quiet baseline floor が確認または安定化されている
- observer / scenario / docs に反映されている
- build が通る
- organism core の意味を壊していない

**優先方針**:
- no behavior break
- semantic 機能を足さない
- baseline を派手にしすぎない
- quiet 時の消失と long-run の暴走を避ける
- observer は研究用であり、本体因果を壊さない

## W-Series: Body-World Closure Phases

AETERNA を「内側で生きるトーラス場」から「世界と閉じて呼吸するトーラス生命場」へ進めるための段階。
意味形成は行わない。proto-neuron は自然発生する観測候補として扱う。

| Phase | 内容 | 状態 |
|---|---|---|
| **W0** | Body-World Closure 原則固定 | ✅ 完了（docs のみ） |
| **W1** | Body Surface 導入 | 未着手 |
| **W2** | Actuation Pulse 導入 | 未着手 |
| **W3** | Simulated World Medium 導入 | 未着手 |
| **W4** | Sensory Return 導入 | 未着手 |
| **W5** | Reafference Comparison 導入 | 未着手 |
| **W6** | Body-World Closure Metrics | 未着手 |
| **W7** | Emergent Proto-Neuron Observation | ✅ observer-side candidate observation |
| **W8** | Closed-Loop Scenario Tests | 未着手 |

### W0 完了条件

- body-world-closure-principles.md がある ✅
- emergent-proto-neuron-principles.md がある ✅
- world-medium-spec.md / actuation-pulse-spec.md / reafference-comparison-spec.md / body-world-closure-metrics.md がある ✅
- roadmap に W0〜W8 が追記されている ✅
- AETERNA は意味ノードを先に持たないことが明記されている ✅
- proto-neuron は自然発生する観測候補であると明記されている ✅
- runtime 挙動を変えていない ✅

---

## Phase 2: 外乱受容と prediction mismatch の純化

**目的**: 入力を生命場を開始するトリガーではなく、すでに流れている場を乱す perturbation として整理し、prediction mismatch を state-dependent に立てられるようにする。

**Phase 2 の完了条件**:
- PerturbationEvent 型がある
- PredictionMismatchState 型がある
- perturbation 導出 helper がある
- mismatch 導出 helper がある
- same touch, different state の最小差が確認できる
- scenario / observer / metrics / docs に反映されている
- build が通る
- organism core の意味を壊していない

**優先方針**:
- no behavior break
- touch pipeline を全面置換しない
- input は ongoing baseline に重なる perturbation
- mismatch は state-dependent
- semantic interpretation に進まない


### W7 完了条件

- `ProtoNeuronCandidate` / `ProtoNeuronObservationState` がある
- `deriveProtoNeuronCandidates` がある
- excitability / refractory / propagation / trace / recurrence / co-activation / weak plasticity / closure coupling が導出される
- observer / metrics / scenario summary に proto-neuron 観測が反映される
- semantic leak test がある
- runtime neuron node を配置していない
- Node bridge を本格実装していない
