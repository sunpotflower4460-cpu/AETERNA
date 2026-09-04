# Vessel Roadmap — K0〜K8 完了条件と決定的反証子

**Status:** docs-only. K1 以降は別 PR で実装する。本書はロードマップのみを固定する。

各フェーズは既存の作法（`docs/pure-physics-implementation-plan.md` §8 の PR分割形式）
に従い、完了条件（合流条件）を持つ。加えて `Aeterna-prism` の `next_step_policy` に
倣い、**決定的反証子（decisive falsifier）**を必須とする。反証子が書けないフェーズは
開始しない。

## K0 — 器憲章（本 PR）

**内容:** `docs/vessel/` 一式、`AGENTS.md`、既存ロードマップの陳腐化解消（本書 §末尾）。

**完了条件:**
- `docs/vessel/VESSEL_CHARTER.md`, `closed-life-loop-design.md`,
  `anti-delusion-apparatus.md`, `vessel-roadmap.md`, `claim-ladder.md`,
  `white-ceilings.md`, `imports-from-siblings.md` が存在する
- `AGENTS.md`（ルート）が存在し `docs/agent-guardrails.md` から参照される
- `docs/current-roadmap.md` の W1〜W6 表記矛盾、v6.1〜v6.4 の二系統、二つの
  「v6.5」が本書内で調停されている（下記「既存ロードマップの陳腐化解消」節）
- runtime 変更ゼロ・UI 変更ゼロ・既存テスト影響ゼロ

**反証子:** N/A（docs-only フェーズに物理的反証子はない。プロセス上の完了条件のみ）

## K1 — 土台（決定論・型検査・CI・スナップショット）

**目的:** 純粋物理コアを書く前に、検証できる状態を作る。

**対応する現状の欠落:**
- core が `crypto.getRandomValues` 由来の非決定的乱数を引く
  (`src/core/hardwareRandom.ts`, `src/core/dynamicCore.ts:20-22`,
  `src/core/dormantNodes.ts:150,160`)
- 状態のシリアライズ/復元が存在しない
- CI が 1 本もない（`.github/` 不在）
- `tsconfig.json` の `include` が `src/bridge/**`, `src/signal/**`, `src/types/**`
  のみで、コードベースの一部しか型検査されていない
- `tsx` が `package.json` の scripts から使われているが devDependencies に
  宣言されていない

**作業内容:**
1. 種つき PRNG を注入方式で導入する。`src/world/phaseCarryingDrive.ts` の
   `makeSeededRandom` を共有モジュール（例: `src/utils/seededRandom.ts`）へ
   昇格し、新規実装を発明せず既存アルゴリズムを再利用する。
2. core から crypto 乱数を排除する。`hardwareRandom` は診断用途にのみ残し、
   力学のいかなる経路にも直結させない。
3. 同一 seed・同一入力列で bit 一致復帰することをテストで固定する
   （`AETERNA-TORUS` 原則8「同じ状態＋同じ入力＝同じ出力」）。
4. `tsconfig.json` の `include` を拡張し、`tsc --noEmit` が通ることを
   確認する。`tsx` を `devDependencies` に追加する。
5. CI を新設する。fast（push毎）/ slow（nightly）の二段構成を最小とし、
   `PhysiCymatics/.github/workflows/ci.yml` の構成に倣う。既存の
   `npm run check:release` と既存テストスイートを自動ゲートに載せる。

**完了条件:**
- 同一 seed で 2 回走らせた結果が bit 一致する
- CI が新設され緑である
- `tsc --noEmit` が新規/K-Series コードに対して通る

**反証子:** bit 一致が取れない場合、その原因（隠れた非決定性の発生源）を特定し
記録するまで K2 を開始しない。原因不明のまま K2 に進むことは禁止する。

**スコープ修正（2026-09-04、実装中の発見に基づく）:** 当初「完全状態のシリアラ
イズ/復元」「`tsconfig.json` の include を全域へ」と書いたが、実装に着手した
結果、両方とも K1 の本質的目的（決定論の確立）を超えて過大であることが判明した。

