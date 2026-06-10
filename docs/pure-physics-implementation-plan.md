AETERNA PURE PHYSICS 実装方針書 v0.2.1
改訂メモ
v0.2.1では、v0.2方針書に以下を追加・修正する。
	1	dissipationLoss_H の符号条件を修正する。\ndissipationLoss_N ≥ 0 は定理として要求するが、dissipationLoss_H は符号保証しない。実測値をそのまま記帳する。
	2	tick内ステップ順序を固定する。\n基本順序は以下とする。
保存部 → 散逸 → 駆動 → 媒質履歴 → 観測
	3	step orderをsolver settingsとしてexportに含める。\n将来順序を変更した場合、物理差分なのか順序差分なのかを区別できるようにする。

0. 最上位原則
以下をすべてのPR・実装・レビューの上位ルールとする。
	1	「これが必要だからこう動く」型のロジックを入れない。
	2	場へ触れる入力経路は J(x,t) のみ。
	3	観測は readonly。観測値は力学へ戻さない。
	4	clamp / maxDelta / amplitudeClamp / max(ν,0) を入れない。
	5	すべての差分は帳簿に名前付きで記録する。
	6	既存coreを置き換えず、src/pure/ として並走させる。
	7	実装はPRごとに一層ずつ進め、各PRで対応する検証ハーネスを通す。
	8	物理の破れ・NaN・発散・帳簿不成立は隠さず、実験の事実として記録する。
	9	観測者は「こう見える」を報告できるが、確定しない。
	10	Aeterna本体の実出力と観測者の解釈を混同しない。

1. 実装対象の基本方程式
純粋物理コアの場は、トーラス上の複素場 ψ(x,t) とする。
∂ψ/∂t = i(α∇²ψ − g|ψ|²ψ) − νψ + J(x,t)
分解は以下。
i(α∇²ψ − g|ψ|²ψ) : 保存部
−νψ                    : 散逸
J(x,t)                 : 外部駆動
重要な設計判断:
	•	βψ のような無からのゲインは持たない。
	•	非線形項 −g|ψ|²ψ は保存部の虚数側に置く。
	•	J(x,t) は場への唯一の外部入力であり、シナリオとは J の仕様である。
	•	ν(x) は媒質の散逸率であり、観測値ではなく物理状態である。
	•	観測系は ψ と ν の readonly snapshot を受け取る純関数にする。

2. tick内ステップ順序
1tickは、以下の順序で固定する。
1. Conservative block
   非線形位相 half step
   線形 Cayley/CN step
   非線形位相 half step

2. Dissipation step
   ψ ← ψ · exp(−νdt)

3. Drive step
   ψ ← ψ + J(x,t)dt

4. Medium history step
   ν(x) を厳密積分で更新

5. Observe step
   readonly snapshotから観測値を導出
この順序は、実験条件の一部である。\n順序を変えれば、O(dt)レベルで結果が変わりうる。
したがって、以下を必ずexportに含める。
solverStepOrder:
  - conservative
  - dissipation
  - drive
  - mediumHistory
  - observe
将来順序を変更する場合は、別solver modeとして扱い、同じ実験と混ぜない。

3. 最重要注意: 線形ステップは陽解法禁止
保存部の線形項 iα∇²ψ には、前進オイラー型の陽解法を使ってはならない。
理由:
ψ_next = ψ + iαλdt ψ
となる各固有モードの増幅率は、
|1 + iλdt| = sqrt(1 + (λdt)^2) > 1
であり、dt をどれだけ小さくしてもノルムが増幅する。
これはCFL条件では救えない。\nシュレディンガー型の分散項に対して、前進オイラーは無条件不安定である。
したがって、クランプ撤廃と積分器置換は不可分である。\nクランプは「安全策」ではなく、壊れた積分器が生む増幅を隠す応急処置になりうる。
許可する線形ステップ
以下のいずれかを採用する。
A. Cayley / Crank–Nicolson
ψ_next = (I - iαdt L/2)^(-1) (I + iαdt L/2) ψ
L が適切な内積で自己随伴であれば、この更新はユニタリであり、ノルムを保存する。
B. スペクトル法
周期境界・平坦計量の検証経路では、FFTまたは自作DFTにより線形部を厳密に進めることができる。
ただし、曲面計量のトーラスでは係数が場所依存になるため、単純な平坦FFTだけでは本番のトーラス計量を代表しない。

