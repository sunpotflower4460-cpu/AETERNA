# AETERNA-NATURAL v2.4 — Japanese-First UI / Terminology Organization

## Overview

v2.4 introduces the **Japanese-First UI** layer: a structured, language-first
approach to making AETERNA accessible to first-time viewers.

The core principle:

> 研究者向けの深い観測機能を残しながら、初見でも"見る順番"と"意味の読み方"が分かるUIにする。

AETERNA is an observation instrument, not a research terminal full of English
acronyms. v2.4 makes it speak Japanese first.

---

## Changes in v2.4

### New source files

| Path | Description |
|------|-------------|
| `src/i18n/jpTerminology.ts` | Central Japanese label/term mapping. All UI strings live here. |
| `src/ui/natural/NowSummaryPanel.tsx` | "今起きていること" summary panel — always-visible natural-language state summary |
| `src/ui/natural/ObservationRouteGuide.tsx` | "見る順番" 8-step observation navigation guide |
| `src/ui/natural/LensDescriptionPanel.tsx` | Per-lens JP description panel ("何を見るレンズか") |
| `src/ui/natural/TerminologyDictionary.tsx` | Built-in terminology dictionary (13 terms, 5 facets each) |
| `src/ui/natural/ViewModeSelector.tsx` | 4-mode selector: はじめて見る / 通常観測 / 研究者モード / 開発者モード |

### Updated source files

| Path | Change |
|------|--------|
| `src/i18n/jpTerminology.ts` (new) | — |
| `src/ui/lens/metricLensRegistry.ts` | Added `labelJp` field to `MetricLens` interface and all 17 lens definitions; added `ALL_LENS_IDS` export |
| `src/ui/observation/ObservationMobileTabs.tsx` | Japanese tab labels (見る/調べる/レンズ/時間/関連/聞く); English retained in `aria-label` |
| `src/ui/observation/ObservationHeader.tsx` | ライブ/再生 mode badges; セル/レンズ JP labels; （未選択）/（なし）; Japanese replay note |
| `src/ui/observation/CellInspectorPanel.tsx` | "セル観測" panel title; JP metric labels from `jpTerminology`; JP empty/no-events messages |
| `src/ui/observation/MetricSpotlightPanel.tsx` | "観測レンズ" panel title; JP lens name + EN label sub-display; JP layer suggestions |
| `src/ui/observation/CausalTracePanel.tsx` | "関連候補" title; "因果証明ではありません" disclaimer; JP signals heading and empty message |
| `src/ui/observation/LayerCorrelationPanel.tsx` | "層の相関" title; "相関は因果ではありません" disclaimer; JP table headers |
| `src/ui/observation/InspectorDrawer.tsx` | JP tab labels (セル/観測値/履歴/警告); English in aria-labels; JP empty messages |
| `src/ui/guide/LensAwareGuidePanel.tsx` | "観測ガイド" panel title (with "(AI Guide)" reference); JP lens/cell display; JP guide type note |
| `src/ui/observation/ObservationWorkspace.tsx` | JP navigation hint |

---

## UI Term Mapping

| English (v2.3) | Japanese (v2.4) | Notes |
|----------------|-----------------|-------|
| Cell Inspector | セル観測 | Panel title |
| Metric Spotlight | 観測レンズ | Panel title |
| Vortex Candidate | 渦候補 | Metric label |
| Weak Plasticity Trace | 媒質履歴 | Metric label |
| Observed Ratio | 観測比率 | Metric label |
| Causal Trace | 関連候補 | Panel title |
| Layer Correlation | 層の相関 | Panel title |
| Replay Snapshot | 観測スナップショット再生 | Panel title |
| Proxy | 補助指標 | Value kind label |
| Derived | 導出値 | Value kind label |
| Reference | 参照値 | Value kind label |
| Not causal proof | 因果証明ではありません | Disclaimer |
| AI Guide | 観測ガイド | Panel title (EN reference retained) |
| Live | ライブ | Header badge |
| Replay | 再生 | Header badge |
| Field (tab) | 見る | Mobile tab |
| Inspector (tab) | 調べる | Mobile tab |
| Lens (tab) | レンズ | Mobile tab |
| Replay (tab) | 時間 | Mobile tab |
| Trace (tab) | 関連 | Mobile tab |
| Guide (tab) | 聞く | Mobile tab |

---

## New Panel: "今起きていること" (NowSummaryPanel)

Located at `src/ui/natural/NowSummaryPanel.tsx`.

Always-visible panel that summarises the current observation state in plain
Japanese. Example lines:

