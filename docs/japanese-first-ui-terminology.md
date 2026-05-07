# AETERNA-NATURAL v2.4 Japanese-First UI / Terminology Organization

## 1. Purpose

AETERNA-NATURAL v2.4 は、初見ユーザーが英語ラベルや専門語で迷わないように、UI / 用語 / tooltip / docs / guide を日本語ファーストにする整備です。

新しい dynamics は追加しません。
目的は、AETERNA-NATURAL の観測UIを初見ユーザーにも読めるように、日本語表示名・説明文・用語辞典・内部ID表示方針を整えることです。

---

## 2. Japanese-First Policy

- UI の表示ラベルはすべて日本語を優先します
- 英語ラベルは aria-label・data 属性・研究者/開発者モードの詳細表示に置きます
- 初見モード（beginner）では専門語と internalId を隠します
- 研究者モード（researcher）では英語名を表示します
- 開発者モード（developer）では英語名 + internalId を表示します

---

## 3. Internal ID vs Display Label

表示名と内部IDは分離されています。

| 表示 | 内部ID | 種別 |
|------|--------|------|
| 渦候補の強さ | `vortexCandidateConfidence` | 補助指標 / Proxy |
| 弱い媒質履歴 | `weakPlasticityTrace` | 測定値 / Measured |
| 関連候補 | `causalTrace` | 補助指標 / Proxy |
| 観測スナップショット再生 | `timeReplay` | 表示用に平滑化 / Presentation-smoothed |
| 観測比率 | `observedRatio` | 導出値 / Derived |
| 膜の変形 | `membraneDeformation` | 導出値 / Derived |

実装方針:

- **初見モード**: 日本語名のみ
- **通常観測**: 日本語名 + 種別
- **研究者モード**: 日本語名 + 英語名
- **開発者モード**: 日本語名 + 英語名 + internalId

---

## 4. Beginner / Standard / Researcher / Developer Modes

### Beginner（はじめて見る）

表示するもの:
- 今これは何か
- 今の状態
- セル観測（基本）
- 渦候補・振幅・位相（基本用語）
- 観測ガイド
- 観測スナップショット再生
- 保存
- これは何ではないか（免責）

隠すもの:
- internalId
- raw diagnostic logs
- advanced metrics
- developer warnings
- complex config names
- layer correlation・difference view・ratio involvement（専門パネル）

### Standard（通常観測）

- すべての Beginner 機能
- セル観測パネル（完全）
- 観測レンズ
- 全用語の種別バッジ
- 時間（スナップショット再生）

### Researcher（研究者モード）

- すべての Standard 機能
- 英語名を表示
- 層の相関・関連候補・差分表示・観測比率
- 研究エクスポート
- 用語辞典（全用語）

### Developer（開発者モード）

- すべての Researcher 機能
- 英語名 + internalId を表示
- 生ログ・設定・デバッグ表示
- 開発者警告

---

## 5. Required Term Dictionary

`src/i18n/observationTermsJa.ts` にすべての必須用語が定義されています。

各用語は `ObservationTermDefinition` 型で、以下のフィールドを持ちます:

```typescript
export interface ObservationTermDefinition {
  id: string;
  jaLabel: string;
  enLabel?: string;
  internalId?: string;
  shortDescriptionJa: string;
  longDescriptionJa: string;
  whatItShowsJa: string;
  whatItIsNotJa: string;
  highValueHintJa?: string;
  lowValueHintJa?: string;
  nextToLookJa?: string;
  valueKind?: 'Raw' | 'Measured' | 'Derived' | 'Proxy' | 'Check' | 'Reference' | 'Presentation-smoothed';
  cautionJa: string;
  beginnerVisible: boolean;
  researcherVisible: boolean;
  developerVisible: boolean;
}
```

必須用語一覧（最低限の日本語ラベル）:

| internalId | 日本語ラベル |
|------------|-------------|
| field | 場 |
| cell | セル |
| cellIndex | セル番号 |
| uAngle | 主角（u） |
| vAngle | 副角（v） |
| innerRim | 内側リム |
| outerRim | 外側リム |
| areaElement | 面積要素 |
| gaussianCurvature | ガウス曲率 |
| meanCurvature | 平均曲率 |
| amplitude | 振幅 |
| phase | 位相 |
| phaseCoherence | 位相コヒーレンス |
| vortexCandidate | 渦候補 |
| vortexCandidateConfidence | 渦候補の強さ |
| topologicalCharge | トポロジカル電荷 |
| membrane | 膜 |
| membraneDeformation | 膜の変形 |
| actuationImprint | 起動刻印 |
| returnImprint | 帰還刻印 |
| weakPlasticityTrace | 弱い媒質履歴 |
| plasticityTrace | 媒質履歴 |
| resistanceScale | 抵抗変化 |
| observedRatio | 観測比率 |
| observedRatioInvolvement | 観測比率への関与 |
| referenceRatio | 参照比率 |
| causalTrace | 関連候補 |
| possibleContributingSignals | 関与している可能性のある観測値 |
| layerCorrelation | 層の相関 |
| differenceView | 変化の比較 |
| timeReplay | 観測スナップショット再生 |
| replaySnapshot | 観測スナップショット |
| lensContext | レンズコンテキスト |
| metricSpotlight | 観測レンズ |
| cellInspector | セル観測 |
| visualLens | 可視レンズ |
| observationGuide | 観測ガイド |
| proxy | 補助指標 |
| derived | 導出値 |
| reference | 参照値 |
| check | 確認値 |
| notObserved | 未観測 |
| notCausalProof | 因果証明ではありません |

---

## 6. Value Kind Translations

