# K12 実装ADR — 第二の記憶チャンネル g(x) の具体化

**Status:** approved-by-continuation（うえきさんの「続きお願いいたします」を実装続行の
承認として扱う。技術選択そのものへの異議があれば、この文書を読んだ上で差し戻すことが
できる）。`docs/vessel/K-series-II-brain-and-universe-plan.md` K12節「具体形は K5 と
同様に ADR で確定してから実装する」に応じる文書。

K12節は腕B（第二の記憶チャンネル: 局所非線形性 g(x)）を「法則は ν(x) と同じ厳密ODE・
凸結合形」「g₀ と g₁ の間に構造的に有界、クランプ不要」までは決めたが、具体的な数式・
tick内での読み書きタイミング・帳簿への記帳方法は未確定だった。この文書はそれを確定する。
腕A（時間スケール掃引）は既存の ν(x) 機構をそのまま使うため新規のADR判断を要しない
（グリッド・seed数の凍結は `K12-arm-a-timescale-preregistration.md` が担当）。腕C
（α(x)）はこのADRの対象外（`K12-arm-c-propagation-memory-design.md` が別途扱う、
本期は設計のみで実装なし）。

## 選択1: g(x) の発展則は ν(x) と同型の厳密ODE・凸結合形にする

**選んだもの:**

```
Phi_g(x)  = kappa_g * |psi(x)|^2
rate      = kappa_g * |psi(x)|^2 + rho_g
g*(x)     = (rho_g * g0 + kappa_g * |psi(x)|^2 * g1) / rate
d(g)/dt   = -kappa_g * (g - g1) * |psi(x)|^2 - rho_g * (g - g0)
```

厳密解（|psi|^2をtick内で凍結した線形ODEとして、`src/pure/medium/history.ts`の
ν(x)と全く同じ手法）:

```
g(t+dt) = g*(x) + (g(t) - g*(x)) * exp(-rate*dt)
```

**比較検討した代替案:**

1. ν(x)と全く同じ式（`g* = rho_g*g0/rate`、つまり第二の固定点を暗黙に0とする）。
   → 却下。物理的に「非線形結合定数gが0に近づく」ことに特別な意味はなく（νの0は
   「散逸なし」という意味を持つが、gの0は「非線形項なし」というだけで、K12の
   目的である「よく流れた場所の剛性が変わる」という物理像には対応しない）。
   `g₀とg₁の間に構造的に有界`というK12節の明文要求も満たさない（この形は
   [0, g0]の範囲でしか有界にならない）。
2. g*を|psi|^2の非線形関数（シグモイド等）にする。
   → 却下。ν(x)と異なる関数形を導入すると「同じ規律で作った第二のチャンネル」
   という比較可能性が失われ、腕Bの決定的反証子（「時間スケールの問題かチャンネルの
   置き場所の問題か」の切り分け）が曖昧になる。凸結合形はν(x)との構造的な対応が
   直接比較できる最小の変更である。

**理由（構造的有界性の証明）:** `rate>0`のとき、`decay=exp(-rate*dt)`は`kappa_g,
rho_g,|psi|^2,dt>=0`なので`(0,1]`に入る。このとき

```
g(t+dt) = g*(x)*(1-decay) + g(t)*decay
```

は`g*(x)`と`g(t)`の凸結合である。さらに`g*(x) = (rho_g*g0 + kappa_g*|psi|^2*g1)/rate`
自体が`g0`と`g1`の凸結合（係数`rho_g/rate`と`kappa_g*|psi|^2/rate`はともに`[0,1]`で
和が1）。よって`g(t)`が帰納的に`[min(g0,g1), max(g0,g1)]`に収まっていれば、
`g*(x)`も`g(t+dt)`もこの区間に収まる。初期値`g(x,0)=g0`（選択4参照）はこの区間に
収まっているので、以降すべてのtickで`clamp`なしに構造的に有界であることが
代数的に保証される（`src/pure/medium/history.ts`のν非負性証明と同じ論法を
一般化しただけで、新しい証明技法は要らない）。