- **スナップショット/復元**: `AeternaNetwork`（legacy）は `initialize*State()`
  が17個あり、状態は約200フィールドに及ぶ。加えて `network.seededRandom` は
  クロージャ（関数）であり、汎用的なシリアライズができない。`src/pure/` は
  まだ存在せず（K2 で新設）、そちらは最初から遥かに小さく型付けされた状態
  （ψ の real/imag Float64Array、ν(x)、少数のスカラーパラメータ）になる
  予定である。legacy の巨大な状態に汎用リフレクションベースの
  スナップショットを今リトロフィットするより、**K2 で `src/pure/` の状態を
  設計する際に、その状態専用の snapshot/restore を最初から組み込む**方が、
  作り直しなく正しく作れる。K1 の決定論要件は
  `src/tests/experiments/seededDeterminism.test.ts`（同一seed・同一入力列で
  `ScenarioResult` 全体が bit 一致することを検証済み）で満たされているため、
  legacy engine 全体のスナップショット/復元は K1 のスコープから外し、K2 に
  先送りする。
- **tsconfig include の全域化**: `src/**/*.ts` へ拡張すると 306 件のエラーが
  出る（`allowImportingTsExtensions` と `allowJs` を追加する2つの妥当な
  config 修正だけで 156 件まで減るが、残りは legacy コードの実質的な型エラー
  であり、K-Series とは無関係な既存コードの型修正作業になる）。K1 が実際に
  必要としているのは「新しく書く K-Series コード（`src/utils/`,
  将来の `src/pure/`）が型検査されること」であり、「既存の legacy コード
  全体を今すぐ型安全にすること」ではない。`include` は
  `src/bridge/**`, `src/signal/**`, `src/types/**`（既存）に
  `src/utils/**`, `src/pure/**`（新規、`src/pure/` は K2 でディレクトリが
  作られた時点で自動的に対象になる）を追加するにとどめる。legacy 全体の
  型検査は、着手するなら独立した別フェーズとして扱う。

**K1 開始時点のベースライン（本 PR の検証で確認、2026-09-03）:** CI が存在しな
かったため未検出だった既存の失敗が、K0 時点で以下の通り確認された。これは
本 PR（docs-only）が引き起こしたものではない——本 PR は `src/` を一切変更して
おらず、以下のテストはいずれも `docs/vessel/`, `README.md`,
`docs/agent-guardrails.md`, `docs/current-roadmap.md`, `AGENTS.md` を参照しない。
K1 は CI 新設と同時にこのベースラインをゼロにする（緑にしてから隠すのではなく、
現状を先に記録する）。

```
Test Files  7 failed | 208 passed (215)
     Tests  9 failed | 3498 passed (3507)
```

失敗ファイル（vitest run、2026-09-03 時点）:

- `src/tests/behavioral/sensoryReturn.test.ts`
- `src/tests/scenario.test.ts`
  （Scenario J: Expected Touch Miss、Scenario AW: Moderate Openness Exploration）
- `src/tests/behavioral/actuationPulse.test.ts`
  （W2-D: low output readiness suppresses pulse generation）
- `src/tests/observer/nonlinearPotentialAccelerationPreview.test.ts`
- `src/tests/observer/nonlinearPotentialAppliedUpdateProposal.test.ts`（2件）
- `src/tests/stabilization/energyRealityAuditDocs.test.ts`（2件）
- `src/tests/world/externalDriveField.test.ts`
  （waveform を breath/heartbeat/life rhythm として提示していないかの guard）

K1 の作業内容に、CI 新設と並行してこれら9件の根本原因調査・修正を追加する。
修正せずに CI を緑化する（該当テストを skip/削除する）ことは
`docs/agent-guardrails.md` の変更規律に反するため禁止する。

**K1 進捗（2026-09-04 追記）:** 9件のうち8件を修正済み、1件は根本原因を特定した
上で意図的に未修正のまま残す。

