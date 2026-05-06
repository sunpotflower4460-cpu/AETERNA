# AETERNA-NATURAL v2.0 Observation UX Final Polish

## 1. Purpose

v2.0 は AETERNA-NATURAL v1.6〜v1.9 で実装した超観測システムを、ひとつの観測体験として分かりやすく統合するためのフェーズである。

新しい dynamics は追加しない。目的は以下：

- Cell Inspector / Metric Spotlight / Visual Lens / Time Replay / Causal Trace / Layer Correlation / Difference View / Lens-aware AI Guide を、迷わない・見やすい・聞きやすい・誤解しにくい状態へ磨き込む
- Live / Replay / Lens / Guide の状態を常に見える化する
- proxy / derived / check / reference の区別を一目で分かるようにする
- Mobile でも操作しやすくする
- fake visual / fake event / fake result は一切追加しない
- runtime dynamics は変更しない

---

## 2. Observation Workspace

`src/ui/observation/ObservationWorkspace.tsx` が全観測 panel の統合コンテナ。

### 構成

```
ObservationWorkspace
  - ObservationHeader          (状態バー)
  - ObservationDiagnosticStrip (警告・NaN・レンズ状態)
  - [Main Field View]          (トーラス表示 placeholder)
  - InspectorDrawer            (4タブ: Cell / Metric / Events / Warnings)
  - MetricSpotlightPanel       (アクティブレンズの詳細)
  - TimeReplayPanel            (Live / Replay 操作)
  - CausalTracePanel           (因果候補 — proof ではない)
  - LayerCorrelationPanel      (相関 — proof ではない)
  - DifferenceViewPanel        (差分ビュー)
  - ObservedRatioInvolvementPanel (比率観測)
  - LensAwareGuidePanel        (観測ガイド)
  - ObservationMobileTabs      (モバイル底部タブ)
  - Navigation hint            ("Tap a cell → Inspector → …")
```

各 panel は条件付きレンダリング。observation が null のときは適切な空状態メッセージを表示する。

---

## 3. Live / Replay Distinction

### ObservationHeader

常時表示。以下を明示：

- **Live** モード: `Live tick 530`
- **Replay** モード: `Replay tick 240 / Live tick 530` + 赤 badge
- Replay 中は日本語注記を表示:  
  「Replay Mode は記録された観測 snapshot を表示しています。runtime 自体が過去に戻ったわけではありません。」

### TimeReplayPanel

- Live / Replay badge を常時表示
- "Return to Live" ボタンを常に見える位置に配置
- snapshot が存在しない tick では "Snapshot unavailable" + スナップショット案内文
- ReplaySlider の disclaimer: "Replay Mode shows recorded observation snapshots. It does not imply the runtime itself has moved backward."

### Runtime ModeBar

`RuntimeModeBadge` (既存) で以下を常時表示：

| Badge | 値 | 色 |
|---|---|---|
| Metric | Flat / Curved | safe / research |
| Field | Scalar / Complex Observer / Complex Runtime | safe / research / experimental |
| Membrane | Off / Observer / Weak Coupling | safe / research / experimental |
| Plasticity | Off / Observe / Resistance | safe / research / experimental |
| Constants | Neutral / Legacy | safe / legacy |
| Safety | Safe / Research / Experimental | safe / research / experimental |

- Legacy は "comparison only" と表示
- Complex Runtime は "experimental" と明示
- Guide badge が AETERNA 本体ではないことを tooltip で示す

---

## 4. Inspector Flow

### InspectorDrawer

4タブ構造 (`cell` / `metric` / `events` / `warnings`)：

**Cell タブ**:
- cell index, u/v angle, region
- areaElement, gaussianCurvature, amplitude, phase
- vortex confidence, membrane deformation, plasticity trace, resistanceScale
- observed ratio involvement
- 未観測値は "(not observed)" — undefined を 0 と表示しない

**Metric タブ**:
- metric row (label / value / unit / value kind badge / confidence / lens shortcut)
- 未観測値は "(not observed)"
- value kind badge に tooltip あり