`rate=0`の退化ケース（`kappa_g=0`かつ`rho_g=0`、または`kappa_g*|psi|^2=0`かつ
`rho_g=0`）は0/0を避けるため`g(t+dt)=g(t)`とする（ν(x)と同一の扱い）。

**誠実な床:** この式は`|psi(x)|^2`をtick内で凍結した*線形*ODEの厳密解であり、
tick内で`psi`と`g`を自己無撞着に解いてはいない（ν(x)と全く同じ誠実な床——
`history.ts`のモジュールdoc参照）。

## 選択2: g(x) は保存部（conservative step）の非線形半ステップで読み、
tick最後にψの最終状態から書く

**選んだもの:** `applyNonlinearPhaseStep`と`computeHamiltonian`を、スカラー`g:
number`に加えて`g: number | Float64Array`を受け付けるように拡張する
（既存の呼び出しは全て`number`のままなので**挙動を一切変えない**）。
`createConservativeStepper`の`step()`に、tick単位で渡す**任意の**`gField?:
Float64Array`引数を追加する（省略時は構築時に渡した`params.g`をそのまま使う——
既存の呼び出し元は無変更で動く）。

tick内での実際の流れ:
1. その tick の**開始時点**の`g(x)`を`conservativeStepper.step(psi, g)`に渡す
   （非線形半ステップ2回とも同じ`g(x)`を使う——tick内でgは変化しない）
2. 散逸・駆動・交換・媒質履歴(ν)は今まで通り
3. **新規**: `applyGHistoryStep`が、tick最終的なpsi（今までのnu(x)と同じタイミング
   規約）を使って`g(x)`を次tick用に更新する

**比較検討した代替案:**

1. `ConservativeStepperParams.g`自体を`number | Float64Array`にし、
   `createConservativeStepper`を毎tick作り直す。
   → 却下。`createConservativeStepper`は線形ソルバー（`linearStepper`、
   spectralの場合はFFTベースの巡回三重対角ソルバーの事前構築を含む）を
   保持するオブジェクトであり、毎tick作り直すと線形ソルバーの構築コストが
   tickごとにかかる（K9が排除した「毎tickの高コスト構築」を逆に持ち込む）。
   線形部はgに一切依存しない（このADRの前提そのもの）ので、`step()`への
   引数化で十分。
2. 別関数`applyNonlinearPhaseStepField`を新設し、`applyNonlinearPhaseStep`は
   スカラー専用のまま変更しない。
   → 却下ではないが採用しない。ループ本体（`theta = g*|psi|^2*dtHalf`の計算）が
   完全に同一なので、関数を分けると保守時に2箇所を同期する負担が生まれる。
   `typeof g === 'number'`の分岐1つで両対応する方が、テストも1ファイルで
   閉じる。

**理由（tick順序への影響なし）:** 非線形位相回転は「セルごとの厳密な回転」
（`nonlinearPhaseStep.ts`）であり、線形ソルバー（Cayley/CN、K9のスペクトル分解）
には一切影響しない——K12節が既に述べているこの事実により、`PURE_CORE_
SOLVER_STEP_ORDER`の`'conservative'`の**中身**が変わるだけで、ステップの
**並び**自体は変える必要がない。ただし`g(x)`自身の更新ステップは新しい
tick単位の処理なので、`'mediumHistory'`の直後に`'gHistory'`を追加する
（`['conservative','dissipation','drive','exchange','mediumHistory',
'gHistory','observe']`）。`nu(x)`と同じ理由（「そのtickで場を通過した最終的な
エネルギーに応答するべき」）による配置。

**誠実な床:** `runDissipationTick`・`runDriveTick`・`runMediumHistoryTick`は、
新しい**任意**引数`gField?`を末尾に追加する形で拡張する（省略時は
`conservativeStepper`構築時の`params.g`を使う——完全後方互換）。既存の
全呼び出し元（K5〜K11の全モジュール）は一切変更を要さない。

## 選択3: mediumWork_H は「同じψ・異なるgでのHの差」として実測する

**選んだもの:**