- 修正済み（8件）:
  - `sensoryReturn.test.ts` — 相対 import の深さの誤り（typo）
  - `energyRealityAuditDocs.test.ts`（2件）— 禁止語ガードの素朴な部分文字列一致が
    自分自身の「❌ 避けるべき表示」ドキュメントと `energy-reality-audit.md` の
    `Not:` 例示に誤反応。`src/tests/support/claimGuard.ts` を新設し、見出し文脈と
    否定語文脈を考慮する判定に置き換え。加えて `energy-realness-principles.md` に
    欠落していた必須フレーズを追記
  - `externalDriveField.test.ts` — 同じ `claimGuard.ts` で修正（disclaimer 内の
    "life" 語への誤反応）
  - `nonlinearPotentialAccelerationPreview.test.ts` — `0 * Infinity = NaN`
    （IEEE 754）が quartic 係数ゼロの項を汚染していた実バグを
    `nonlinearPotentialFieldPreparation.ts` で修正
  - `nonlinearPotentialAppliedUpdateProposal.test.ts`（2件）— 読み取りと書き込みを
    区別しない禁止識別子スキャンの誤検知、および前段の NaN 修正により当初の
    非有限化狙いの数値が届かなくなったテスト値の再設計
  - `actuationPulse.test.ts`（W2-D）— **RNG起因のflakyだったことを確認**。本 K1
    の決定論化（下記）で解消
  - `scenario.test.ts` Scenario J（Expected Touch Miss）— seed固定で再現性を確認
    した上で根本原因を特定：`touchExpectation.ts` の `CONFIDENCE_INCREASE=0.01`
    （1フレームあたり）と `CONFIDENCE_DECAY=0.998`（100フレーム周期）の組み合わせ
    では、`duration:1` の単発タップでは confidence が漸近的に約0.045にしか達せず、
    `missingTouchSurprise` が要求する `>0.3` ゲートに構造的に到達し得ない。
    テストの touch pattern を `duration:15` に修正（本番の `touchExpectation.ts`
    自体は変更していない）
- **未修正のまま残す（1件）**: `scenario.test.ts` Scenario AW
  （Moderate Openness Exploration）。seed固定で再現性を確認し、RNGではないことを
  確定。根本原因を `deriveNeedMotivation.ts` の `deriveExplorationMotivation` の
  `safetyNeed>0.5` / `boundaryIntegrity<0.4` ペナルティ条件まで追跡したが、
  `initialHomeostaticState` を変えても最初の約100フレームで両者はほぼ同じ
  「ストレス状態」に収束する（`deriveFeltState.ts` の overload/irritability 連鎖に
  ある初期条件非依存のアトラクタ）。これが意図された立ち上がり挙動なのか
  バグなのかの判断は、有機体設計の意図を知る人間の判断を要する。テストは
  失敗したまま残し、コメントで原因を記録した（アサーションの無効化・削除はしない）。

**次の担当者向け:** Scenario AW の調査は `deriveFeltState.ts` の overload 導出
（`deriveOverload`）→ `snapshot.overload` の蓄積源 → `homeostaticState.irritabilityLevel`
の更新則、の順にさらに1〜2層深く追う必要がある。単なる config 値の変更では
直らないことは確認済み。

## K2 — 純粋物理コア PR2〜PR5（器だけを作る）

**目的:** `docs/pure-physics-implementation-plan.md` §8 の PR2〜PR5 をそのまま実行する。
本ロードマップは新しい設計を持ち込まない。

- PR2: geometry / state / params / 自己随伴ラプラシアン L / solver settings
- PR3: 保存部 Strang 分割 + Cayley/CN（線形部の前進オイラー禁止）
- PR4: N/H 帳簿 + 散逸
- PR5: 外部駆動 J(x,t) + driveWork

**完了条件:** `docs/pure-physics-implementation-plan.md` の各 PR の合流条件を
そのまま採用する。特に:
- L の自己随伴性テスト `<φ,Lψ>_dA ≈ <Lφ,ψ>_dA` が通る
- `invariants.ts` と `stepConservative.ts` が同一の L を使う
- pure core 内に `clamp` / `maxDelta` / `amplitudeClamp` / `Math.random` /
  `Date.now` が存在しない
