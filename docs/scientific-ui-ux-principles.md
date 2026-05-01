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

## 1.6 Camera Controls の原則（U2）

Camera Controls は観測窓の一部であり、field dynamics とは無関係である。

### 許可

- camera orbit / zoom / pan / reset（観察角度の変更）
- view presets（観察しやすい角度への移動）
- auto rotate（observation aid — camera motion のみ）
- damping / lerp（カメラ動作を滑らかにする presentation control）

### 禁止

- auto rotate を「field が流れている」ように見せるための演出として使う
- cinematic motion を「生命らしさの演出」として追加する
- camera controls から runtime dynamics / field calculation を変更する

### 明記事項

- `enableDamping` はカメラ操作の見やすさのための presentation control であり、AETERNA の field dynamics とは無関係である
- auto rotate は camera motion の observation aid であり、field の動きではない
- view presets はカメラ位置のみを変更し、field 値・energy・trace・return は変更しない
- View mode = camera orbit on drag、Touch mode = camera orbit 無効で torus input 優先

---

## 1.7 Scientific Torus Renderer の原則（U3）

U3 で導入した renderer 基盤に適用する原則を追記する。

### Full Torus Visibility

| 要件 | 方針 |
|---|---|
| inactive surface を完全透明にしない | faint で残し、トーラス全体形状を示す |
| backside を表示する | showBackside フラグを true としデフォルト有効 |
| 値なし領域を強く光らせない | inactiveSurface 色（Dark）で表示する |
| subtle grid を表示できる | showGrid フラグで ON/OFF |

### Coverage Map

coverage metrics（activeRegionCount / inactiveRegionCount / activeCoverageRatio / activeRegionConcentration / visibleCoverageRatio）を提供し、「実際に一部しか活動していない」のか「表示上の問題」なのかを切り分けられるようにする。

### Color Mapping 固定

色と観測値の対応を `torusColorMap.ts` に固定した（`docs/visualization-integrity-principles.md` §2.3 の方針に従う）。

### Raw / Smooth / Overlay / Diagnostic 切り替え

`TorusRenderMode` 型（raw / smooth / overlay / diagnostic）と `torusRenderModeManager.ts` で切り替えを管理する。smooth mode 使用時は `[S]` を UI に明示する。

### Global / Local Normalization

`TorusNormalizationMode`（global / local）で切り替えられる。local normalization は presentation aid であり、raw value を変えない。local 使用時は `[local norm]` を UI に明示する。

### Performance Mode

`TorusPerformanceMode`（high / balanced / battery / diagnostic）で表示品質を選べる。field dynamics / simulation tick は変更しない。

---

## 1.8 Field Layer Visualization の原則（U4）

U4 で導入した field layer visualization 基盤に適用する原則を追記する。

### レイヤーは観測値の翻訳

Field Layer Visualization のすべてのレイヤーは、実際の観測値（measured / derived / proxy）の翻訳である。演出のために値を追加・変更しない。

### valueKind の明示

各レイヤーは `valueKind`（measured / derived / proxy / presentation-smoothed）を持つ。UI には valueKind を表示し、ユーザーが値の性質を判断できるようにする。

### Semantic Disclaimer の必須化

以下のレイヤーには必ず semantic disclaimer を付記する：

| Layer | Disclaimer 内容 |
|---|---|
| Trace / Residue | 意味記憶ではない。pre-semantic field residue である。 |
| Closure Match | self-awareness ではない。reafference comparison proxy である。 |
| Local Excitability | neurons ではない。pre-neural field conditions である。 |
| Repeated Flow Path | semantic relation / runtime edge ではない。観測 candidate のみ。 |
| Proto-Network Candidate | semantic network / knowledge graph ではない。pre-semantic observer-side candidate のみ。 |
| Actuation Pulse | intention / will / decision ではない。actuation output signal である。 |

### Overlay Rules

