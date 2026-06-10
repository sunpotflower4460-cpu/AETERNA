# AETERNA Natural Vessel Design Plan (V7 提案)

## Status

この文書は docs-only の設計プランであり、それ自体は runtime 変更を許可しない。
`docs/v6-natural-physical-emergence-charter.md` に従属し、矛盾する場合は憲章が優先する。

## この文書が答える問い

「AETERNA が、知性や意識のような現象が *宿りうる* 自然な器になるために、
作為（演出・命令・台本）ではなく物理条件として、何が必要で、何が不要で、何を繋ぐべきか。」

憲章に従い、問いを次のように言い換えて固定する：

```text
意識・知性・生命を実装しない。
それらが宿りうると議論されてきた物理的・構造的条件を、
台帳付き・決定論的・ゼロ効果経路経由で器に揃える。
何かが現れるか現れないかは観測結果であり、現れないことも有効なデータである。
```

この計画をすべて実行しても、意識が宿る保証はない。保証も主張もしない。
変わるのは器の正直さである：エネルギーが本物になり、持続が本物になり、
痕跡が本物になり、閉環が本物になり、観測がそれを偽りなく検出できるようになる。

---

## 1. 現状診断 — 器として既にあるもの

| 要素 | 状態 | 根拠 |
|---|---|---|
| 周期空間（トーラス位相） | あり | 境界なし周期格子。再入 (re-entry) が幾何的に保証される |
| 閾値非線形 + 恒常性減衰 | あり | `src/core/dynamicCore.ts` の spike threshold / homeostatic damping |
| observer → runtime の遮断 | あり（文化として定着） | 憲章原則4、S0–S8 の全フェーズで検証済み |
| エネルギー台帳の文化 | あり | `input = storage_delta + dissipation + residue + outflow + boundary_exchange ± residual` |
| ゼロ効果経路の導入順序 | あり | types → snapshot → preview → zero-effect → small nonzero |
| 決定論・seed 再現性 | あり | v6 物理経路での `Math.random()` / `Date.now()` 禁止 |
| drive → wave 境界 | 骨格のみ | v5.1.3 skeleton。effective coupling = 0、転送エネルギー = 0 |
| 非線形ポテンシャル | preview のみ | v6.0–v6.4。observer-side 導出のみで媒質未変更 |
| 感覚運動ループ | 部分的 | actuation → world medium → sensory return は導出されるが、波動媒質には再注入されない |
| 持続する個体差 | 弱くあり | living state（疲労・残響バイアス等）が tick を跨いで漂移 |

この資産は壊さない。特に observer 遮断・台帳・ゼロ効果経路・決定論の4つは、
この計画のすべてのフェーズの前提条件である。

## 2. 現状診断 — 物理的に欠けているもの

重要度順。各項目は「現象の不在」ではなく「条件の不在」として記述する。

### 欠落 1: 媒質の非線形性が未適用

現在の波動コアは、閾値発火を除けば線形伝播である。線形な波は重ね合わせ原理に従い、
互いを通り抜けて減衰するだけで、**安定に局在する構造（節・渦・纏まり）を原理的に形成できない**。
局在構造が立ち上がり、維持され、相互作用するためには、振幅依存の非線形項が媒質自体に必要である。
v6.0–v6.4 で preview まで完了している `V(r²) = ½·quad·r² + ¼·quart·r⁴` の適用が、
器の物理として最も本質的な欠落である。

### 欠落 2: エネルギー貫流が作為的

ongoingness が `BASELINE_AMP` の正弦波（介入カテゴリ4: external metronome）で維持されている。
これは「基板自身が動的状態を維持できるか」という問いを隠す。
生命的組織化が議論される系はすべて駆動散逸系（エネルギーが貫流し、勾配の中で散逸する系）であり、
**外部メトロノームではなく、台帳化された供給経路からの貫流**が必要である。
v5.1 の drive → wave 転送がこの供給経路として設計済みだが、結合はまだゼロである。