- N 保存・H 有界性・H 収束（2次収束）・secular drift 非検出のテストが通る

**反証子:** PR3 で N 保存・H 有界性・2次収束が確認できない場合、散逸・駆動・
媒質履歴を一切載せない（`docs/pure-physics-implementation-plan.md` §11 の明文）。

**PR2 完了（2026-09-04）:** `src/pure/params.ts`, `src/pure/geometry/torus.ts`,
`src/pure/geometry/laplaceBeltrami.ts`, `src/pure/field/state.ts`,
`src/pure/random/seededPrng.ts` を実装。`src/tests/pure/` に47テスト
（`pureParams`, `torusGeometry`, `laplaceBeltramiSelfAdjoint`, `pureFieldState`,
`seededPrngDeterminism`, `pureCoreForbiddenPatterns`）。

- L の自己随伴性は「対称な辺の transmissibility を使う」という設計から
  代数的に保証され、数値検証でも相対誤差 <1e-9（`laplaceBeltrami.ts` の
  モジュールdocに証明を記載）。N=4,8,16 の格子で確認
- L(定数場) = 0 を確認（ラプラシアンの基本性質）
- トーラス全面積は解析解 `4π²Rr` と厳密一致（cell-centered midpoint rule
  での cos の和が任意の N≥2 で厳密にゼロになる離散直交性による。N=4,8,16,33
  で確認、丸め誤差のみ）
- 同一seedでの初期状態の bit 一致を確認（`pureFieldState.test.ts`）
- `src/pure/` 全体を対象にした禁止識別子スキャン（`Math.random(`, `Date.now(`,
  `clamp(`, `maxDelta`, `amplitudeClamp`, `boost`, `stabilize`, `makeAlive`,
  `makeConscious`, `forceRecovery`, `desiredTarget`）と、legacy/organism層への
  import 禁止を、コメントと実コードを区別した上で機械チェックするテストを
  `pureCoreForbiddenPatterns.test.ts` として追加（`claimGuard.ts` と同じ
  「言及と使用を混同しない」設計）
- `src/pure/random/seededPrng.ts` は新規実装せず `src/utils/seededRandom.ts`
  を re-export（K1 で確立した「既存実装を再利用する」原則をそのまま適用）
- `tsconfig.json` に `allowImportingTsExtensions: true` を追加（`src/pure/**`
  を include に加えたことで、値インポートの `.ts` 拡張子表記——このリポジトリの
  既存の型インポートと同じ記法——を通すために必要。`noEmit: true` なので安全）

**PR2 の床（誠実な未達）:** 時間発展は一切実装していない（`stepConservative.ts`
はまだ存在しない）。L の離散化が連続極限の Laplace-Beltrami 作用素に
どの収束レートで一致するかは検証していない（それは PR3 の
`hamiltonianConvergence.test.ts` の仕事）。

**PR3 完了（2026-09-04）:** `src/pure/field/{nonlinearPhaseStep,linearSolve,
linearCayleyStep,stepConservative,invariants}.ts` を実装。
`src/tests/pure/` に32テスト追加（計79テスト）。

- 非線形位相回転は厳密解（|ψ|² が保存されるため、離散化誤差なし）
- 線形部は Cayley/CN を実の 2N² 元ブロック連立一次方程式に変換し、
  密行列LU分解（一度だけ）＋前進代入・後退代入（毎tick）で解く。
  前進オイラーは一切使っていない
- ノルム保存を単発ステップで相対誤差 <1e-9、200回繰り返しても <1e-6
  で確認（Cayley変換は自己随伴作用素に対して厳密にユニタリという
  性質が、PR2で証明した自己随伴性からそのまま成立する）
- N保存を500〜1000tickにわたり相対誤差 <1e-6 で確認。g∈{0,1,5,20}の
  いずれでも成立し、secular drift（時間とともに増大する系統誤差）は
  検出されなかった
- H有界性を2000tick・強結合（g=15）でも確認（発散なし。Strang分割は
  Hを厳密には保存しないため「有界」を検証条件とした）
