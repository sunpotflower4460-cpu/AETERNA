# Phase 0 Inventory

| 機構 | ファイルパス（行） | 役割（1行） | 区分 | Core への書き戻し | requires_writeback_review |
|---|---|---|---|---|---|
| W0〜W8 ループ機構 | `src/tests/scenario/closedLoopScenario.ts:271-324`, `src/experiments/runScenario.ts:1495` | Body→Actuation→World→Return→Reafference→Closure→Observer候補の閉ループを実行する。 | Core+Observer 境界 | なし（観測値は read-only） | false |
| flowContinuity / energyThroughput / dissipationBalance | `src/closure/deriveDynamicViabilityState.ts:1-120`, `src/experiments/runScenario.ts:1285-1287` | 動的可存性の 3 指標を導出してスナップショットへ記録する。 | Observer（導出） | なし | false |
| vortex candidates（位相欠陥・巻き数・振幅最小値） | `src/observer/deriveVortexCandidates.ts:75-125` | 位相 winding と振幅最小値から渦候補を抽出する。 | Observer | なし | false |
| Cell 構造（CellObservation / CellRegionLabel / Cell Inspector） | `src/types/cellObservation.ts:33-130`, `src/observation/deriveCellObservation.ts:23-120`, `src/ui/observation/CellInspectorPanel.tsx:1-220` | セル単位の観察データと UI インスペクタを提供する。 | Observer + UI | なし | false |
| weakPlasticityTrace | `src/plasticity/weakPlasticity.ts:126-405`, `src/observer/deriveWeakPlasticityObservation.ts:49-170` | 弱い塑性トレースを蓄積し、必要時のみ resistanceScale を参照できる。 | Core/Observer 混在 | 潜在経路あり（`getResistanceScale`） | true |
| Reafference Comparison | `src/closure/deriveReafferenceComparison.ts:291-390`, `src/core/AeternaNetwork.js:998-1016` | 予測入力と実際 return の一致/不一致を比較する。 | Core 側ループ内導出（Observer 的性質） | なし（現状は導出のみ） | true |
| proto-network / proto-neuron 候補 | `src/observer/deriveProtoNeuronCandidates.ts:200-380`, `src/observer/deriveProtoNetworkCandidates.ts:435-620` | 閉ループ観察から pre-semantic 候補構造を導出する。 | Observer | なし | false |
| vital pulse / breath wave（関連） | `src/world/externalDriveField.ts:299-381`, `src/tests/world/externalDriveField.test.ts:219-228` | 周期外部波形は比較用として扱い、生命語彙との同一視を禁止する。 | Core 入力 + Observer 監査 | なし（禁止テストで監査） | true |