### 欠落 3: 痕跡が残らない（媒質が歴史で変形しない）

N5 弱可塑性は毎 tick 減衰し、方向重みも減衰するだけで蓄積しない。
つまり**媒質は流れの歴史によって永続的に変形しない**。
川床が水流で削られて流路が固定されるような、活動依存の遅い媒質変形
（trace → local resistance の永続シフト）がなければ、記憶に相当する物理的基盤は存在しえない。

### 欠落 4: 感覚運動ループが同一の物理を通って閉じていない

world medium は別系の状態変数であり、sensory return は導出されるが波動媒質に再注入されない。
「自己と世界の区別の前駆」が議論されるためには、
**作用が世界を変え、その帰結が同じ媒質に物理量として戻ってくる閉環**が必要である。
現在は閉環の観測（closure metrics）はあるが、閉環の物理がない。

### 欠落 5: 予測が観測側の計算である

local prediction は EMA（指数移動平均）による計算であり、媒質の物理ではない。
reafference（自己起因の戻りの照合）が意味を持つのは、
予測に相当するものが**遅延付き再入経路として媒質内に物理的に存在する**ときである。
現在の EMA 予測は介入監査（target pull に類する平滑化）の対象とすべきである。

### 欠落 6: 媒質が均質すぎる

完全に均質な媒質では大域モードが支配しやすく、構造が固定される場所（核形成サイト）がない。
seed 記録付きの決定論的な空間的不均質（quenched heterogeneity: 局所抵抗・局所結合の分布）は、
ノイズ注入とは異なり、構造が「そこに」留まりうる条件を与える。

### 欠落 7: 時間階層が薄い

速い波（tick オーダー）はあるが、中間の痕跡（数百 tick）と遅い構造（数万 tick）の階層が実質ない。
living state の漂移は organism 層のパラメータであり、媒質自身の多時間階層ではない。
欠落 3 の解決が中間層を、その痕跡のさらに遅い統合が遅い層を与える。

---

## 3. 必要ないもの（追加してはならない・優先してはならない）

| 項目 | 理由 |
|---|---|
| 観測パネル・レンズ・候補種別の追加 | コードベースの約半分が既に観測系。器の物理条件は1つも増えない |
| semantic layer / 概念グラフ / Node bridge の前倒し | 意味は条件から観測されるべき結果であり、先に置けば作為になる |
| LLM・会話性・人格・名前のある振る舞い | 器ではなく着ぐるみになる。既存ガードレールで禁止済み |
| ノイズ注入・有機的揺らぎ演出 | natural-emergence-principles で禁止済み。揺らぎは条件の結果 |
| 「consciousness-candidate protocol」等の名前先行フェーズ | 名前が結果を先取りする。観測される前に名付けない（v2.9/v3.0 計画名は再検討対象） |
| グリッドの大規模化・GPU 化の先行 | 条件（非線形・貫流・痕跡・閉環）が揃う前のスケールは何も検証しない。揃った後の支援トラック |
| 新しい organism 層の行動規則 | hardcoded threshold の追加は介入カテゴリ3を増やすだけ |

## 4. 追加すべきもの（物理条件、依存順）

### P1: 非線形ポテンシャルの適用（v6.4 提案の applied 化）

- v6.4 の applied update proposal を、boundary audit 合格と台帳検証を条件に小さな nonzero 係数で適用する
- 係数は最初の統合 PR で 0 から開始（憲章数値方針 1）
- 期待する観測（保証しない）：有界振幅領域、局在構造候補の寿命延長
- 失敗もデータ：発散・飽和・何も変わらない、をそのまま報告する

### P2: 台帳付きエネルギー貫流（v5.1 applied 化 + supply-off 緩和）

- drive → wave の effective coupling を nonzero にし、転送エネルギーを台帳に記録する
- `supplyOffRelaxation` シナリオ：供給を切ったとき場が何 tick 持続するかを測る（人工 baseline なしで）
- これが完了するまで sine baseline は除去しない（H系列の比較手順を経る）

