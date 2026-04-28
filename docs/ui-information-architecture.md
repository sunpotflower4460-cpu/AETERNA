# UI Information Architecture

## 目的

AETERNA の UI を3層に整理し、Main Field View を中心に据えた観測窓の情報構造を固定する。

---

## 3.1 Layer A: Main Field View

中央に大きく表示する主役。

**表示対象：**

- Torus Life Field
- Energy Flow
- Trace / Residue
- Actuation Pulse
- Sensory Return
- Closure Match
- Local Excitability
- Repeated Flow Path Candidate
- Proto-Network Candidate

**設計原則：**

- トーラス全体が見えること（backside も faint 表示）
- 一部だけ明るく見える場合は、実際の field 状態を反映しているか確認できること
- Layer Overlay モードで複数観測値を重ねて表示できること
- raw / smoothed の切り替えができること

---

## 3.2 Layer B: Observation HUD

画面端に薄く重ねる短い状態表示。

**表示例：**

```
Flow:          moderate
Return:        delayed
Echo:          medium
Boundary:      semi-open
Closure:       weak match
Saturation:    low risk
Semantic:      inactive
```

**設計原則：**

- human emotion label は使わない
- consciousness claim は使わない
- 数値を詰め込みすぎない（状態サマリーのみ）
- 長文説明は Layer C の Research Panels に任せる
- 半透明で Main Field View を遮らない

---

## 3.3 Layer C: Research Panels

開閉式の詳細パネル。

**推奨パネル構成：**

| パネル名 | 役割 |
|---|---|
| **Overview** | 全体の viability サマリー、フロー継続性、境界状態、リスク指標の概観 |
| **Field** | トーラス生命場の詳細：activity map、excitability、thresholdProximity、refractoryDepth |
| **World Loop** | Actuation Pulse → World Medium → Sensory Return → Closure Match の循環状態 |
| **Medium** | World Medium の状態：conductivity、viscosity、echoDecay、residue |
| **Local Field** | LocalExcitabilityFieldState の詳細：region 別 excitability / resistance / dissipation |
| **Paths** | Repeated Flow Path Candidate の一覧と統計 |
| **Proto-Network** | Proto-Network Candidate の一覧と統計 |
| **Scenarios** | 実行中 / 過去のシナリオ情報 |
| **Raw** | raw packet、NaN 検出、saturation 確認、coverage map の diagnostic 表示 |

**設計原則：**

- デフォルトは閉じた状態
- パネルを開いても Main Field View を完全に隠さない
- Diagnostic / Raw パネルは研究・診断用途であり、casual ユーザー向けに最前面に出さない

---

## 3.4 UI レイヤー間の関係

```
Layer A: Main Field View  ← 常時表示
Layer B: Observation HUD  ← 常時表示（薄く重ねる）
Layer C: Research Panels  ← ユーザー操作で開閉
```

右下には常時 **"Explain current state"** ボタンを表示する。  
ユーザーが迷った時に、現在起きていること・見るべき場所・次に試せる操作を確認できる。

---

## 3.5 U1 実装方針（Layout 再設計）

### PC レイアウト

- 画面中央: Main Field View（トーラス全画面）
- 左上: Observation HUD（compact status chips + title）
- 右側: Research Panel（collapsible sidebar, ~380px, 初期は折りたたみ）
- 右下: `Explain current state` ボタン（固定）
- 画面下: Event Strip（薄く）

### モバイルレイアウト

- 画面全面: Main Field View
- 上部: Observation HUD（compact chips）
- 下部: Bottom Nav（5ボタン: View / Touch / Explain / Scenario / Data）
- Research Panel が下から出るシート形式（responsive CSS）

### Research Panel タブ構成

| タブ | 内容 |
|---|---|
| **Overview** | 全体サマリーカード（Flow / Return / Energy / Echo / Risk）+ Guide / Sparklines |
| **Field** | Physical Disk / Torus Geometry / Network State / Prerequisites / Ongoingness |
| **World** | Recovery Field / Actuation Pulse |
| **Medium** | Medium Profile（Delay / Echo / Resistance） |
| **Paths** | Touch Pattern / Trace & Replay |
| **Network** | Natural Mechanisms / A2 Arousal / Prior Rewrite / Organism & Action |
| **Scenarios** | Presets / Sliders / Actions / Camera / Experience Mode |
| **Raw** | API Config / Signal Observe Panel / Visual & Debug Toggles |

### 実装ファイル

| ファイル | 役割 |
|---|---|
| `index.html` | 3層レイアウト HTML/CSS（Tailwind + inline CSS） |
| `src/ui/layout/layoutControls.js` | タブ切替 / パネル開閉 / モバイルシート / Explain / Event Strip |
| `src/ui/updateMetricsUI.js` | HUD chips + Overview cards 更新（各フレーム） |
| `src/tests/ui/layoutStructure.test.ts` | レイアウト構造スモークテスト（38件） |

---

## 関連文書

- `docs/scientific-ui-ux-principles.md` — Scientific UI/UX 原則
- `docs/visualization-integrity-principles.md` — 可視化の整合性原則
- `docs/torus-visualization-requirements.md` — トーラス表示要件
- `docs/default-guide-principles.md` — Default Guide 方針
