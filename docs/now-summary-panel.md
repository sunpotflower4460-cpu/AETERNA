# Now Summary Panel — AETERNA-NATURAL v2.7

## 概要

「今起きていること要約パネル」は、AETERNAの現在の観測状態を8つのセクションで整理して表示するパネルです。

**このパネルはAETERNAの発話ではありません。観測装置による条件観測です。意識・生命・知性の証明ではありません。**

---

## 1. 目的

観測者（研究者・初心者を問わず）が、AETERNAの現在の状態を一覧で把握できるようにします。

- 初心者モード: かんたんな2〜3行サマリー + 主要2セクション
- 研究者モード: 全8セクション + 詳細指標
- 開発者モード: 全セクション + ソース指標ID表示

---

## 2. 設計原則

- LLM/API呼び出しなし（ルールベース）
- 日本語ファースト
- undefined値は絶対に0として扱わない（不足は'insufficient'で報告）
- 意識・生命・知性の証明主張なし
- すべての表示テキストはXSSセーフ（_esc()経由）
- 既存コード（NowSummaryState / deriveNowSummary in ui/summary/）は変更しない

---

## 3. セクション一覧

### 3.1 トーラス生命場（torusLifeField）

使用指標: arousal, sigma, phaseCoherence, clusterRatio, baselineLevel, residueLevel, firingRateError

注意: トーラス生命場の活動は生命や意識の証明ではありません。

### 3.2 生命幹（vitalStem）

使用指標: energy, stability, overload, fatigue, modeState, actionState, orientingDrive, restDrive

注意: 生命幹サマリーは生命の証明ではありません。持続・反応・回復・状態依存性の観測です。

### 3.3 身体-世界ループ（bodyWorldLoop）

使用指標: loopGain, returnStrength, returnMismatch, selfCausedMatch, closureStability, membraneDeformation, actuationReturnOverlap

注意: 閉ループ候補の観測です。因果証明ではありません。

### 3.4 履歴と痕跡（history）

使用指標: activityResidue, traceStrength, replayReadiness, plasticityTrace, recentHistoryBias

注意: これは意味記憶ではありません。場に残る履歴・痕跡・再発しやすさの観測です。

### 3.5 創発候補（emergenceCandidates）

使用指標: vortexCandidateCount, protoPointCandidateCount, protoNeuronCandidateCount, protoNetworkCandidateCount, maxProtoNeuronConfidence, maxProtoNetworkConfidence

注意: proto-neuron / proto-network は意味ノードではありません。創発候補の観測です。

### 3.6 リスク（risks）

使用指標: collapseRisk, saturationRisk, feedbackSaturationRisk, overload, nanOrInfinityCount

注意: リスク指標が高い場合は、Safe Baselineと比較してください。

### 3.7 信号のやり取り（signalExchange）

使用指標: touchActive, soundActive, lightActive, motionActive, recentInputKind, recentActionPulse, actionState, returnStrength

注意: 信号のやり取りは言語的な会話ではありません。低層の入力・反応・戻り・履歴の観測です。

### 3.8 意識候補条件（consciousnessCandidateConditions）

使用指標: 複数の指標から10の条件を評価

注意: これは意識の証明ではありません。意識が宿るかもしれない前提条件の一部を観測可能な指標として整理したものです。

---

## 4. 意識候補条件の10項目

1. **持続性** — エネルギー観測値を使用
2. **境界性** — 膜変形観測値を使用
3. **状態依存応答** — モード状態を使用
4. **履歴依存性** — 痕跡強度を使用
5. **閉ループ性** — 閉ループ安定性を使用
6. **自己維持傾向** — 安定性を使用
7. **予測誤差応答** — 予測感度を使用
8. **自発性** — 探索ドライブを使用
9. **統合性** — 位相コヒーレンスを使用
10. **信号対話性** — タッチ/音/光/動き入力を使用

各条件のステータス: observed（観測）/ weak（弱観測）/ notObserved（非観測）/ insufficient（観測値不足）

