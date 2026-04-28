# Scientific UI / UX Principles

## 目的

AETERNA の UI / UX / Visualization 改善に入る前に、正確さを保ったまま「見える・触れる・理解できる」観測装置にするための原則を固定する。

AETERNA の美しさは、演出ではなく翻訳である。  
実際のトーラス生命場・流れ・抵抗・散逸・遅延・境界交換・痕跡・戻り・閉ループを、人間が観測しやすい形へ翻訳することが UI の役割である。

---

## 1.1 UI の中核定義

**AETERNA の UI は、操作パネルではなく観測窓である。**

UI の目的は、以下を人間が理解できるようにすることである：

- 今、内部で何が流れているか
- 何が外へ出たか
- World Medium がどう変化したか
- 何が戻ってきたか
- 出たものと戻ったものがどう噛み合ったか
- どこに trace / residue が残ったか
- どの局所領域が励起しやすい状態か
- 反復流路や proto-network candidate が観測されるか

ただし、これは意味化・人格化・感情化ではない。

---

## 1.2 美しさの原則

AETERNA の美しさは、演出ではなく翻訳である。

実際の field / activity / trace / return / closure / local excitability / repeated flow / proto-network candidate を、人間が観測しやすい色・光・密度・線・透明度・タイムラインへ変換する。

### 禁止

- 見栄えのために fake energy を足す
- 生命っぽく見せるために fake fluctuation を足す
- 値がない場所を強く光らせる
- energy が通っていない場所に flow を描く
- semantic meaning があるように色をつける
- 感情・意思・意識のように見せる

### 許可

- raw value の可視化
- derived value の可視化
- proxy value の可視化
- presentation smoothing（明示的に区別したうえで）
- interpolation（明示的に区別したうえで）
- tone mapping
- color normalization
- raw / smoothed toggle

**ただし、presentation smoothing は必ず明記する。**

---

## 1.3 raw / derived / proxy / presentation-smoothed の区分

UI 上でも可能な限りこの区分を表示する方針とする。

| 区分 | 定義 | 例 |
|---|---|---|
| **Measured** | 実際に直接測っている値 | pulse intensity, echoLevel, return intensity |
| **Derived** | Measured や state から計算された値 | flowContinuity, returnStrength, traceResidue |
| **Proxy** | 直接測れない概念の代理指標 | closureStability, selfCausedMatch, proto-network confidence |
| **Presentation-smoothed** | 人間が見やすいように補間・平滑化した表示値 | （raw と区別する） |

---

## 1.4 禁止事項（実装時）

以下を実装してはいけない：

- `addFakeEnergy()`
- `addOrganicWobble()`
- `addLifeLikeSparkle()`
- `forceBeautifulFlow()`
- `randomGlowWhenQuiet()`
- semantic node / object label / same-object detection / teacher binding / language meaning / LLM teacher
- consciousness / self-awareness / emotion claim の UI 表示

---

## 1.5 API なしでの観測可能性

API key がなくても、以下を最低限理解できる default guide を用意する方針とする：

- 現在の metrics を読む
- 今起きていることを短文で説明する
- 用語を説明する
- 次に見るべきパネルを案内する
- 次に試せる scenario を提案する

深い推論・LLM 的な自由会話・意味づけ・生命/意識/感情の断定はしない。

---

## 関連文書

- `docs/visualization-integrity-principles.md` — 可視化の整合性原則
- `docs/ui-information-architecture.md` — UI 情報アーキテクチャ（3層）
- `docs/torus-visualization-requirements.md` — トーラス表示要件
- `docs/default-guide-principles.md` — Default Guide 方針
- `docs/ui-ux-roadmap.md` — U0〜U8 ロードマップ
- `docs/natural-emergence-principles.md` — Natural Emergence 原則
- `docs/implementation-language-guardrails.md` — 実装言語の禁止事項
