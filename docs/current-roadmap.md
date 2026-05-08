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
- N1 curved torus metric baseline
- N2 complex scalar field observer
- N0–N7 + v1.0 Stabilization ✅ 完了 (2026-05-01)
- AETERNA-NATURAL v1.1 Observation UX Polish ✅ 完了 (2026-05-02)
- AETERNA-NATURAL v1.3 Research Scenarios / Preset Experiments ✅ 完了 (2026-05-05)
- AETERNA-NATURAL v1.5 App Packaging / Deployment Readiness ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v1.6 Super Observation Architecture ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v1.7 Deep Inspector / Time Replay ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v1.8 Causal Trace / Layer Correlation ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v1.9 Lens-aware AI Guide ✅ 完了 (2026-05-07)
- AETERNA-NATURAL v2.0 Observation UX Final Polish ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v2.1 Final QA / Release Audit ✅ 完了 (2026-05-06)
- AETERNA-NATURAL v2.2 Public Demo Polish / Landing Copy ✅ 完了 (2026-05-07)
- AETERNA-NATURAL v2.6.5 Current State Audit / Core Boundary Freeze ✅ 完了 (2026-05-07)
- AETERNA-NATURAL v2.7 今起きていること要約パネル / Now Summary Panel ✅ 完了 (2026-05-08)
- AETERNA-NATURAL v2.8 Energy Reality Audit / Result-Coded Dynamics Detection ✅ 完了 (2026-05-08)

## Planned Observation / Energy Reality Phases

- v2.4 Japanese-first UI / Terminology — planned (not yet implemented)
- v2.5 First-time Onboarding / Observation Route — planned (not yet implemented)
- v2.6 Lens Explanations / Glossary Enhancement — planned (not yet implemented)
- v2.6.5 Current State Audit / Core Boundary Freeze — ✅ complete (2026-05-07)
- v2.7 Now Summary Panel — ✅ complete (2026-05-08)
- v2.8 Energy Reality Audit / Result-Coded Dynamics Detection — ✅ complete (2026-05-08)
- v2.9 Energy Ledger / ConservationResidual Check — next
- v3.0 Local Conservation Substrate — planned
- v3.1 Spatial World Medium — planned
- v3.2 ExternalDriveField = 0 Structure — planned
- v3.3 Steady ExternalDrive Flow — planned
- v3.4 Supply Cutoff Test — planned
- v3.5 PeriodicDrive Spectral Comparison — planned

## Energy Reality Series

AETERNA の energy / medium / life-field 系は、今後「それらしい結果」を直接書く方向ではなく、局所的な保存則・交換・蓄積・散逸・境界条件から挙動が導出されるかを検証する方向へ進める。

### E0 / v2.8 Energy Reality Audit ✅

目的:
- 現行 dynamics のうち、local / derived / proxy / result-coded / presentation を分類する。
- World Medium scalar baseline, smoothDecay, sine drift, direct damping, residue decay, clamp loss, weighted derived states を監査する。
- runtime dynamics は変更しない。
- `docs/energy-realness-principles.md` と `docs/energy-reality-audit.md` を追加する。

完了条件:
- energy realness principles が docs 化されている ✅
- result-coded dynamics の監査 docs がある ✅
- implementation-language-guardrails に energy realness 追記がある ✅
- docs guard test がある ✅
- runtime dynamics を変更していない ✅

### E1 / v2.9 Energy Ledger / ConservationResidual Check

目的:
- 現行 dynamics を置き換えず、まず収支の見える化を行う。
- input / internal accumulation / dissipation / actuation output / residue conversion / clamp loss / unaccounted energy を診断値として記録する。
- conservationResidual を Check-kind metric として扱う。
- residual が閉じない場合、energy flow ではなく diagnostic/proxy と明記する。

### E2 / v3.0 Local Conservation Substrate

目的:
- global decay や center-buffer injection ではなく、局所セル交換・蓄積・散逸先を持つ基盤を追加する。
- loss が消えるのではなく、named DissipationField / OutflowField / ResidueField へ移るようにする。

### E3 / v3.1 Spatial World Medium