```
mediumWork_H = computeHamiltonian(psiFinal, operator, geometry, alpha, gNext)
             - computeHamiltonian(psiFinal, operator, geometry, alpha, gCurrent)
```

`psiFinal`はそのtickの最終的なψ（gHistoryステップはψを一切変えないので、
gHistoryステップの前後でψは同一——`mediumNonContact.test.ts`と同じ検証パターンを
`g(x)`にも適用する）。`gCurrent`はそのtickが実際に使った`g(x)`、`gNext`は
`applyGHistoryStep`が返した次tick用の`g(x)`。

**比較検討した代替案:**

1. `mediumWork_H`を記帳せず、gの変化によるH変化を`numericalDrift_H`に
   紛れ込ませる。
   → 却下。K12節が明文で禁止している（「`numericalDrift_H`に紛れ込ませない
   ——設計書 v0.1.2 の濫用禁止条項」）。`numericalDrift_H`は保存部の
   Cayley/CN離散化誤差という**別の物理的原因**を持つ量であり、「媒質定数が
   変わったことによるHの再定義」という全く別の現象と混ぜると、どちらの
   原因が実際の誤差の源かを後から切り分けられなくなる。
2. gの変化そのものを「エネルギー注入」とみなし、driveWork_Hに合算する。
   → 却下。driveWork_Hは外部駆動J(x,t)という**別の物理的経路**からの
   仕事であり、g(x)の変化はJとは無関係な媒質自身の緩和である。合算すると
   「駆動から入ったエネルギー」と「媒質の再定義によるHの見かけの変化」が
   区別できなくなる。

**理由:** H自体が`g`をパラメータとして含む関数（`H = alpha*<psi,-L*psi> +
(g/2)*sum|psi|^4*dA`）なので、`g`が変わればψが不変でもHの値は変わる——
これは物理的な仕事ではなく「ものさしが変わった」ことによる見かけの変化である。
これを他の項と混同せず**新しい独立した項**として実測することが、K12節の
「実測差分として新しい項で記帳する」という要求そのものである。

**誠実な床:** `mediumWork_H`は**測定するだけ**で、符号や大きさを事前に主張しない
（`exchangeWork_H_psi`/`exchangeWork_H_chi`がK5で「一般に同額逆符号にならない」と
実測されたのと同じ扱い——構造から導かれる保証ではなく、実測して記録する量）。

## 選択4: g(x) の初期値は一様な g0

**選んだもの:** `createPureFieldState`がν(x,0)=ν0で初期化するのと同じ規約で、
g(x,0)=g0で一様初期化する。

**理由:** 選択1の構造的有界性の証明は`g(t)`が最初から`[g0,g1]`に収まっていることを
前提とする。一様g0は最も単純にこの前提を満たし、かつ「まだ何も流れていない場所は
基準値」という物理像とも整合する（νのν0初期化と同じ理由）。

**比較検討した代替案:** g(x,0)を`createSeededRandom`由来の何らかの分布にする。
→ 却下。`AETERNA-pure`原則A「『こうなってほしい』という願いをコードに埋め込まない」
に照らし、初期条件に構造を持たせる理由がない。一様初期化はψの初期化（K2 PR2の
種つきランダム位相）とは異なる層の話であり、gは「まだ流れを経験していない」という
一様な状態から始めるのが最小の選択。

## この ADR が答えない問い

- 腕C（α(x)、伝播記憶）— `docs/vessel/K12-arm-c-propagation-memory-design.md`
  （設計のみ、本期は実装なし）
- κ_g・ρ_g・g0・g1の具体的な数値 — `docs/vessel/K12-arm-b-second-channel-
  preregistration.md`（事前登録、実装より前に凍結）
- χ側の非線形項g_χ(x) — K5 ADRが既に「今回は置かない」としたスコープ外を継承。
  K12は ψ 側のみを対象とする
- g(x)自身の観測器（K11のL3/L4はψの位相・密度のみを対象とし、g(x)自体を
  可視化する測定器は持たない）— 将来の拡張。K12の完了条件はL2/L3判定のみを要求する