- 自己収束性（dtを半分にすると誤差が約1/4になる2次精度）を、
  非線形系全体と線形のみ（g=0）の両方で確認（比率2.5〜6の範囲、
  期待値4に近い）
- 前進オイラーとの直接比較で、同じ演算子に対して前進オイラーが
  実際にノルムを増幅させることを数値的に示した（`docs/pure-physics-
  implementation-plan.md` §3 の「無条件不安定」という主張を、
  断定ではなく実測で裏付けた）

**PR3 の床（誠実な未達）:** 散逸・駆動・媒質履歴はまだ実装していない
（PR4〜PR6）。H の収束レート自体（2次精度）は自己収束性で確認したが、
解析解との比較による絶対誤差の収束は未検証（解析解が存在する単純な
テストケース——例えば平坦計量極限での既知の分散関係——との比較は、
このPRの範囲外とした）。

**PR4 完了（2026-09-04）:** `src/pure/field/stepDissipation.ts`,
`src/pure/ledger/energy.ts` を実装。`src/tests/pure/` に18テスト追加
（計99テスト）。

- 散逸は `ψ ← ψ・exp(−ν(x)dt)` による厳密な指数減衰（線形近似ではない）
- `dissipationLoss_N ≥ 0` は ν(x)≥0 なら代数的に保証されることを、
  均一 ν・非均一 ν の両方で確認（不変条件は空間構造に依存しない）
- `dissipationLoss_H` は均一 ν の場合のみ非負を要求し、実際に
  50〜100tick・複数の (α,g) 組で非負を確認。孤立した散逸ステップに
  ついても解析予測（運動項は exp(−2νdt)、四次項は exp(−4νdt) で
  スケールする）と数値結果が一致することを確認した
- `numericalDrift_H` が保存部だけに由来し、ν(x) の大きさ（0〜50まで
  振った）に一切依存しないことを確認。散逸ステップの H 変化が
  `numericalDrift_H` に漏れ込んでいないという、設計書の合流条件
  「numericalDrift_H が保存ブロック以外で使われない」を直接検証した
- 帳簿の恒等式 `N(t+1)=N(t)−dissipationLoss_N+residual_N` /
  `H(t+1)=H(t)−dissipationLoss_H+numericalDrift_H+residual_H`
  （PR4時点では駆動項がまだ無いため driveWork=0）が毎tick成立し、
  residual が許容誤差内（N: 相対 <1e-8、H: 絶対 <1e-8）に収まることを
  100tickにわたり確認

**PR4 の床（誠実な未達）:** 均一 ν(x)=ν₀ のみを扱った。不均一 ν(x) は
PR6（媒質履歴）で初めて実際の力学として現れ、その時点で
`dissipationLoss_H` は符号保証を失う（設計書 §7 の明文どおり、これは
バグではなく不均一吸収が勾配エネルギーを作る物理現象）。駆動 J はまだ
無いため driveWork_N/H は常に0であり、この帳簿の駆動項付き完全形は
PR5 の仕事。

**PR5 完了（2026-09-04）:** `src/pure/drive/drive.ts`, `src/pure/field/stepDrive.ts`
を実装し、`src/pure/ledger/energy.ts` に `runDriveTick`（`runDissipationTick`
を内部で再利用し、その出力へ駆動ステップをもう一段適用する構成）を追加。
`src/tests/pure/` に13テスト追加（計114テスト）。

- J(x,t) = spatialProfile(x)・exp(i(ωt+phase)) という、ψを一切読まない
  純関数として実装（ソーススキャンで「psi」というコード上の識別子が
  存在しないことを直接検証——ドキュメント中の説明文としての言及とは
  区別する、既存の claimGuard.ts と同じ「言及と使用の区別」）
- 駆動ステップ ψ ← ψ + J・dt は陽解法（Euler）だが、これは
  `linearCayleyStep.ts` が禁じる前進オイラーとは別種の操作である
  ことをモジュールdocで明示：後者はψに比例するフィードバック項の
  不安定性の問題であり、Jはψに依存しない外部強制項なのでその議論は
  適用されない
