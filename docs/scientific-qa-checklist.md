# Scientific QA Checklist

AETERNA U8 の Scientific QA で使う確認票。
各項目は source / test / manual note を添えて確認する。

## Value Mapping

- [ ] Energy / Activity layer は actual activity / energy source に対応している
- [ ] Trace / Residue layer は trace / residue source に対応している
- [ ] Sensory Return layer は actual return packet / return metrics に対応している
- [ ] Closure Match layer は reafference / closure metrics に対応している
- [ ] Local Excitability layer は `LocalExcitabilityField` に対応している
- [ ] Repeated Flow Path layer は `RepeatedFlowPathObservation` に対応している
- [ ] Proto-Network layer は `ProtoNetworkObservation` に対応している

## Value Kind

- [ ] Measured / Derived / Proxy / Presentation-smoothed が区別されている
- [ ] Smooth は raw と区別されている
- [ ] Proxy は proxy として表示されている
- [ ] Proto-network confidence は semantic meaning として扱われていない

## Runtime Integrity

- [ ] UI / renderer が runtime dynamics を変更していない
- [ ] camera controls が field value を変更していない
- [ ] layer toggle が observation display のみを変更している
- [ ] scenario recommended layer / view が runtime dynamics を変更していない

## Audit anchors

- `src/ui/render/fieldLayerRegistry.ts`
- `src/ui/render/torusRenderModeManager.ts`
- `src/ui/render/torusCoverageMetrics.ts`
- `src/ui/render/torusDiagnosticWarnings.ts`
- `src/ui/summary/deriveNowSummary.ts`
- `src/ui/guide/deriveGuideExplanation.ts`
- `src/scenario/scenarioPresetRegistry.ts`
