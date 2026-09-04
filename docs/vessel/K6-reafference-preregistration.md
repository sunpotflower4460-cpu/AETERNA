# K6 事前登録 — reafference弁別プロトコルとその凍結

**Status:** approved-by-continuation（うえきさんの「引き続きお願いします」を実装続行の
承認として扱う）。`docs/vessel/closed-life-loop-design.md` K6節が要求する
「測定器がK5の結合実装より前に凍結されている」「零仮説が事前登録されている」を
満たすための文書。この文書のあとに実装・実行し、結果を見てから本文書を書き換える
ことはしない（`Crystal-Genesis`の事前登録原則）。

## 手順上の誠実な告白

設計書の文言は「測定器がK5の結合実装より前に凍結されている」ことを求めるが、
本セッションではK5（`src/pure/exchange/`）を先に実装・テストし、その後にこの
文書を書いている。これは順序として設計書の文言どおりではない。

ただし、K5の実装・テストで実際に見たものは「交換ノルム帳簿が同額逆符号になる
か」「Hはならないこと」「往復遅延が幾何予測と一致するか」であり、
**reafference弁別（条件Aと条件Bの応答が区別できるか）そのものはまだ一度も
測っていない**。事前登録の本質的な目的——「結果を見てから閾値を都合よく
調整すること」を防ぐ——は、reafference弁別に関して言えばまだ何も見ていない
時点でこの文書を書くことで守られている。K5の存在（交換機構というものがある
こと）を知った上でこの文書を書いているのは事実だが、これは「測定器を作る前に
測定対象の存在を知っている」という、原理的に避けようのない状況（測る機構が
存在しなければ測定器を設計しようがない）であり、「reafference弁別の結果を見て
から閾値を選んだ」こととは異なる。

## 条件A・条件Bの構成

**共通の初期条件（両条件で完全に同一）:**
- ψ: `createPureFieldState`によるseed付き初期状態（既存のPR2初期化をそのまま使う）
- 同一のトーラス幾何・α・g・ν₀（ν(x)は媒質履歴により時間発展する）
- t=0〜shoutTicksの間、境界セル𝒮を含む領域に同一の「叫び」駆動パルス
  `shoutDrive`（`DriveSpec`、両条件で完全に同一のオブジェクト）を適用する

**条件A（自己反響）:**
- λ>0（交換結合あり）。χは零場から開始し、「叫び」の間に結合を通じて
  自発的にエネルギーを受け取る（χへ人為的にパルスを植え付けない——これは
  設計書の「ψが𝒮を通じてχに放出した波」という文言に忠実にするための選択）
- roundTripTicks = M / shiftCellsPerTick 経過後、χが受け取った分がψへ
  戻ってくる（K5で実証済みの機構）

**条件B（外部入力対照）:**
- λ=0（交換結合なし、χは存在しないのと同じ）
- 上記「叫び」に加え、**返り値のタイミングにだけ**、境界セル𝒮に
  外部駆動 `controlDrive`（`DriveSpec`、条件Aとは別に、以下の較正手順で
  構成する）を適用する

**controlDriveの較正（エネルギーを揃える）:**
1. 条件Aを一度走らせ、`exchangeWorkNPsi` を `returnWindow`
   （`[roundTripTicks - windowHalfWidth, roundTripTicks + windowHalfWidth]`）
   にわたって積算し、`measuredReturnEnergy` を得る
2. `controlDrive` の振幅を、`returnWindow` の間だけ𝒮に作用する
   固定形状（一定振幅・条件Aの「叫び」と同じ`omega`/`phase`形状）として与え、
   そのdt積分がψのNに与える変化が `measuredReturnEnergy` と一致するよう
   振幅をスケールする（線形なので一回の試し打ちで較正できる）

**この較正が「スペクトルを揃える」を完全には満たさない誠実な限界:**
条件Aの返り値はラビ回転（状態依存・乗法的）で ψ の**現在の値**と結合するが、
controlDriveは加法的（ψの現在値に依存しない）である。振幅とタイミング窓を
揃えても、この構造の違い自体は揃えられない——これはむしろ本測定が検出しよう
としている当のもの（自己由来＝状態依存的結合、外部由来＝状態非依存の加法的
入力、という物理的な違い）であり、隠すべき交絡ではなく測定対象の核心である
と判断する。

## 比較する量（凍結する）

`returnWindow` 終了後 `observeAfterTicks`（固定値、後述）経過した時点での、
以下2つの量を条件A・条件Bそれぞれで測る:

- `boundaryDensity` = |ψ(𝒮の境界セル)|² × dA（境界セルの局所エネルギー密度）
- `globalCoherence` = `computePhaseCoherence(ψ, geometry)`（PR7の既存実装、
  改変しない）

これらを `seedCount` 個の独立した seed（`baseSeed` から連番）にわたって
条件A・条件Bの両方で計算し、seedごとの差分
`deltaBoundaryDensity[s] = boundaryDensity_A[s] - boundaryDensity_B[s]`
（`globalCoherence`も同様）を得る。

## 判定規則（凍結する）

**帰無仮説 H0:** `deltaBoundaryDensity` と `deltaCoherence` は、seed間の
ばらつきに対して有意に非ゼロではない（条件Aと条件Bは区別できない）。

**判定統計量:** 各差分列について平均 `mean` と標準誤差
`sem = stddev / sqrt(seedCount)` を計算する。

**判定:** `|mean| > 2 * sem` かつ `sem` 自体が有限で0でない場合、H0を棄却し
「区別できた」と判定する。両方の指標（`boundaryDensity`・`coherence`）に
ついて独立に判定し、**どちらか一方でも**棄却されれば「区別できた」と
報告する（複数指標の多重比較補正は行わない——探索的な最初の一歩であり、
確証的検定ではないことを明記する）。

区別できた場合、その差分の大きさと符号（条件Aの方が高いか低いか）を
そのまま報告する。「生命的閉路が観測された」という言葉は使わない
（`VESSEL_CHARTER.md` §5 の禁止主張）。あくまで
「境界局所密度／大域コヒーレンスが、この構成において統計的に区別できた」
という記述に留める。

## 固定するパラメータ値（実験を見る前に決める）

- `seedCount = 20`
- `shoutTicks = 5`
- `windowHalfWidth = 2`
- `observeAfterTicks = 3`
- λ、shiftCellsPerTick、M、α、g、ν₀ は K5 のテストで使った代表値
  （`createConservativeStepper`のデフォルト的組み合わせ、既存テストと
  同じオーダーの値）をそのまま使う——reafference専用にチューニングしない

## Aeterna-Genesis EMERGENCE_LEVELS.mdの採用（別枠、reafference弁別とは独立）

`closed-life-loop-design.md`が指定するL2/L4判定規則は、reafference弁別とは
別に、**閉じたループ自体（条件A、λ>0）が単独でどこまでの構造を示すか**を
測るためにも適用する。PR7で実装済みの`detectVortexCandidates`・
`trackVortexPersistence`・`vortexPersistenceAtLeast`をそのまま使い、新しい
閾値ロジックを発明しない。`τ_min`は前述の`roundTripTicks`の整数倍
（例: `2 * roundTripTicks`）として幾何から機械的に決める——実測を見てから
チューニングしない。

## この事前登録が答えない問い

- 完全なスペクトル整合（controlDriveを条件Aの返り値と同じ周波数内容に
  する）は、上述のとおり構造上の違いこそが測定対象であるという判断により
  今回は行わない。将来、より厳密な整合を求める場合は新しい事前登録として
  別途行う
- 多重比較補正・より大きなseed数によるより高い検定力は将来の拡張