- 一様位相のψに対し、ψと同位相のJが全セルで |ψ|² を厳密に増加させる
  こと（孤立試験）、ψと逆位相（π shift）のJが全セルで厳密に減少させる
  ことを確認。`runDriveTick` を通した `driveWork_N` の符号が
  cos(相対位相) の符号を、位相を0〜2πまで振って追跡することも確認
- 振幅ゼロの駆動（`spatialProfile` が全セル0）が `runDriveTick` を
  `runDissipationTick` とビット一致させること（駆動が唯一の追加経路で
  あり、他の経路でψを変えないことの直接証拠）を確認
- 駆動ありでも帳簿の恒等式 `N(t+1)=N(t)+driveWork_N−dissipationLoss_N+residual_N` /
  `H(t+1)=H(t)+driveWork_H−dissipationLoss_H+numericalDrift_H+residual_H`
  が40tickにわたり成立することを確認（`residual_N/H` は PR4 で確定した
  意味・値のまま変わらないことを設計上保証し、数値でも確認した）

**PR5 の床（誠実な未達）:** driveWork_H の符号は一般に保証しない
（設計書の帳簿定義どおり、駆動仕事は正負どちらもありうる想定であり、
本PRのテストも符号を断定していない）。媒質履歴 ν(x) はまだ実装して
いない（PR6）ため、この時点の駆動はまだ「一定の ν₀ を持つ吸収体へ
外部からエネルギーを注ぐ」だけであり、持続的パターンが生まれるか
どうかはまだ観測対象になっていない（`docs/vessel/white-ceilings.md`
参照）。

**次: PR6（= K3）** — 媒質履歴 ν(x)（唯一許可された書き戻し）。完了記録は
K3 のセクションに記す。

## K3 — 媒質履歴 ν(x)（PR6）＝ 唯一許可された書き戻し

**目的:** `docs/pure-physics-implementation-plan.md` §8 PR6 をそのまま実行する。

```
Φ(x) = ν(x)|ψ(x)|²
∂ν/∂t = −κΦ + ρ(ν₀ − ν)
ν(t+dt) = ν* + (ν(t) − ν*)·exp(−(κ|ψ|² + ρ)dt),  ν* = ρν₀/(κ|ψ|² + ρ)
```

入力は局所の `|ψ(x)|²` のみ。observer 由来の値（vortex candidate 等）は pure
core に一切持ち込まない（`VESSEL_CHARTER.md` §4）。指数緩和により
`max(ν,0)` を使わずに数学的に厳密に `ν > 0` が保証される。

**完了条件:** `docs/pure-physics-implementation-plan.md` PR6 の合流条件。加えて
`Aeterna-prism` §6.7「新しい結合・場・機構は新しい白であり t=0 から再実行する」
に従い、ν(x) の追加は新しい白として扱う。

**反証子:** 不均一 ν 条件下で `dissipationLoss_H` が負にもなりうることを許容・
記録できること。符号を無理に正へ揃えたらフェーズは失敗と判定する（PR6 の
物理的性質そのものが反証子である）。

**PR6 完了（2026-09-04）:** `src/pure/medium/history.ts` を実装し、
`src/pure/ledger/energy.ts` に `runMediumHistoryTick`（`runDriveTick` を
内部で再利用し、その出力の psi に対して ν(x) だけを更新する構成）を
追加。`src/tests/pure/` に16テスト追加（計131テスト）。

- ν(t+dt) = ν* + (ν(t)−ν*)・exp(−(κ|ψ|²+ρ)dt) という厳密解を実装
  （tick内で|ψ|²を凍結した線形ODEの解析解、線形近似ではない）。
  複数の (κ,ρ,ν₀,|ψ|²,dt) 組で解析式と数値が一致することを確認
- κ=ρ=0 の退化ケース（0/0 になりうる箇所）で ν が厳密に不変であることを
  確認し、ゼロ除算を回避
- 同じ大域パラメータ (κ,ρ,ν₀) を持つ2セルが、局所の |ψ(x)|² の違いだけで
  異なる ν* へ緩和することを確認——媒質履歴が「observer由来の値」ではなく
  「場を通過する局所エネルギーに応答する物理状態」であることの直接証拠
  （`VESSEL_CHARTER.md` §4 の要求）