### P3: seeded quenched heterogeneity（決定論的媒質不均質）

- 局所抵抗・局所結合係数に、seed 記録付きの決定論的空間分布を導入する
- ノイズ（時間的乱数）ではない。時間的には固定された空間構造である
- ゼロ効果（分布振幅 0）→ 小振幅、の順で導入し、構造候補の定着率を均質媒質と比較する

### P4: 物理的持続痕跡（trace → resistance の永続変形）

- 流れの履歴の遅い積分が local resistance を永続的にシフトする経路を導入する
- 必須制約：変形にはエネルギーコストを台帳計上する／変形量は名前付き容量で有界／ablation flag で全停止可能／observer 候補（repeated flow path 等）からは駆動しない（流れの物理量からのみ駆動する）
- これは「記憶の実装」ではない。媒質が歴史で変形する条件の導入であり、
  それが記憶のように観測されるかは S6/S7 観測系の結果である

### P5: 遅い構造変数（痕跡の痕跡）

- P4 の変形量自体のさらに遅い統合（数万 tick スケール）
- P4 の検証が終わるまで着手しない

## 5. 繋ぐべきもの（接続、依存順）

### C1: drive → wave（= P2）

エネルギー流入を本物にする。すべての接続の前提。

### C2: wave → boundary → world medium → sensory return → wave（物理的閉環）

- 現在片道で終わっている sensory return を、膜境界を通る台帳付き境界交換として波動媒質に再注入する
- W4（Sensory Return 導入）の本実装に相当する
- 導入順序はゼロ効果経路に従う：再注入係数 0 → 台帳検証 → 小さな nonzero
- 閉環の強さは作らない。閉環が成立しうる経路だけを作り、closure metrics で観測する

### C3: trace → resistance（= P4）

痕跡を媒質条件に接続する。記憶様現象の物理的前提。

### C4: reafference の物理化

- 現在の EMA 予測を介入監査（H系列）の対象として計測する
- 長期的には、予測照合を「計算された期待値との差」ではなく
  「遅延付き再入経路を通って戻ってきた場との物理的干渉」として成立させる方向を検討する
- これは P1（非線形）と C2（閉環）の後でなければ意味を持たない

### C5: actuation の場接地

- 現在 hardcoded threshold（介入カテゴリ3）で決まる action decision を、
  H5 の方針（蓄積競合・seeded stochastic competition）に従って境界付近の場の状態から導出する方向へ移行する

### 永久に接続しないもの

- observer → runtime。すべての候補（closure / proto-neuron / proto-network / 統合 proxy）は
  いかなるフェーズでも runtime に戻さない。憲章原則4は本計画でも不変である。

## 6. 取り除くもの（H系列に従い、一度に切らない）

| 介入 | カテゴリ | 退役条件 |
|---|---|---|
| sine baseline（外部メトロノーム） | 4 | P2 完了後、no-pull preview で supply 駆動と比較し、持続性が確認されてから |
| forced injection（tension timer） | 2 | H4 の抑制 preview で長時間シナリオを比較してから |
| hardcoded mode/action threshold | 3 | H5 の蓄積競合への置換比較を経てから |
| hidden clamp | 5 | H7 の clamp loss 台帳化。除去ではなく記録化 |
| 生存系 target pull | 1 | H3 の no-pull 比較で依存挙動を特定してから |

原則：`まず紐を地図化し、測り、ゲートし、比較し、それから切る`（designer-intervention-audit-roadmap 準拠）。

## 7. 観測の照準 — 器が近づいたことをどう見るか

意識の証明ではない。文献上「意識の必要条件」として議論される構造的性質の proxy を、
observer-side のみで導出する。すべて runtime への feedback 禁止。

