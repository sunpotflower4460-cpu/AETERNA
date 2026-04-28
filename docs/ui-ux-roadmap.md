# UI / UX Roadmap

## 目的

AETERNA の UI / UX / Visualization 改善を段階的に進めるためのロードマップを固定する。

各 Phase は「見た目のための嘘」や「生命っぽい演出」に流れないよう、`docs/scientific-ui-ux-principles.md` と `docs/visualization-integrity-principles.md` の原則に従う。

---

## U-Series: UI / UX Phases

| Phase | 内容 | 状態 |
|---|---|---|
| **U0** | UI/UX 原則固定 | ✅ 完了（docs のみ） |
| **U1** | Layout 再設計 | 未着手 |
| **U2** | Torus Camera / Controls | 未着手 |
| **U3** | Scientific Torus Renderer | 未着手 |
| **U4** | Field Layer Visualization | 未着手 |
| **U5** | Overview / Now Summary / Event Timeline | 未着手 |
| **U6** | Guide / Explanation System | 未着手 |
| **U7** | Scenario UX | 未着手 |
| **U8** | Visual QA / Scientific QA | 未着手 |

---

## U0: UI/UX 原則固定

**目的**: AETERNA の UI / UX / Visualization 改善に入る前に、正確さを保ったまま「見える・触れる・理解できる」観測装置にするための原則を docs に固定する。  
runtime 挙動は変更しない。fake visual を追加しない。

**完了条件**:
- `docs/scientific-ui-ux-principles.md` がある ✅
- `docs/visualization-integrity-principles.md` がある ✅
- `docs/ui-information-architecture.md` がある ✅
- `docs/torus-visualization-requirements.md` がある ✅
- `docs/default-guide-principles.md` がある ✅
- `docs/ui-ux-roadmap.md` がある ✅
- fake visual 禁止が明記されている ✅
- raw / derived / proxy / presentation-smoothed 区分がある ✅
- UI は観測窓と明記されている ✅
- トーラス表示要件がある ✅
- default guide 方針がある ✅
- runtime 挙動を変更していない ✅
- build が通る ✅

---

## U1: Layout 再設計

**目的**: Main Field View（Layer A）が中央に大きく表示され、Observation HUD（Layer B）と Research Panels（Layer C）が主役を遮らないレイアウトを実現する。  
現状の「UI パネルが重なってトーラスが見えづらい」問題を改善する。

---

## U2: Torus Camera / Controls

**目的**: drag rotate / pinch-zoom / double-tap reset / view presets / auto rotate / mobile gesture を実装し、トーラスを任意の角度から観察できるようにする。  
`docs/torus-visualization-requirements.md` §4.1 の要件を実装する。

---

## U3: Scientific Torus Renderer

**目的**: fake energy・fake flow を追加せず、実際の field 値を色・光・透明度に変換する Scientific Renderer を実装する。  
backside faint display / inactive surface visibility / coverage map / raw-smoothed toggle を含む。  
`docs/torus-visualization-requirements.md` §4.2〜4.4 の要件を実装する。

---

## U4: Field Layer Visualization

**目的**: Energy Flow / Trace / Residue / Local Excitability / Repeated Flow Path / Proto-Network Candidate / Closure Match を、独立した観測レイヤーとして重ね合わせて表示できるようにする。  
`docs/ui-information-architecture.md` §3.1 の表示対象を実装する。

---

## U5: Overview / Now Summary / Event Timeline

**目的**: 現在の viability 状態・主要 metrics を Observation HUD（Layer B）として表示し、過去の主要イベントを Timeline として確認できるようにする。  
数値の羅列ではなく、状態の要約として伝える。

---

## U6: Guide / Explanation System

**目的**: API key なしでも動く rule-based な Default Local Guide を実装し、右下の "Explain current state" ボタンから現在状態・次に見るべきパネル・次に試せる scenario を案内できるようにする。  
`docs/default-guide-principles.md` の方針を実装する。

---

## U7: Scenario UX

**目的**: シナリオの選択・実行・観察を UI から行えるようにし、"次に試せること" を明確に案内する。  
ユーザーが AETERNA の挙動を能動的に探索できるようにする。

---

## U8: Visual QA / Scientific QA

**目的**: fake visual が混入していないか・raw / smoothed の区別が正しく表示されているか・observation window として正確に動いているかを系統的に検証する QA Phase。  
`docs/visualization-integrity-principles.md` の各原則が実装で守られているかを確認する。

---

## 各 Phase 共通の禁止事項

- fake energy / fake fluctuation / fake trace / fake return を追加しない
- semantic node / label / concept / same-object detection を追加しない
- LLM 呼び出しを勝手に追加しない
- consciousness / emotion / self-awareness claim を UI に出さない
- runtime dynamics を変更しない（U3 shader 実装時も observer-side のみ）

---

## 関連文書

- `docs/scientific-ui-ux-principles.md` — Scientific UI/UX 原則
- `docs/visualization-integrity-principles.md` — 可視化の整合性原則
- `docs/ui-information-architecture.md` — UI 情報アーキテクチャ
- `docs/torus-visualization-requirements.md` — トーラス表示要件
- `docs/default-guide-principles.md` — Default Guide 方針
- `docs/current-roadmap.md` — S-Series / W-Series を含む全体 roadmap