- `max(ν,0)` が pure core 内に存在しないことをソーススキャンで確認した上で、
  500通りのランダムな (κ,ρ,ν₀,|ψ|²,dt) と2000tickの長時間積分の両方で
  ν が一度も負にならないことを数値確認。非負性は凸結合として代数的に
  保証される（クランプ不要）ことをモジュールdocで証明した
- 媒質履歴ステップが ψ・N・H に触れないことを、関数シグネチャ自体
  （`applyMediumHistoryStep` は ν(x) しか返さない）と、
  `runMediumHistoryTick` が `runDriveTick` の ledger をそのまま返す
  （測り直さない）実装の両方で保証。強い κ（=1000）でも N/H が
  ビット一致することを確認
- 不均一 ν(x) が `dissipationLoss_H` を負にしうることを、理論上の主張
  ではなく具体例で実証：完全に一様な場（勾配エネルギー=0、g=0で四次項
  も除去）に列交互ν(x)を適用すると、差分減衰が場を非一様にし、
  H が厳密に増加する（`dissipationLoss_N` は同じ設定でも非負のまま）

**PR6 の床（誠実な未達）:** ν(x) の空間パターンは、まだ「実際の
シミュレーションを走らせて自然に生じたもの」ではなく、テストでは
意図的に構成した非一様パターン（列交互）で決定的な符号反転を実証した。
実際の駆動+散逸+媒質履歴を組み合わせた長時間run上で ν(x) がどんな
パターンに自然収束するか、それが個体性（Emergence Level）にどう
寄与するかは K6/K7 の観測対象であり、このPRの範囲外。

## K4 — 読み取り専用観測（PR7）

**目的:** `docs/pure-physics-implementation-plan.md` §8 PR7 をそのまま実行する。

**完了条件:** 観測 ON/OFF で場の状態がビット単位で一致する
（`observerNonIntervention.test.ts`）。観測結果が runtime dynamics に import
されない。

**反証子:** 観測 ON/OFF で 1 bit でも差が出た場合、観測系は無効と判定し、
観測実装を修正するまで K5 を開始しない。

## K5 — 物理的閉路を置く（既存憲法にない新規フェーズ）

**目的:** `docs/pure-physics-implementation-plan.md` の J(x,t) は開放系の外部
駆動として指定されており、場から J への戻り道がない。ここで初めて物理的閉路
（`VESSEL_CHARTER.md` §2 の左列）を置く。詳細設計は
`docs/vessel/closed-life-loop-design.md` を参照。

**置くもの（これだけ）:**
- 交換境界 𝒮 — トーラス上のセル部分集合。幾何のみで定義する
- 外部媒質 χ — 自身の波動方程式と自身の散逸を持つ第二の場
- 対称結合 — ψ↔χ の交換を単一の対称項として書く
- 創発する往復遅延 — `delay` パラメータを置かず、χ の経路長と波速から導出させる

**置かないもの:** 目標値、報酬、生命らしさの判定、observer からの帰還。

**完了条件:**
- 結合ゼロで開放系（K2〜K4 の結果）と bit 一致する（遮断対照）
- 交換項が ψ側・χ側の両台帳で同額逆符号として記帳される
- 往復遅延が幾何と波速の予測どおりに動く
- `solverStepOrder` に交換ステップが明記され export される

**反証子（零仮説）:** χ を「同じ遅延・同じ減衰を持つが内部力学を持たない
遅延線」に差し替えて、場の挙動が区別できない場合、外部媒質を物理場として
置いたことは何も買っていない。それを結論として記録する。

## K6 — 生命的閉路が出るかを観測する

**目的:** ここで初めて「生命ループ」を観測する。実装しない。

**主要測定:** reafference 弁別——自分が出した波が戻ってきた場合と、外から
同じエネルギー・同じスペクトルで入った場合とで、場の応答が違うか。エネルギー
とスペクトルを揃えることを必須とする（揃えなければ振幅の違いを測っているに
過ぎない）。既存の `src/closure/deriveReafferenceComparison.ts`（legacy 側）
は設計参照として使用する。