目的:
- scalar World Medium を、空間を持つ WorldMediumField へ移行する。
- 膜セルは隣接する world medium cell とだけ交換する。
- world medium 同士は局所交換・拡散・散逸を持つ。

### E4 / v3.2 ExternalDriveField = 0 Structure

目的:
- ExternalDriveField と boundary entry structure を追加するが、drive は 0 で固定する。
- 構造だけを追加し、保存則が壊れないことを確認する。

### E5 / v3.3 Steady ExternalDrive Flow

目的:
- 定常供給 Flow のみを入れる。
- Pulse / PeriodicDrive はまだ追加しない。
- 供給・内部蓄積・散逸・流出・残留の ledger が閉じるか確認する。

### E6 / v3.4 Supply Cutoff Test

目的:
- `if supply === 0 then decay` のような結果ルールを書かず、供給停止時に局所散逸と保存則の結果として活動が減るか観測する。
- 減らない場合も valid observation とする。

### E7 / v3.5 PeriodicDrive Spectral Comparison

目的:
- 最後に周期駆動を入れる。
- 入力波形・内部波形・出力波形を別々に記録し、位相差・遅延・変形・スペクトル差分を測る。
- 同形同相なら flow evidence ではなく pass-through / presentation と扱う。

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

## U-Series: UI / UX Phases

AETERNA の UI / UX / Visualization 改善を段階的に進める。
各 Phase は `docs/scientific-ui-ux-principles.md` の原則に従い、fake visual・演出的揺らぎを追加しない。

| Phase | 内容 | 状態 |
|---|---|---|
| **U0** | UI/UX 原則固定 | ✅ 完了（docs のみ） |
| **U1** | Layout 再設計 | ✅ 完了 |
| **U2** | Torus Camera / Controls | ✅ 完了 |
| **U3** | Scientific Torus Renderer | ✅ 完了 |
| **U4** | Field Layer Visualization | ✅ 完了 |
| **U5** | Overview / Now Summary / Event Timeline | ✅ 完了 |
| **U6** | Guide / Explanation System | ✅ 完了 |
| **U7** | Scenario UX | ✅ 完了 |
| **U8** | Visual QA / Scientific QA | ✅ 完了 |

詳細は `docs/ui-ux-roadmap.md` を参照。

---

## S-Series: Natural Emergence Phases

AETERNA の次段階（W-Series の後）では、自然発生原則に基づく条件実装を進める。
揺らぎ・安定・proto-neuron / proto-network は、条件から自然に観測される結果として扱う。

| Phase | 内容 | 状態 |
|---|---|---|
| **S0** | Natural Emergence Principles 固定 | ✅ 完了（docs のみ） |
| **S1** | Flow / Resistance / Dissipation Audit | ✅ 完了（2026-04-27） |
| **S2** | Dynamic Viability State | ✅ 完了（2026-04-27） |
| **S3** | Minimal Natural Feedback | ✅ 完了（2026-04-27） |
| **S4** | Delay / Echo / Resistance Profile | ✅ 完了（2026-04-28） |
| **S5** | Local Excitability Field | ✅ 完了（2026-04-28） |
| **S6** | Path Formation by Repeated Flow | ✅ 完了（2026-04-28） |
| **S7** | Proto-Network Candidate Observation | ✅ 完了 |
| **S8** | Long-Run Natural Emergence Scenarios | ✅ 完了 |

S-Series は observer/proxy として有用だが、Energy Reality Series の厳密化により、今後は result-coded dynamics と real modeled flow の区別をさらに強める。

---

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
| **W8** | Closed-Loop Scenario Tests | ✅ scenario / behavioral tests / docs |

Note: W-Series の既存実装/計画は、Energy Reality Series により real substrate / proxy / derived の区別を再監査する。

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

## Next Step

次は v2.9 Energy Ledger / ConservationResidual Check。

v2.9 では runtime dynamics の置換は行わず、まず既存 dynamics に対して diagnostic ledger を導入する。保存則が閉じない場合は、それを failure ではなく measurement として記録し、energy flow verified とは表示しない。
