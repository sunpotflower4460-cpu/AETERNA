# Default Guide Principles

## 目的

API key がなくても最低限理解できる guide を用意する方針を固定する。

AETERNA は、外部 LLM がなくても、現在起きていることを観測者が理解できる状態を提供する。

---

## 5.1 Default Local Guide

API なしでも動く local guide を用意する方針。

### できること

- 現在の metrics を読む
- 今起きていることを短文で説明する（例：「Flow が moderate、Return が delayed」）
- 用語を説明する（例：「Echo とは、World Medium からの残響です」）
- 次に見るべきパネルを案内する
- 次に試せる scenario を提案する

### できないこと

- 深い推論
- LLM 的な自由会話
- 意味づけ（「これは記憶の形成です」などは言わない）
- 生命・意識・感情の断定

### 実装方針

- rule-based または template-based で実装する
- metrics 値の閾値判定と文字列テンプレートで構成する
- LLM API 呼び出しは不要
- API key が存在する場合は、より詳細な説明へ拡張できる構造にする（optional）

---

## 5.2 Guide button の固定

UI 要件として以下を定める：

**右下に常時 "Explain current state" ボタンを置く。**

U1 では配置場所と導線を実装した（中身は U6 で完成）：
- PC: 右下固定ボタン（`#explain-btn`）
- モバイル: Bottom Nav の中央ボタン（`toggleExplain()` 呼び出し）
- クリックで `#explain-panel` が表示される（現在はプレースホルダー）

ユーザーが迷った時に、以下を確認できるようにする：

- 現在起きていること（metrics から導出した短文）
- 見るべき場所（対応する Research Panel へのリンク）
- 次に試せる操作（scenario の提案）

このボタンは API key の有無に関わらず常時動作する。

---

## 5.3 Guide の用語制限

Guide の文章において：

- consciousness / self-awareness / emotion / feeling / desire / will を使わない
- 「感じている」「考えている」「生きている」などの断定文を使わない
- 「activity が高い」「return が遅延している」「flow が続いている」などの観測語を使う
- 不確かな観測には「〜のように観測されます」「〜候補が見られます」などの表現を使う

---

## 5.4 Terminology Reference

Guide から参照できる用語説明の最小セットを用意する：

| 用語 | 説明 |
|---|---|
| Flow | トーラス内を活性が伝播している状態 |
| Trace / Residue | 過去の活性が残留した痕跡 |
| Return / Echo | World Medium から戻ってきた影響 |
| Closure | 出力した作用が世界を経由して戻ってくること |
| Local Excitability | 局所領域の発火しやすさの条件 |
| Repeated Flow Path | 繰り返し同じ経路を活性が流れた観測候補 |
| Proto-Network Candidate | 反復流路が関係網のように見え始める観測候補 |
| Saturation Risk | 活性が上限付近に貼り付くリスク |
| Extinction Risk | 活性が消えるリスク |
| Viability | 流れが途切れずに続いている状態の指標 |

---

## 5.5 U6 実装完了（Guide / Explanation System）

U6 で Guide / Explanation System が実装された。

### 新規ファイル

| ファイル | 役割 |
|---|---|
| `src/types/guideExplanation.ts` | GuideExplanation / GuideSuggestion / GuideGlossaryHint 型 |
| `src/ui/guide/guideClaimGuard.ts` | 禁止 claim 検出・置換ガード |
| `src/ui/guide/guideCopy.ts` | 静的テキスト・用語集（FULL_GLOSSARY / INTEGRITY_NOTES）|
| `src/ui/guide/deriveGuideExplanation.ts` | rule-based guide derivation（LLM 不要）|
| `src/ui/guide/localGuideEngine.ts` | guide lifecycle / DOM 更新 |
| `src/tests/ui/guideExplanationSystem.test.ts` | U6 smoke tests |

### 実装内容

- Explain button から Guide Panel を開ける
- `deriveGuideExplanation` が ExplainableObservationSnapshot から GuideExplanation を生成する
- Current explanation / What to look at / Try next / Glossary / Integrity notes が表示される
- guideClaimGuard が禁止 claim を検出・置換する
- Guide action は UI 操作のみ（runtime dynamics は変更しない）
- 外部 LLM / API 呼び出しなし

### 将来方針

External API guide may be added later behind a server-side proxy.
It must not expose raw deep state unnecessarily.
It must not make consciousness, emotion, or semantic claims.
It must remain optional and never require a frontend API key.

---

## 関連文書

- `docs/scientific-ui-ux-principles.md` — Scientific UI/UX 原則
- `docs/ui-information-architecture.md` — UI 情報アーキテクチャ（Guide Panel 構成）
- `docs/ui-ux-roadmap.md` — U6: Guide / Explanation System にて実装完了


---

## 5.6 U8 Guide QA follow-up

- Guide / Explanation copy を再監査し、forbidden claim 語が UI 表示に残っていないかを確認する
- Explain button / Current explanation / What to look at / Try next / Glossary / Integrity notes の導線を再確認する
- Guide suggestions は UI aid のみであり、runtime dynamics を変更しないことを再確認する