**採用する機械判定規則**（`Aeterna-Genesis/docs/EMERGENCE_LEVELS.md` をそのまま
採用し、自前の閾値を発明しない）:
- L2: `localized_components > 0 AND winding_defects_detected AND persistence > τ_min`
- L4: `tracked_id_lifetime > τ AND inside_outside_contrast > θ AND recovers_after_perturbation`

**完了条件:**
- 測定器が K5 より前に凍結されている（`AETERNA-TORUS` 原則「新しい現象と、
  その現象を判定する測定器を同一PRで確定しない」）
- 零仮説と閾値が事前登録済みである（`Crystal-Genesis` の事前登録方式に倣う）
- null 結果が正式に記録される

**反証子:** エネルギーとスペクトルを揃えた条件で自他の応答差が零仮説と区別
できない場合、自他境界は観測されなかった。それを結論として記録する。

## K7 — 天井の地図（AETERNA 版 WHITE_CEILINGS）

**目的:** `Aeterna-Genesis/docs/WHITE_CEILINGS.md` の方法論を AETERNA に持ち込む。
仮説段階の予測は `docs/vessel/white-ceilings.md` に先に記載済み。

**完了条件:** K2〜K6 の各白について、到達レベル・停止理由・次に足りない原因
が表として存在する。

## K8 — 器の判定書

**目的:** 人向け文書と機械可読文書を分離して出す（`Aeterna-Genesis/AGENTS.md`
の「やさしい説明」と「監査用報告書」は必ず別々に、の原則に従う）。

**完了条件:** `VESSEL_REPORT.md`（人向け）と機械可読 JSON の両方に、seed・
params・solverStepOrder・ticks・台帳サマリ・零仮説比較・到達レベル・天井理由
が全て入り、再現できる。

**「完成」の定義:** 知性が現れたことではない。この器が何をでき何をできないか
が、隠さず、再現可能に、数で書かれていること。

---

## 既存ロードマップの陳腐化解消

`docs/current-roadmap.md` と本書との関係を明記する。

1. **W1〜W6 表記の矛盾**: `docs/current-roadmap.md` の W-Series 表は W1〜W6 を
   「未着手」と記載しているが、`docs/aeterna-current-state-audit.md` および
   `src/core/AeternaNetwork.js` の実装（`updateWorldMedium`, `deriveSensoryReturn`,
   `deriveReafferenceComparison` 等の呼び出し）から、legacy 実装においては
   W1〜W5 相当の機構が配線済みであることが確認できる。これは legacy core
   （`src/core/`, `src/world/`, `src/closure/`）における事実であり、
   **K-Series（`src/pure/`）とは独立した別の実装系列**である。`current-roadmap.md`
   の当該表は「legacy 実装ステータス」として読み替え、K-Series はこれを前提
   にしない。矛盾の解消それ自体は legacy ドキュメント整理の別 PR に委ねる。
2. **v6.1〜v6.4 の二系統**: `docs/v6-natural-physical-emergence-roadmap.md` の
   v6.1〜v6.4（Boundary Phase Field / Cross-Layer Energy Cycle / Relaxation-Time
   Hierarchy / Thermal Bath）と、`docs/nonlinear-potential-field-preparation.md`
   が実装した v6.1〜v6.4（force preview / acceleration preview / boundary audit /
   applied-update proposal）は、**同じ番号で異なる内容**を指す。K-Series は
   これらのいずれとも独立した番号系列（K0〜K8）を用いることで、この衝突を
   継承しない。legacy 側の v6 番号系列自体の調停は本書の範囲外とし、
   legacy ドキュメント整理の別 PR に委ねる。
3. **二つの「v6.5」**: 上記と同じ理由により、K-Series はこの衝突を継承しない。

K-Series は legacy の v6 / W-Series と**並走**する別系列であり
（`docs/pure-physics-implementation-plan.md` 原則6「既存coreを置き換えず、
src/pure/ として並走させる」）、番号の重複や参照は発生しない。
