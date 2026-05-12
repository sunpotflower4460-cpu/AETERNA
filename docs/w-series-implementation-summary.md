# W-Series Implementation Summary

> このドキュメントは W-Series (Body-World Closure) の現状を一覧する。`docs/current-roadmap.md` の status marker と合わせて読む。

## 経緯

`docs/current-roadmap.md` の W-Series テーブルでは W1-W6 が `未着手` と書かれていたが、これは **stale marker** だった。実際には W1-W6 のすべての型・deriver・behavioral test が既に実装され、`closedLoopScenario.ts` (W8) で W1 → W7 ループが連結して走っている。

D-full ミニプラン (`/root/.claude/plans/warm-sparking-lark.md`) の D1 で status を `✅ 完了` に更新し、本ドキュメントが実装の所在を示す。

## W1 — Body Surface

| | |
|---|---|
| 型 | `src/types/bodySurfaceState.ts` |
| Deriver | `src/body/deriveBodySurfaceState.ts` |
| Feedback | `src/body/applyBodySurfaceFeedback.ts` |
| Test | `src/tests/behavioral/bodySurfaceState.test.ts` |
| 主要 field | `boundaryIntegrity`, `surfaceSensitivity`, `permeability`, `contactReadiness`, `outputReadiness`, `localIrritability`, `recoveryShielding` |

身体表層 (Body Surface) は膜 (Membrane) とは別の boundary-side 層として、W2 Actuation Pulse の `outputReadiness` を供給する。

## W2 — Actuation Pulse

| | |
|---|---|
| 型 | `src/types/actuationPulse.ts` |
| Deriver | `src/actuation/deriveActuationPulse.ts` |
| Feedback | `src/actuation/applyActuationFeedback.ts` |
| Test | `src/tests/behavioral/actuationPulse.test.ts` |
| Channels | `visual`, `simulatedForce` |
| 主要 field | `intensity`, `coherence`, `rhythm`, `locality`, `outputReadiness`, recovery/boundary/trace linking |

`BodySurfaceState`、pressure/recovery/trace/mismatch 状態を入力に取り、ActuationPulse を生成する (条件不成立時は `null`)。原則: 「AETERNA の場の圧が外へ漏れるような身体的作用」であり、メッセージ・言語ではない。

## W3 — Simulated World Medium

| | |
|---|---|
| 型 | `src/types/worldMediumState.ts` |
| Initialize | `src/world/initializeWorldMediumState.ts` |
| Update | `src/world/updateWorldMedium.ts` |
| Test | `src/tests/behavioral/worldMedium.test.ts` |
| 主要 field | `ambientLight`, `ambientNoise`, `surfaceResistance`, `echoLevel`, `motionDrift`, `fieldTemperature`, `feedbackDelay`, `lastPulseImpact`, `mediumStability` |

`updateWorldMedium(world, pulse, dt)` は ActuationPulse を世界に弱く作用させ、自然な decay/drift を適用する。

**並列**: v3.x の `src/world/spatialWorldMedium.ts` は **per-cell の spatial 媒体** で、これは torus 内部の exchange に使われる。W3 の scalar `worldMediumState` は body-world loop の **外部 scalar 世界** を表す。両者は意図的に並列に保たれている (D ミニプランの設計判断)。

## W4 — Sensory Return

| | |
|---|---|
| 型 | `src/types/sensoryReturnPacket.ts` |
| Deriver | `src/perception/deriveSensoryReturn.ts` |
| Weak coupling | `src/perception/sensoryReturnToPerturbation.ts` (`weakScale = 0.3`) |
| Apply | `src/perception/applySensoryReturnFeedback.ts` |
| Test | `src/tests/behavioral/sensoryReturn.test.ts` |
| Channels | `simulatedLight`, `simulatedNoise`, `simulatedPressure`, `simulatedMotion`, `simulatedEcho` |
| 主要 field | `intensity`, `novelty`, `locality`, `rhythm`, `worldOriginStrength`, `returnDelayHint`, `mediumStabilityHint` |