4. 離散ラプラシアンの自己随伴性
Cayley / Crank–Nicolsonのノルム保存は、離散ラプラシアン L が内積に対して自己随伴であることを前提にする。
トーラス曲面では、セル面積 dA や計量係数が場所によって変わる。\nしたがって、単純な差分ラプラシアンでは保存構造が壊れる可能性がある。
PR 2で決めること
src/pure/geometry/torus.ts では、以下を同時に定義する。
- cell area dA
- weighted inner product
- metric-aware Laplace-Beltrami operator L
- Lの自己随伴性を検証するテスト
推奨する離散化
ラプラシアンは発散形式で離散化する。
Lψ = div(metricFlux(grad ψ))
隣接セル間のフラックスに計量係数を対称に入れることで、dA 重み付き内積に対して自己随伴になるように設計する。
自己随伴性テスト
PR 2で以下を追加する。
<φ, Lψ>_dA ≈ <Lφ, ψ>_dA
複素場なので、内積は共役を含む。
<φ, ψ>_dA = Σ conj(φ_i) ψ_i dA_i
このテストが通らない場合、PR 3のCayley/CNによるノルム保存は成立しない。

5. invariants と step は同じ L を共有する
invariants.ts と stepConservative.ts は、必ず同じ離散演算子 L を使う。
禁止:
stepConservative.ts では L_step を使う
invariants.ts では別実装の gradient / laplacian から H を計算する
このようにすると、numericalDrift_H が数値積分の性質ではなく、2つの離散化のズレを測ってしまう。
Hの定義
ハミルトニアンは、積分器が使う L そのものから定義する。
H = α <ψ, -Lψ>_dA + (g/2) Σ |ψ|^4 dA
必要に応じて係数や符号は実装する L の符号規約に合わせる。\n重要なのは、Hがstepと同一の離散演算子から導かれることである。

6. パラメータの分類
PURE PHYSICSでは、物理定数・離散化定数・実験定数・数値解法設定を混同しない。
6.1 基本パラメータ
記号
意味
種別
R, r
トーラス主半径・副半径
幾何
N
格子分割数
離散化
dt
時間刻み
離散化
α
分散係数
物理
g
非線形結合
物理
ν₀
基準散逸率
物理
κ
媒質可塑率
物理
ρ
媒質緩和率
物理
seed
初期条件の乱数シード
実験
6.2 数値解法設定
曲面計量でCayley / Crank–Nicolsonを使う場合、線形方程式の求解が必要になる。\n反復解法を使う場合、その許容誤差は場の挙動に影響するため、隠してはならない。
以下は物理定数ではないが、runtimeの数値解法設定として明示する。
記号
意味
種別
linearSolverTolerance
Cayley/CN線形ソルバーの収束許容誤差
数値解法
linearSolverMaxIterations
Cayley/CN線形ソルバーの最大反復回数
数値解法
linearSolverKind
direct / iterative / spectral など
数値解法
solverStepOrder
tick内ステップ順序
数値解法 / 実験条件
これらは「欲しい振る舞いを作るための調整定数」ではない。\nただしruntime結果に影響するため、seed・dt・Nと同じく、実験ログとexportに必ず含める。
6.3 テスト用toleranceとの区別
テスト用toleranceは物理でもruntimeでもない。
testTolerance
ledgerResidualTolerance
assertionTolerance
これらは検証ハーネスの設定であり、場の時間発展には影響してはならない。

7. 帳簿定義
ノルム帳簿:
N(t+1) = N(t) + driveWork_N - dissipationLoss_N + residual_N
ハミルトニアン帳簿:
H(t+1) = H(t)
       + driveWork_H
       - dissipationLoss_H
       + numericalDrift_H
       + residual_H