`src/i18n/valueKindLabelsJa.ts` に定義されています。

| ValueKind | 日本語 | 説明 |
|-----------|--------|------|
| Raw | 生値 | ランタイムから直接取得された未加工の値 |
| Measured | 測定値 | 場から直接測定された観測値 |
| Derived | 導出値 | 他の観測値を組み合わせて計算された値 |
| Proxy | 補助指標 | 状態を読みやすくするための観測補助値 |
| Check | 確認値 | 破綻や整合性を確認するための値 |
| Reference | 参照値 | 比較のために使う値 |
| Presentation-smoothed | 表示用に平滑化 | 表示を見やすくするために平滑化処理された値 |

---

## 7. Panel Copy Rules

各主要パネルには短い日本語説明を置きます。

### セル観測（Cell Inspector）

選択したセルで、今どんな値が観測されているかを表示します。
気になる値を押すと、その値を見やすくする観測レンズに切り替わります。

### 観測レンズ（Metric Spotlight）

選択した値を、トーラス場の上で見やすく表示します。
これは実際の観測値を可視化したもので、存在しない現象を演出するものではありません。

### 観測スナップショット再生（Time Replay）

記録された観測スナップショットを表示します。
runtime 自体が過去へ戻るわけではありません。

### 関連候補（Causal Trace）

近い時間・場所・層で一緒に変化した観測値を表示します。
これは因果証明ではなく、関連候補です。

### 観測ガイド（Observation Guide）

観測ガイドに、今見ている値やレンズについて質問できます。
ガイドは観測補助であり、AETERNA 本体の発話ではありません。

---

## 8. Glossary UI

`src/ui/terms/` に用語辞典UIコンポーネントがあります。

- `ObservationGlossaryPanel.tsx` — 用語辞典パネル全体
- `ObservationTermCard.tsx` — 個別用語カード
- `TermTooltip.tsx` — 軽量ツールチップ

各カードは:
- 用語名（日本語）
- 英語名（研究者/開発者モードのみ）
- 内部ID（開発者モードのみ）
- これは何か
- 何を見る値か
- 何ではないか
- 値が高い/低い時（ある場合）
- 次に見るもの（ある場合）
- 種別バッジ
- 注意事項

配置候補:
- Guide panel 内
- ObservationWorkspace のヘルプ
- 各 tooltip から開ける
- FirstRunGuide から開ける

---

## 9. Copy Guard

`src/tests/stabilization/japaneseCopyGuard.test.ts` で、禁止表現を検出します。

### 禁止日本語表現

- 意識が証明
- 生命が証明
- 知性が証明
- AETERNAは生きている
- AETERNAが感じている
- AETERNAが欲している
- AETERNAが理解した
- 神秘の証明
- 癒しの証明
- 渦は心
- 可塑性は記憶
- 比率が真理を証明

### 禁止英語表現

- consciousness proved
- life proved
- intelligence proved
- AETERNA is alive
- AETERNA feels
- AETERNA wants
- mystical proof
- healing proof
- vortex is mind
- plasticity is memory
- ratio proves truth
- fake result
- fake visual
- fake event

### 推奨表現

- 観測候補
- 補助指標
- 導出値
- 参照比較
- 関連候補
- 因果証明ではありません
- 証明ではありません
- 未観測
- 十分なデータがありません

---

## 10. Guardrails

以下は変更してはいけません:

- runtime dynamics の変更
- 新しい dynamics の追加
- LLM / API 実呼び出し
- Node bridge の追加
- semantic memory の実装
- fake visual / fake cause / fake result の追加
- 意識・生命・知性の証明表現
- consciousness claim / intelligence proof claim / life proof claim
- mystical proof claim / healing proof claim

---

## Files Added / Modified in v2.4

### New Files

| File | Purpose |
|------|---------|
| `src/i18n/observationTermsJa.ts` | 観測用語辞典（全必須用語） |
| `src/i18n/valueKindLabelsJa.ts` | 値種別バッジの日本語ラベル |
| `src/i18n/uiLabelsJa.ts` | UI全般の日本語ラベル |
| `src/config/observationDisplayModeConfig.ts` | 表示モード設定（beginner/standard/researcher/developer） |
| `src/ui/terms/ObservationGlossaryPanel.tsx` | 用語辞典パネル |
| `src/ui/terms/ObservationTermCard.tsx` | 用語カード |
| `src/ui/terms/TermTooltip.tsx` | 用語ツールチップ |
| `src/tests/i18n/observationTermsJa.test.ts` | observationTermsJa テスト |
| `src/tests/i18n/valueKindLabelsJa.test.ts` | valueKindLabelsJa テスト |
| `src/tests/ui/observationGlossaryPanel.test.ts` | ObservationGlossaryPanel テスト |
| `src/tests/ui/japaneseFirstLabels.test.ts` | 日本語ラベル横断テスト |
| `src/tests/ui/beginnerModeVisibility.test.ts` | 初見モード表示テスト |
| `src/tests/stabilization/japaneseCopyGuard.test.ts` | 日本語コピーガード |
| `docs/japanese-first-ui-terminology.md` | このドキュメント |

### Updated Files

| File | Change |
|------|--------|
| `README.md` | 日本語説明を冒頭に追加 |
| `src/i18n/jpTerminology.ts` | v2.4で追加済み（JP labels中心） |
| `src/ui/natural/` | v2.4で追加済み（NowSummaryPanel, ViewModeSelector等） |
| `src/ui/observation/` | v2.4で更新済み（Japanese panel titles） |

---

*AETERNA-NATURAL v2.4 — no runtime dynamics changes, no fake visual, no consciousness/life/intelligence proof claims.*
