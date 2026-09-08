# 勘違い防止装置 — 環1〜環4

**Status:** docs-only. 各項目の実装は該当する K フェーズに属する（別 PR）。

うえきさんの指示「生命ループ自体を作る過程で勘違いすることを無くすため、他の
機能は外側にある」を、具体的な装置の一覧として固定する。各環は内核
（`src/pure/` の閉じた生命ループ）を読むだけで、内核へは書き戻さない。

出所の凡例: リポジトリ名とファイルパスを併記する。新規発明ではなく、既に
兄弟リポジトリで実証済みの機構を移植する。

## 環1 — 決定論・スナップショット・台帳

内核が「本当に同じ実験を繰り返せているか」を保証する層。

| 項目 | 何を防ぐか | 出所 | 完了条件 |
|---|---|---|---|
| 種つき PRNG の注入 | 実験のたびに違う乱数源が混ざり、再現不能な差分を「創発」と誤読すること | `src/world/phaseCarryingDrive.ts`（AETERNA 既存）, `Destiny-Dice/src/rng/testing/seeded.ts` | 同一 seed で bit 一致 |
| 状態のスナップショット/復元 | 長時間実験の同一性が検証できないこと | `AETERNA-TORUS` 原則8 | 復元後 bit 一致 |
| N/H 帳簿 + `assertClosed` | エネルギーの出所不明な増減を「自発的活動」と誤読すること | `docs/pure-physics-implementation-plan.md` §7, `AI-village/src/physics/core/conservationLedger.js` | 毎tick帳簿が閉じる、または未閉鎖が明示的に警告される |
| 一因一所有者レジストリ | 複数の経路が同じ場の量を書き換え、原因が特定できなくなること | `AI-village/src/physics/core/physicsAuthority.js`（重複登録で throw） | pure core 内で場への書き込み経路が J と交換項のみに限定される |
| `solverStepOrder` の固定と export | 順序を暗黙に変えて、物理差分と順序差分を混同すること | `docs/pure-physics-implementation-plan.md` §2 | 全 export に solverStepOrder が含まれる |

## 環2 — 観測ファイアウォール・写像カタログ

観測が内核に影響しないこと、および任意の結論から場の量まで遡れることを
保証する層。

| 項目 | 何を防ぐか | 出所 | 完了条件 |
|---|---|---|---|
| observer 非介入性テスト | 観測コードが場を変えてしまい、観測自体が現象を作り出すこと | `docs/pure-physics-implementation-plan.md` PR7, `AETERNA-TORUS` の Core→Observer 境界テスト | 観測 ON/OFF で場が bit 一致 |
| 番号付き写像カタログ（M2→M11型） | 141個の docs と約200のメトリクスの間で、主張の出所が辿れなくなること | `Cheese-Machine-75/src/core/mappings/mappingCatalog.ts` | 任意の K6 判定結果から、経由した場の量までのチェーンが文書化されている |
| kind タグ（Raw/Derived/Proxy/Check/Reference） | 観測値の種別を混同し、Proxy を Raw と誤読すること | 既存 AETERNA `src/i18n/valueKindLabelsJa.ts`, `AETERNA-MIDIUM` | 新規観測値にも既存 kind タグ体系を適用する（`claim-ladder.md` の対応表） |

## 環3 — 事前登録・零仮説・独立オラクル

「答えを見てから閾値を調整する」ことを構造的に禁止する層。

| 項目 | 何を防ぐか | 出所 | 完了条件 |
|---|---|---|---|
| 事前登録 → 零仮説較正 → 閾値凍結 → commit バリア → 本実験 | 事後の閾値調整による結果の水増し | `Crystal-Genesis/crystal_genesis/{null_calibration,pre_g001_guard}.py`, PR8/PR12/PR13_NOTES | K6 の判定規則・閾値が K5 実装より前にコミットされ、以後変更不可（変更するなら新しい事前登録として別実験になる） |
| 零仮説コードが目標 config を開けない | 零仮説の実装自体に答えが漏れ込むこと | `Crystal-Genesis` の測定ファイアウォール | 零仮説実行コードから本実験の閾値・config への参照が存在しない（静的 import チェック） |
| oracle → reference → implementation の黄金一致 | 純粋物理コアの積分器が「見た目は正しそうだが実は違う」ものになること | `PhysiCymatics/oracles/`, `reference/gen_golden.py` | K2 の保存則テスト（N保存・H有界性・2次収束）が、解析解または独立実装との数値一致で検証される |
| 第8監査（評価ゲート・初期条件が結論と同型の因果を符号化していないか） | `if` 文で答えを書かなくても、初期条件や評価ゲートの設計に答えが埋め込まれること | `Aeterna-Genesis/LAW.md` | K6 の判定規則についてレビュー時に「ゲートが null／自明な系でも通ってしまわないか」を確認する |

## 環4 — 人間ゲート・主張の階段・罠の図鑑

最終防衛線。エージェントが自分自身の結果を過大に読むことを、人間の判断を
挟んで防ぐ層。

| 項目 | 何を防ぐか | 出所 | 完了条件 |
|---|---|---|---|
| 主張の階段（claim ladder） | 「測定された」と「解釈」と「まだ分からない」を混同すること | `AETERNA-TORUS/tools/claims/claims_ledger.md`（C0〜C5）, `Aeterna-Genesis`（measured/observed/interpretive/analogy/frontier） | `docs/vessel/claim-ladder.md` に統合済み |
| Narrow / Wide-Code / Wide-User の3役レビュー | 単一の視点（コードの正しさのみ、あるいはユーザー体験のみ）で判断してしまうこと | `Jibunkaigi/docs/phases.yaml`, `.github/workflows/run-phase.yml` | AETERNA Issue #159 が既に要求している3レビューを、K1以降の各PRで実施する体制を作る（CI実装は別PR） |
| 自己施錠する検証器（`REVIEW_REQUIRED` 三値終了） | エージェントが自分でゲートを緩めること | `Aeterna-prism/tools/verify.py`, `prism/guardrails.py` | K1 で導入するCIに、PASS/FAIL に加え REVIEW_REQUIRED（人間レビュー必須）の状態を持たせる |
| ADR承認マーカー（`- **Status:** approved-by-owner`） | 憲章やゲート自体をエージェントが無断で変更すること | `Aeterna-prism` の governance-lock | `docs/vessel/` および `AGENTS.md` の変更は ADR相当の記録を残し、オーナー承認を明記する |
| 罠の図鑑 | 過去に踏んだ罠（測定バイアス、符号ミス等）を忘れて再度踏むこと | `PhysiCymatics/docs/working_ledger.md` | K1以降、`docs/vessel/traps.md`（未作成、K1で新設）に罠を記録する運用を開始する |
| research_compass（研究方向を検証されるデータとして持つ） | 「前のPRの隣だから」という理由だけで次を決めること | `Aeterna-prism/configs/research_compass_v1.yaml` | 新しいK フェーズの追加提案には、最低2つの方向の比較と決定的反証子を必須とする（本書と同じ形式） |

## 環の相互関係

環1〜環4 は内核（`src/pure/`）に対して**読み取り専用**であり、互いにも
一方向にのみ依存する。

```
内核 ──読まれるだけ──▶ 環1（決定論・台帳）
                        ──▶ 環2（観測）
                                ──▶ 環3（事前登録・オラクル）
                                        ──▶ 環4（人間ゲート）
```

環4から内核への書き戻しは存在しない。人間ゲートが「進めてよい」と判断した
場合でも、それは次のKフェーズの**開始許可**であって、現在の観測結果を
書き換えることではない。
