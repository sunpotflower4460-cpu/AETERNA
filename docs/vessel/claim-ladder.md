# 主張の階段（Claim Ladder）

**Status:** docs-only. `AETERNA-TORUS` の C0〜C5 と `Aeterna-Genesis` の
measured/observed/interpretive/analogy/frontier 及び役割 E/V/S/N/F/Q を、
AETERNA の既存 kind タグ（Raw/Derived/Proxy/Check/Reference）と対応づけて
統合する。新しい階段を発明しない。

## 階段そのもの

| レベル | 名称 | 意味 | 何であってはいけないか |
|---|---|---|---|
| C0 | Idea | まだ実装されていない着想 | 実装されたかのように語ること |
| C1 | Implemented | コードとして存在する | 検証されたかのように語ること |
| C2 | Unit-validated | 個別の単体テストが通る | 全体として整合しているかのように語ること |
| C3 | Analytically validated | 解析解・保存則テストと一致する | 実測（独立実装）で確認されたかのように語ること |
| C4 | Independently corroborated | 独立した数値実装と一致する | 現実の物理現象として確認されたかのように語ること |
| C5 | Experimentally corroborated | 現実の測定データと一致する（AETERNAでは非該当が多い） | — |

各レベルの主張は、**それより下位のレベルを裏付ける証拠なしに**引き上げては
ならない（`AETERNA-TORUS/tools/claims/claims_ledger.md`「A claim's level here
must never exceed what its cited evidence artifact actually supports」）。

## 役割（Genesis の E/V/S/N/F/Q を採用）

| 役割 | 意味 |
|---|---|
| E | Emergence — 現象が観測された（水準はレベルで別途表現） |
| V | Validation — 数値的に一致した。**V は E に劣らない証拠**である |
| S | Synthesis/Circuit — 外部 oracle を含んでよいが必ず明示する |
| N | Negative — 正直な失敗。隠さず残す。一級の証拠 |
| F | Frontier — まだ観測も実装もされていない、次の一手 |
| Q | Quarantine — 第8監査（`anti-delusion-apparatus.md` 環3）に抵触し、
  上位ラベルを剥奪された状態 |

## 既存 kind タグとの対応表

AETERNA の既存 `src/i18n/valueKindLabelsJa.ts` は Raw / Derived / Proxy /
Check / Reference / Candidate / MetaObserver の7種を持つ。K-Series の主張は
これらの kind から構築されるため、対応を明記する。

| 既存 kind | 意味 | 主張階段での扱い |
|---|---|---|
| Raw | 直接の場の出力、平滑化なし | C1（実装存在）の直接的裏付けになりうる |
| Derived | Raw から計算された値 | C1〜C2 の裏付け。導出式自体が C2〜C3 の検証対象 |
| Proxy | 間接指標 | C1 止まり。C2 以上への昇格には別途検証が必要 |
| Check | 整合性不変量（0または非活性であるべき） | 帳簿・自己随伴性テスト等、C2〜C3 の直接の判定材料 |
| Reference | 比較用の基準値。力学へは戻さない | 零仮説・遮断対照の実装に用いる。それ自体は主張しない |
| Candidate | 確定していない構造候補 | E（Emergence）の候補。V による裏付けなしに確定させない |
| MetaObserver | 観測についての観測 | 環2〜環4 の自己監査に用いる |

## K-Series 各フェーズの現在の到達レベル

本表は `docs/vessel/white-ceilings.md` の実測が入るまでの初期値であり、
K フェーズが進むごとに更新する。