```
現在は安全な観測モードです。
トーラス場は活動状態にあります。
セル 7 を選択して観測中です。
fieldPhase レンズで可視化中です。
近くに渦候補があります（信頼度：高）。
```

Always ends with the observation disclaimer:

> ここで見えているものは、場の変化を観測しやすくしたものです。断定ではなく、観測と仮説のための手がかりとして見てください。

---

## New Panel: "見る順番" (ObservationRouteGuide)

Located at `src/ui/natural/ObservationRouteGuide.tsx`.

8-step observation navigation:

1. 場全体を見る
2. 気になる場所をタップする
3. セルの値を見る
4. レンズで可視化する
5. 時間を戻して変化を見る
6. 関連候補を見る
7. 観測ガイドに聞く
8. 結果を書き出す

Supports full list mode and compact "next step" hint mode.

---

## New Panel: Lens Descriptions (LensDescriptionPanel)

Located at `src/ui/natural/LensDescriptionPanel.tsx`.

Per-lens JP description covering:

- **何を見るか** — what this lens observes
- **何ではないか** — what it explicitly is NOT
- **値が高い時 / 値が低い時** — value interpretation hints

All 17 lenses have descriptions. Example for 位相レンズ:

```
このレンズは、複素スカラー場の位相（−π〜π）を色で見ます。
色の回り込みがある場所では渦候補が出ることがあります。

何ではないか:
感情や意味ではありません。数学的な位相の観測です。
```

---

## New: 観測用語辞典 (TerminologyDictionary)

Located at `src/ui/natural/TerminologyDictionary.tsx`.

13 core terms with 5-facet explanation each:

| 用語 | 英語 |
|------|------|
| 場 | Field |
| セル | Cell |
| 位相 | Phase |
| 振幅 | Amplitude |
| 渦候補 | Vortex Candidate |
| 膜 | Membrane |
| 媒質履歴 | Weak Plasticity Trace |
| 観測比率 | Observed Ratio |
| 補助指標 | Proxy |
| 導出値 | Derived |
| 参照値 | Reference |
| 関連候補 | Causal Trace |
| 層の相関 | Layer Correlation |

---

## New: 表示モードセレクター (ViewModeSelector)

Located at `src/ui/natural/ViewModeSelector.tsx`.

| モード | 説明 |
|--------|------|
| はじめて見る | 最小表示。場・セル・ガイドの基本のみ |
| 通常観測 | セル/レンズ/再生/ガイドの標準観測モード |
| 研究者モード | 相関・差分・比率・エクスポート・詳細診断まで |
| 開発者モード | 生ログ・設定・デバッグ・トレース詳細 |

---

## Accessibility Principle

Japanese labels are the primary display text. English is retained in:

- `aria-label` attributes (screen readers)
- `data-*` attributes (test selectors)
- Parenthetical sub-labels `(AI Guide)`, `(Causal Trace)`, etc.
- Internal IDs and lens `id` fields

---

## Tests

| File | Tests | Description |
|------|-------|-------------|
| `src/tests/natural/nowSummaryPanel.test.ts` | 15 | NowSummaryPanel unit tests |
| `src/tests/natural/observationRouteGuide.test.ts` | 14 | ObservationRouteGuide unit tests |
| `src/tests/natural/lensDescriptionPanel.test.ts` | 13 | LensDescriptionPanel unit tests |
| `src/tests/natural/terminologyDictionary.test.ts` | 13 | TerminologyDictionary unit tests |
| `src/tests/natural/viewModeSelector.test.ts` | 21 | ViewModeSelector unit tests |
| `src/tests/ui/japaneseFirstUI.test.ts` | 15 | Cross-panel JP label guard |

91 new tests added. All existing tests updated to match v2.4 JP labels.
Total: **708 → 799** tests, all pass.

---

## Design Principles

- **Japanese-first**: Display labels are Japanese. English remains in IDs, aria-labels, data attributes.
- **No mystical claims**: No consciousness/soul/life/intelligence proof claims anywhere.
- **Observation framing**: Everything is "観測", not assertion.
- **Disclaimer always present**: Each panel has an appropriate JP disclaimer.
- **English accessible**: Detail views, aria-labels, and parenthetical references keep English reachable.

---

## Roadmap

```
v2.4 ✓ 日本語ファーストUI / 用語整理
v2.5   初見オンボーディング / 観測ルート
v2.6   観測レンズ説明 / 用語辞典 (統合)
v2.7   「今起きていること」要約パネル (統合)
v2.8   スマホUI再設計 / 観測室レイアウト
v2.9   初見ユーザーテスト用QA
v3.0   Public Demo Final Runbook
```
