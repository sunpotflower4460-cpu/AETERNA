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