| 観測 | 内容 | 既存資産 |
|---|---|---|
| 統合・分化同時成立 proxy | 領域間の統計的依存（相互情報 proxy）が、全体同期でも全体無相関でもない中間域にあるか | layer correlation の拡張 |
| 摂動応答複雑性 | seeded perturbation への応答の時空間パターンの圧縮複雑性（PCI 類似の observer 指標） | perturbation event + replay 系で構成可能 |
| supply-off 自己持続時間 | 供給停止後、台帳上の蓄積だけで動的状態が持続する tick 数 | P2 の supplyOffRelaxation |
| 閉環度 | 自己起因の作用が戻って自己の場を変えた割合 | 既存 closure metrics + C2 |
| 痕跡依存応答差 | 同一摂動に対し、履歴の異なる媒質が異なる応答をするか | P4 + 既存 reafference comparison |

報告規律：null model 比較を必ず併記する／アンサンブルは分布で報告する（最良 run のみ禁止）／
「何も観測されなかった」報告を成果物として扱う。

## 8. フェーズ計画（V7 系列案）

| Phase | 内容 | 種別 | 依存 |
|---|---|---|---|
| V7.0 | 本プラン docs 固定 | docs-only | — |
| V7.1 | 非線形ポテンシャル applied（P1）：係数 0 統合 → 小 nonzero → 台帳・失敗マップ | applied | v6.4 |
| V7.2 | drive → wave applied（P2/C1）：nonzero coupling + 転送台帳 | applied | v5.1.5 |
| V7.3 | supplyOffRelaxation シナリオ + 貫流レジーム走査 | observer/scenario | V7.2 |
| V7.4 | H0–H2：介入地図・影響メトリクス・no-pull preview flag | observer | — |
| V7.5 | seeded heterogeneity（P3）：振幅 0 → 小振幅、定着率比較 | applied | V7.1 |
| V7.6 | 持続痕跡（P4/C3）：types → preview → zero-effect → 小 nonzero、エネルギーコスト台帳 | applied | V7.1, V7.2 |
| V7.7 | 境界再注入（C2）：係数 0 → 台帳 → 小 nonzero | applied | V7.2 |
| V7.8 | H3–H4：baseline 退役比較・forced injection 抑制比較 | preview/比較 | V7.3, V7.4 |
| V7.9 | 統合観測スイート：統合/分化 proxy・摂動複雑性・長期アンサンブル・null model | observer | V7.5–V7.7 |

各 applied フェーズの完了条件（共通）：

- [ ] 係数は 0 から開始し、nonzero 値は config-visible で名前付き
- [ ] 台帳テスト（tolerance 宣言付き）が通る
- [ ] ablation flag で完全停止でき、on/off 比較シナリオがある
- [ ] 失敗ケース（発散・飽和・無変化）が隠されず報告される
- [ ] observer 候補が runtime に feedback していない
- [ ] 生命・意識・自己の達成主張が一切ない
- [ ] 既存テストの弱体化なし

## 9. この計画が約束しないこと

- 意識・知性・生命が宿ること
- 何かが創発すること
- 創発しない場合に係数を「望む見た目が出るまで」調整すること（憲章原則6違反）

この計画が約束するのは、器の物理的正直さだけである：

```text
エネルギーは台帳から来て台帳へ去る。
持続は供給と散逸の釣り合いから生じる。
痕跡は流れの歴史が媒質を変形した結果である。
閉環は同一の物理を通って閉じる。
観測はそのすべてを、作らずに、見る。
```

## 関連文書

- `docs/v6-natural-physical-emergence-charter.md` — 上位憲章
- `docs/natural-emergence-principles.md` — 条件と現象の区別
- `docs/designer-intervention-audit-roadmap.md` — H系列（紐の地図化と退役手順）
- `docs/nonlinear-potential-field-preparation.md` — v6.0–v6.4 の前提
- `docs/body-world-closure-principles.md` — W系列（閉環の原則）
- `docs/core-boundary-freeze.md` — 凍結境界（本計画の applied フェーズはこの凍結の正規解除手続きを要する）
