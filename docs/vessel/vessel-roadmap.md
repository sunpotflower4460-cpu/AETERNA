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
3. 完全状態のシリアライズ/復元を実装する。同一 seed・同一入力列で
   bit 一致復帰することをテストで固定する（`AETERNA-TORUS` 原則8「同じ状態＋
   同じ入力＝同じ出力」）。
4. `tsconfig.json` の `include` を全域に拡張し、`tsc --noEmit` が通ることを
   確認する。`tsx` を `devDependencies` に追加する。
5. CI を新設する。fast（push毎）/ slow（nightly）の二段構成を最小とし、
   `PhysiCymatics/.github/workflows/ci.yml` の構成に倣う。既存の
   `npm run check:release` と既存テストスイートを自動ゲートに載せる。

**完了条件:**
- 同一 seed で 2 回走らせた結果が bit 一致する
- スナップショット復元が bit 一致する
- CI が新設され緑である
- `tsc --noEmit` が全域で通る

**反証子:** bit 一致が取れない場合、その原因（隠れた非決定性の発生源）を特定し
記録するまで K2 を開始しない。原因不明のまま K2 に進むことは禁止する。

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