| フェーズ | 現在の到達レベル | 根拠 |
|---|---|---|
| K0（本憲章） | C1 | 設計書として実装済み（docs-only） |
| K1（土台） | C2 | `src/tests/experiments/seededDeterminism.test.ts` で同一seed・同一入力の bit 一致を検証済み。CI で継続検証される |
| K2 PR2（geometry/state/params/自己随伴L） | C3 | `src/tests/pure/` 47 テストで検証: L の自己随伴性は代数的に保証された設計であり数値実験でも確認（相対誤差 <1e-9）、torus 全面積は解析解 4π²Rr と厳密一致（cos の離散直交性による）、同一seedでの状態一致を確認。**時間発展は未実装**（PR3 以降） |
| K2 PR3（保存部Strang分割積分器） | C3 | `src/tests/pure/` 32 テスト追加（計79）で検証: 非線形位相回転は厳密解、線形Cayley/CNはノルムを相対誤差 <1e-9（単発）/<1e-6（200tick）で保存、N保存を500〜1000tickで確認（secular drift 非検出）、H有界性を2000tick・強結合でも確認、dt半減で誤差が約1/4になる2次収束を確認、前進オイラーとの数値比較で不安定性を実証。**散逸・駆動・媒質履歴は未実装**（PR4〜PR6） |
| K2 PR4（N/H帳簿 + 散逸） | C3 | `src/tests/pure/` 18 テスト追加（計99）で検証: `dissipationLoss_N ≥ 0` を均一・非均一 ν(x) の両方で確認（代数的に空間構造に依存しない不変条件）、`dissipationLoss_H ≥ 0` を均一 ν(x) 限定で解析予測（運動項 exp(−2νdt)・四次項 exp(−4νdt) スケーリング）と数値の両方で確認、`numericalDrift_H` が保存部由来のみでν(x)の大きさに非依存であることを確認、帳簿の恒等式と residual が100tickにわたり許容誤差内。**均一νのみが範囲**（不均一νはPR6で符号保証を失う。駆動Jはまだ無くdriveWork=0） |
| K2 PR5（外部駆動 J + driveWork） | C3 | `src/tests/pure/` 13 テスト追加（計114）で検証: J(x,t) がψを読まない純関数であることをソーススキャンで確認、同位相駆動が全セルで|ψ|²を厳密に増加、逆位相駆動が厳密に減少、`driveWork_N`の符号がcos(相対位相)を0〜2πで追跡、振幅ゼロの駆動がPR4の`runDissipationTick`とビット一致（駆動が唯一の追加経路であることの直接証拠）、駆動ありでも帳簿の恒等式が40tickにわたり成立。**driveWork_Hの符号は保証しない**（設計どおり正負どちらもありうる）。媒質履歴はまだ均一ν₀のまま（PR6） |
| K2 PR6 / K3（媒質履歴 ν(x)） | C3 | `src/tests/pure/` 16 テスト追加（計131）で検証: ν(t+dt)の厳密解が解析式と一致、κ=ρ=0の退化ケースでνが不変（0/0回避）、同一パラメータでも局所|ψ(x)|²の違いで異なるν*へ緩和（observer由来ではなく局所物理量応答であることの直接証拠）、500通りのランダム試行と2000tick長時間積分でνが非負を維持（`max(ν,0)`不在をソーススキャンでも確認）、媒質履歴ステップがψ/N/Hに触れないことを型・実装の両方で保証、不均一ν(x)が`dissipationLoss_H`を負にする具体例を実証。**空間パターンは意図的に構成したテスト用のものであり、実runでの自然な収束パターンはK6/K7の観測対象** |
| K2 PR7 / K4（読み取り専用観測） | C3 | `src/tests/pure/` 26 テスト追加（計163）で検証: 手作りの4象限位相パターンで既知位置・既知符号のvortex candidateを検出（象限反転で符号反転も確認）、coherenceが既知の一様/対称キャンセル/ゼロ場ケースで正しい値、nu-|ψ|²相関が既知パターンで±1近傍、非干渉性をソーススキャン（field/ledger/drive/medium/geometryがobserve/runをimportしない）と実行時ビット一致（observe ON/OFF）の両方で確認、レポートJSON/Markdownに必須フィールドが揃うことを確認、自動スイープが同一seedで2回ともビット一致し優劣判断をしないことを確認。**測定器の設置のみ**——実際の駆動下でどんなパターンが生じるかはK5/K6の観測対象 |
| K5（物理的閉路） | C3 | `src/tests/pure/` 60 テスト追加（計217）で検証: χの厳密巡回シフトがN_χ/H_χを代数的に厳密保存（Mtickで元の場に厳密復帰）、交換境界𝒮の幾何的選択（外環赤道最近傍）を確認、対称結合（厳密ラビ回転）がユニタリで|ψ_b|²+|χ_p|²を厳密保存、`exchangeWork_N`が複数λ・複数tickで同額逆符号を厳密に達成、遮断対照（λ=0）でψ・νの軌跡がK2〜K4の開放系と30tickにわたりビット一致、往復遅延がM/shiftCellsPerTickという幾何予測どおりのタイミングで観測される。**exchangeWork_Hは同額逆符号にならないことを実測で確認**（Hの勾配項による非対称性、PR6と同型の誠実な発見）。χの媒質履歴・非線形項・𝒮の分布境界は未実装。遅延線零仮説はK6のreafference測定手法と本質的に同じであるためK6へ委ねる |
| K6（生命的閉路観測） | C0 | 未着手 |

## モジュールヘッダ形式（`src/pure/` 実装時に適用）

`PhysiCymatics/CLAUDE.md` の規律5「claim tiers必須」・6「モジュールヘッダー
必須（PUT-IN / EMERGED / claim-tier / floors）」を、`src/pure/` の各ファイルに
適用する。K1 実装 PR から以下の形式のヘッダコメントを先頭に付す。

```ts
/**
 * PUT-IN: このモジュールが前提として与える量（例: α, g, ν0, 幾何）
 * EMERGED: このモジュールの計算結果として出てくる量（結果を先に書かない）
 * claim-tier: C0〜C5 のいずれか（本ファイル時点の到達レベル）
 * floors (誠実な床): このモジュールがまだ検証していないこと
 */
```

## 禁止する混同

- Candidate を Raw であるかのように語ること（vortex candidate = 渦そのもの、
  ではない。既存 `docs/aeterna-to-node-bridge-spec.md` の禁止語リストを継承）
- V（数値一致）を伴わない E（現象観測）を確定事実として語ること
- Q（quarantine）に分類された結果を、その後の PR で静かに格上げすること
- C1（実装存在）を C3（解析解一致）であるかのように語ること