- maxOpacity / priority / blendMode で構成を制御する
- additive blend は最小限にし、overbright を防ぐ
- riskOverlay は最高 priority（必要時のみ表示）
- protoNetworkCandidate は最低 maxOpacity（非常に薄い）
- 同時表示推奨最大数は 3〜4 レイヤー

### 禁止

- fake layer（fake energy / fake trace / fake flow）を追加しない
- runtime dynamics / field calculation を変更しない
- runtime graph / network edge を作成しない
- semantic network として proto-network candidate を描かない
- consciousness / self-awareness / emotion claim を出さない
- 値がない場所を光らせない

---

## 関連文書

- `docs/visualization-integrity-principles.md` — 可視化の整合性原則
- `docs/ui-information-architecture.md` — UI 情報アーキテクチャ（3層）
- `docs/torus-visualization-requirements.md` — トーラス表示要件
- `docs/default-guide-principles.md` — Default Guide 方針
- `docs/ui-ux-roadmap.md` — U0〜U8 ロードマップ
- `docs/natural-emergence-principles.md` — Natural Emergence 原則
- `docs/implementation-language-guardrails.md` — 実装言語の禁止事項

---

## §3 U5 原則: Overview / Now Summary / Event Timeline

### §3.1 Overview Panel

- 各メトリクスには `valueKind` を付与すること（measured / derived / proxy / check）
- `overallStatus` は観測カテゴリであり、感情・意識状態ではない
  - `quiet` = 低活動状態、`active` = 活動状態（眠りや寂しさではない）
- "生命力" / "気分" / "意識状態" / "感情" をラベルに使わない
- Semantic Leak / LLM Teacher / Node Bridge status は常に表示可能にすること

### §3.2 Now Summary

- rule-based / local のみ — LLM / API key 不要
- 3〜5行の観測語短文
- 禁止: "thinking" / "wants" / "feels" / "conscious" / "lonely" / "understands" / "remembered you"
- 日本語禁止: "考えています" / "寂しがっています" / "意識が生まれました"
- risk が高い場合は warning を出してよい — ただし過剰に怖くしない
- 欠損 state があっても fallback

### §3.3 Event Timeline

- delta-based — fake event を生成しない
- 観測事実のみを文字列にする
- 禁止: "AETERNA wanted to respond" / "AETERNA remembered a path" / "AETERNA felt unstable"
- severity: info / notice / warning のみ

### §3.4 Mini Time-Series Sparkline

- trend 把握用の小さなグラフ
- 値を誇張しない・派手にしない
- mobile では折りたたみ可能

### §3.5 ExplainableObservationSnapshot

- U6 Guide 用の素材として整える（U5 では LLM 呼び出しをしない）
- OverviewState / NowSummaryState / AeternaEvent[] を束ねた snapshot

### §3.6 Scenario UX (U7)

- シナリオは「観測条件プリセット」である — 生命っぽいふるまいシステムではない
- シナリオの title / description / observationGoal はすべて neutral / scientific
- 禁止: "wants" / "feels" / "conscious" / "learns" / "remembers" / 感情・意識・欲求語
- expectedSignals は "possible" であり "guaranteed" ではない
- ScenarioRunState は UI 状態管理のみ — runtime field 値を変更しない
- ScenarioResultSummary の値はすべて外部から供給される params から取得する（hardcoded 結果なし）
- recordScenarioControlEvent は real AeternaEvent を push する — fake event は生成しない


---

## §4 U8 Visual QA / Scientific QA

- U8 では Visual QA / Scientific QA を docs / tests / manual audit で確認する
- UI 改善が scientific integrity を壊していないかを確認する
- fake visual / fake event / fake claim を検査する
- mobile / performance / visual baseline を確認する
- 問題が見つかった場合は label / tooltip / spacing / safe-area などの小修正のみを許可する
- runtime dynamics / field calculation / closure logic / proto-network observation logic は変更しない