項目定義
項
意味
符号
driveWork_N
駆動JがNに与えた符号付き仕事
正/負どちらもありうる
driveWork_H
駆動JがHに与えた符号付き仕事
正/負どちらもありうる
dissipationLoss_N
散逸νによりNから失われた量
常に非負
dissipationLoss_H
散逸ステップ前後のH減少量としての実測差分
符号保証なし
numericalDrift_H
保存ブロックの数値積分誤差
物理ではなく計算上の観測項
residual_N/H
上記すべてを記帳した後の残差
実装バグ・帳簿不成立の検出用
重要修正: H側の散逸は符号保証しない
dissipationLoss_N ≥ 0 は定理として要求する。\n各セルの |ψ| が指数減衰するため、Nは必ず減る。
一方、dissipationLoss_H ≥ 0 は一般には要求しない。
理由:
	•	Hには勾配エネルギー α|∇ψ|² が含まれる。
	•	ν(x) が場所ごとに異なる場合、隣接セルが異なる速さで減衰する。
	•	その結果、元々なかった段差が生まれ、勾配エネルギーが増えることがある。
	•	これはバグではなく、不均一吸収が勾配を作る物理現象である。
したがって、H側では散逸ステップ前後の実測差分をそのまま記帳する。\n符号を無理に正へ揃えない。
テスト分離
PR 4時点で ν(x)=ν₀ の均一散逸のみを扱う場合:
dissipationLoss_N ≥ 0
dissipationLoss_H ≥ 0
を期待してよい。
PR 6以降、媒質履歴により ν(x) が不均一になる場合:
dissipationLoss_N ≥ 0
dissipationLoss_H は符号保証なし
とする。
この違いは、媒質履歴が物理的に効き始めたことの検出器にもなる。

8. PR分割
PR 1 — 設計書をdocsに追加
目的
PURE PHYSICSの憲法をdocsとして固定する。
追加候補
docs/pure-physics-core-design.md
docs/pure-physics-implementation-plan.md
内容
	•	v0.1.2設計書をMarkdown化して追加
	•	本方針書を追加
	•	READMEのDocs一覧にリンク追加
	•	agent-guardrailsから参照
	•	既存coreを置き換えないことを明記
合流条件
	•	docs only
	•	runtime変更なし
	•	UI変更なし
	•	既存テスト影響なし

PR 2 — geometry / state / params
目的
時間発展前に、器だけを作る。
追加候補
src/pure/params.ts
src/pure/geometry/torus.ts
src/pure/geometry/laplaceBeltrami.ts
src/pure/field/state.ts
src/pure/random/seededPrng.ts

src/tests/pure/pureParams.test.ts
src/tests/pure/torusGeometry.test.ts
src/tests/pure/laplaceBeltramiSelfAdjoint.test.ts
src/tests/pure/seededPrngDeterminism.test.ts
実装内容
	•	9個の基本パラメータを定義
	•	数値解法設定を別表で定義
	•	ψ を real / imag の Float64Array で保持
	•	ν(x) を Float64Array で保持
	•	dA をトーラス計量から計算
	•	dA重み付き内積を実装
	•	計量対応の離散ラプラシアン L を実装
	•	L の自己随伴性をテスト
	•	初期条件はseed付きPRNGのみ
	•	Math.random / Date.now を禁止
	•	tick内ステップ順序をsolver settingsとして定義する
合流条件
	•	同一seedで初期状態が完全一致
	•	dA が正である
	•	L が dA 重み付き内積で自己随伴
	•	pure core内に Math.random / Date.now が存在しない
	•	solver settingsに solverStepOrder が含まれる
	•	時間発展コードはまだ追加しない

PR 3 — 保存部のみのStrang分割積分器
目的
散逸・駆動・媒質履歴を入れる前に、保存部だけを証明する。
追加候補
src/pure/field/invariants.ts
src/pure/field/stepConservative.ts
src/pure/field/linearCayleyStep.ts
src/pure/field/nonlinearPhaseStep.ts