**Events タブ**:
- recent events (tick / kind / text)
- イベントなし: "No recent events for this cell."

**Warnings タブ**:
- severity 別 warning 一覧
- なし: "No warnings." (info badge)

### Metric Row UX (CellMetricRow)

各 metric row:
- label / value / unit
- value kind badge (tooltip 付き)
- confidence (あれば表示)
- lens shortcut "→ Lens"
- クリックで focusedMetric / activeLens が変わる

Value kind badge の tooltip:
- measured: "観測バッファから直接読んだ値"
- derived: "実測・内部状態から計算された導出値"
- proxy: "観測補助指標。直接証明ではありません"
- unavailable: "未観測"

---

## 5. Metric Spotlight Flow

`MetricSpotlightPanel`:
- lens name / focused metric / current value / value kind / confidence
- proxy lens には "Proxy: 観測補助指標。証明ではありません。" note
- context line: `Lens: <name> | Kind: [kind]`
- Recommended field layers (advisory, not automatic)
- Guide shortcuts: これなに？ / どう仮説できる？ / 次どこ見る？ / 注意点は？

---

## 6. Trace / Correlation / Difference UX

### CausalTrace

シグナルのラベル構造:
- `possible` → 可能性のある寄与シグナル
- `related` → 関連観測
- `nearby` → 時間的に近いイベント
- signals title に "(possible · related · nearby — not causal proof)" を表示

常時表示 disclaimer:
> ⚠ Not causal proof. Signals shown are possible contributing signals only. Correlation between metrics is not evidence of causation.

禁止語: cause, proved, because definitely

### Layer Correlation

- sample 数 < 3 → "(insufficient samples)"
- ヘッダー: "Samples (min 3)"
- disclaimer: "Correlation is not causal proof."

### Difference View

- "Largest Observed Changes" (改善ではなく変化量)
- caution-intro: "delta の大きさは「改善」ではありません。観測された変化量です。"

---

## 7. Lens-aware Guide UX

`LensAwareGuidePanel`:

常時注記:
> このガイドは観測結果を読む補助です。AETERNA 本体の発話ではありません。

Public mode:
- "rule-based guide · external LLM disabled" と明示

Question shortcuts (常時表示):
- これなに？ / 次どこ見る？ / 注意点は？

Response view:
- answer が 200 文字超の場合 `<details>/<summary>` で折りたたむ
- caution notes セクション
- observation facts セクション
- hypothesis candidates セクション
- suggested next lenses (ボタン)

AI Guide に関する原則:
- AETERNA 本体ではない
- External LLM / API 呼び出しは行わない (rule-based のみ)
- Claim guard が適用され、意識・生命・知性の証明表現は除去される

---

## 8. Mobile UX

### ObservationMobileTabs

6タブ bottom navigation:
- Field 🌐 / Inspector 🔍 / Lens 🔭 / Replay ⏮ / Trace 🔗 / Guide 💬
- `role="tablist"` + `role="tab"` + `aria-selected`
- 最小タップターゲット: 44px 確保
- `observation:tabChange` CustomEvent で切り替え

### 原則

- トーラス表示を完全に隠さない (Field タブで常に見える)
- bottom sheet は閉じられる
- Replay slider がスマホで操作できる
- Guide input がキーボードで潰れすぎない

---

## 9. Warning Severity

全 panel で以下の severity を統一:

| Severity | 色 | 用途 |
|---|---|---|
| Info | grey | Rule-based guide active |
| Notice | blue | Vortex candidate observed |
| Warning | yellow/amber | Plasticity trace near clamp |
| Critical | red | NaN detected |
| Experimental | amber | complexRuntime active |

`ObservationDiagnosticStrip` で一括管理。Critical のみ赤、Experimental は amber、Notice は穏やか。

---

## 10. Value Kind Badges

全 panel で統一:

