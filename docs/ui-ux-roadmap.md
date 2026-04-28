# UI / UX Roadmap

## 目的

AETERNA の UI / UX / Visualization 改善を段階的に進めるためのロードマップを固定する。

各 Phase は「見た目のための嘘」や「生命っぽい演出」に流れないよう、`docs/scientific-ui-ux-principles.md` と `docs/visualization-integrity-principles.md` の原則に従う。

---

## U-Series: UI / UX Phases

| Phase | 内容 | 状態 |
|---|---|---|
| **U0** | UI/UX 原則固定 | ✅ 完了（docs のみ） |
| **U1** | Layout 再設計 | ✅ 完了 |
| **U2** | Torus Camera / Controls | ✅ 完了 |
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

**実装内容**:
- トーラス全画面表示（Layer A）
- 上部 compact HUD chips（Flow / Return / Echo / Risk）
- 右側 collapsible Research Panel（PC）+ モバイル bottom sheet（responsive）
- Research Panel タブ: Overview / Field / World / Medium / Paths / Network / Scenarios / Raw
- Overview タブを最初の情報入口に（サマリーカード）
- `Explain current state` ボタンを右下に固定
- Event Strip を下部に薄く配置
- モバイル Bottom Nav（5ボタン）
- API key / debug 設定を Raw タブに移動

**完了条件**:
- Main Field View が中央主役 ✅
- Observation HUD がある ✅
- Research Panel が開閉式で整理されている ✅
- Overview が最初の tab ✅
- Explain button が見つけやすい位置にある ✅
- PC side panel 方針 ✅
- mobile bottom sheet 方針 ✅
- パネルがトーラスを過度に隠さない ✅
- Raw / Advanced が初期画面で前面に出すぎない ✅
- runtime dynamics を変更していない ✅
- fake visual を追加していない ✅
- semantic / consciousness / emotion claim なし ✅
- build が通る ✅
- 38件のレイアウト構造テスト通過 ✅

---

## U2: Torus Camera / Controls

**目的**: drag rotate / pinch-zoom / pan / double-tap reset / view presets / auto rotate / keyboard shortcuts / mobile gesture / View-Touch mode を実装し、トーラスを任意の角度から観察できるようにする。  
`docs/torus-visualization-requirements.md` §4.1 の要件を実装する。

**実装内容**:

- drag rotate（1本指 / 左クリックドラッグ → orbit）
- pinch zoom（2本指ピンチ）/ wheel zoom
- pan（右クリック / 中クリックドラッグ、2本指）
- double-tap / double-click → reset view
- R キー → reset view
- 1–7 キー → view preset
- Space キー → auto rotate toggle
- 8 view presets: Front / Top / Side / Inside Rim / Energy Flow / Trace / Closure / Diagnostic
- damping（gentle lerp、観察補助）
- auto rotate（off by default、observation aid のみ、field dynamics ではない）
- View / Touch mode toggle（View=orbit on drag、Touch=orbit 無効で torus input 優先）
- Camera HUD（現在の view preset / zoom / auto rotate 状態を表示）
- 初期視点 Front（distance=15）でトーラス全体が収まる
- near=0.1、far=100、fov=50

**新規ファイル**:

- `src/ui/camera/torusViewPresets.ts` — view preset 定義
- `src/ui/camera/createTorusCameraControls.ts` — keyboard shortcut 登録
- `src/ui/camera/useTorusCameraControls.ts` — Camera UI state management
- `src/tests/ui/torusCameraControls.test.ts` — smoke tests（65件）

**更新ファイル**:

- `src/utils/cameraControls.js` — 全面強化（damping, pan, pinch zoom, all 8 presets, auto-rotate, View/Touch mode, Camera HUD）
- `src/main.ts` — 新 window globals + keyboard shortcut 登録
- `index.html` — Camera HUD 追加、Camera Viewpoints 拡張（8 presets）、View/Touch toggle 追加、CSS 追加

**重要方針**:

- camera motion は observation aid であり field dynamics ではない（docs / source に明記）
- auto rotate は presentation control（field が揺れているように見せるものではない）
- view presets は値を変更しない（カメラ位置のみ変更）
- View / Touch mode は既存の tap ベース torus perturbation 入力を壊さない
- runtime dynamics / field calculation / energy / trace / return は変更しない
- fake visual を追加していない

**完了条件**:

- rotate / zoom / pan / reset ができる ✅
- view presets がある（8種類）✅
- auto rotate toggle がある ✅
- keyboard shortcuts がある（R, 1-7, Space）✅
- View / Touch mode 切り替えがある ✅
- Camera HUD がある ✅
- PC / mobile の操作導線がある ✅
- 初期視点でトーラス全体が見える ✅
- runtime 未変更 ✅
- fake visual なし ✅
- semantic/consciousness/emotion claim なし ✅
- build が通る ✅
- 65件の camera controls テスト通過 ✅
- 38件の layout structure テスト通過 ✅

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