src/tests/pure/conservativeNorm.test.ts
src/tests/pure/hamiltonianBoundedness.test.ts
src/tests/pure/hamiltonianConvergence.test.ts
src/tests/pure/noExplicitEulerLinearStep.test.ts
実装内容
Strang分割:
1. 非線形位相回転 half step
2. 線形Cayley/CN step
3. 非線形位相回転 half step
線形部では陽解法を禁止する。
合流条件
	•	線形部に前進オイラーが存在しない
	•	N保存テストが通る
	•	H有界性テストが通る
	•	H収束テストが通る
	•	secular drift検出テストが通る
	•	invariants.ts と stepConservative.ts が同一の L を使う

PR 4 — N/H帳簿 + 散逸
目的
散逸 −νψ を追加し、失われた量を帳簿へ記録する。
追加候補
src/pure/ledger/energy.ts
src/pure/field/stepDissipation.ts

src/tests/pure/ledgerDissipation.test.ts
src/tests/pure/numericalDriftScope.test.ts
src/tests/pure/dissipationNormLoss.test.ts
src/tests/pure/uniformDissipationHamiltonianLoss.test.ts
実装内容
	•	ψ ← ψ · exp(−νdt) による指数散逸
	•	ステップ前後のN/H差分を実測
	•	N側は dissipationLoss_N として非負を要求
	•	H側は dissipationLoss_H として実測値を記録
	•	PR 4時点では均一νを基本テストにする
合流条件
	•	均一νで dissipationLoss_N ≥ 0
	•	均一νで dissipationLoss_H ≥ 0
	•	residual_N / residual_H が毎tick許容誤差内
	•	numericalDrift_H が保存ブロック以外で使われない
	•	散逸差分が媒質熱帳簿へ移記される
	•	dissipationLoss_H ≥ 0 を一般条件として固定しない

PR 5 — 外部駆動 J + driveWork
目的
場への唯一の外部入力 J(x,t) を追加する。
追加候補
src/pure/drive/drive.ts
src/pure/field/stepDrive.ts

src/tests/pure/driveWork.test.ts
src/tests/pure/negativeDriveWork.test.ts
実装内容
	•	DriveSpecを定義
	•	J(x,t) を返す純関数を実装
	•	ψ ← ψ + J·dt を適用
	•	適用前後のN/H差分を driveWork_N / driveWork_H として記録
合流条件
	•	drive以外の経路でψが変更されない
	•	正位相Jで正のdriveWorkが記録される
	•	逆位相Jで負のdriveWorkが記録される
	•	駆動ありでも帳簿が閉じる

PR 6 — 媒質履歴 ν(x)
目的
weak plasticityを観測カテゴリではなく、物理的な媒質履歴として実装する。
追加候補
src/pure/medium/history.ts

src/tests/pure/mediumHistory.test.ts
src/tests/pure/mediumNonContact.test.ts
src/tests/pure/noNuClamp.test.ts
src/tests/pure/nonUniformDissipationHamiltonianSign.test.ts
基本式
Φ(x) = ν(x)|ψ(x)|²

∂ν/∂t = −κΦ + ρ(ν₀ − ν)
厳密積分
tick内で |ψ|² を凍結すれば、νについて線形ODEになる。
ν(t+dt) = ν* + (ν(t) − ν*) exp(−(κ|ψ|² + ρ)dt)

ν* = ρν₀ / (κ|ψ|² + ρ)
この式により、max(ν,0) を使わずに非負性を保つ。
合流条件
	•	ν が負にならない
	•	max(ν,0) がpure core内に存在しない
	•	媒質履歴ステップ前後で ψ は変わらない
	•	媒質履歴ステップ前後で N / H は変わらない
	•	不均一ν条件で dissipationLoss_N ≥ 0
	•	不均一ν条件で dissipationLoss_H が負にもなりうることを許容・記録する
	•	媒質履歴は観測値ではなく、場の通過エネルギーに応答する物理状態として実装されている

PR 7 — observe(readonly) + 自動スイープ
目的
純粋物理コアに観測器を付ける。\nただし観測は力学に戻さない。
追加候補
src/pure/observe/vortexCandidates.ts
src/pure/observe/coherence.ts
src/pure/observe/correlation.ts
src/pure/run/runPureExperiment.ts
src/pure/run/exportPureReport.ts

