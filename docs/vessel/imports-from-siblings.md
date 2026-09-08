# 兄弟リポジトリからの移植一覧

**Status:** docs-only。実装は該当する K フェーズで行う。「誠実な生命の器に
必要だと思ったもののみ取り込む」という方針に従い、取り込むものと取り込まない
ものの両方を、理由とともに明記する。

## 取り込むもの

| 取り込むもの | 出所 | 何を防ぐか | 対応するK/環 |
|---|---|---|---|
| 第8監査「評価ゲートと初期条件は、結論と同型の因果を符号化してはならない」＋4つの具体テスト | `Aeterna-Genesis/LAW.md` | 最大の勘違い源。`if`文で書かなくても、初期条件と評価ゲートに答えが埋まる | 環3 |
| Emergence Levels L0〜L8 / Causal Closure C0〜C4 の機械判定規則 | `Aeterna-Genesis/docs/EMERGENCE_LEVELS.md`, `CAUSAL_CLOSURE.md` | 閾値の自前発明 | K6 |
| WHITE_CEILINGS 方法論＋「新しい機構＝新しい白＝t=0から再実行」＋「Level Nの後にLevel N+1の機能を追加してはならない」 | `Aeterna-Genesis` | 走行中の機能接ぎ木。別々の白を一つの歴史に縫い合わせること | K3, K5, K7 |
| 自己施錠する検証器（git-blobハッシュで検証器自身も施錠、REVIEW_REQUIRED=2の三値終了コード）＋anti-target-encoding正規表現ゲート＋ADRの承認マーカー必須 | `Aeterna-prism/tools/verify.py`, `prism/guardrails.py` | エージェントが自分でゲートを緩めること | 環4, K1 |
| research_compass（研究方向と主張上限を検証されるデータとして持つ） | `Aeterna-prism/configs/research_compass_v1.yaml` | 「前のPRの隣だから」で次を決めること | 環4 |
| 事前登録→零仮説較正→閾値凍結→commitバリア→本実験。零仮説コードは目標configを開けない | `Crystal-Genesis`（`null_calibration.py`, `pre_g001_guard.py`, PR8/PR12/PR13_NOTES） | 事後の閾値調整 | K6, 環3 |
| oracle→reference→implementationの黄金一致＋罠の図鑑 | `PhysiCymatics`（`oracles/`, `docs/working_ledger.md`） | 純粋物理コアが「正しい」ことをどう知るか | K2, 環3, 環4 |
| 導出によるprovenance（一次文献がなくても、次元解析・解析極限・受動性・因果性・独立実装との数値一致で「導出済み」と認める） | `AETERNA-TORUS/docs/17_DERIVATION_PROVENANCE.md` | 出典なしで止まることと、出典なしで断定することの両方 | K2, claim-ladder |
| 10の開発原則＋9つの停止条件＋C0〜C5主張台帳 | `AETERNA-TORUS/README.md`, `CLAUDE.md`, `tools/claims/claims_ledger.md` | 測定器の後付け調整 | claim-ladder, K6 |
| 一因一所有者レジストリ（重複登録でthrow）＋段階固定・非再入のステップ契約＋複式記帳台帳と`assertClosed` | `AI-village/src/physics/core/{physicsAuthority,physicsStepContract,conservationLedger}.js` | 「場へ触れる入力経路はJのみ」「solverStepOrder固定」を実行時に強制する | 環1, K2, K5 |
| AGENTS.md運用契約：1セッション=1フェーズ／自己採点をしない／迷ったら実装せず質問する | `Destiny-Dice/AGENTS.md` | AETERNAにAGENTS.mdがない | ルート`AGENTS.md`（本PR） |
| 人間ゲートCI：phases.yaml（goal/do/dont/done_when）＋Required-reviewer環境＋Narrow/Wide-Code/Wide-Userの3役レビュー | `Jibunkaigi/docs/phases.yaml`, `.github/workflows/run-phase.yml` | Issue #159が3レビューを名指しで要求しているのに機構がない | 環4, K1 |
| 番号付き写像カタログ（M2→M11、各変換の実装位置つき） | `Cheese-Machine-75/src/core/mappings/mappingCatalog.ts` | 141docsと約200メトリクスの間で主張の出所が辿れないこと | 環2 |

## 取り込まないもの

| 取り込まないもの | 出所 | 理由 |
|---|---|---|
| Node-AI-Z の意味層（proto-meaning, utterance, trunk/branch governance等） | `Node-AI-Z` | `Node-AI-Z/docs/architecture-boundary.md` が既に torus / organism / physical disk を「別リポジトリ（例: AETERNA系）」と外側から線引きしている。器の中に意味層を入れない。既存の `docs/aeterna-to-node-bridge-spec.md` の一方向・サニタイザ付き境界のままにする |
| Jibunkaigi の複数人格エージェント（レイ・ジョー・ケン・ミナ・サトウ） | `Jibunkaigi` | 意味層と同様、器の外側の関心事。人間ゲートCIの機構のみ移植し、内容は移植しない |
| Destiny-Dice の量子RNGプロバイダ・one-year実験の運用インフラ | `Destiny-Dice` | 器の物理コアとは無関係の実験運用ドメイン。AGENTS.md運用契約のみ移植する |
| Cheese-Machine-75 のRaw/Measured/Inferred/Revised層とホームチェック | `Cheese-Machine-75` | 写像カタログのアイデアのみ移植し、観測対象（粒子検出イベント）はAETERNAの対象と無関係 |
| AI-villageの建築物理（FEM、破壊力学、音響）そのもの | `AI-village` | 器のドメインと無関係。ownership registry / step contract / conservation ledger という**構造**のみ移植する |
| AETERNA-TORUSの音響ドメイン固有部分（膜モーダル動力学、C++実装） | `AETERNA-TORUS` | ドメインが異なる。原則・停止条件・claims ledgerという**規律**のみ移植する |

## 移植の原則

移植するのは常に**構造・規律・方法論**であり、**ドメイン固有の内容**では
ない。この区別を `docs/vessel/` の各文書で維持する。取り込んだ規律に
AETERNA 固有の値（閾値、パラメータ名）を新規に発明して埋め込むことは、
移植ではなく新設計であり、別途 ADR 相当のレビューを要する
（`anti-delusion-apparatus.md` 環4）。