---

## 5. 信頼度レベル

- **high（高）**: 使用指標の2/3以上が定義済み
- **medium（中）**: 使用指標の1/3〜2/3が定義済み
- **low（低）**: 使用指標の1/3未満が定義済み
- **insufficient（不足）**: 定義済み指標なし

---

## 6. 重大度レベル

- **calm（安定）**: 通常の観測状態
- **active（活性）**: 活動が活発な状態
- **strained（過負荷）**: 過負荷・ストレス状態
- **recovering（回復中）**: 疲労・回復状態
- **unstable（不安定）**: NaN/Infinity検出等の重大問題
- **unknown（不明）**: データ不足のため判定不可

---

## 7. ファイル構成

| ファイル | 説明 |
|---------|------|
| `src/types/nowSummary.ts` | 型定義（v2.7追加型を含む） |
| `src/observer/deriveNowSummary.ts` | 導出ロジック（NEW） |
| `src/ui/observation/NowSummaryPanel.tsx` | パネルHTML描画（NEW） |
| `src/ui/observation/NowSummarySectionCard.tsx` | セクションカードHTML描画（NEW） |
| `src/ui/observation/ConsciousnessCandidateConditionsPanel.tsx` | 意識候補条件パネル（NEW） |

---

## 8. 表示モード

### 初心者モード（beginner）

- overallOneLineJa（全体1行）
- beginnerSummaryJa（2〜3行）
- vitalStem + bodyWorldLoop の2セクションのみ
- suggestedNextObservations（次の観測候補）

### 研究者モード（researcher）

- 全8セクション（詳細付き）
- researcherSummaryJa
- strongestObservedChanges

### 開発者モード（developer）

- 研究者モードと同じ + ソース指標ID表示

---

## 9. Safe Baselineボタン

すべてのモードで「Safe Baselineと比較する」ボタンが表示されます。

クリック時: `window.dispatchEvent(new CustomEvent('nowSummary:safeBaselineCompare', { detail: { timestamp } }))`

---

## 10. 免責事項（claimGuard）

常に以下のテキストが表示されます:

> このパネルはAETERNAの発話ではありません。観測装置による条件観測です。意識・生命・知性の証明ではありません。

---

## 11. ガイド統合

以下の質問がルールベースガイドで処理されます:

- 「生命幹は安定してる？」→ 生命幹の観測説明
- 「閉ループはある？」→ 身体-世界ループ候補の説明
- 「意識候補条件は？」→ 重い注意付きで条件一覧
- 「今何が起きてる？」→ 今起きていることパネルへ誘導

---

## 12. モバイルタブ

「今」タブ（📋）が最初のタブとして追加されています。

---

## 13. テスト

| テストファイル | 内容 |
|------------|------|
| `src/tests/observer/deriveNowSummary.test.ts` | 導出ロジックのユニットテスト |
| `src/tests/observer/consciousnessCandidateConditions.test.ts` | 意識候補条件テスト |
| `src/tests/ui/nowSummaryPanel.test.ts` | パネル描画テスト |
| `src/tests/ui/nowSummarySectionCard.test.ts` | セクションカードテスト |
| `src/tests/ui/nowSummaryGuideIntegration.test.ts` | ガイド統合テスト |
| `src/tests/stabilization/nowSummaryCopyGuard.test.ts` | ソースコード静的検証 |

---

## 14. 禁止パターン

以下のパターンはソースコードに含めてはなりません:

- `inp.arousal ?? 0`（undefinedを0として扱う）
- `AETERNA は生きている`
- `AETERNA is conscious`
- `fetch(` / `LLM` / `API_KEY`（LLM/API呼び出し）
- `semantic node` / `意味ノードである`（proto-neuronの誤った説明）
- 意識・生命・知性の証明を主張するテキスト

---

*Reference: docs/aeterna-natural-vocabulary.md, docs/japanese-first-ui.md, docs/implementation-language-guardrails.md*