src/tests/pure/observerNonIntervention.test.ts
src/tests/pure/pureReportFormat.test.ts
src/tests/pure/autoSweepDeterminism.test.ts
観測対象
	•	自発構造
	•	履歴依存
	•	自己維持
	•	統合
レポート形式
Observed facts
→ In one sentence
→ How it appears
→ Possibility
→ Still unknown
合流条件
	•	観測ON/OFFで場の状態がビット単位で一致
	•	観測結果がruntime dynamicsにimportされない
	•	自動スイープは条件を満たしたパラメータ領域を列挙する
	•	優劣判断や意識確定をしない
	•	JSON/Markdown exportにseed・params・solver settings・solverStepOrder・ticks・ledger summaryが含まれる

9. 実装時の禁止事項
以下はpure core内で禁止。
clamp
maxDelta
amplitudeClamp
max(nu, 0)
Math.random
Date.now
boost
stabilize
makeAlive
makeConscious
forceRecovery
desiredTarget
また、以下の構造を禁止する。
- existing dynamicCore を直接置き換える
- aeternaTuning.ts から pure core へ import する
- pure core から legacy / organism 層へ import する
- observedRatio / vortexCandidate / coherence を力学に戻す
- drive以外の経路で ψ を変更する
- Hの差分をすべて numericalDrift_H に逃がす
- step と invariant で別々の L を使う
- 線形シュレディンガー部に前進オイラーを使う
- テストを通すために物理定数を増やす
- tick内ステップ順序を暗黙に変更する

10. 実装レビューのチェックリスト
各PRで以下を確認する。
1. このPRは一つの責務だけを持っているか
2. 既存coreを変更していないか
3. pure coreがlegacy/organism層に依存していないか
4. 観測値が力学に戻っていないか
5. 場への入力経路はJだけか
6. 差分は帳簿に名前付きで記録されているか
7. residualを隠していないか
8. numericalDrift_Hを濫用していないか
9. clamp系が入っていないか
10. 追加パラメータは物理・幾何・離散化・数値解法のどれかとして説明できるか
11. 「欲しい振る舞い」の直接記述になっていないか
12. 観測者の表現とAeterna actual outputを混同していないか
13. 線形部に前進オイラーが入っていないか
14. 離散ラプラシアンLは自己随伴か
15. invariantsとstepは同じLを使っているか
16. solverStepOrderは固定され、exportされているか
17. dissipationLoss_NとdissipationLoss_Hの符号条件を混同していないか

11. 実装開始の推奨順
最初にやるべきは、PR 1としてdocsを追加すること。
その後、すぐに時間発展へ進まず、PR 2で器を作る。
PR 1: docs
PR 2: geometry / state / params / self-adjoint L / solver settings
PR 3: conservative Strang + Cayley/CN
PR 4: ledger + dissipation
PR 5: drive J + driveWork
PR 6: medium history
PR 7: readonly observe + sweep
特にPR 2とPR 3が重要である。
PR 2で L の自己随伴性が証明できなければ、PR 3のCayley/CNによるノルム保存は成立しない。
PR 3で保存部のN保存・H有界性・2次収束が確認できなければ、散逸・駆動・媒質履歴を載せてはいけない。
PR 4では均一νの散逸を確認し、PR 6以降で不均一νによるH符号不定性を許容・記録する。

12. 一文要約
AETERNA PURE PHYSICSは、既存coreを壊さず src/pure/ に並走する純粋物理コアとして実装する。\n幾何と自己随伴な離散ラプラシアンを先に証明し、その同じ演算子で保存量を計算し、前進オイラーではなくCayley/CNまたは厳密線形ステップで保存部を進める。\ntick内ステップ順序を固定・exportし、N/H帳簿では dissipationLoss_N と dissipationLoss_H の符号条件を分離する。\nその後、帳簿・散逸・駆動・媒質履歴・readonly観測を一層ずつ追加し、各PRで物理的不変条件と非介入性を検証する。\n目的は「欲しい動き」を作ることではなく、トーラス上に置いた物理がどう流れるかを、隠さず記録することである。