`deriveSensoryReturn(world, prevWorld, dt)` が world delta から packets を生成し、`sensoryReturnToPerturbation` が `weakScale = 0.3` の重みで perturbation event に弱く変換する。残り 0.7 の行き先は **D2-d で名指し** (boundary dissipation)。

## W5 — Reafference Comparison

| | |
|---|---|
| 型 | `src/types/reafferenceComparisonState.ts` |
| Deriver | `src/closure/deriveReafferenceComparison.ts` |
| Test | `src/tests/behavioral/reafferenceComparison.test.ts` |
| 主要 field | `expectedReturn`, `actualReturn`, `returnDelay`, `returnMismatch`, `selfCausedMatch`, `worldCausedDifference`, `unresolvedReturn`, `comparisonConfidence` |

「自分が出した pulse から期待される return」と「実際に世界から戻ってきた sensory packet」を比較する pre-semantic proxy。意識・自己認識の主張ではない。

## W6 — Body-World Closure Metrics

| | |
|---|---|
| 型 | `src/types/bodyWorldClosureState.ts` |
| Deriver | `src/closure/deriveBodyWorldClosureState.ts` |
| Test | (W8 closed-loop scenarios でカバー) |
| 主要 metrics | `loopGain`, `roundTripDelay`, `returnStrength`, `selfCausedMatch`, `worldMismatch`, `closureStability`, `closureDrift`, `unresolvedReturn`, `feedbackSaturationRisk` |

ループ閉鎖の強度を 9 つの observer-side metrics として表示。S2 DynamicViability / S4 MediumProfile への入力にもなる。

## W7 — Emergent Proto-Neuron Observation

| | |
|---|---|
| 型 | `src/types/protoNeuronObservationState.ts`, `src/types/protoNeuronCandidate.ts` |
| Deriver | `src/observer/deriveProtoNeuronCandidates.ts` |
| Test | `src/tests/behavioral/protoNeuronObservation.test.ts` |

observer-side candidate 観測のみ。runtime neuron node の配置はしない。Node bridge も実装しない。

## W8 — Closed-Loop Scenario Tests

| | |
|---|---|
| Runner | `src/tests/scenario/closedLoopScenario.ts` (`runClosedLoopScenario`, `runClosedLoopScenarioSuite`) |
| Test | `src/tests/behavioral/closedLoopScenarios.test.ts` |
| Scenario count | W8-A〜W8-J の 10 scenarios |
| 検証 | `semanticLeakCount === 0`, `nanOrInfinityCount === 0` |

`runClosedLoopScenario` は 1 tick あたり W1 → W2 → W3 → W4 → W5 → W6 → W7 を順に呼ぶ。modes: `normal`, `no_return`, `delayed_return`, `amplified_return`, `weak_return`, `world_only`, `repeated_self_pulse`。

## outflow chain pair-ledger 規律 (D2 以降で land 予定)

v3.8 → v4.4 で inflow chain (ExternalDrive → Medium → Membrane → Substrate → Buffer) には pair-ledger が入った。outflow chain (Buffer → Actuation → World → Sensory → Membrane) では同じ規律が未適用。

D2 で 4 つの新 transfer module を追加する:

- `src/actuation/bufferToActuationTransfer.ts` — Buffer → ActuationPulse
- `src/world/actuationToWorldTransfer.ts` — ActuationPulse → WorldMediumState (`actuationOutputEnergy` を実値化)
- `src/perception/worldToSensoryTransfer.ts` — WorldMediumState delta → SensoryReturnPacket[]
- `src/perception/sensoryToMembraneTransfer.ts` — SensoryReturnPacket → MembraneState (weak coupling 残り 0.7 を `boundaryDissipationEnergy` として名指し)

それぞれ `*-zero` / `*-positive` の段階規律で land し、最後に D4 で 8 link (inflow 4 + outflow 4) の end-to-end closure を検証する。

実装中は既存 W-Series モジュール (上記 deriver 群) を **書き換えない**。新 transfer module が既存 deriver の周りを巻く形で accounting を追加する。numeric invariance は許容条件。