| Kind | 色 | Tooltip |
|---|---|---|
| Raw | #e5e7eb | ほぼ加工前の値 |
| Measured | #34d399 | 観測バッファから直接読んだ値 |
| Derived | #60a5fa | 計算された導出値 |
| Proxy | #fbbf24 | 直接証明ではなく、観測補助指標 |
| Check | #a78bfa | 破綻や整合性を確認するための検査値 |
| Reference | #94a3b8 | 比較用。core dynamics の因果成分ではない |
| Presentation-smoothed | #6ee7b7 | 表示の読みやすさのために平滑化された値 |

---

## 11. Copy Guard

以下の表現を全 panel / guide response / docs から禁止:

**英語**:
- consciousness proved, life proved, intelligence proved
- AETERNA feels, AETERNA wants, AETERNA understands
- soul resonance, mystical proof, healing proof
- vortex is mind, plasticity is memory, ratio proves truth

**日本語**:
- 意識が証明, 生命が証明, 知性が証明
- AETERNA が感じている, AETERNA が欲している, AETERNA が理解した
- 魂, 神秘の証明, 癒しの証明, 渦は心, 可塑性は記憶, 比率が真理を証明

`src/tests/stabilization/finalObservationCopyGuard.test.ts` で自動検証。

---

## 12. Guardrails

以下を常に守る:

1. **No behavior break** — runtime dynamics は変更しない
2. **No fake visual / fake event / fake result** — 全ての表示値は実測・derivation から
3. **No LLM/API calls** — guide は rule-based のみ
4. **No Node bridge** — semantic memory 実装なし
5. **No consciousness/life/intelligence proof claim** — disclaimer / caution のみ許可
6. **Replay ≠ runtime rewind** — 常に明示
7. **AI Guide ≠ AETERNA 本体** — 常に明示
8. **Proxy / Reference ≠ proof** — value kind badge と tooltip で明示
9. **Correlation ≠ causation** — CausalTrace / LayerCorrelation で常に disclaimer
10. **Delta ≠ improvement** — DifferenceView で常に明示

---

## Files Changed

### New Files

- `src/ui/observation/ObservationWorkspace.tsx`
- `src/ui/observation/ObservationHeader.tsx`
- `src/ui/observation/InspectorDrawer.tsx`
- `src/ui/observation/ObservationMobileTabs.tsx`
- `src/ui/observation/ObservationDiagnosticStrip.tsx`
- `src/tests/ui/observationWorkspace.test.ts`
- `src/tests/ui/observationHeader.test.ts`
- `src/tests/ui/inspectorDrawer.test.ts`
- `src/tests/ui/metricRowUx.test.ts`
- `src/tests/ui/replayUx.test.ts`
- `src/tests/ui/traceCorrelationDifferenceUx.test.ts`
- `src/tests/ui/lensAwareGuideUx.test.ts`
- `src/tests/ui/mobileObservationFlow.test.ts`
- `src/tests/stabilization/finalObservationCopyGuard.test.ts`
- `docs/observation-ux-final-polish.md`

### Updated Files

- `src/ui/observation/CellMetricRow.tsx` (confidence, tooltips, extended VALUE_KIND_COLORS)
- `src/ui/observation/MetricSpotlightPanel.tsx` (4 guide buttons, proxy note, context line)
- `src/ui/observation/CausalTracePanel.tsx` (signals note, relation kind map)
- `src/ui/observation/LayerCorrelationPanel.tsx` (insufficient samples, header)
- `src/ui/observation/DifferenceViewPanel.tsx` (largest observed change, caution-intro)
- `src/ui/observation/ObservedRatioInvolvementPanel.tsx` (JP caution, Reference badge)
- `src/ui/replay/TimeReplayPanel.tsx` (snapshot unavailable JP, Return-to-Live bar)
- `src/ui/guide/LensAwareGuidePanel.tsx` (guardrail note, public mode label, shortcuts)
- `src/ui/guide/LensGuideResponseView.tsx` (collapsible for long answers)
- `docs/current-roadmap.md`
